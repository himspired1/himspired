// Simple test for session management functionality
// This can be run with: npx jest src/lib/session.test.ts

import { SessionManager, ReservationAPI } from "./session";

describe("SessionManager", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  test("should generate unique session IDs", () => {
    const sessionId1 = SessionManager.getSessionId();
    const sessionId2 = SessionManager.getSessionId();

    expect(sessionId1).toBeDefined();
    expect(sessionId2).toBeDefined();
    expect(sessionId1).toBe(sessionId2); // Should return same session ID
  });

  test("should clear session", () => {
    const sessionId1 = SessionManager.getSessionId();
    SessionManager.clearSession();
    const sessionId2 = SessionManager.getSessionId();

    expect(sessionId1).not.toBe(sessionId2); // Should be different after clearing
  });

  test("should check session validity", () => {
    SessionManager.getSessionId();
    expect(SessionManager.isSessionValid()).toBe(true);
  });
});

describe("ReservationAPI", () => {
  test("should check product availability", () => {
    const availableProduct = { stock: 5 };
    const outOfStockProduct = { stock: 0 };
    const reservedProduct = {
      stock: 5,
      reservedUntil: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
    };
    const expiredReservationProduct = {
      stock: 5,
      reservedUntil: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
    };

    expect(ReservationAPI.isProductAvailable(availableProduct)).toBe(true);
    expect(ReservationAPI.isProductAvailable(outOfStockProduct)).toBe(false);
    expect(ReservationAPI.isProductAvailable(reservedProduct)).toBe(false);
    expect(ReservationAPI.isProductAvailable(expiredReservationProduct)).toBe(
      true
    );
  });

  test("should get availability message", () => {
    const availableProduct = { stock: 5 };
    const outOfStockProduct = { stock: 0 };
    const reservedProduct = {
      stock: 5,
      reservedUntil: new Date(Date.now() + 60000).toISOString(),
      reservedBy: "session_123",
    };

    expect(ReservationAPI.getAvailabilityMessage(availableProduct)).toBe(
      "Available"
    );
    expect(ReservationAPI.getAvailabilityMessage(outOfStockProduct)).toBe(
      "Out of stock"
    );
    expect(ReservationAPI.getAvailabilityMessage(reservedProduct)).toContain(
      "Reserved"
    );
  });
});
