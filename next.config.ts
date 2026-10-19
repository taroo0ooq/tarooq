import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/experience", destination: "/", permanent: false },
      { source: "/expertise", destination: "/business", permanent: false },
    ];
  },
  outputFileTracingIncludes: {
    "/posts": ["./content/posts/**/*"],
    "/posts/[slug]": ["./content/posts/**/*"],
  },
};

export default nextConfig;
