import type { NextConfig } from 'next';

const config: NextConfig = {
  devIndicators: false,
  trailingSlash: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: { unoptimized: true },
};
export default config;
