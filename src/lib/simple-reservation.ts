/**
 * Simple Reservation Service
 *
 * Provides in-memory reservation management with automatic cleanup.
 *
 * Memory Management:
 * - Automatic cleanup of expired reservations every minute
 * - Manual cleanup controls for testing and shutdown
 * - Memory leak prevention through proper timer management
 * - Statistics tracking for monitoring
 */
interface Reservation {
  sessionId: string;
  expiresAt: Date;
}

interface AvailabilityResult {
  available: boolean;
  message: string;
}

class SimpleReservationService {
  private reservations: Map<string, Reservation> = new Map();

  isProductAvailable(
    productId: string,
    sessionId?: string
  ): AvailabilityResult {
    const reservation = this.reservations.get(productId);

    if (!reservation) {
      return { available: true, message: "Available" };
    }

    // Check if reservation has expired
    if (new Date() > reservation.expiresAt) {
      this.reservations.delete(productId);
      return { available: true, message: "Available" };
    }

    // Check if this session has the reservation
    if (sessionId && reservation.sessionId === sessionId) {
      return { available: true, message: "Reserved by you" };
    }

    // Product is reserved by another session
    return { available: false, message: "Product is reserved by another user" };
  }

  reserveProduct(
    productId: string,
    sessionId: string,
    durationMinutes: number = 10
  ): { success: boolean; message: string } {
    const existingReservation = this.reservations.get(productId);

    if (existingReservation && new Date() <= existingReservation.expiresAt) {
      if (existingReservation.sessionId === sessionId) {
        return { success: true, message: "Already reserved by you" };
      } else {
        return {
          success: false,
          message: "Product is already reserved by another user",
        };
      }
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

    this.reservations.set(productId, {
      sessionId,
      expiresAt,
    });

    return { success: true, message: "Product reserved successfully" };
  }

  releaseReservation(
    productId: string,
    sessionId?: string
  ): { success: boolean; message: string } {
    const reservation = this.reservations.get(productId);

    if (!reservation) {
      return { success: true, message: "No reservation to release" };
    }

    // If sessionId is provided, only release if it matches
    if (sessionId && reservation.sessionId !== sessionId) {
      return {
        success: false,
        message: "Cannot release reservation owned by another session",
      };
    }

    this.reservations.delete(productId);
    return { success: true, message: "Reservation released successfully" };
  }

  forceReleaseAllReservations(productId: string): {
    success: boolean;
    message: string;
  } {
    const hadReservation = this.reservations.has(productId);
    this.reservations.delete(productId);

    return {
      success: true,
      message: hadReservation
        ? "All reservations force released"
        : "No reservations to release",
    };
  }

  // Clean up expired reservations
  cleanupExpiredReservations(): void {
    const now = new Date();
    let cleanedCount = 0;
    const initialSize = this.reservations.size;

    for (const [productId, reservation] of this.reservations.entries()) {
      if (now > reservation.expiresAt) {
        this.reservations.delete(productId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(
        `🧹 Cleaned up ${cleanedCount} expired reservations (${initialSize} → ${this.reservations.size})`
      );
    }
  }

  // Get statistics about current reservations
  getReservationStats(): {
    totalReservations: number;
    expiredReservations: number;
    activeReservations: number;
  } {
    const now = new Date();
    let expiredCount = 0;
    let activeCount = 0;

    for (const [, reservation] of this.reservations.entries()) {
      if (now > reservation.expiresAt) {
        expiredCount++;
      } else {
        activeCount++;
      }
    }

    return {
      totalReservations: this.reservations.size,
      expiredReservations: expiredCount,
      activeReservations: activeCount,
    };
  }

  // Manually trigger cleanup (useful for testing)
  forceCleanup(): void {
    this.cleanupExpiredReservations();
  }
}

export const reservationService = new SimpleReservationService();

// Store the interval ID for cleanup
let cleanupIntervalId: NodeJS.Timeout | null = null;

// Start the cleanup timer
const startCleanupTimer = (): void => {
  // Clear any existing timer first
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
  }

  // Start new cleanup timer
  cleanupIntervalId = setInterval(() => {
    reservationService.cleanupExpiredReservations();
  }, 60000);

  console.log("🧹 Reservation cleanup timer started");
};

// Stop the cleanup timer
const stopCleanupTimer = (): void => {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
    console.log("🧹 Reservation cleanup timer stopped");
  }
};

// Start the cleanup timer immediately
startCleanupTimer();

// Export cleanup functions for external control
export const reservationCleanup = {
  start: startCleanupTimer,
  stop: stopCleanupTimer,
  isRunning: (): boolean => cleanupIntervalId !== null,
};
