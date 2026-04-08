'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, generateKitschNickname, calculateLevel, getTitleByLevel } from '@/lib/userSystem';
import { auth, db, provider, storage } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export interface ExtendedUserProfile extends UserProfile {
  tickets?: number;
  lastTicketLevel?: number;
  lastLoginDate?: string;
  streak?: number;
}

interface UserContextType {
  profile: ExtendedUserProfile | null;
  user: User | null;
  level: number;
  title: string;
  addPoints: (p: number) => void;
  updateNickname: (n: string) => void;
  updateProfileImage: (b64: string) => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<ExtendedUserProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [toastQueue, setToastQueue] = useState<{id: number, p: number}[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        const today = new Date().toLocaleDateString('ko-KR');

        if (docSnap.exists()) {
          const data = docSnap.data() as ExtendedUserProfile;
          
          let updatedData: Partial<ExtendedUserProfile> = {};
          let shouldUpdate = false;
          let bonusPoints = 0;
          let newStreak = data.streak || 0;

          if (data.lastLoginDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('ko-KR');
            if (data.lastLoginDate === yesterday) {
              newStreak += 1;
            } else {
              newStreak = 1;
            }
            
            bonusPoints = 500;
            if (newStreak % 7 === 0) bonusPoints += 3000;
            else if (newStreak % 3 === 0) bonusPoints += 1500;
            
            updatedData = { 
              lastLoginDate: today, 
              streak: newStreak,
              points: (data.points || 0) + bonusPoints
            };
            shouldUpdate = true;
          }

          if (shouldUpdate) {
            const nextProfile = { ...data, ...updatedData };
            setProfile(nextProfile);
            await updateDoc(docRef, updatedData);
            if (bonusPoints > 0) {
              setTimeout(() => {
                 alert(`🎉 출석 완료! 연속 ${newStreak}일 접속 보상으로 +${bonusPoints.toLocaleString()}P 획득!`);
              }, 1500);
            }
          } else {
            setProfile(data);
          }
        } else {
          // 신규 가입자 초기 프로필 생성
          const newProfile: ExtendedUserProfile = {
            nickname: generateKitschNickname(),
            points: 500, // 최초 보상
            profileImage: u.photoURL || undefined,
            tickets: 0,
            lastTicketLevel: 1,
            lastLoginDate: today,
            streak: 1
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
          setTimeout(() => { alert(`🎉 환영합니다! 최초 출석 보상으로 +500P 획득!`); }, 1500);
        }
      } else {
        setProfile(null);
      }
    });
    return () => unsub();
  }, []);

  const addPoints = async (p: number) => {
    if (!user || !profile) return;

    // Toast UI 추가
    const tid = Date.now() + Math.random();
    setToastQueue(prev => [...prev, { id: tid, p }]);
    setTimeout(() => {
      setToastQueue(prev => prev.filter(t => t.id !== tid));
    }, 2500);

    const nextPoints = profile.points + p;
    const oldLevel = calculateLevel(profile.points);
    const newLevel = calculateLevel(nextPoints);
    
    let nextTickets = profile.tickets || 0;
    let nextLastLevel = profile.lastTicketLevel || 1;

    if (newLevel > oldLevel) {
      let isTicketGained = false;
      if (Math.floor(newLevel / 10) > Math.floor(oldLevel / 10)) {
        nextTickets += 1;
        nextLastLevel = newLevel;
        isTicketGained = true;
      }

      import('canvas-confetti').then(confetti => {
        confetti.default({
          particleCount: 200,
          spread: 120,
          origin: { y: 0.5 },
          colors: ['#f472b6', '#818cf8', '#34d399', '#fbbf24'],
          zIndex: 99999
        });
        setTimeout(() => {
          let msg = `🎉 축하합니다! 레벨업 하셨습니다!\n현재 레벨: Lv.${newLevel}\n새로운 칭호 획득: [${getTitleByLevel(newLevel)}]`;
          if (isTicketGained) msg += `\n\n🎁 10단위 레벨업 달성 보상: [닉네임 교환권 1장]을 획득하셨습니다!`;
          alert(msg);
        }, 500);
      });
    }

    const nextProfile = { ...profile, points: nextPoints, tickets: nextTickets, lastTicketLevel: nextLastLevel };
    setProfile(nextProfile);
    await updateDoc(doc(db, 'users', user.uid), { points: nextPoints, tickets: nextTickets, lastTicketLevel: nextLastLevel });
  };

  const updateNickname = async (n: string) => {
    if (!user || !profile) return;
    const currentTickets = profile.tickets || 0;
    if (currentTickets <= 0) {
      alert("닉네임 교환권이 없습니다! 아이디어를 많이 올려서 10레벨업 보상을 받아보세요.");
      return;
    }
    const nextProfile = { ...profile, nickname: n, tickets: currentTickets - 1 };
    setProfile(nextProfile);
    await updateDoc(doc(db, 'users', user.uid), { nickname: n, tickets: currentTickets - 1 });
  };

  const updateProfileImage = async (b64: string) => {
    if (!user || !profile) return;
    try {
      const imageRef = ref(storage, `profiles/${user.uid}_${Date.now()}`);
      await uploadString(imageRef, b64, 'data_url');
      const url = await getDownloadURL(imageRef);
      const nextProfile = { ...profile, profileImage: url };
      setProfile(nextProfile);
      await updateDoc(doc(db, 'users', user.uid), { profileImage: url });
    } catch (e) {
      console.error(e);
      alert("프로필 이미지 스토리지 업로드에 실패했습니다. Firebase 권한을 확인해주세요.");
    }
  };

  const login = async () => {
    try { await signInWithPopup(auth, provider); } 
    catch(e) { console.error("Login Failed", e); }
  };

  const logout = async () => {
    try { await signOut(auth); } 
    catch(e) { console.error("Logout Failed", e); }
  };

  const level = profile ? calculateLevel(profile.points) : 1;
  const title = getTitleByLevel(level);

  return (
    <UserContext.Provider value={{ profile, user, level, title, addPoints, updateNickname, updateProfileImage, login, logout }}>
      {children}
      {/* 플로팅 XP 토스트 UI */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-[9999] pointer-events-none">
        {toastQueue.map((toast) => (
          <div key={toast.id} className="toast-animation bg-gradient-to-r from-pink-500 to-orange-400 text-white font-black px-6 py-4 rounded-full shadow-[0_10px_25px_-5px_rgba(236,72,153,0.6)] border-2 border-white/50 text-xl flex items-center justify-between min-w-[200px]">
            <span className="drop-shadow-sm">✨ XP 획득!</span>
            <span className="text-3xl ml-4 drop-shadow-md text-yellow-100">+{toast.p.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser는 항상 UserProvider 내부에서 호출되어야 합니다.");
  return context;
}
