'use client';
import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ExtendedUserProfile } from '@/context/UserContext';
import { getTitleByLevel, calculateLevel } from '@/lib/userSystem';

export default function TopNav() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [topUsers, setTopUsers] = useState<ExtendedUserProfile[]>([]);

  useEffect(() => {
    if (isSidebarOpen) {
      const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(10));
      const unsub = onSnapshot(q, (snapshot) => {
        setTopUsers(snapshot.docs.map(doc => doc.data() as ExtendedUserProfile));
      });
      return () => unsub();
    }
  }, [isSidebarOpen]);

  const handleConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.1, x: 0.9 }, // 화면 우측 상단 별표 버튼 근처
      colors: ['#f472b6', '#34d399', '#fbbf24', '#818cf8']
    });
  };

  return (
    <>
      <header className="fixed top-0 w-full z-40 bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.05)] h-16 border-b border-pink-100 dark:border-pink-900/30">
        <div className="flex justify-between items-center px-6 h-full w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="material-symbols-outlined text-pink-600 dark:text-pink-400 hover:scale-125 hover:rotate-6 transition-all cursor-pointer">menu</button>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white font-headline tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">아이디어 나눔터</h1>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button onClick={handleConfetti} className="material-symbols-outlined text-pink-600 dark:text-pink-400 hover:scale-125 hover:-rotate-12 transition-all cursor-pointer">auto_awesome</button>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar Panel */}
      <div className={`fixed top-0 left-0 h-full w-72 sm:w-80 bg-white dark:bg-slate-900 shadow-2xl z-[101] transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col border-r-4 border-pink-300 dark:border-pink-800`}>
        <div className="p-6 bg-gradient-to-br from-pink-400 to-indigo-500 text-white flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "10px 10px" }}></div>
          <h2 className="font-headline text-2xl font-black relative z-10 drop-shadow-sm">✨ 명예의 전당</h2>
          <button onClick={() => setIsSidebarOpen(false)} className="material-symbols-outlined relative z-10 hover:scale-125 transition-transform bg-black/20 rounded-full w-8 h-8 flex items-center justify-center">close</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-yellow-500">emoji_events</span> 종합 랭킹 TOP 10
          </h3>
          <div className="space-y-4">
            {topUsers.map((u, i) => {
              const lv = calculateLevel(u.points);
              const rankColor = i === 0 ? 'bg-yellow-400 text-slate-900 shadow-[0_0_15px_rgba(250,204,21,0.5)]' 
                            : i === 1 ? 'bg-slate-300 text-slate-800' 
                            : i === 2 ? 'bg-amber-600 text-white' 
                            : 'bg-slate-800 dark:bg-slate-700 text-white';
              return (
                <div key={i} className={`flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border ${i === 0 ? 'border-yellow-400' : 'border-slate-200 dark:border-slate-700'} hover:scale-[1.02] transition-transform group/card`}>
                  <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center font-black ${rankColor} text-sm font-headline`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="font-black text-slate-800 dark:text-white truncate text-sm">{u.nickname}</span>
                      <span className="text-pink-500 font-black text-xs shrink-0 bg-pink-50 dark:bg-pink-900/30 px-2 rounded-full">{u.points.toLocaleString()}P</span>
                    </div>
                    <div className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full inline-block truncate max-w-full">
                      Lv.{lv} {getTitleByLevel(lv)}
                    </div>
                  </div>
                </div>
              );
            })}
            {topUsers.length === 0 && <p className="text-center text-sm font-bold text-slate-400 py-8">가입된 멤버가 없습니다!</p>}
          </div>

          <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
            <h4 className="font-bold text-indigo-800 dark:text-indigo-300 text-xs mb-2 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">tips_and_updates</span> 랭커가 되는 꿀팁</h4>
            <ul className="text-[11px] text-indigo-600 dark:text-indigo-400 space-y-2 font-medium leading-relaxed bg-white/50 dark:bg-black/20 p-3 rounded-xl">
              <li className="flex justify-between border-b border-indigo-100/50 dark:border-indigo-800/30 pb-1">
                <span>신규 아이디어 작성</span> <strong className="font-black text-pink-500">+50P</strong>
              </li>
              <li className="flex justify-between border-b border-indigo-100/50 dark:border-indigo-800/30 pb-1">
                <span>다른 사람 글에 공감</span> <strong className="font-black text-pink-500">+10P</strong>
              </li>
              <li className="flex justify-between">
                <span>10레벨 달성 시 보상</span> <strong className="font-black text-indigo-500">교환권 +1</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
