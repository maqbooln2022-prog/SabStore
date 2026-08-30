/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // item photo URLs are user-supplied; tighten this once you know real sources
    ],
  },
};

module.exports = nextConfig;
