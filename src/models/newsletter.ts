export interface NewsletterSubscriber {
  _id?: string;
  email: string;
  subscribedAt: Date;
  isActive: boolean;
  source?: string;
}