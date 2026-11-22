/**
 * Utility functions for formatting question identifiers across the application.
 */

/**
 * Formats a question external ID for display in a concise, neat, human-readable format.
 * Transforms long auto-generated hashes like "NEET-PHY-MWOWQUFB-CZSZ-63" into "PHY-63".
 */
export function formatDisplayQuestionId(externalId?: string | null): string {
  if (!externalId) return "";
  const trimmed = externalId.trim();

  // Pattern 1: Generated long pattern with index at end, e.g. NEET-PHY-MWOWQUFB-CZSZ-63 or NEET-CHEM-X-Y-12
  const longPatternMatch = trimmed.match(
    /^[A-Z]+-([A-Z]{2,4})-[A-Z0-9]+-[A-Z0-9]+-(\d+)$/i,
  );
  if (longPatternMatch) {
    const [, sub, num] = longPatternMatch;
    return `${sub.toUpperCase()}-${num}`; // e.g. "PHY-63"
  }

  // Pattern 2: DEMO-PHY-001 or NEET-PHY-001 -> PHY-001
  const demoOrCourseMatch = trimmed.match(/^(?:DEMO|NEET)-([A-Z]{2,4})-(\d+)$/i);
  if (demoOrCourseMatch) {
    const [, sub, num] = demoOrCourseMatch;
    return `${sub.toUpperCase()}-${num}`; // e.g. "PHY-001"
  }

  // Pattern 3: Timestamp ID like NEET-17322789 or NEET-34891733
  const timestampMatch = trimmed.match(/^NEET-(\d+)$/i);
  if (timestampMatch) {
    return `Q-${timestampMatch[1].slice(-4)}`;
  }

  // Pattern 4: Short batch format like PHY-A2F-063 -> PHY-063
  const shortBatchMatch = trimmed.match(/^([A-Z]{2,4})-[A-Z0-9]{2,4}-(\d+)$/i);
  if (shortBatchMatch) {
    const [, sub, num] = shortBatchMatch;
    return `${sub.toUpperCase()}-${num}`;
  }

  // If already short and clean like PHY-001, Q1, etc.
  if (trimmed.length <= 12) {
    return trimmed;
  }

  // Fallback for any other long hash: shorten cleanly
  const lastSegment = trimmed.split("-").pop();
  if (lastSegment && /^\d+$/.test(lastSegment)) {
    return `Q-${lastSegment}`;
  }

  return trimmed.length > 12 ? `${trimmed.slice(0, 8)}…` : trimmed;
}
