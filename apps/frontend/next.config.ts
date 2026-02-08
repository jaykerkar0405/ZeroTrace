import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "@react-native-async-storage/async-storage": false,
        "pino-pretty": false,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
      };
    } else {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    config.module = {
      ...config.module,
      unknownContextCritical: false,
    };
    
    return config;
  },
  transpilePackages: ['snarkjs', 'ffjavascript', '@anon-aadhaar/core', '@anon-aadhaar/react'],
};

export default nextConfig;
