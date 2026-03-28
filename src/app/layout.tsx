import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Be_Vietnam_Pro } from "next/font/google";
import BottomNav from "@/components/BottomNav";
import TopNav from "@/components/TopNav";
import { UserProvider } from "@/context/UserContext";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-plus-jakarta" 
});
const beVietnam = Be_Vietnam_Pro({ 
  subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-be-vietnam" 
});

export const metadata: Metadata = {
  title: "아이디어 나눔터",
  description: "복지메이커스 아이디어 나눔터",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`light ${plusJakarta.variable} ${beVietnam.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              var userAgent = navigator.userAgent.toLowerCase();
              if (userAgent.indexOf("kakaotalk") > -1) {
                if (userAgent.indexOf("android") > -1) {
                  location.href = 'intent://' + location.href.replace(/https?:\\/\\//i, '') + '#Intent;scheme=https;package=com.android.chrome;end';
                } else if (userAgent.indexOf("iphone") > -1 || userAgent.indexOf("ipad") > -1) {
                  alert("안전한 로그인을 위해 오른쪽 아래의 나침반(또는 사파리) 아이콘을 눌러 'Safari로 열기'를 선택해 주세요.");
                }
              }
            `,
          }}
        />
      </head>
      <body className="bg-background font-body text-on-surface min-h-screen holographic-bg flex flex-col">
        <UserProvider>
        { /* TopAppBar Shell */ }
        <TopNav />

        {children}

        { /* BottomNavBar Shell */ }
        <BottomNav />
        
        { /* Decorative Washi Tape */ }
        <div className="hidden md:block fixed top-20 right-4 w-32 h-8 bg-primary-container/40 opacity-50 sticker-rotate-neg -z-10 pointer-events-none" style={{ maskImage: "linear-gradient(to right, black, transparent)", WebkitMaskImage: "linear-gradient(to right, black, transparent)" }}></div>
        <div className="hidden md:block fixed bottom-24 left-4 w-24 h-6 bg-secondary-container/40 opacity-50 sticker-rotate-pos -z-10 pointer-events-none"></div>
        </UserProvider>
      </body>
    </html>
  );
}
