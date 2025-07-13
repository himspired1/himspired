export interface ContactReply {
  _id?: string; 
  message: string;
  sentBy: 'admin' | 'system';
  sentAt: Date;
  emailSent: boolean;
}

export interface ContactMessage {
  _id?: string;
  messageId: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  deviceFingerprint?: string;
  ipAddress?: string;
  replies?: ContactReply[];
}

export interface ContactStats {
  total: number;
  unread: number;
  replied: number;
  recent: number;
}

export interface CreateContactRequest {
  name: string;
  email: string;
  message: string;
  deviceFingerprint?: string;
  ipAddress?: string;
}


export interface CreateContactReply {
  message: string;
  sentBy: 'admin' | 'system';
  sentAt: Date;
  emailSent: boolean;
}


export interface Order {
  _id?: string;
  orderId: string;
  status: 'payment_pending' | 'payment_confirmed' | 'shipped' | 'complete';
  createdAt: Date | string;
  total?: number;
}