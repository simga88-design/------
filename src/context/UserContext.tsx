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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as ExtendedUserProfile);
        } else {
          // 신규 가입자 초기 프로필 생성
          const newProfile: ExtendedUserProfile = {
            nickname: generateKitschNickname(),
            points: 0,
            profileImage: u.photoURL || undefined,
            tickets: 0,
            lastTicketLevel: 1
          };
          await setDoc(docRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
    });
    return () => unsub();
  }, []);

  const addPoints = async (p: number) => {
    if (!user || !profile) return;
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
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f472b6', '#818cf8', '#34d399', '#fbbf24']
        });
        setTimeout(() => {
          let msg = `🎉 축하합니다! 레벨업 하셨습니다!\n현재 레벨: Lv.${newLevel}\n새로운 칭호 획득: [${getTitleByLevel(newLevel)}]`;
          if (isTicketGained) msg += `\n\n🎁 10단위 레벨업 달성 보상: [닉네임 교환권 1장]을 획득하셨습니다!`;
          alert(msg);
        }, 300);
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
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser는 항상 UserProvider 내부에서 호출되어야 합니다.");
  return context;
}
