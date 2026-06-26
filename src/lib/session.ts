// Session management utility for reservation system
export class SessionManager {
  private static SESSION_KEY = "himspired_session_id";
  private static SESSION_EXPIRY = 30 * 60 * 1000; // 30 minutes in milliseconds

  /**
   * Get or create a session ID for the current user
   * @returns The session ID
   */
  static getSessionId(): string {
    if (typeof window === "undefined") {
      // Server-side rendering - return a temporary ID
      return "temp_" + Date.now();
    }

    let sessionId = localStorage.getItem(this.SESSION_KEY);

    if (!sessionId) {
      // Generate new session ID
      sessionId = this.generateSessionId();
      localStorage.setItem(this.SESSION_KEY, sessionId);
    }

    return sessionId;
  }

  /**
   * Generate a unique session ID
   * @returns A unique session ID
   */
  private static generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `session_${timestamp}_${random}`;
  }

  /**
   * Clear the session ID (useful for testing or logout)
   */
  static clearSession(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.SESSION_KEY);
    }
  }

  /**
   * Check if session is still valid (not expired)
   * @returns True if session is valid
   */
  static isSessionValid(): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    const sessionId = localStorage.getItem(this.SESSION_KEY);
    if (!sessionId) {
      return false;
    }

    // Extract timestamp from session ID
    const timestampMatch = sessionId.match(/session_(\d+)_/);
    if (!timestampMatch) {
      return false;
    }

    const sessionTimestamp = parseInt(timestampMatch[1]);
    const now = Date.now();

    return now - sessionTimestamp < this.SESSION_EXPIRY;
  }

  /**
   * Refresh session if it's about to expire
   */
  static refreshSessionIfNeeded(): void {
    if (typeof window === "undefined") {
      return;
    }

    const sessionId = localStorage.getItem(this.SESSION_KEY);
    if (!sessionId) {
      return;
    }

    // Extract timestamp from session ID
    const timestampMatch = sessionId.match(/session_(\d+)_/);
    if (!timestampMatch) {
      return;
    }

    const sessionTimestamp = parseInt(timestampMatch[1]);
    const now = Date.now();
    const timeUntilExpiry = this.SESSION_EXPIRY - (now - sessionTimestamp);

    // If session expires in less than 5 minutes, refresh it
    if (timeUntilExpiry < 5 * 60 * 1000) {
      this.clearSession();
      this.getSessionId(); // This will create a new session
    }
  }
}

// Reservation API utilities
export class ReservationAPI {
  /**
   * Reserve a product for the current session
   * @param productId - The product ID to reserve
   * @returns Promise with reservation result
   */
  static async reserveProduct(
    productId: string
  ): Promise<{ success: boolean; message: string; reservedUntil?: string }> {
    try {
      const sessionId = SessionManager.getSessionId();

      const response = await fetch(`/api/products/reserve/${productId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          reservedUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
        }),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: result.message || "Product reserved successfully",
          reservedUntil: result.reservedUntil,
        };
      } else {
        return {
          success: false,
          message: result.error || "Failed to reserve product",
        };
      }
    } catch (error) {
      console.error("Reservation error:", error);
      return {
        success: false,
        message: "Network error while reserving product",
      };
    }
  }

  /**
   * Release a product reservation
   * @param productId - The product ID to release
   * @returns Promise with release result
   */
  static async releaseProduct(
    productId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const sessionId = SessionManager.getSessionId();

      const response = await fetch(`/api/products/release/${productId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      // Check if response has content before trying to parse JSON
      const responseText = await response.text();
      let result;

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        console.error("Failed to parse response JSON:", responseText);
        return {
          success: false,
          message: "Invalid response from server",
        };
      }

      if (response.ok) {
        return {
          success: true,
          message:
            result.message || "Product reservation released successfully",
        };
      } else {
        return {
          success: false,
          message: result.error || "Failed to release product reservation",
        };
      }
    } catch (error) {
      console.error("Release error:", error);
      return {
        success: false,
        message: "Network error while releasing product reservation",
      };
    }
  }

  /**
   * Check if a product is available (not reserved or out of stock)
   * @param product - The product to check
   * @returns True if product is available
   */
  static isProductAvailable(product: {
    stock?: number;
    reservedUntil?: string;
    reservedBy?: string;
  }): boolean {
    if (!product) return false;

    // Check if product has stock
    if (product.stock !== undefined && product.stock <= 0) {
      return false;
    }

    // Check if product is reserved
    if (product.reservedUntil) {
      const reservedUntil = new Date(product.reservedUntil);
      const now = new Date();

      // If reservation is still active, product is not available
      if (reservedUntil > now) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get availability message for a product
   * @param product - The product to check
   * @returns Availability message
   */
  static getAvailabilityMessage(product: {
    stock?: number;
    reservedUntil?: string;
    reservedBy?: string;
  }): string {
    if (!product) return "Product not found";

    if (product.stock !== undefined && product.stock <= 0) {
      return "Out of stock";
    }

    if (product.reservedUntil) {
      const reservedUntil = new Date(product.reservedUntil);
      const now = new Date();

      if (reservedUntil > now) {
        // Check if reserved by current session
        const sessionId = SessionManager.getSessionId();
        if (product.reservedBy === sessionId) {
          return "Reserved by you";
        } else {
          return "Reserved by another user";
        }
      }
    }

    return "Available";
  }
}
