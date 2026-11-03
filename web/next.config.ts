import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

import { resolveDummyAuthMode } from "./lib/dev-auth-config";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default function configureNext(phase: string): NextConfig {
  if (
    process.env.DUMMY_AUTH_ENABLED === "true" &&
    phase !== PHASE_DEVELOPMENT_SERVER
  ) {
    throw new Error(
      "DUMMY_AUTH_ENABLED may only be true for the Next.js development server",
    );
  }
  resolveDummyAuthMode(process.env);
  return nextConfig;
}
