/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    resolveAlias: {
      jspdf: "jspdf/dist/jspdf.es.min.js",
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        jspdf: "jspdf/dist/jspdf.es.min.js",
      }
    }
    return config
  },
}

export default nextConfig
