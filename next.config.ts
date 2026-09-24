import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The archive moved onto /events, under the upcoming events.
  async redirects() {
    return [{ source: "/events/past", destination: "/events#past", permanent: true }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/event-posters/**",
      },
    ],
  },
};

export default nextConfig;
