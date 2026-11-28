import { describe, expect, it } from "vitest";
import { ApiClientError } from "./api-client";
import { getApiErrorMessage } from "./api-errors";

describe("getApiErrorMessage", () => {
  it("extracts message from ApiClientError", () => {
    const err = new ApiClientError("Session expired", 401);
    expect(getApiErrorMessage(err, "Fallback")).toBe("Session expired");
  });

  it("extracts message from standard Error", () => {
    expect(getApiErrorMessage(new Error("Network down"), "Fallback")).toBe("Network down");
  });

  it("returns fallback for non-error values or blank messages", () => {
    expect(getApiErrorMessage(null, "Fallback")).toBe("Fallback");
    expect(getApiErrorMessage("", "Fallback")).toBe("Fallback");
    expect(getApiErrorMessage(new Error("   "), "Fallback")).toBe("Fallback");
  });
});
