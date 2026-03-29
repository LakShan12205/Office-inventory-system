const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true
  },
  env: {
    NEXT_PUBLIC_USE_MOCK_DATA: process.env.USE_MOCK_DATA ?? "true"
  }
};

export default nextConfig;
