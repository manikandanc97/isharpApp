import { describe, expect, it } from "vitest";

import { getSignupErrorMessage } from "./auth-error";

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

  it("keeps unknown provider errors intact", () => {
    expect(getSignupErrorMessage({ message: "Unexpected provider error" })).toBe(
      "Unexpected provider error",
    );
  });
});
