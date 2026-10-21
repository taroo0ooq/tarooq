import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/experience", destination: "/", permanent: false },
      { source: "/expertise", destination: "/business", permanent: false },
      { source: "/posts/2026-10-12-regional-capability", destination: "/posts", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/posts/new",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
  outputFileTracingIncludes: {
    "/posts": ["./content/posts/**/*"],
    "/posts/[slug]": ["./content/posts/**/*"],
  },
};

export default nextConfig;
