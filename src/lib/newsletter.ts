import clientPromise from './mongodb';
import { NewsletterSubscriber } from '@/models/newsletter';

export class NewsletterService {
  private async getCollection() {
    const client = await clientPromise;
    return client.db('himspired').collection<NewsletterSubscriber>('newsletter_subscribers');
  }

  async subscribe(email: string, source: string = 'website') {
    const collection = await this.getCollection();
    
    // Check if already subscribed
    const existing = await collection.findOne({ email });
    
    if (existing) {
      if (existing.isActive) {
        return { 
          success: false, 
          message: 'This email is already subscribed to our newsletter.' 
        };
      } else {
        // Reactivate subscription
        await collection.updateOne(
          { email },
          { 
            $set: { 
              isActive: true, 
              subscribedAt: new Date() 
            } 
          }
        );
        return { 
          success: true, 
          message: 'Welcome back to the Himspired Community!' 
        };
      }
    }

    // Create new subscription
    const subscriber: NewsletterSubscriber = {
      email,
      subscribedAt: new Date(),
      isActive: true,
      source
    };

    const result = await collection.insertOne(subscriber);
    
    // Create index for email (for uniqueness and performance)
    await collection.createIndex({ email: 1 }, { unique: true });
    
    return { 
      success: true, 
      subscriberId: result.insertedId.toString(),
      message: 'Welcome to the Himspired Community!' 
    };
  }

  async unsubscribe(email: string) {
    const collection = await this.getCollection();
    
    const result = await collection.updateOne(
      { email },
      { $set: { isActive: false } }
    );

    return result.matchedCount > 0;
  }

  async getActiveSubscribers() {
    const collection = await this.getCollection();
    return collection.find({ isActive: true }).toArray();
  }

  async getTotalSubscribers() {
    const collection = await this.getCollection();
    return collection.countDocuments({ isActive: true });
  }
}

export const newsletterService = new NewsletterService();