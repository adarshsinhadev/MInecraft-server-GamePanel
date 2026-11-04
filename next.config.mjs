const backendUrl = process.env.BACKEND_URL || "http" + ":" + "/" + "/" + "127.0.0.1:3001";

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["mc-heads.net", "crafatar.com", "minotar.net"],
  },
  async rewrites() {
    return [{
      source: "/backend/:path*",
      destination: backendUrl + "/:path*",
    }];
  },
};

export default nextConfig;
