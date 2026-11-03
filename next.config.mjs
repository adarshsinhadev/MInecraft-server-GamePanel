/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["mc-heads.net", "crafatar.com", "minotar.net"],
  },
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: "http://127.0.0.1:3001/:path*",
      },
    ];
  },
};

export default nextConfig;

