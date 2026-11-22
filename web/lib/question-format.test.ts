import { describe, expect, it } from "vitest";
import { formatDisplayQuestionId } from "./question-format";

describe("formatDisplayQuestionId", () => {
  it("formats long generated hashes to short clean IDs", () => {
    expect(formatDisplayQuestionId("NEET-PHY-MWOWQUFB-CZSZ-63")).toBe("PHY-63");
    expect(formatDisplayQuestionId("NEET-CHE-MWOWQUFB-CZSZ-12")).toBe("CHE-12");
    expect(formatDisplayQuestionId("NEET-BOT-ABCD1234-EFGH-1")).toBe("BOT-1");
  });

  it("handles course and demo prefixed IDs", () => {
    expect(formatDisplayQuestionId("DEMO-PHY-001")).toBe("PHY-001");
    expect(formatDisplayQuestionId("NEET-PHY-001")).toBe("PHY-001");
  });

  it("handles short batch IDs", () => {
    expect(formatDisplayQuestionId("PHY-A2F-063")).toBe("PHY-063");
  });

  it("preserves short clean IDs", () => {
    expect(formatDisplayQuestionId("PHY-001")).toBe("PHY-001");
    expect(formatDisplayQuestionId("Q-63")).toBe("Q-63");
    expect(formatDisplayQuestionId("Q1")).toBe("Q1");
  });

  it("handles empty or null values", () => {
    expect(formatDisplayQuestionId(null)).toBe("");
    expect(formatDisplayQuestionId(undefined)).toBe("");
    expect(formatDisplayQuestionId("")).toBe("");
  });
});
