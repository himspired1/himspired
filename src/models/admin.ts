import { ObjectId } from 'mongodb';

export interface AdminUser {
  _id?: ObjectId;
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
} 