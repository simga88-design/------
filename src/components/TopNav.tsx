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
      particleCount: 90,
      spread: 64,
      origin: { y: 0.08, x: 0.92 },
      colors: ['#e85d55', '#139c8f', '#f0b429', '#172033'],
    });
  };

  return (
    <>
      <header className="fixed top-0 w-full z-40 bg-[#fffdf8]/90 dark:bg-slate-950/85 backdrop-blur-xl h-16 border-b border-[#e6dfd3] dark:border-slate-800">
        <div className="flex justify-between items-center px-4 sm:px-6 h-full w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="w-10 h-10 rounded-lg border border-[#e6dfd3] dark:border-slate-800 bg-white/70 dark:bg-slate-900 text-[#172033] dark:text-slate-100 hover:border-[#e85d55]/50 transition-colors flex items-center justify-center"
              aria-label="명예의 전당 열기"
            >
              <span className="material-symbols-outlined text-[21px]">leaderboard</span>
            </button>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-black text-[#172033] dark:text-white font-headline tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                아이디어 나눔터
              </h1>
              <p className="hidden sm:block text-[11px] font-bold text-slate-500 dark:text-slate-400 -mt-0.5">
                Makers Studio
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleConfetti}
            className="w-10 h-10 rounded-lg border border-[#e6dfd3] dark:border-slate-800 bg-white/70 dark:bg-slate-900 text-[#e85d55] hover:border-[#e85d55]/50 transition-colors flex items-center justify-center"
            aria-label="축하 효과"
          >
            <span className="material-symbols-outlined text-[21px]">auto_awesome</span>
          </button>
        </div>
      </header>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/35 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 h-full w-72 sm:w-80 bg-[#fffdf8] dark:bg-slate-950 shadow-2xl z-[101] transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col border-r border-[#e6dfd3] dark:border-slate-800`}>
        <div className="p-5 border-b border-[#e6dfd3] dark:border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-headline text-2xl font-black text-[#172033] dark:text-white">명예의 전당</h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">활동 포인트 랭킹</p>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="material-symbols-outlined hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg w-9 h-9 flex items-center justify-center text-slate-500"
            aria-label="명예의 전당 닫기"
          >
            close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 bg-[#f7f4ee] dark:bg-slate-900">
          <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-[#c98217]">emoji_events</span>
            종합 랭킹 TOP 10
          </h3>

          <div className="space-y-3">
            {topUsers.map((rankedUser, index) => {
              const level = calculateLevel(rankedUser.points);
              const rankColor = index === 0
                ? 'bg-[#f0b429] text-[#172033]'
                : index === 1
                  ? 'bg-slate-300 text-slate-900'
                  : index === 2
                    ? 'bg-[#c98217] text-white'
                    : 'bg-[#172033] text-white';

              return (
                <div
                  key={`${rankedUser.nickname}-${index}`}
                  className="flex items-center gap-3 bg-white dark:bg-slate-950 p-3 rounded-lg border border-[#e6dfd3] dark:border-slate-800"
                >
                  <div className={`w-8 h-8 rounded-lg flex shrink-0 items-center justify-center font-black ${rankColor} text-sm font-headline`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center gap-2 mb-1">
                      <span className="font-black text-[#172033] dark:text-white truncate text-sm">{rankedUser.nickname}</span>
                      <span className="text-[#e85d55] font-black text-xs shrink-0 bg-[#fff1ef] dark:bg-red-950/30 px-2 py-0.5 rounded-md">
                        {rankedUser.points.toLocaleString()}P
                      </span>
                    </div>
                    <div className="text-[10px] font-bold text-[#139c8f] dark:text-teal-300 truncate">
                      Lv.{level} {getTitleByLevel(level)}
                    </div>
                  </div>
                </div>
              );
            })}
            {topUsers.length === 0 && <p className="text-center text-sm font-bold text-slate-400 py-8">가입된 멤버가 없습니다.</p>}
          </div>

          <div className="mt-6 p-4 bg-white dark:bg-slate-950 rounded-lg border border-[#e6dfd3] dark:border-slate-800">
            <h4 className="font-black text-[#172033] dark:text-white text-sm mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[17px] text-[#139c8f]">tips_and_updates</span>
              랭킹을 올리는 방법
            </h4>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 font-bold leading-relaxed">
              <li className="flex justify-between border-b border-[#e6dfd3] dark:border-slate-800 pb-2">
                <span>새 아이디어 작성</span>
                <strong className="font-black text-[#e85d55]">+500P</strong>
              </li>
              <li className="flex justify-between border-b border-[#e6dfd3] dark:border-slate-800 pb-2">
                <span>다른 사람 글에 공감</span>
                <strong className="font-black text-[#e85d55]">+100P</strong>
              </li>
              <li className="flex justify-between">
                <span>10레벨 단위 보상</span>
                <strong className="font-black text-[#139c8f]">교환권 +1</strong>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}
