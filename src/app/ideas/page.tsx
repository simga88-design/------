'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import IdeaCard, { Idea } from '@/components/IdeaCard';
import NewIdeaModal from '@/components/NewIdeaModal';
import { useUser } from '@/context/UserContext';

type IdeaFilter = 'all' | 'latest' | 'popular' | 'workspace' | 'completed';

const filters: { id: IdeaFilter; label: string; icon: string }[] = [
  { id: 'all', label: '전체', icon: 'dashboard' },
  { id: 'latest', label: '최신', icon: 'schedule' },
  { id: 'popular', label: '인기', icon: 'favorite' },
  { id: 'workspace', label: '작업방 있음', icon: 'rocket_launch' },
  { id: 'completed', label: '완성됨', icon: 'task_alt' },
];

const hasCode = (error: unknown): error is { code: string } => {
  return typeof error === 'object' && error !== null && 'code' in error;
};

const getIdeaText = (idea: Idea) => {
  return `${idea.title || ''} ${idea.description || ''} ${idea.category || ''} ${idea.authorName || idea.author || ''}`.toLowerCase();
};

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [activeFilter, setActiveFilter] = useState<IdeaFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const { addPoints } = useUser();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'ideas'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setIdeas(snapshot.docs.map((ideaDoc) => ({ id: ideaDoc.id, ...ideaDoc.data() }) as Idea));
      },
      (error) => {
        console.error('Firestore ideas subscription failed:', error);
        if (error.code === 'permission-denied') {
          alert('Firestore 읽기 권한이 없습니다. Firebase Console에서 규칙을 확인해주세요.');
        }
      },
    );

    return () => unsubscribe();
  }, []);

  const filteredIdeas = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    let nextIdeas = ideas.filter((idea) => {
      if (!normalizedSearch) return true;
      return getIdeaText(idea).includes(normalizedSearch);
    });

    if (activeFilter === 'popular') {
      nextIdeas = [...nextIdeas].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    }

    if (activeFilter === 'workspace') {
      nextIdeas = nextIdeas.filter((idea) => Boolean(idea.workspaceId || idea.progress !== undefined));
    }

    if (activeFilter === 'completed') {
      nextIdeas = nextIdeas.filter((idea) => Boolean(idea.isCompleted));
    }

    return nextIdeas;
  }, [activeFilter, ideas, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: ideas.length,
      workspaces: ideas.filter((idea) => Boolean(idea.workspaceId || idea.progress !== undefined)).length,
      completed: ideas.filter((idea) => idea.isCompleted).length,
      upvotes: ideas.reduce((sum, idea) => sum + (idea.upvotes || 0), 0),
    };
  }, [ideas]);

  const handleCreateWorkspace = async (idea: Idea) => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      if (idea.workspaceId) {
        router.push(`/workspace/${idea.workspaceId}`);
        setIsCreating(false);
        return;
      }

      const existingWorkspaceQuery = query(collection(db, 'workspaces'), where('originalIdeaId', '==', idea.id));
      const existingWorkspaceSnap = await getDocs(existingWorkspaceQuery);

      if (!existingWorkspaceSnap.empty) {
        const existingId = existingWorkspaceSnap.docs[0].id;
        try {
          await updateDoc(doc(db, 'ideas', idea.id), { workspaceId: existingId });
        } catch (error) {
          console.error('Failed to backfill idea workspaceId:', error);
        }
        router.push(`/workspace/${existingId}`);
        setIsCreating(false);
        return;
      }

      const docRef = await addDoc(collection(db, 'workspaces'), {
        originalIdeaId: idea.id,
        createdAt: serverTimestamp(),
      });

      try {
        await updateDoc(doc(db, 'ideas', idea.id), { workspaceId: docRef.id });
      } catch (error) {
        console.error('Failed to update idea workspaceId:', error);
      }

      await addPoints(500);
      router.push(`/workspace/${docRef.id}`);
    } catch (error) {
      console.error('Failed to create workspace:', error);
      if (hasCode(error) && error.code === 'permission-denied') {
        alert('Firestore 쓰기/읽기 권한이 없습니다.');
      } else {
        alert('작업방 생성 중 오류가 발생했습니다.');
      }
      setIsCreating(false);
    }
  };

  return (
    <main className="w-full pt-24 pb-32 px-4 sm:px-6 max-w-7xl mx-auto relative min-h-screen overflow-x-hidden">
      <section className="relative z-10 mb-8 min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-stretch min-w-0">
          <div className="min-w-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/70 dark:border-slate-800 rounded-lg p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 min-w-0">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 text-sm font-black text-pink-600 dark:text-pink-300 bg-pink-50 dark:bg-pink-900/20 px-3 py-1.5 rounded-full mb-4">
                  <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                  아이디어 탐색
                </div>
                <h1 className="font-headline text-4xl md:text-5xl font-black text-slate-950 dark:text-white tracking-tight mb-3">
                  함께 키울 생각을 찾아보세요
                </h1>
                <p className="text-slate-600 dark:text-slate-300 font-bold leading-relaxed max-w-2xl">
                  떠오른 제안을 모으고, 공감으로 가능성을 확인한 뒤, 작업방에서 실제 프로젝트로 발전시킵니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                aria-label="새 아이디어 작성"
                className="inline-flex items-center justify-center gap-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-5 py-3 rounded-lg font-black shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all shrink-0"
              >
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>edit_square</span>
                새 아이디어
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-950 text-white rounded-lg p-5 shadow-md min-w-0">
            <div>
              <p className="text-xs font-black text-slate-400 mb-1">전체 아이디어</p>
              <p className="text-3xl font-black font-headline">{stats.total}</p>
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 mb-1">공감</p>
              <p className="text-3xl font-black font-headline">{stats.upvotes}</p>
            </div>
            <div className="border-t border-white/10 pt-3">
              <p className="text-xs font-black text-slate-400 mb-1">작업방</p>
              <p className="text-2xl font-black font-headline text-indigo-200">{stats.workspaces}</p>
            </div>
            <div className="border-t border-white/10 pt-3">
              <p className="text-xs font-black text-slate-400 mb-1">완성</p>
              <p className="text-2xl font-black font-headline text-emerald-200">{stats.completed}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-20 z-30 mb-8 bg-white/85 dark:bg-slate-950/85 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-sm min-w-0">
        <div className="flex flex-col lg:flex-row gap-3 min-w-0">
          <label className="w-full lg:flex-1 min-w-0 flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 h-12">
            <span className="material-symbols-outlined text-slate-400">search</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="제목, 내용, 작성자, 카테고리 검색"
              className="w-full min-w-0 bg-transparent outline-none text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
            />
          </label>
          <div className="w-full lg:w-auto min-w-0 flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {filters.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  aria-label={`${filter.label} 필터`}
                  className={`h-12 px-4 rounded-lg border text-sm font-black whitespace-nowrap inline-flex items-center gap-2 transition-colors ${
                    isActive
                      ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 border-slate-950 dark:border-white'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-pink-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{filter.icon}</span>
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <NewIdeaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <section className="relative z-10 w-full">
        {filteredIdeas.length === 0 ? (
          <div className="min-h-80 flex flex-col items-center justify-center text-slate-700 dark:text-slate-300 font-bold bg-white/70 dark:bg-slate-900/70 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 backdrop-blur-md shadow-sm p-8 text-center">
            <span className="material-symbols-outlined text-6xl text-pink-400 mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
            <h2 className="text-2xl font-headline font-black mb-2">조건에 맞는 아이디어가 없어요</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">검색어를 줄이거나 새 아이디어를 남겨보세요.</p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              aria-label="아이디어 작성"
              className="inline-flex items-center gap-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-5 py-3 rounded-lg font-black"
            >
              <span className="material-symbols-outlined" aria-hidden="true">add</span>
              아이디어 작성
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onDeploy={() => handleCreateWorkspace(idea)}
                isCreating={isCreating}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
