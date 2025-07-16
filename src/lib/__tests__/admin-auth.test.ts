// Mock jose module to avoid ESM parsing issues
jest.mock("jose", () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue("mock.jwt.token"),
  })),
  jwtVerify: jest.fn().mockResolvedValue({
    payload: {
      sub: "test-admin",
      username: "test-admin",
      role: "admin",
      iat: Date.now(),
      exp: Date.now() + 86400000,
    },
  }),
}));

import { AdminAuth } from "../admin-auth";
import bcrypt from "bcryptjs";

// Mock bcrypt
jest.mock("bcryptjs");

describe("AdminAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateToken", () => {
    it("should generate a valid JWT token", async () => {
      const username = "test-admin";
      const token = await AdminAuth.generateToken(username);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token).toBe("mock.jwt.token");
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token", async () => {
      const username = "test-admin";
      const token = await AdminAuth.generateToken(username);
      const user = await AdminAuth.verifyToken(token);

      expect(user).toBeDefined();
      expect(user?.username).toBe(username);
      expect(user?.role).toBe("admin");
    });

    it("should return null for invalid token", async () => {
      // Mock jwtVerify to throw an error for invalid tokens
      const { jwtVerify } = await import("jose");
      (jwtVerify as jest.Mock).mockRejectedValueOnce(
        new Error("Invalid token")
      );

      const user = await AdminAuth.verifyToken("invalid-token");
      expect(user).toBeNull();
    });
  });

  describe("authenticate", () => {
    it("should authenticate with valid credentials", async () => {
      const mockCompare = bcrypt.compare as jest.MockedFunction<
        typeof bcrypt.compare
      >;
      mockCompare.mockResolvedValue(true);

      const result = await AdminAuth.authenticate(
        "test-admin",
        "correct-password"
      );
      expect(result).toBe(true);
    });

    it("should reject invalid credentials", async () => {
      const mockCompare = bcrypt.compare as jest.MockedFunction<
        typeof bcrypt.compare
      >;
      mockCompare.mockResolvedValue(false);

      const result = await AdminAuth.authenticate(
        "test-admin",
        "wrong-password"
      );
      expect(result).toBe(false);
    });

    it("should reject invalid username", async () => {
      const result = await AdminAuth.authenticate("wrong-username", "password");
      expect(result).toBe(false);
    });
  });

  describe("verifyPassword", () => {
    it("should verify correct password", async () => {
      const mockCompare = bcrypt.compare as jest.MockedFunction<
        typeof bcrypt.compare
      >;
      mockCompare.mockResolvedValue(true);

      const result = await AdminAuth.verifyPassword("password", "hash");
      expect(result).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const mockCompare = bcrypt.compare as jest.MockedFunction<
        typeof bcrypt.compare
      >;
      mockCompare.mockResolvedValue(false);

      const result = await AdminAuth.verifyPassword("password", "hash");
      expect(result).toBe(false);
    });

    it("should handle bcrypt errors", async () => {
      const mockCompare = bcrypt.compare as jest.MockedFunction<
        typeof bcrypt.compare
      >;
      mockCompare.mockRejectedValue(new Error("bcrypt error"));

      const result = await AdminAuth.verifyPassword("password", "hash");
      expect(result).toBe(false);
    });
  });
});
