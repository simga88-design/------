import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 모바일/같은 네트워크 기기에서 개발 서버에 접속할 때 HMR origin 차단을 피하기 위한 허용 목록입니다.
  allowedDevOrigins: ["192.168.55.139", "localhost", "0.0.0.0", "127.0.0.1"],
};

export default nextConfig;
