'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

export default function DeleteDummyPage() {
  const { user } = useUser();
  const [status, setStatus] = useState('대기 중... 로그인이 되어있는지 확인해주세요.');
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleClean = async () => {
    if (!user) {
      alert('로그인이 필요합니다! 프로필 탭 등에서 먼저 로그인해주세요.');
      return;
    }
    setIsDeleting(true);
    setStatus('더미 데이터 조회 중...');
    
    const dummyAuthors = ['코딩신생아', '미대오빠아님', '설명충등판', '파이썬무서워'];
    const dummyTitles = [
      '🤖 얄루! 챗GPT로 첫 챗봇 뚝딱 만들기',
      '🎨 미드저니로 나만의 인스타 프사 굽기',
      '🏆 AI 용어 골든벨! 딥러닝이 뭔데 씹덕아',
      '🐍 파이썬 뱀 게임 만들며 기초 뽀개기'
    ];

    try {
      // 1. Delete Ideas
      const ideasRef = collection(db, 'ideas');
      const ideasSnap = await getDocs(ideasRef);
      let deletedCount = 0;
      const deletedIdeaIds: string[] = [];

      for (const d of ideasSnap.docs) {
        const data = d.data();
        const author = data.authorName || data.author || '';
        const title = data.title || '';

        if (dummyAuthors.includes(author) || dummyTitles.includes(title)) {
          await deleteDoc(doc(db, 'ideas', d.id));
          deletedIdeaIds.push(d.id);
          deletedCount++;
        }
      }

      setStatus(`더미 아이디어 ${deletedCount}개 삭제 완료! 관련 작업방 정리 중...`);

      // 2. Delete Workspaces
      const wsRef = collection(db, 'workspaces');
      const wsSnap = await getDocs(wsRef);
      let wsDeletedCount = 0;

      for (const d of wsSnap.docs) {
        const data = d.data();
        const originalIdeaId = data.originalIdeaId || '';
        if (deletedIdeaIds.includes(originalIdeaId)) {
          await deleteDoc(doc(db, 'workspaces', d.id));
          wsDeletedCount++;
        }
      }

      setStatus(`더미 아이디어 ${deletedCount}개 및 작업방 ${wsDeletedCount}개 영구 삭제 완료! 🎉`);
      setTimeout(() => {
        router.push('/ideas');
      }, 3000);
    } catch (e: any) {
      console.error(e);
      setStatus(`오류 발생: ${e.message || e}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-screen pt-32 px-4 flex flex-col items-center justify-center bg-slate-50 font-body">
      <div className="bg-white p-8 rounded-[2rem] shadow-xl border-2 border-slate-200 max-w-lg w-full text-center">
        <h1 className="text-3xl font-black mb-4 font-headline text-slate-800">더미 데이터 완전 삭제 🧹</h1>
        <p className="mb-8 text-slate-600 font-bold whitespace-pre-wrap">{status}</p>
        {!user ? (
          <p className="text-red-500 font-bold mb-4">로그인이 필요합니다. 먼저 내 정보(프로필) 탭에서 로그인해 주세요!</p>
        ) : (
          <button 
            onClick={handleClean} 
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-black text-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? '삭제 중...' : '더미 데이터 삭제 시작! 💣'}
          </button>
        )}
      </div>
    </main>
  );
}
