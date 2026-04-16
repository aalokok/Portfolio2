import type { Metadata } from "next";
import { WisdomClient } from "@/components/wisdom/client";

export const metadata: Metadata = {
  title: "Wisdom — Aalok Sud",
  robots: { index: false, follow: false },
};

export default function WisdomPage() {
  return <WisdomClient />;
}
