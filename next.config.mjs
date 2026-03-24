

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/bridge/:path*',
        destination: 'http://localhost:3001/:path*',
      },
    ]
  },
}

export default nextConfig
