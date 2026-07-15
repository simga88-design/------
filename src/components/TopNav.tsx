'use client';

import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ExtendedUserProfile } from '@/context/UserContext';
import { calculateLevel, getTitleByLevel } from '@/lib/userSystem';

export default function TopNav() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [topUsers, setTopUsers] = useState<ExtendedUserProfile[]>([]);

  useEffect(() => {
    if (!isSidebarOpen) return;

    const rankingQuery = query(collection(db, 'users'), orderBy('points', 'desc'), limit(10));
    const unsubscribe = onSnapshot(rankingQuery, (snapshot) => {
      setTopUsers(snapshot.docs.map((doc) => doc.data() as ExtendedUserProfile));
    });

    return () => unsubscribe();
  }, [isSidebarOpen]);

  const handleConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.1, x: 0.9 },
      colors: ['#f472b6', '#34d399', '#fbbf24', '#818cf8'],
    });
  };

  return (
    <>
      <header className="fixed top-0 w-full z-40 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.05)] h-16 border-b border-pink-100 dark:border-pink-900/30">
        <div className="flex justify-between items-center px-6 h-full w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="material-symbols-outlined text-pink-600 dark:text-pink-400 hover:scale-125 hover:rotate-6 transition-all cursor-pointer"
              aria-label="명예의 전당 열기"
            >
              leaderboard
            </button>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white font-headline tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              아이디어 나눔터
            </h1>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={handleConfetti}
              className="material-symbols-outlined text-pink-600 dark:text-pink-400 hover:scale-125 hover:-rotate-12 transition-all cursor-pointer"
              aria-label="축하 효과"
            >
              auto_awesome
            </button>
          </div>
        </div>
      </header>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`fixed top-0 left-0 h-full w-72 sm:w-80 bg-white dark:bg-slate-900 shadow-2xl z-[101] transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col border-r-4 border-pink-300 dark:border-pink-800`}>
        <div className="p-6 bg-gradient-to-br from-pink-400 to-indigo-500 text-white flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
          <h2 className="font-headline text-2xl font-black relative z-10 drop-shadow-sm">명예의 전당</h2>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="material-symbols-outlined relative z-10 hover:scale-125 transition-transform bg-black/20 rounded-full w-8 h-8 flex items-center justify-center"
            aria-label="명예의 전당 닫기"
          >
            close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-yellow-500">emoji_events</span>
            종합 랭킹 TOP 10
          </h3>
          <div className="space-y-4">
            {topUsers.map((rankedUser, index) => {
              const level = calculateLevel(rankedUser.points);
              const rankColor = index === 0
                ? 'bg-yellow-400 text-slate-900 shadow-[0_0_15px_rgba(250,204,21,0.5)]'
                : index === 1
                  ? 'bg-slate-300 text-slate-800'
                  : index === 2
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 dark:bg-slate-700 text-white';

              return (
                <div
                  key={`${rankedUser.nickname}-${index}`}
                  className={`flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border ${index === 0 ? 'border-yellow-400' : 'border-slate-200 dark:border-slate-700'} hover:scale-[1.02] transition-transform`}
                >
                  <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center font-black ${rankColor} text-sm font-headline`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-black text-slate-800 dark:text-white truncate text-sm">{rankedUser.nickname}</span>
                      <span className="text-pink-500 font-black text-xs shrink-0 bg-pink-50 dark:bg-pink-900/30 px-2 rounded-full">
                        {rankedUser.points.toLocaleString()}P
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full inline-block truncate max-w-full">
                      Lv.{level} {getTitleByLevel(level)}
                    </div>
                  </div>
                </div>
              );
            })}
            {topUsers.length === 0 && <p className="text-center text-sm font-bold text-slate-400 py-8">가입된 멤버가 없습니다.</p>}
          </div>

          <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
            <h4 className="font-bold text-indigo-800 dark:text-indigo-300 text-xs mb-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">tips_and_updates</span>
              랭킹을 올리는 방법
            </h4>
            <ul className="text-[11px] text-indigo-600 dark:text-indigo-400 space-y-2 font-medium leading-relaxed bg-white/50 dark:bg-black/20 p-3 rounded-xl">
              <li className="flex justify-between border-b border-indigo-100/50 dark:border-indigo-800/30 pb-1">
                <span>새 아이디어 작성</span>
                <strong className="font-black text-pink-500">+500P</strong>
              </li>
              <li className="flex justify-between border-b border-indigo-100/50 dark:border-indigo-800/30 pb-1">
                <span>다른 사람 글에 공감</span>
                <strong className="font-black text-pink-500">+100P</strong>
              </li>
              <li className="flex justify-between">
                <span>10레벨 단위 보상</span>
                <strong className="font-black text-indigo-500">교환권 +1</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
