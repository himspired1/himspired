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
    for (const [productId, reservation] of this.reservations.entries()) {
      if (now > reservation.expiresAt) {
        this.reservations.delete(productId);
      }
    }
  }
}

export const reservationService = new SimpleReservationService();

// Clean up expired reservations every minute
setInterval(() => {
  reservationService.cleanupExpiredReservations();
}, 60000);
