import { SessionManager } from "./session";

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface RawCartItem {
  originalProductId?: string;
  _id?: string;
  quantity: number;
  price?: number;
}

export class CheckoutSessionManager {
  /**
   * Start a checkout session for the current user
   * @param cartItems - The items in the user's cart
   * @returns Promise<boolean> - True if session started successfully
   */
  static async startCheckoutSession(cartItems: CartItem[]): Promise<boolean> {
    try {
      const sessionId = SessionManager.getSessionId();

      // Check if sessionId is null or undefined
      if (!sessionId) {
        console.error(
          "Cannot start checkout session: sessionId is null or undefined"
        );
        return false;
      }

      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          cartItems,
        }),
      });

      if (response.ok) {
        console.log("Checkout session started successfully");
        return true;
      } else {
        console.error(
          `Failed to start checkout session: HTTP ${response.status}`
        );
        return false;
      }
    } catch (error) {
      console.error(
        "Error starting checkout session:",
        error instanceof Error ? error.message : "Unknown error"
      );
      return false;
    }
  }

  /**
   * End the current checkout session
   * @returns Promise<boolean> - True if session ended successfully
   */
  static async endCheckoutSession(): Promise<boolean> {
    try {
      const sessionId = SessionManager.getSessionId();

      // Check if sessionId is null or undefined
      if (!sessionId) {
        console.error(
          "Cannot end checkout session: sessionId is null or undefined"
        );
        return false;
      }

      const response = await fetch("/api/checkout/session", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      if (response.ok) {
        console.log("Checkout session ended successfully");
        return true;
      } else {
        console.error(
          `Failed to end checkout session: HTTP ${response.status}`
        );
        return false;
      }
    } catch (error) {
      console.error(
        "Error ending checkout session:",
        error instanceof Error ? error.message : "Unknown error"
      );
      return false;
    }
  }

  /**
   * Check if the current user has an active checkout session
   * @returns Promise<boolean> - True if user has active checkout session
   */
  static async hasActiveCheckoutSession(): Promise<boolean> {
    try {
      const sessionId = SessionManager.getSessionId();

      // Check if sessionId is null or undefined
      if (!sessionId) {
        console.error(
          "Cannot check checkout session: sessionId is null or undefined"
        );
        return false;
      }

      const response = await fetch(`/api/checkout/session/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error(
        "Error checking checkout session:",
        error instanceof Error ? error.message : "Unknown error"
      );
      return false;
    }
  }

  /**
   * Convert cart items to the format expected by the checkout session
   * @param cartItems - The cart items from Redux state
   * @returns CartItem[] - Formatted cart items
   * @throws Error if validation fails for any cart item
   */
  static formatCartItemsForCheckout(cartItems: RawCartItem[]): CartItem[] {
    if (!Array.isArray(cartItems)) {
      throw new Error("Cart items must be an array");
    }

    return cartItems.map((item, index) => {
      // Validate required fields
      if (typeof item.quantity !== "number" || item.quantity <= 0) {
        throw new Error(
          `Invalid quantity for cart item at index ${index}: must be a positive number`
        );
      }

      // Validate that at least one product identifier is present
      const productId = item.originalProductId || item._id;
      if (!productId) {
        throw new Error(
          `Missing product identifier for cart item at index ${index}: must have either originalProductId or _id`
        );
      }

      // Validate price if present
      if (
        item.price !== undefined &&
        (typeof item.price !== "number" || item.price < 0)
      ) {
        throw new Error(
          `Invalid price for cart item at index ${index}: must be a non-negative number`
        );
      }

      return {
        productId,
        quantity: item.quantity,
        price: item.price ?? 0,
      };
    });
  }

  /**
   * Safely validate cart items without throwing errors
   * @param cartItems - The cart items to validate
   * @returns { isValid: boolean; errors: string[] } - Validation result
   */
  static validateCartItems(cartItems: unknown[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(cartItems)) {
      errors.push("Cart items must be an array");
      return { isValid: false, errors };
    }

    cartItems.forEach((item, index) => {
      if (typeof item !== 'object' || item === null) {
        errors.push(`Cart item at index ${index} must be an object`);
        return;
      }

      const rawItem = item as RawCartItem;

      // Validate quantity
      if (typeof rawItem.quantity !== 'number' || rawItem.quantity <= 0) {
        errors.push(`Invalid quantity for cart item at index ${index}: must be a positive number`);
      }

      // Validate product identifier
      const productId = rawItem.originalProductId || rawItem._id;
      if (!productId) {
        errors.push(`Missing product identifier for cart item at index ${index}: must have either originalProductId or _id`);
      }

      // Validate price if present
      if (rawItem.price !== undefined && (typeof rawItem.price !== 'number' || rawItem.price < 0)) {
        errors.push(`Invalid price for cart item at index ${index}: must be a non-negative number`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }
}
