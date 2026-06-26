import { ObjectId } from "mongodb";

export interface StateDeliveryFee {
  _id?: ObjectId;
  state: string;
  deliveryFee: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStateDeliveryFeeRequest {
  state: string;
  deliveryFee: number;
  isActive?: boolean;
}

export interface UpdateStateDeliveryFeeRequest {
  deliveryFee?: number;
  isActive?: boolean;
}

export function isValidDeliveryFee(fee: unknown): fee is number {
  return typeof fee === "number" && fee >= 0 && fee <= 10000; // Max 10k delivery fee
}

export function isValidState(state: unknown): state is string {
  return typeof state === "string" && state.length > 0 && state.length <= 100;
}
