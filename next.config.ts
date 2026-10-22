import type { NextConfig } from "next";

const githubPagesRepo = process.env.GITHUB_PAGES_REPOSITORY;
const basePath = githubPagesRepo ? `/${githubPagesRepo}` : "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  ...(basePath
    ? { basePath, assetPrefix: `${basePath}/` }
    : {}),
  images: {
    unoptimized: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
