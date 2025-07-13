import clientPromise from './mongodb';
import { ContactMessage, CreateContactRequest, ContactStats, CreateContactReply } from '@/models/contact';

export class ContactService {
  private async getCollection() {
    const client = await clientPromise;
    return client.db('himspired').collection<ContactMessage>('contact_messages');
  }

  async createMessage(data: CreateContactRequest): Promise<ContactMessage> {
    const collection = await this.getCollection();
    
    const message: ContactMessage = {
      ...data,
      messageId: `MSG-${Date.now()}`,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      replies: [],
    };

    const result = await collection.insertOne(message);
    return { ...message, _id: result.insertedId.toString() };
  }

  // Quick spam check - only allow 1 message per 24h per email
  async checkRateLimit(email: string, fingerprint?: string): Promise<boolean> {
    const collection = await this.getCollection();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const query = {
      createdAt: { $gte: yesterday },
      $or: [
        { email },
        ...(fingerprint ? [{ deviceFingerprint: fingerprint }] : [])
      ]
    };

    const recent = await collection.findOne(query);
    return !recent;
  }

  async getMessages(): Promise<ContactMessage[]> {
    const collection = await this.getCollection();
    
    // TODO: Add pagination for large datasets
    return collection.find({}).sort({ createdAt: -1 }).toArray();
  }

  async getMessage(id: string): Promise<ContactMessage | null> {
    const collection = await this.getCollection();
    return collection.findOne({ messageId: id });
  }

  async markAsRead(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.updateOne(
      { messageId: id },
      { $set: { isRead: true, updatedAt: new Date() } }
    );
    return result.matchedCount > 0;
  }

  async addReply(messageId: string, reply: CreateContactReply): Promise<boolean> {
    const collection = await this.getCollection();
    
    // Simple reply ID generation - good enough for now
    const replyWithId = {
      _id: Date.now().toString(),
      ...reply
    };

    const result = await collection.updateOne(
      { messageId },
      {
        $push: { replies: replyWithId },
        $set: { updatedAt: new Date() }
      }
    );
    return result.matchedCount > 0;
  }

  async getStats(): Promise<ContactStats> {
    const collection = await this.getCollection();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Run these in parallel for better performance
    const [total, unread, replied, recent] = await Promise.all([
      collection.countDocuments({}),
      collection.countDocuments({ isRead: false }),
      collection.countDocuments({ 'replies.0': { $exists: true } }),
      collection.countDocuments({ createdAt: { $gte: yesterday } }),
    ]);

    return { total, unread, replied, recent };
  }

  async deleteMessage(id: string): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ messageId: id });
    return result.deletedCount > 0;
  }
}

export const contactService = new ContactService();