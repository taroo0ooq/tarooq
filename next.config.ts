import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "edbgctmcyinzrectewel.supabase.co",
        pathname: "/storage/v1/object/public/post-images/**",
      },
    ],
  },
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
      {
        source: "/posts/new/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
  outputFileTracingIncludes: {
    "/": ["./content/person-jsonld.json"],
    "/ar": ["./content/person-jsonld.json"],
    "/llms.txt": ["./content/llms.txt"],
    "/opengraph-image": ["./public/personal-image.jpg"],
    "/posts": ["./content/posts/**/*"],
    "/posts/[slug]": ["./content/posts/**/*"],
    "/ar/posts": ["./content/posts/**/*"],
    "/ar/posts/[slug]": ["./content/posts/**/*"],
    "/sitemap.xml": ["./content/posts/**/*"],
  },
};

export default nextConfig;
