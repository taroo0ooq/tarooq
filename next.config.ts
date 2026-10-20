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
    "/ar/posts": ["./content/posts/**/*"],
    "/ar/posts/[slug]": ["./content/posts/**/*"],
  },
};

export default nextConfig;
