'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: '홈', path: '/', icon: 'home' },
  { name: '탐색', path: '/ideas', icon: 'search' },
  { name: '기록', path: '/records', icon: 'auto_stories' },
  { name: '내 정보', path: '/profile', icon: 'person_heart' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full h-[76px] bg-[#fffdf8]/92 dark:bg-slate-950/92 backdrop-blur-xl flex justify-around items-center px-3 pb-2 z-50 border-t border-[#e6dfd3] dark:border-slate-800">
      {navItems.map((item) => {
        const isActive = pathname === item.path;

        return (
          <Link
            key={item.path}
            href={item.path}
            aria-current={isActive ? 'page' : undefined}
            className={`h-14 min-w-16 px-3 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors ${
              isActive
                ? 'bg-[#172033] text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900 hover:text-[#172033] dark:hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
              {item.icon}
            </span>
            <span className="font-headline text-[11px] font-black">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
