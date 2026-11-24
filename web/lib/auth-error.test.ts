import { describe, expect, it } from "vitest";

import { getLoginErrorMessage, getSignupErrorMessage } from "./auth-error";

describe("signup error messages", () => {
  it("replaces Supabase's email quota error with an actionable message", () => {
    expect(
      getSignupErrorMessage({
        code: "over_email_send_rate_limit",
        message: "email rate limit exceeded",
        status: 429,
      }),
    ).toContain("continue with Google");
  });

  it("recognizes the legacy quota message when no error code is present", () => {
    expect(
      getSignupErrorMessage({ message: "Email rate limit exceeded" }),
    ).toContain("temporarily busy");
  });

  it("sanitizes unknown provider errors with a safe user-facing message", () => {
    expect(getSignupErrorMessage({ message: "Unexpected provider error" })).toBe(
      "Something went wrong. Please try again or contact I-Sharp support.",
    );
  });
});

describe("login error messages", () => {
  it("returns generic credential message for standard invalid credentials", () => {
    expect(
      getLoginErrorMessage({
        status: 400,
        message: "Invalid login credentials",
      }),
    ).toBe("Invalid email or password.");
  });

  it("handles rate limiting errors accurately", () => {
    expect(
      getLoginErrorMessage({
        status: 429,
        message: "rate limit exceeded",
      }),
    ).toBe("Too many sign-in attempts. Please wait a minute and try again.");
  });

  it("handles network and fetch failures cleanly", () => {
    expect(
      getLoginErrorMessage({
        name: "AuthRetryableFetchError",
        message: "Failed to fetch",
      }),
    ).toBe("Cannot connect to the server. Please check your connection.");
  });

  it("handles timeout errors accurately", () => {
    expect(
      getLoginErrorMessage({
        status: 408,
        message: "Request timed out",
      }),
    ).toBe("The request timed out. Please check your connection and try again.");
  });

  it("handles server 500/503 errors safely without leaking internal details", () => {
    expect(
      getLoginErrorMessage({
        status: 503,
        message: "Database unavailable",
      }),
    ).toBe("Unable to sign in right now. Please try again.");
  });
});
