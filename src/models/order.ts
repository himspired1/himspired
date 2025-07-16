export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  size?: string;
  category: string;
  // Add mainImage field with proper typing
  mainImage?: {
    _type: "image";
    asset: {
      _ref: string;
      _type: "reference";
    };
    alt?: string;
    caption?: string;
  };
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export type OrderStatus =
  | "payment_pending"
  | "payment_confirmed"
  | "shipped"
  | "complete"
  | "payment_not_confirmed"
  | "canceled";

export interface Order {
  _id?: string;
  orderId: string;
  userId?: string;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  total: number;
  paymentReceipt?: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  message?: string;
}

export interface CreateOrderRequest {
  customerInfo: CustomerInfo;
  items: OrderItem[];
  total: number;
  message?: string;
}
