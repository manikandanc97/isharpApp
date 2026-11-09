import type { Metadata } from "next";
import { DemoTestScreen } from "@/components/demo-test";

export const metadata: Metadata = {
  title: "Full-Screen NEET Demo CBT Assessment | I-Sharp Academy",
  description:
    "Official full-screen randomized NEET practice examination with authentic bilingual questions, live countdown timer, and NTA scoring.",
};

export default function DemoTestPage() {
  return <DemoTestScreen />;
}
