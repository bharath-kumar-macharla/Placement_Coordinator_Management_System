/**
 * Unit tests for scheduler: clash detection and priority resolution policy.
 * Run: npm test (from backend/)
 */

import { hasTimeOverlap, resolvePriority } from "../services/schedulerService.js";

// ── hasTimeOverlap tests ──────────────────────────────────────────────────────
describe("hasTimeOverlap", () => {
  const BUFFER_MS = 15 * 60 * 1000; // 15 minutes

  const makeSlot = (startISO, endISO) => ({ start_time: startISO, end_time: endISO });

  test("no overlap with empty existing slots", () => {
    const start = new Date("2025-01-15T09:00:00Z");
    const end   = new Date("2025-01-15T10:00:00Z");
    expect(hasTimeOverlap(start, end, [], BUFFER_MS)).toBe(false);
  });

  test("detects direct overlap", () => {
    const existing = [makeSlot("2025-01-15T09:30:00Z", "2025-01-15T10:30:00Z")];
    const start    = new Date("2025-01-15T09:00:00Z");
    const end      = new Date("2025-01-15T10:00:00Z");
    expect(hasTimeOverlap(start, end, existing, BUFFER_MS)).toBe(true);
  });

  test("detects buffer zone conflict", () => {
    // New slot ends at 10:00, existing starts at 10:10 — within 15-min buffer
    const existing = [makeSlot("2025-01-15T10:10:00Z", "2025-01-15T11:10:00Z")];
    const start    = new Date("2025-01-15T09:00:00Z");
    const end      = new Date("2025-01-15T10:00:00Z"); // bufferedEnd = 10:15
    expect(hasTimeOverlap(start, end, existing, BUFFER_MS)).toBe(true);
  });

  test("no conflict when gap exceeds buffer", () => {
    // New slot ends at 10:00, existing starts at 10:30 — beyond 15-min buffer
    const existing = [makeSlot("2025-01-15T10:30:00Z", "2025-01-15T11:30:00Z")];
    const start    = new Date("2025-01-15T09:00:00Z");
    const end      = new Date("2025-01-15T10:00:00Z"); // bufferedEnd = 10:15
    expect(hasTimeOverlap(start, end, existing, BUFFER_MS)).toBe(false);
  });

  test("completely before existing slot — no conflict", () => {
    const existing = [makeSlot("2025-01-15T14:00:00Z", "2025-01-15T15:00:00Z")];
    const start    = new Date("2025-01-15T09:00:00Z");
    const end      = new Date("2025-01-15T10:00:00Z");
    expect(hasTimeOverlap(start, end, existing, BUFFER_MS)).toBe(false);
  });

  test("completely after existing slot — no conflict", () => {
    const existing = [makeSlot("2025-01-15T07:00:00Z", "2025-01-15T08:00:00Z")];
    const start    = new Date("2025-01-15T09:00:00Z");
    const end      = new Date("2025-01-15T10:00:00Z");
    expect(hasTimeOverlap(start, end, existing, BUFFER_MS)).toBe(false);
  });

  test("new slot contained within existing slot — conflict", () => {
    const existing = [makeSlot("2025-01-15T08:00:00Z", "2025-01-15T12:00:00Z")];
    const start    = new Date("2025-01-15T09:00:00Z");
    const end      = new Date("2025-01-15T10:00:00Z");
    expect(hasTimeOverlap(start, end, existing, BUFFER_MS)).toBe(true);
  });

  test("checks all slots, not just first", () => {
    const existing = [
      makeSlot("2025-01-15T07:00:00Z", "2025-01-15T08:00:00Z"), // before
      makeSlot("2025-01-15T09:30:00Z", "2025-01-15T10:30:00Z"), // conflicts
    ];
    const start = new Date("2025-01-15T09:00:00Z");
    const end   = new Date("2025-01-15T10:00:00Z");
    expect(hasTimeOverlap(start, end, existing, BUFFER_MS)).toBe(true);
  });
});

// ── resolvePriority tests ─────────────────────────────────────────────────────
describe("resolvePriority", () => {
  test("higher match score wins", () => {
    const slotA = { matchScore: 80, alternatives: 2 };
    const slotB = { matchScore: 60, alternatives: 2 };
    expect(resolvePriority(slotA, slotB)).toBe("A");
    expect(resolvePriority(slotB, slotA)).toBe("B");
  });

  test("equal score: fewer alternatives wins", () => {
    const slotA = { matchScore: 75, alternatives: 1 }; // fewer alternatives
    const slotB = { matchScore: 75, alternatives: 3 };
    expect(resolvePriority(slotA, slotB)).toBe("A");
  });

  test("equal score: equal alternatives: A wins (stable)", () => {
    const slotA = { matchScore: 75, alternatives: 2 };
    const slotB = { matchScore: 75, alternatives: 2 };
    expect(resolvePriority(slotA, slotB)).toBe("A");
  });

  test("score difference overrides alternatives count", () => {
    const slotA = { matchScore: 90, alternatives: 10 }; // high score but many alternatives
    const slotB = { matchScore: 50, alternatives: 1  }; // low score but fewest alternatives
    expect(resolvePriority(slotA, slotB)).toBe("A"); // score wins
  });

  test("zero scores handled correctly", () => {
    const slotA = { matchScore: 0, alternatives: 1 };
    const slotB = { matchScore: 0, alternatives: 1 };
    expect(resolvePriority(slotA, slotB)).toBe("A");
  });
});
