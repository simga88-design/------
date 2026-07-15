'use client';

/* eslint-disable @next/next/no-img-element -- Record thumbnails come from user-uploaded Firebase URLs. */

import { useEffect, useState } from 'react';
import { collection, collectionGroup, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { Idea } from '@/components/IdeaCard';
import { useUser } from '@/context/UserContext';

type RecordsTab = 'myIdeas' | 'upvotedIdeas' | 'myWorkspaces';

const tabs: { id: RecordsTab; icon: string; label: string }[] = [
  { id: 'myIdeas', icon: 'edit_square', label: '내 아이디어' },
  { id: 'upvotedIdeas', icon: 'favorite', label: '공감한 글' },
  { id: 'myWorkspaces', icon: 'rocket_launch', label: '작업방' },
];

const tabClasses: Record<RecordsTab, { active: string; inactive: string }> = {
  myIdeas: {
    active: 'bg-white dark:bg-slate-900 text-pink-500 border-pink-300 dark:border-pink-600 z-10 relative shadow-[0_-5px_15px_rgba(236,72,153,0.15)]',
    inactive: 'bg-pink-50/50 dark:bg-slate-800/50 text-slate-400 border-pink-100 dark:border-slate-700 hover:bg-white',
  },
  upvotedIdeas: {
    active: 'bg-white dark:bg-slate-900 text-indigo-500 border-indigo-300 dark:border-indigo-600 z-10 relative shadow-[0_-5px_15px_rgba(99,102,241,0.15)]',
    inactive: 'bg-indigo-50/50 dark:bg-slate-800/50 text-slate-400 border-indigo-100 dark:border-slate-700 hover:bg-white',
  },
  myWorkspaces: {
    active: 'bg-white dark:bg-slate-900 text-violet-500 border-violet-300 dark:border-violet-600 z-10 relative shadow-[0_-5px_15px_rgba(139,92,246,0.15)]',
    inactive: 'bg-violet-50/50 dark:bg-slate-800/50 text-slate-400 border-violet-100 dark:border-slate-700 hover:bg-white',
  },
};

export default function RecordsPage() {
  const { user, profile } = useUser();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<RecordsTab>('myIdeas');
  const [myIdeas, setMyIdeas] = useState<Idea[]>([]);
  const [upvotedIdeas, setUpvotedIdeas] = useState<Idea[]>([]);
  const [joinedWorkspaces, setJoinedWorkspaces] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;

    const myIdeasQuery = query(
      collection(db, 'ideas'),
      where('authorName', '==', profile.nickname),
      orderBy('createdAt', 'desc'),
      limit(20),
    );

    const upvotedQuery = query(
      collection(db, 'ideas'),
      where('upvotedBy', 'array-contains', user.uid),
      orderBy('upvotes', 'desc'),
      limit(20),
    );

    const membershipsQuery = query(
      collectionGroup(db, 'members'),
      where('nickname', '==', profile.nickname),
    );

    const unsubscribeMyIdeas = onSnapshot(myIdeasQuery, (snapshot) => {
      setMyIdeas(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Idea));
      setIsLoading(false);
    });

    const unsubscribeUpvoted = onSnapshot(upvotedQuery, (snapshot) => {
      setUpvotedIdeas(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Idea));
    });

    let unsubscribeJoinedIdeas: (() => void) | undefined;
    const unsubscribeMemberships = onSnapshot(membershipsQuery, (snapshot) => {
      const workspaceIds = snapshot.docs
        .map((doc) => doc.ref.parent.parent?.id)
        .filter((id): id is string => Boolean(id));

      if (workspaceIds.length === 0) {
        setJoinedWorkspaces([]);
        return;
      }

      const targetIds = workspaceIds.slice(0, 30);
      const joinedIdeasQuery = query(
        collection(db, 'ideas'),
        where('workspaceId', 'in', targetIds),
      );

      if (unsubscribeJoinedIdeas) unsubscribeJoinedIdeas();
      unsubscribeJoinedIdeas = onSnapshot(joinedIdeasQuery, (ideaSnapshot) => {
        setJoinedWorkspaces(ideaSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Idea));
      });
    });

    return () => {
      unsubscribeMyIdeas();
      unsubscribeUpvoted();
      unsubscribeMemberships();
      if (unsubscribeJoinedIdeas) unsubscribeJoinedIdeas();
    };
  }, [user, profile]);

  if (!user) {
    return (
      <main className="pt-32 pb-32 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <span className="material-symbols-outlined text-6xl text-pink-300 mb-4 animate-bounce">lock</span>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-4">로그인이 필요한 공간입니다</h2>
        <button type="button" onClick={() => router.push('/profile')} className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold shadow-md hover:scale-105 transition-all">
          로그인하러 가기
        </button>
      </main>
    );
  }

  const myWorkspaces = [
    ...myIdeas.filter((idea) => idea.workspaceId),
    ...joinedWorkspaces,
  ];
  const uniqueWorkspaces = Array.from(new Map(myWorkspaces.map((item) => [item.workspaceId, item])).values());

  const currentList = activeTab === 'myIdeas'
    ? myIdeas
    : activeTab === 'upvotedIdeas'
      ? upvotedIdeas
      : uniqueWorkspaces;

  const emptyMessage = activeTab === 'myIdeas'
    ? '아직 작성한 아이디어가 없어요. 첫 아이디어를 남겨보세요.'
    : activeTab === 'upvotedIdeas'
      ? '아직 공감한 글이 없어요. 마음에 드는 아이디어를 찾아보세요.'
      : '아직 참여 중인 작업방이 없어요. 가능성 있는 아이디어를 작업방으로 발전시켜보세요.';

  return (
    <main className="pt-24 pb-32 px-4 sm:px-8 lg:px-12 w-full mx-auto relative min-h-screen overflow-x-hidden">
      <div className="absolute top-24 left-4 opacity-30 rotate-[-15deg] pointer-events-none">
        <span className="material-symbols-outlined text-pink-400 text-6xl drop-shadow-md" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
      </div>
      <div className="absolute top-48 right-4 opacity-40 rotate-[25deg] pointer-events-none">
        <span className="material-symbols-outlined text-indigo-400 text-7xl drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
      </div>

      <div className="text-center mb-10 relative z-10 mt-6">
        <h1 className="font-headline text-5xl md:text-6xl font-black text-slate-800 dark:text-white mb-2 tracking-tighter drop-shadow-md">
          나의 <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">기록</span>
        </h1>
        <div className="mt-4">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-pink-200/50 dark:border-pink-900/50 shadow-sm">
            <span className="text-slate-600 dark:text-slate-300 font-bold text-sm tracking-wide">
              {profile?.nickname}님의 활동 아카이브
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-start gap-2 w-full relative z-10 px-4 mt-8 max-w-6xl mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 h-14 rounded-t-3xl font-black transition-all text-[13px] md:text-[15px] border-2 border-b-0 flex items-center justify-center gap-2 tracking-wide px-2 ${isActive ? tabClasses[tab.id].active : tabClasses[tab.id].inactive}`}
              style={{ marginBottom: isActive ? '-2px' : '0' }}
            >
              <span className="material-symbols-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className={`relative w-full max-w-6xl mx-auto border-2 rounded-3xl rounded-tl-none p-6 md:p-12 min-h-[600px] transition-all duration-500 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl ${activeTab === 'myIdeas' ? 'border-pink-300 dark:border-pink-600 shadow-pink-200/50' : activeTab === 'myWorkspaces' ? 'border-violet-300 dark:border-violet-600 shadow-violet-200/50' : 'border-indigo-300 dark:border-indigo-600 shadow-indigo-200/50'}`}>
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/40 via-transparent to-white/10 dark:from-white/5 pointer-events-none rounded-3xl" />

        {isLoading ? (
          <div className="text-center py-32 w-full text-slate-400 font-bold animate-pulse font-headline text-2xl relative z-10">
            기록을 불러오는 중입니다...
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center py-24 w-full text-slate-400 font-black flex flex-col items-center relative z-10">
            <span className="material-symbols-outlined text-6xl mb-4 drop-shadow-sm">inventory_2</span>
            {emptyMessage}
          </div>
        ) : (
          <div className="w-full relative z-10 mb-10 columns-1 md:columns-2 lg:columns-3 gap-6 max-w-6xl mx-auto">
            {currentList.map((item) => (
              <div
                key={item.id}
                className="break-inside-avoid relative group cursor-pointer w-full mb-6"
                onClick={() => router.push(activeTab === 'myWorkspaces' ? `/workspace/${item.workspaceId}` : '/ideas')}
              >
                <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl shadow-lg border-2 border-white dark:border-slate-700 hover:shadow-2xl transition-all duration-300 relative group-hover:-translate-y-2">
                  {((item.isCompleted && item.resultImageUrl) || item.imageUrl) && (
                    <div className="w-full aspect-[4/3] mb-5 bg-slate-100 relative overflow-hidden rounded-2xl shadow-inner border border-slate-200/50">
                      <img src={(item.isCompleted && item.resultImageUrl) ? item.resultImageUrl : item.imageUrl!} alt="아이디어 썸네일" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                      {(item.isCompleted && item.resultImageUrl) && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md z-20">완성됨</div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full text-[11px] font-bold border border-slate-200 dark:border-slate-700">{item.category}</span>
                    <span className="flex items-center gap-1 text-pink-500 font-bold text-sm bg-pink-50 dark:bg-pink-900/30 px-3 py-1 rounded-full shadow-sm">
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                      {item.upvotes}
                    </span>
                  </div>

                  <h3 className="font-headline text-2xl font-black text-slate-900 dark:text-white mb-2 leading-snug break-words">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 leading-relaxed font-body">{item.description}</p>

                  {activeTab === 'myWorkspaces' && item.progress !== undefined && (
                    <div className="mt-4 w-full flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black tracking-wide text-slate-500">진행률</span>
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden shadow-inner">
                        <div className="bg-gradient-to-r from-pink-500 to-indigo-500 h-full transition-all duration-500" style={{ width: `${item.progress}%` }} />
                      </div>
                      <span className="text-[10px] font-black tracking-widest text-indigo-500">{item.progress}%</span>
                    </div>
                  )}

                  <div className="mt-5 flex justify-between items-center opacity-80 group-hover:opacity-100 transition-opacity">
                    <div className="text-[12px] font-bold text-slate-500 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      {item.authorName}
                    </div>
                    <span className="text-[12px] font-black text-indigo-500 hover:text-indigo-400 flex items-center gap-0.5">
                      {activeTab === 'myWorkspaces' ? '작업방 입장' : '자세히 보기'}
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
