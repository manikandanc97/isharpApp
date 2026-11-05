import { describe, expect, it } from "vitest";
import {
  isValidEmail,
  isValidPhone,
  normalizePhone,
  validateIdentifier,
  validateRegistration,
} from "./validation";

describe("validation helpers", () => {
  it("validates emails correctly", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("invalid-email")).toBe(false);
    expect(isValidEmail("user@domain")).toBe(false);
  });

  it("normalizes and validates phone numbers", () => {
    expect(normalizePhone("+91 (987) 654-3210")).toBe("+919876543210");
    expect(isValidPhone("+919876543210")).toBe(true);
    expect(isValidPhone("12345")).toBe(false);
  });

  it("validates identifier (email or phone)", () => {
    expect(validateIdentifier("")).toBe("Enter your email or mobile number.");
    expect(validateIdentifier("invalid")).toBe("Enter a valid email or mobile number.");
    expect(validateIdentifier("student@isharp.in")).toBeUndefined();
    expect(validateIdentifier("+919876543210")).toBeUndefined();
  });

  it("validates registration inputs", () => {
    expect(
      validateRegistration({ email: "", password: "", confirmPassword: "" }),
    ).toEqual({
      email: "Enter your email address.",
      password: "Create a password.",
      confirmPassword: "Confirm your password.",
    });

    expect(
      validateRegistration({
        email: "test@example.com",
        password: "short",
        confirmPassword: "short",
      }),
    ).toEqual({
      password: "Use at least 8 characters.",
    });

    expect(
      validateRegistration({
        email: "test@example.com",
        password: "password123",
        confirmPassword: "mismatch",
      }),
    ).toEqual({
      confirmPassword: "Passwords do not match.",
    });

    expect(
      validateRegistration({
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      }),
    ).toEqual({});
  });
});
