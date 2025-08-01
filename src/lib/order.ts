import {
  withPerformanceLogging,
  getClientWithRetry,
} from "./mongodb";
import { Order, OrderStatus, CreateOrderRequest } from "@/models/order";
import { cacheService } from "./cache-service";

export class OrderService {
  private async getCollection() {
    try {
      const client = await getClientWithRetry();
      return client.db("himspired").collection<Order>("orders");
    } catch (error) {
      console.error("Failed to get MongoDB collection:", error);
      throw new Error("Database connection failed");
    }
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
        // OPTIMIZATION: Use write concern for better performance
        await collection.insertOne(order, {
          writeConcern: { w: 1, j: false }, // Acknowledged writes without journaling for speed
        });

        // Clear order list cache when new order is created
        try {
          await cacheService.clearOrderCache();
        } catch (cacheError) {
          console.warn("Failed to clear order cache:", cacheError);
        }

        return order;
      } catch (error) {
        console.error("Failed to create order:", error);
        throw new Error("Failed to create order");
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
        // OPTIMIZATION: Use countDocuments with hint for better performance
        const totalCount = await collection.countDocuments(query, {
          hint: { status: 1, createdAt: -1 },
        });

        // OPTIMIZATION: Use more specific projection and add sort hint
        const orders = await collection
          .find(query, {
            projection: {
              orderId: 1,
              status: 1,
              createdAt: 1,
              "customerInfo.name": 1,
              "customerInfo.email": 1,
              total: 1,
              items: 1,
              paymentReceipt: 1, // Include payment receipt for admin display
            },
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .hint({ status: 1, createdAt: -1 })
          .toArray();

        return {
          orders,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        };
      } catch (error) {
        console.error("Failed to get orders:", error);
        throw new Error("Failed to retrieve orders");
      }
    });
  }

  async getOrder(orderId: string) {
    return withPerformanceLogging("getOrder", async () => {
      const collection = await this.getCollection();

      try {
        const order = await collection.findOne(
          { orderId },
          {
            projection: {
              _id: 0,
              orderId: 1,
              status: 1,
              customerInfo: 1,
              items: 1,
              total: 1,
              message: 1,
              paymentReceipt: 1, // FIXED: Use correct field name
              createdAt: 1,
              updatedAt: 1,
            },
          }
        );

        if (!order) {
          throw new Error("Order not found");
        }

        return order;
      } catch (error) {
        console.error(`Failed to get order ${orderId}:`, error);
        throw new Error("Failed to retrieve order");
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

        // Clear order cache when status changes
        try {
          await cacheService.clearOrderCache();
        } catch (cacheError) {
          console.warn("Failed to clear order cache:", cacheError);
        }

        return { success: true, message: "Order status updated successfully" };
      } catch (error) {
        console.error(`Failed to update order ${orderId}:`, error);
        throw new Error("Failed to update order status");
      }
    });
  }

  async uploadPaymentReceipt(orderId: string, receiptUrl: string) {
    return withPerformanceLogging("uploadPaymentReceipt", async () => {
      const collection = await this.getCollection();

      try {
        const result = await collection.updateOne(
          { orderId },
          {
            $set: {
              paymentReceipt: receiptUrl, // FIXED: Use correct field name
              updatedAt: new Date(),
            },
          }
        );

        if (result.matchedCount === 0) {
          throw new Error("Order not found");
        }

        return { success: true, message: "Receipt uploaded successfully" };
      } catch (error) {
        console.error(`Failed to upload receipt for order ${orderId}:`, error);
        throw new Error("Failed to upload receipt");
      }
    });
  }
}

export const orderService = new OrderService();
