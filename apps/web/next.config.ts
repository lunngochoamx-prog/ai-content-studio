import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const repoBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (isGithubPages ? "/ai-content-studio" : "");
const backendOrigin = process.env.API_BACKEND_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = isGithubPages
  ? {
      output: "export",
      basePath: repoBasePath,
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {
      async rewrites() {
        return [
          {
            source: "/api/:path*",
            destination: `${backendOrigin}/api/:path*`,
          },
        ];
      },
    };

export default nextConfig;
