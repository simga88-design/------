'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { profile, user, login, logout, level, title, updateNickname, updateProfileImage } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (profile) setTempName(profile.nickname);
    // Initialize dark mode from html class
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, [profile]);

  const toggleDarkMode = () => {
    const root = document.documentElement;
    const isDark = root.classList.toggle('dark');
    setIsDarkMode(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  if (!user || !profile) {
    return (
      <main className="pt-32 pb-32 px-4 sm:px-6 max-w-lg mx-auto relative min-h-screen text-center flex flex-col items-center">
        <div className="w-24 h-24 bg-pink-100 dark:bg-pink-900/40 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-pink-500 text-5xl">lock</span>
        </div>
        <h1 className="text-3xl font-black mb-4 font-headline text-slate-900 dark:text-white">반갑습니다! 👋</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-10 font-bold leading-relaxed">
          동아리 활동을 시작하고 나만의 스크랩북 ID를<br/>
          만들려면 가장 먼저 로그인을 해주세요!
        </p>
        <button 
          onClick={login} 
          className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-700 px-8 py-4 rounded-full font-black text-lg shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 w-content"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-6 h-6" />
          구글 계정으로 3초만에 가입하기
        </button>
      </main>
    );
  }

  const minPointsForCurrent = 50 * Math.pow(level - 1, 2);
  const minPointsForNext = 50 * Math.pow(level, 2);
  const progressPercent = Math.min(100, Math.max(0, ((profile.points - minPointsForCurrent) / (minPointsForNext - minPointsForCurrent)) * 100));

  const handleSaveName = () => {
    if (tempName.trim().length > 0) updateNickname(tempName.trim());
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        updateProfileImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="pt-24 pb-32 px-4 sm:px-6 max-w-lg mx-auto relative min-h-screen">
      {/* Decorative background */}
      <div className="absolute top-20 right-5 opacity-40 rotate-[15deg] pointer-events-none">
        <span className="material-symbols-outlined text-pink-500 text-6xl drop-shadow-md" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
      </div>

      <div className="text-center mb-10">
        <h1 className="font-headline text-4xl font-black text-slate-900 dark:text-white mb-2">내 정보</h1>
        <p className="text-slate-600 dark:text-slate-400 font-body font-bold text-sm bg-white/40 dark:bg-black/40 inline-block px-4 py-1 rounded-full backdrop-blur-sm">
          나만의 K-Pop 스크랩북 ID
        </p>
      </div>

      {/* ID Card (사원증 스타일) */}
      <div className="bg-white/80 dark:bg-[#1a1625]/90 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl border border-pink-200/50 dark:border-pink-800/30 relative overflow-hidden group hover:shadow-pink-300/20 transition-all duration-500 max-w-sm mx-auto flex flex-col items-center">
        
        {/* Hologram Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-300/20 via-transparent to-indigo-300/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

        {/* Lanyard Hole (사원증 목걸이 구멍) */}
        <div className="w-14 h-2.5 bg-slate-200/50 dark:bg-black/50 rounded-full mb-6 shadow-inner mx-auto mt-2"></div>

        {/* Profile Photo Area */}
        <div className="relative z-10 mb-5">
           <label className="block w-32 h-32 rounded-full border-[5px] border-white dark:border-slate-800 shadow-xl bg-gradient-to-br from-pink-400 to-indigo-500 flex items-center justify-center cursor-pointer overflow-hidden group/avatar relative">
            {profile.profileImage ? (
              <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-white text-6xl drop-shadow-md" style={{ fontVariationSettings: "'FILL' 1" }}>face_6</span>
            )}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white text-2xl mb-1">photo_camera</span>
              <span className="text-white text-[10px] font-bold">사진 변경</span>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          <div className="absolute -bottom-2 -right-3 bg-yellow-400 text-slate-900 w-12 h-12 rounded-full flex flex-col items-center justify-center font-headline font-black shadow-lg border-[3px] border-white dark:border-slate-800 rotate-12 transition-transform hover:rotate-0 z-20 pointer-events-none">
            <span className="text-[10px] leading-tight -mb-1">LV</span>
            <span className="text-xl leading-tight">{level}</span>
          </div>
        </div>

        {/* Title Badges */}
        <div className="bg-gradient-to-r from-pink-100 to-indigo-100 dark:from-pink-900/50 dark:to-indigo-900/50 text-pink-700 dark:text-pink-300 px-5 py-1.5 rounded-full text-sm font-extrabold font-body mb-3 shadow-sm border border-pink-200/50 dark:border-pink-700/50">
          {title}
        </div>

        {/* Nickname (Edit Mode) */}
        {isEditing ? (
          <div className="flex flex-col items-center gap-2 mb-4 z-10 w-full px-4">
            <div className="flex w-full gap-2">
              <input 
                type="text" 
                value={tempName} 
                onChange={e => setTempName(e.target.value)}
                className="w-full text-center font-headline text-2xl font-black bg-white/50 dark:bg-black/50 dark:text-white border-2 border-pink-300 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-pink-500"
                maxLength={15}
                autoFocus
              />
              <button onClick={handleSaveName} className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl px-4 py-2 font-bold shadow-md active:scale-95 transition-all shrink-0">적용</button>
            </div>
            <p className="text-[11px] font-bold text-pink-600 dark:text-pink-400 bg-white/60 dark:bg-black/40 px-3 py-1 rounded-full shadow-sm mt-1">🎫 닉네임 교환권 1장이 바로 차감됩니다.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-4 z-10 w-full">
            <div 
              className="flex items-center gap-2 group/edit cursor-pointer hover:bg-slate-100/50 dark:hover:bg-white/5 px-4 py-1.5 rounded-2xl transition-colors" 
              onClick={() => {
                if ((profile.tickets || 0) > 0) setIsEditing(true);
                else alert("보유한 닉네임 교환권이 없습니다!\n아이디어 게시(50P) 및 공감(10P)으로 레벨을 올려 10레벨 단위 보상을 얻어보세요!");
              }}
            >
              <h2 className="font-headline text-3xl font-black text-slate-900 dark:text-white drop-shadow-sm">{profile.nickname}</h2>
              {(profile.tickets || 0) > 0 && <span className="material-symbols-outlined text-slate-400 opacity-0 group-hover/edit:opacity-100 transition-opacity text-sm">edit</span>}
            </div>
            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full mt-1">
              보유 교환권: 🎫 <span className="text-indigo-600 dark:text-pink-400 font-black">{profile.tickets || 0}</span>장
            </p>
          </div>
        )}

        <div className="w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200/50 dark:border-slate-800 mb-6">
          <p className="text-slate-500 dark:text-slate-400 font-bold text-[11px] mb-1">내 누적 아이돌 포인트 💎</p>
          <p className="text-pink-600 dark:text-pink-400 font-headline font-black text-xl mb-4 text-right">{profile.points.toLocaleString()} <span className="text-sm">P</span></p>

          {/* EXP Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3.5 relative overflow-hidden shadow-inner border border-slate-300/50 dark:border-slate-700/50">
            <div 
              className="bg-gradient-to-r from-pink-400 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${progressPercent}%` }}
            >
              {/* Sparkle pattern overlay on the bar */}
              <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "4px 4px" }}></div>
            </div>
          </div>
          <div className="w-full flex justify-between text-[11px] font-black text-slate-400 dark:text-slate-500 mt-2 px-1">
            <span>Lv.{level}</span>
            <span>NEXT Lv.{level >= 99 ? 'MAX' : level + 1} ({minPointsForNext.toLocaleString()}P)</span>
          </div>
        </div>

        {/* Decorative ID Card Elements */}
        <div className="absolute top-4 right-4 text-[10px] font-black text-slate-300 dark:text-slate-600 rotate-90 font-headline tracking-widest pointer-events-none">
          CREATOR ID
        </div>
      </div>

      {/* Settings Menu */}
      <div className="mt-8 space-y-4 max-w-sm mx-auto">
        <h3 className="font-headline font-bold text-slate-700 dark:text-slate-300 px-2">설정 및 테마</h3>
        
        {/* Dark Mode Toggle */}
        <div className="bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-200/50 dark:border-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2.5 rounded-xl text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isDarkMode ? 'dark_mode' : 'light_mode'}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">네온 키치 (다크 모드)</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">화면을 힙한 야간 모드로 바꿉니다</p>
            </div>
          </div>
          
          {/* Custom iOS style toggle switch */}
          <button 
            onClick={toggleDarkMode}
            className={`w-14 h-8 rounded-full p-1 drop-shadow-sm transition-colors duration-300 ease-in-out shrink-0 ${isDarkMode ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </button>
        </div>

        {/* Auth section */}
        <button 
          onClick={logout} 
          className="w-full bg-slate-200/50 dark:bg-slate-800/50 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-2xl p-4 font-bold transition-colors border border-slate-200 dark:border-slate-800"
        >
          안전하게 로그아웃
        </button>
      </div>
    </main>
  );
}
