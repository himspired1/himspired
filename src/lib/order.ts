import clientPromise from './mongodb';
import { Order, OrderStatus, CreateOrderRequest } from '@/models/order';

export class OrderService {
 private async getCollection() {
   const client = await clientPromise;
   return client.db('himspired').collection<Order>('orders');
 }

 async createOrder(orderData: CreateOrderRequest) {
   const collection = await this.getCollection();
   const orderId = `HIM-${Date.now()}`;
   
   const order: Order = {
     ...orderData,
     orderId,
     status: 'payment_pending',
     createdAt: new Date(),
     updatedAt: new Date(),
   };

   const result = await collection.insertOne(order);
   return { ...order, _id: result.insertedId.toString() };
 }

 async getOrders(filter: { status?: OrderStatus | 'all' } = {}) {
   const collection = await this.getCollection();
   const query = filter.status && filter.status !== 'all' ? { status: filter.status } : {};
   
   // TODO: Move these to a migration script
   await collection.createIndex({ status: 1 });
   await collection.createIndex({ createdAt: -1 });
   await collection.createIndex({ orderId: 1 });
   
   return collection.find(query).sort({ createdAt: -1 }).toArray();
 }

 async updateOrderStatus(orderId: string, status: OrderStatus) {
   const collection = await this.getCollection();
   const result = await collection.updateOne(
     { orderId },
     { $set: { status, updatedAt: new Date() } }
   );

   if (result.matchedCount === 0) {
     throw new Error('Order not found');
   }
   return result;
 }

 async getOrder(orderId: string) {
   const collection = await this.getCollection();
   return collection.findOne({ orderId });
 }

 async uploadPaymentReceipt(orderId: string, receiptUrl: string) {
   const collection = await this.getCollection();
   return collection.updateOne(
     { orderId },
     { $set: { paymentReceipt: receiptUrl, updatedAt: new Date() } }
   );
 }

 async getOrderStats() {
   const collection = await this.getCollection();
   const [pending, confirmed, shipped, complete] = await Promise.all([
     collection.countDocuments({ status: 'payment_pending' }),
     collection.countDocuments({ status: 'payment_confirmed' }),
     collection.countDocuments({ status: 'shipped' }),
     collection.countDocuments({ status: 'complete' }),
   ]);
   
   return { pending, confirmed, shipped, complete };
 }
}

export const orderService = new OrderService();