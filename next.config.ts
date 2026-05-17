import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // voyageai를 번들에서 제외 — CJS 로드는 voyage/index.ts의 createRequire가 처리
  serverExternalPackages: ["voyageai"],
};

export default nextConfig;
