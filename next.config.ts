import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    env: {
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        NEXT_PUBLIC_VAPI_API_KEY: process.env.NEXT_PUBLIC_VAPI_API_KEY,
    },
    images: { remotePatterns: [
        {
            protocol: 'https',
            hostname: 'covers.openlibrary.org'
        },
        {
            protocol: 'https',
            hostname: 'bkxd0qkkxjqrumuh.public.blob.vercel-storage.com'
        },
        {
            protocol: 'https',
            hostname: 'placehold.co'
        },
    ]},
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb'
        }
    }
};

export default nextConfig;
