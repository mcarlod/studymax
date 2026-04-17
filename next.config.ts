import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    images: { remotePatterns: [
        {
            protocol: 'https',
            hostname: 'covers.openlibrary.org'
        },
        {
            protocol: 'https',
            hostname: 'bkxd0qkkxjqrumuh.public.blob.vercel-storage.com'
        },
    ]},
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb'
        }
    }
};

export default nextConfig;
