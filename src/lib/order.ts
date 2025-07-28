import clientPromise, { withPerformanceLogging } from "./mongodb";
import { Order, OrderStatus, CreateOrderRequest } from "@/models/order";

export class OrderService {
  private async getCollection() {
    const client = await clientPromise;
    return client.db("himspired").collection<Order>("orders");
  }

  async createOrder(orderData: CreateOrderRequest) {
    return withPerformanceLogging("createOrder", async () => {
      const collection = await this.getCollection();
      const orderId = `HIM-${Date.now()}`;

      const order: Order = {
        ...orderData,
        orderId,
        status: "payment_pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      try {
        const result = await collection.insertOne(order);

        // Note: Reservations are kept active after order creation
        // They will only be released when admin confirms payment or cancels order
        // This gives admin 24 hours to review the payment

        return { ...order, _id: result.insertedId.toString() };
      } catch (error) {
        console.error("Failed to create order:", error);
        throw new Error("Order creation failed");
      }
    });
  }

  async getOrders(
    filter: { status?: OrderStatus | "all" } = {},
    pagination: { page?: number; limit?: number } = {}
  ) {
    return withPerformanceLogging("getOrders", async () => {
      const collection = await this.getCollection();

      const query =
        filter.status && filter.status !== "all"
          ? { status: filter.status }
          : {};

      const page = pagination.page || 1;
      const limit = Math.min(pagination.limit || 20, 100); // Max 100 per page
      const skip = (page - 1) * limit;

      try {
        // Get total count for pagination metadata
        const totalCount = await collection.countDocuments(query);

        // Get paginated results
        const orders = await collection
          .find(query, {
            projection: {
              _id: 1,
              orderId: 1,
              "customerInfo.name": 1,
              "customerInfo.email": 1,
              total: 1,
              paymentReceipt: 1,
              status: 1,
              createdAt: 1,
              "items.title": 1,
              "items.quantity": 1,
            },
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .toArray();

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return {
          orders,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasNextPage,
            hasPrevPage,
          },
        };
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        throw new Error("Failed to retrieve orders");
      }
    });
  }

  async getOrderStats() {
    return withPerformanceLogging("getOrderStats", async () => {
      const collection = await this.getCollection();

      try {
        const pipeline = [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ];

        const results = await collection
          .aggregate(pipeline, {
            hint: { status: 1 },
          })
          .toArray();

        const stats = {
          pending: 0,
          confirmed: 0,
          shipped: 0,
          complete: 0,
        };

        // Quick mapping - could be cleaner but works
        results.forEach((result) => {
          switch (result._id) {
            case "payment_pending":
              stats.pending = result.count;
              break;
            case "payment_confirmed":
              stats.confirmed = result.count;
              break;
            case "shipped":
              stats.shipped = result.count;
              break;
            case "complete":
              stats.complete = result.count;
              break;
          }
        });

        return stats;
      } catch (error) {
        console.error("Failed to get order stats:", error);
        // Fallback - not optimal but reliable
        const [pending, confirmed, shipped, complete] = await Promise.all([
          collection.countDocuments({ status: "payment_pending" }),
          collection.countDocuments({ status: "payment_confirmed" }),
          collection.countDocuments({ status: "shipped" }),
          collection.countDocuments({ status: "complete" }),
        ]);

        return { pending, confirmed, shipped, complete };
      }
    });
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    return withPerformanceLogging("updateOrderStatus", async () => {
      const collection = await this.getCollection();

      try {
        const result = await collection.updateOne(
          { orderId },
          {
            $set: {
              status,
              updatedAt: new Date(),
            },
          }
        );

        if (result.matchedCount === 0) {
          throw new Error("Order not found");
        }

        return result;
      } catch (error) {
        console.error(`Failed to update order ${orderId}:`, error);
        throw error;
      }
    });
  }

  async getOrder(orderId: string) {
    return withPerformanceLogging("getOrder", async () => {
      const collection = await this.getCollection();

      try {
        return await collection.findOne(
          { orderId },
          {
            projection: {
              _id: 1,
              orderId: 1,
              customerInfo: 1,
              items: 1,
              total: 1,
              paymentReceipt: 1,
              status: 1,
              createdAt: 1,
              updatedAt: 1,
              message: 1,
            },
          }
        );
      } catch (error) {
        console.error(`Failed to get order ${orderId}:`, error);
        throw new Error("Failed to retrieve order");
      }
    });
  }

  async uploadPaymentReceipt(orderId: string, receiptUrl: string) {
    return withPerformanceLogging("uploadPaymentReceipt", async () => {
      const collection = await this.getCollection();

      try {
        return await collection.updateOne(
          { orderId },
          {
            $set: {
              paymentReceipt: receiptUrl,
              updatedAt: new Date(),
            },
          }
        );
      } catch (error) {
        console.error(`Failed to upload receipt for order ${orderId}:`, error);
        throw new Error("Failed to upload payment receipt");
      }
    });
  }

  async getOrdersByCustomerEmail(email: string) {
    return withPerformanceLogging("getOrdersByCustomerEmail", async () => {
      const collection = await this.getCollection();

      try {
        return await collection
          .find(
            { "customerInfo.email": email },
            {
              projection: {
                _id: 1,
                orderId: 1,
                "customerInfo.name": 1,
                "customerInfo.email": 1,
                items: 1,
                total: 1,
                status: 1,
                createdAt: 1,
              },
            }
          )
          .sort({ createdAt: -1 })
          .limit(50) // Reasonable limit for customer view
          .toArray();
      } catch (error) {
        console.error(`Failed to get orders for email ${email}:`, error);
        throw new Error("Failed to retrieve customer orders");
      }
    });
  }
}

export const orderService = new OrderService();
