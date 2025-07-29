import { NextRequest } from "next/server";
import clientPromise from "./mongodb";

export interface CheckoutSession {
  sessionId: string;
  cartItems: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export class CheckoutAuth {
  private static SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Validate if a session has an active checkout process
   * @param sessionId - The session ID to validate
   * @returns Promise<boolean> - True if session has active checkout
   */
  static async validateCheckoutSession(sessionId: string): Promise<boolean> {
    try {
      const client = await clientPromise;
      const db = client.db("himspired");
      const checkoutSessions = db.collection("checkout_sessions");

      // Find active checkout session for this sessionId
      const session = await checkoutSessions.findOne({
        sessionId,
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

      return !!session;
    } catch (error) {
      console.error("Error validating checkout session:", error);
      return false;
    }
  }

  /**
   * Create a checkout session for a user
   * @param sessionId - The session ID
   * @param cartItems - The items in the cart
   * @returns Promise<boolean> - True if session created successfully
   */
  static async createCheckoutSession(
    sessionId: string,
    cartItems: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>
  ): Promise<boolean> {
    try {
      const client = await clientPromise;
      const db = client.db("himspired");
      const checkoutSessions = db.collection("checkout_sessions");

      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.SESSION_DURATION);

      // Deactivate any existing sessions for this sessionId
      await checkoutSessions.updateMany(
        { sessionId },
        { $set: { isActive: false } }
      );

      // Create new checkout session
      await checkoutSessions.insertOne({
        sessionId,
        cartItems,
        createdAt: now,
        expiresAt,
        isActive: true,
      });

      return true;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      return false;
    }
  }

  /**
   * Deactivate a checkout session and release associated reservations
   * @param sessionId - The session ID to deactivate
   * @returns Promise<boolean> - True if session deactivated successfully
   */
  static async deactivateCheckoutSession(sessionId: string): Promise<boolean> {
    try {
      const client = await clientPromise;
      const db = client.db("himspired");
      const checkoutSessions = db.collection("checkout_sessions");

      // Get the active session to find cart items
      const activeSession = await checkoutSessions.findOne({
        sessionId,
        isActive: true,
      });

      // Deactivate the session
      await checkoutSessions.updateMany(
        { sessionId },
        { $set: { isActive: false } }
      );

      // Release reservations for all items in the session
      if (activeSession && activeSession.cartItems) {
        const releasePromises = activeSession.cartItems.map(
          async (item: unknown) => {
            const itemData = item as { productId: string; quantity: number };
            try {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/products/release/${itemData.productId}`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    sessionId,
                    quantity: itemData.quantity,
                  }),
                }
              );

              if (response.ok) {
                console.log(
                  `✅ Released reservation for product ${itemData.productId}`
                );
              } else {
                console.error(
                  `Failed to release reservation for product ${itemData.productId}:`,
                  await response.text()
                );
              }
            } catch (error) {
              console.error(
                `Error releasing reservation for product ${itemData.productId}:`,
                error
              );
            }
          }
        );

        await Promise.all(releasePromises);
      }

      return true;
    } catch (error) {
      console.error("Error deactivating checkout session:", error);
      return false;
    }
  }

  /**
   * Clean up expired checkout sessions
   * @returns Promise<number> - Number of sessions cleaned up
   */
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const client = await clientPromise;
      const db = client.db("himspired");
      const checkoutSessions = db.collection("checkout_sessions");

      const result = await checkoutSessions.updateMany(
        {
          expiresAt: { $lt: new Date() },
          isActive: true,
        },
        { $set: { isActive: false } }
      );

      return result.modifiedCount;
    } catch (error) {
      console.error("Error cleaning up expired sessions:", error);
      return 0;
    }
  }

  /**
   * Validate checkout session from request
   * @param request - The NextRequest object
   * @returns Promise<boolean> - True if request has valid checkout session
   */
  static async validateRequest(request: NextRequest): Promise<boolean> {
    try {
      const body = await request.json();
      const sessionId = body.sessionId;

      if (!sessionId) {
        return false;
      }

      return await this.validateCheckoutSession(sessionId);
    } catch (error) {
      console.error("Error validating request:", error);
      return false;
    }
  }
}
