'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUser } from '@/context/UserContext';

const dummyAuthors = ['코딩선생님', '미래도서관', '익명친구', '테스트유저'];
const dummyTitles = [
  '챗GPT로 첫 챗봇 만들기',
  '미드저니로 나만의 포스터 만들기',
  'AI 영어 골든벨 열기',
  '타자 연습 게임 만들기',
];

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return String(error);
};

export default function DeleteDummyPage() {
  const { user } = useUser();
  const [status, setStatus] = useState('대기 중입니다. 로그인 상태를 확인해주세요.');
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleClean = async () => {
    if (!user) {
      alert('로그인이 필요합니다. 먼저 내 정보에서 로그인해주세요.');
      return;
    }

    setIsDeleting(true);
    setStatus('더미 아이디어를 조회하는 중입니다...');

    try {
      const ideasSnap = await getDocs(collection(db, 'ideas'));
      let deletedCount = 0;
      const deletedIdeaIds: string[] = [];

      for (const ideaDoc of ideasSnap.docs) {
        const data = ideaDoc.data();
        const author = String(data.authorName || data.author || '');
        const title = String(data.title || '');

        if (dummyAuthors.includes(author) || dummyTitles.includes(title)) {
          await deleteDoc(doc(db, 'ideas', ideaDoc.id));
          deletedIdeaIds.push(ideaDoc.id);
          deletedCount += 1;
        }
      }

      setStatus(`더미 아이디어 ${deletedCount}개를 삭제했습니다. 관련 작업방을 정리하는 중입니다...`);

      const workspaceSnap = await getDocs(collection(db, 'workspaces'));
      let workspaceDeletedCount = 0;

      for (const workspaceDoc of workspaceSnap.docs) {
        const originalIdeaId = String(workspaceDoc.data().originalIdeaId || '');
        if (deletedIdeaIds.includes(originalIdeaId)) {
          await deleteDoc(doc(db, 'workspaces', workspaceDoc.id));
          workspaceDeletedCount += 1;
        }
      }

      setStatus(`완료했습니다. 아이디어 ${deletedCount}개와 작업방 ${workspaceDeletedCount}개를 삭제했습니다.`);
      setTimeout(() => {
        router.push('/ideas');
      }, 3000);
    } catch (error) {
      console.error(error);
      setStatus(`오류 발생: ${getErrorMessage(error)}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-screen pt-32 px-4 flex flex-col items-center justify-center bg-slate-50 font-body">
      <div className="bg-white p-8 rounded-[2rem] shadow-xl border-2 border-slate-200 max-w-lg w-full text-center">
        <h1 className="text-3xl font-black mb-4 font-headline text-slate-800">더미 데이터 삭제</h1>
        <p className="mb-8 text-slate-600 font-bold whitespace-pre-wrap">{status}</p>
        {!user ? (
          <p className="text-red-500 font-bold mb-4">로그인이 필요합니다. 먼저 내 정보에서 로그인해주세요.</p>
        ) : (
          <button
            type="button"
            onClick={handleClean}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-black text-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {isDeleting ? '삭제 중...' : '더미 데이터 삭제 시작'}
          </button>
        )}
      </div>
    </main>
  );
}
