/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow API calls to the FastAPI backend
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ];
  },
};

export default nextConfig;
