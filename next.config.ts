import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 모바일 접속 시 HMR(실시간 렌더링) 웹소켓 연결 차단을 해제하기 위한 허용 IP 목록
  experimental: {
    // Next 14+ specific experimental flag if needed
  },
  // @ts-ignore - Next.js internal / newest config typed
  allowedDevOrigins: ['192.168.55.139', 'localhost', '0.0.0.0', '127.0.0.1'],
};

export default nextConfig;
