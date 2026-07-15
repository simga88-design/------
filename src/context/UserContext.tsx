'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, calculateLevel, generateKitschNickname, getTitleByLevel } from '@/lib/userSystem';
import { auth, db, provider, storage } from '@/lib/firebase';
import { GoogleAuthProvider, User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';

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
  addPoints: (points: number) => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;
  updateProfileImage: (base64Image: string) => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const formatLoginDate = (date: Date) => date.toISOString().slice(0, 10);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<ExtendedUserProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [toastQueue, setToastQueue] = useState<{ id: number; points: number }[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);

      if (!authUser) {
        setProfile(null);
        return;
      }

      const docRef = doc(db, 'users', authUser.uid);
      const docSnap = await getDoc(docRef);
      const today = formatLoginDate(new Date());

      if (!docSnap.exists()) {
        const newProfile: ExtendedUserProfile = {
          nickname: generateKitschNickname(),
          points: 500,
          profileImage: authUser.photoURL || undefined,
          tickets: 0,
          lastTicketLevel: 1,
          lastLoginDate: today,
          streak: 1,
        };
        await setDoc(docRef, newProfile);
        setProfile(newProfile);
        setTimeout(() => {
          alert('환영합니다! 첫 출석 보상으로 +500P를 받았어요.');
        }, 1000);
        return;
      }

      const data = docSnap.data() as ExtendedUserProfile;
      const yesterday = formatLoginDate(new Date(Date.now() - 86_400_000));

      if (data.lastLoginDate === today) {
        setProfile(data);
        return;
      }

      const nextStreak = data.lastLoginDate === yesterday ? (data.streak || 0) + 1 : 1;
      let bonusPoints = 500;

      if (nextStreak % 7 === 0) bonusPoints += 3000;
      else if (nextStreak % 3 === 0) bonusPoints += 1500;

      const updatedData: Partial<ExtendedUserProfile> = {
        lastLoginDate: today,
        streak: nextStreak,
        points: (data.points || 0) + bonusPoints,
      };

      const nextProfile = { ...data, ...updatedData };
      setProfile(nextProfile);
      await updateDoc(docRef, updatedData);

      setTimeout(() => {
        alert(`출석 완료! ${nextStreak}일 연속 접속 보상으로 +${bonusPoints.toLocaleString()}P를 받았어요.`);
      }, 1000);
    });

    return () => unsubscribe();
  }, []);

  const addPoints = async (points: number) => {
    if (!user || !profile) return;

    const toastId = Date.now() + Math.random();
    setToastQueue((prev) => [...prev, { id: toastId, points }]);
    setTimeout(() => {
      setToastQueue((prev) => prev.filter((toast) => toast.id !== toastId));
    }, 2500);

    const nextPoints = profile.points + points;
    const oldLevel = calculateLevel(profile.points);
    const newLevel = calculateLevel(nextPoints);

    let nextTickets = profile.tickets || 0;
    let nextLastTicketLevel = profile.lastTicketLevel || 1;

    if (newLevel > oldLevel) {
      let isTicketGained = false;
      if (Math.floor(newLevel / 10) > Math.floor(oldLevel / 10)) {
        nextTickets += 1;
        nextLastTicketLevel = newLevel;
        isTicketGained = true;
      }

      import('canvas-confetti').then((confetti) => {
        confetti.default({
          particleCount: 200,
          spread: 120,
          origin: { y: 0.5 },
          colors: ['#f472b6', '#818cf8', '#34d399', '#fbbf24'],
          zIndex: 99999,
        });
        setTimeout(() => {
          let message = `축하합니다! 레벨이 올랐어요.\n현재 레벨: Lv.${newLevel}\n새 칭호: ${getTitleByLevel(newLevel)}`;
          if (isTicketGained) message += '\n\n10레벨 단위 보상으로 닉네임 교환권 1장을 받았어요.';
          alert(message);
        }, 500);
      });
    }

    const nextProfile = {
      ...profile,
      points: nextPoints,
      tickets: nextTickets,
      lastTicketLevel: nextLastTicketLevel,
    };
    setProfile(nextProfile);
    await updateDoc(doc(db, 'users', user.uid), {
      points: nextPoints,
      tickets: nextTickets,
      lastTicketLevel: nextLastTicketLevel,
    });
  };

  const updateNickname = async (nickname: string) => {
    if (!user || !profile) return;

    const currentTickets = profile.tickets || 0;
    if (currentTickets <= 0) {
      alert('닉네임 교환권이 없어요. 아이디어를 올리고 공감하며 10레벨 단위 보상을 받아보세요.');
      return;
    }

    const nextProfile = { ...profile, nickname, tickets: currentTickets - 1 };
    setProfile(nextProfile);
    await updateDoc(doc(db, 'users', user.uid), { nickname, tickets: currentTickets - 1 });
  };

  const updateProfileImage = async (base64Image: string) => {
    if (!user || !profile) return;

    try {
      const imageRef = ref(storage, `profiles/${user.uid}_${Date.now()}`);
      await uploadString(imageRef, base64Image, 'data_url');
      const url = await getDownloadURL(imageRef);
      const nextProfile = { ...profile, profileImage: url };
      setProfile(nextProfile);
      await updateDoc(doc(db, 'users', user.uid), { profileImage: url });
    } catch (error) {
      console.error(error);
      alert('프로필 이미지 업로드에 실패했어요. Firebase Storage 권한을 확인해주세요.');
    }
  };

  const login = async () => {
    try {
      provider.setCustomParameters({ prompt: 'select_account' } satisfies Parameters<GoogleAuthProvider['setCustomParameters']>[0]);
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const level = profile ? calculateLevel(profile.points) : 1;
  const title = getTitleByLevel(level);

  return (
    <UserContext.Provider value={{ profile, user, level, title, addPoints, updateNickname, updateProfileImage, login, logout }}>
      {children}
      <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-[9999] pointer-events-none">
        {toastQueue.map((toast) => (
          <div
            key={toast.id}
            className="toast-animation bg-gradient-to-r from-pink-500 to-orange-400 text-white font-black px-6 py-4 rounded-full shadow-[0_10px_25px_-5px_rgba(236,72,153,0.6)] border-2 border-white/50 text-xl flex items-center justify-between min-w-[200px]"
          >
            <span className="drop-shadow-sm">XP 획득!</span>
            <span className="text-3xl ml-4 drop-shadow-md text-yellow-100">+{toast.points.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser는 UserProvider 안에서만 사용할 수 있습니다.');
  return context;
}
