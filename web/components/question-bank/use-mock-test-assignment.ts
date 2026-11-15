"use client";

import { useState } from "react";
import type { MockTest } from "./types";

export interface UseMockTestAssignmentOptions {
  initialTests?: MockTest[];
  initialSelected?: string[];
}

export function useMockTestAssignment({
  initialTests = [],
  initialSelected = [],
}: UseMockTestAssignmentOptions = {}) {
  const [tests, setTests] = useState<MockTest[]>(initialTests);
  const [selected, setSelected] = useState<string[]>(initialSelected);

  return {
    tests,
    setTests,
    selected,
    setSelected,
  };
}
