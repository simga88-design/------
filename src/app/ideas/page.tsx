'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import IdeaCard, { Idea } from '@/components/IdeaCard';
import NewIdeaModal from '@/components/NewIdeaModal';
import { useUser } from '@/context/UserContext';

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const { addPoints } = useUser();

  // Firestore 연결 및 실시간 데이터 조회
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'ideas'), 
      (snapshot) => {
        const ideasData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Idea[];
        setIdeas(ideasData);
      },
      (error) => {
        console.error("Firestore 구독 에러:", error);
        if (error.code === 'permission-denied') {
          alert("Firestore 읽기 권한이 없습니다. Firebase Console에서 규칙(Rules)을 확인해주세요.");
        }
      }
    );
    
    return () => unsubscribe();
  }, []);

  const handleCreateWorkspace = async (idea: Idea) => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      // 1. 이미 아이디어에 workspaceId가 있다면 바로 이동
      if (idea.workspaceId) {
        router.push(`/workspace/${idea.workspaceId}`);
        setIsCreating(false);
        return;
      }

      // 2. 혹은 예전 데이터라서 workspaceId는 없지만 실제 방이 존재하는지 확인
      const q = query(collection(db, 'workspaces'), where('originalIdeaId', '==', idea.id));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        // 이미 방이 존재하면 그 방으로 이동하고 ideas 문서 업데이트
        const existingId = snap.docs[0].id;
        try {
          await updateDoc(doc(db, 'ideas', idea.id), { workspaceId: existingId });
        } catch (e) {
          console.error("idea 문서 업데이트 실패", e);
        }
        router.push(`/workspace/${existingId}`);
        setIsCreating(false);
        return;
      }

      // 3. 진짜 방이 없으면 새로 생성
      const docRef = await addDoc(collection(db, 'workspaces'), {
        originalIdeaId: idea.id,
        createdAt: serverTimestamp(),
      });
      
      // 생성된 방 ID를 ideas 문서에 저장
      try {
        await updateDoc(doc(db, 'ideas', idea.id), { workspaceId: docRef.id });
      } catch (e) {
        console.error("idea 문서 업데이트 실패", e);
      }

      addPoints(50); // 작업 방 생성 성공 시 50 획득
      router.push(`/workspace/${docRef.id}`);
    } catch (error: any) {
      console.error('작업 방 생성 에러:', error);
      if (error.code === 'permission-denied') {
        alert("Firestore 쓰기/읽기 권한이 없습니다.");
      } else {
        alert("작업 방 생성 중 오류가 발생했습니다.");
      }
      setIsCreating(false);
    }
  };

  return (
    <main className="pt-24 pb-32 px-4 sm:px-6 max-w-7xl mx-auto relative min-h-screen overflow-x-hidden">
      {/* 키치하고 정신없는 Y2K 스크랩북 스티커 데코레이션 */}
      <div className="absolute top-10 left-2 md:left-12 opacity-80 rotate-[-15deg] pointer-events-none z-0">
        <span className="material-symbols-outlined text-pink-400 text-6xl drop-shadow-md" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
      </div>
      <div className="absolute top-40 right-2 md:right-16 opacity-70 rotate-[20deg] pointer-events-none z-0">
        <span className="material-symbols-outlined text-indigo-400 text-7xl drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
      </div>
      <div className="absolute top-[500px] left-5 opacity-60 rotate-[-10deg] pointer-events-none z-0 hidden lg:block">
        <span className="material-symbols-outlined text-rose-400 text-6xl drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>music_note</span>
      </div>
      <div className="absolute top-[250px] right-10 opacity-50 rotate-[35deg] pointer-events-none z-0">
        <span className="material-symbols-outlined text-teal-400 text-6xl drop-shadow-md" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
      </div>

      {/* 헤더 타이틀 섹션 */}
      <section className="mb-14 text-center relative z-10 px-2 mt-4 flex flex-col items-center">
        <div className="inline-block relative">
          <h1 className="font-headline text-6xl md:text-8xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter drop-shadow-sm">
            아이디어 나눔터
          </h1>
          <span className="absolute -top-6 -right-8 material-symbols-outlined text-yellow-400 text-4xl animate-bounce" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
        </div>
        
        <p className="text-slate-800 font-bold text-xl md:text-2xl font-body bg-white/60 px-6 py-2 rounded-full backdrop-blur-md border border-pink-200/50 shadow-sm relative sticker-rotate-left">
          <span className="absolute -left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-pink-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          우리 동아리의 빛나는 생각들
          <span className="absolute -right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-indigo-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        </p>
        
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <span className="bg-[#ffedf5] text-pink-700 px-4 py-1.5 rounded-full text-sm font-extrabold rotate-[-3deg] shadow-sm font-body border border-pink-200">#AI_Magic ✨</span>
          <span className="bg-[#e0e7ff] text-indigo-700 px-4 py-1.5 rounded-full text-sm font-extrabold rotate-[3deg] shadow-sm font-body border border-indigo-200">#Hackathon_Vibes 🔥</span>
          <span className="bg-[#e1f6ff] text-teal-700 px-4 py-1.5 rounded-full text-sm font-extrabold -rotate-1 shadow-sm font-body border border-teal-200 hidden sm:inline-block">#DeepLearning_Kitsch 👾</span>
        </div>

        {/* 글 작성 플로팅 팝업 버튼 */}
        <div className="mt-8 flex justify-center">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3.5 rounded-full font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all border-2 border-transparent hover:bg-gradient-to-r hover:from-pink-500 hover:to-indigo-500 hover:text-white"
          >
            <span className="material-symbols-outlined pb-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>edit_square</span> 
            새 아이디어 반짝! ✨
          </button>
        </div>
      </section>

      <NewIdeaModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* 반응형 핀터레스트(Masonry) 스타일 리스트 */}
      <div className="relative z-10 w-full">
        {ideas.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-700 font-bold font-body bg-white/50 rounded-[2rem] border-4 border-dashed border-pink-300/50 backdrop-blur-md shadow-xl p-8 text-center max-w-2xl mx-auto">
            <span className="material-symbols-outlined text-6xl text-pink-400 mb-4 animate-bounce" style={{ fontVariationSettings: "'FILL' 1" }}>cruelty_free</span>
            <span className="text-xl md:text-2xl font-headline">아직 등록된 아이디어가 없어요!<br/>Firestore에 반짝이는 아이디어를 추가해주세요 ✨</span>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8 w-full max-w-7xl mx-auto">
            {ideas.map(idea => (
              <div key={idea.id} className="break-inside-avoid">
                <IdeaCard 
                  idea={idea} 
                  onDeploy={() => handleCreateWorkspace(idea)} 
                  isCreating={isCreating} 
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
