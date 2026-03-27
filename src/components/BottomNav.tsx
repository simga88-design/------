'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: '홈', path: '/', icon: 'home' },
    { name: '탐색', path: '/ideas', icon: 'search' },
    { name: '기록', path: '/records', icon: 'auto_stories' },
    { name: '내 정보', path: '/profile', icon: 'person_heart' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full h-20 bg-white/80 dark:bg-purple-950/80 backdrop-blur-2xl flex justify-around items-center px-4 pb-2 z-50 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = pathname === item.path;

        if (isActive) {
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              className="flex flex-col items-center justify-center bg-gradient-to-br from-pink-400 to-indigo-400 text-white rounded-full p-3 mb-1 shadow-lg shadow-pink-200 transition-all duration-300 scale-105"
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-headline text-[11px] font-bold mt-0.5">{item.name}</span>
            </Link>
          );
        }

        return (
          <Link 
            key={item.path} 
            href={item.path} 
            className="flex flex-col items-center justify-center text-slate-400 p-2 hover:text-pink-500 hover:-translate-y-1 transition-all duration-300"
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-headline text-[11px] font-bold mt-0.5">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
