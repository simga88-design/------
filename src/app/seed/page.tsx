'use client';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SeedPage() {
  const [status, setStatus] = useState("아래 버튼을 누르면 기존 복지(다마고치 등) 데이터가 싹 날아가고 AI 동아리 데이터로 채워집니다!");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSeed = async () => {
    setIsLoading(true);
    try {
      setStatus("기존 아이디어 삭제 중 (청소 슥삭숙삭)... 🧹");
      const snapshot = await getDocs(collection(db, 'ideas'));
      for (const d of snapshot.docs) {
        await deleteDoc(doc(db, 'ideas', d.id));
      }
      
      setStatus("새로운 AI 동아리 샘플 4개 굽는 중... 🍕");
      const examples = [
        {
          title: "🤖 얄루! 챗GPT로 첫 챗봇 뚝딱 만들기",
          description: "복잡한 코딩은 1도 몰라도 괜찮아요! 챗GPT 선배님(?)에게 물어보면서 카톡이나 텔레그램에서 내 말에 대답하는 귀엽고 허술한 챗봇을 주말에 같이 완성해봐요!",
          category: "초보환영",
          categoryColor: "secondary",
          author: "코딩신생아",
          upvotes: 38,
          rotation: "left"
        },
        {
          title: "🎨 미드저니로 나만의 인스타 프사 굽기",
          description: "요즘 유행하는 AI 그림! 미드저니나 D알-E 써서 우리집 반려견을 디즈니 프린세스로 만들어볼까요? 이번 모임 때 각자 만든 프사 자랑 대회 열어서 1등한테 기프티콘 쏩니다 ㅋㅋ",
          category: "이벤트",
          categoryColor: "primary",
          author: "미대오빠아님",
          upvotes: 45,
          rotation: "right"
        },
        {
          title: "🏆 AI 용어 골든벨! 딥러닝이 뭔데 씹덕아",
          description: "머신러닝? 파라미터? 트랜스포머? 맨날 뉴스에서 듣는데 뭐가 뭔지 하나도 모르겠죠! 다 같이 피자 시켜 먹으면서 잼민이 수준의 재미있는 통합 AI 용어 퀴즈 대회 열어봐요!",
          category: "스터디",
          categoryColor: "tertiary",
          author: "설명충등판",
          upvotes: 21,
          rotation: "left"
        },
        {
          title: "🐍 파이썬 뱀 게임 만들며 기초 뽀개기",
          description: "혼자서 파이썬 인강 보며 공부하기 너무 졸립니다... 평일 저녁에 1시간씩 디스코드에 모여 나란히 에러 파티하면서 추억의 스네이크 게임 하나 완성해봐요! 뉴비 대환영!",
          category: "도전",
          categoryColor: "primary",
          author: "파이썬무서워",
          upvotes: 56,
          rotation: "right"
        }
      ];

      for (const ex of examples) {
        await addDoc(collection(db, 'ideas'), {
          ...ex,
          createdAt: serverTimestamp()
        });
      }

      setStatus("🎉 완료! 2초 뒤 탐색 페이지로 이동합니다...");
      setTimeout(() => {
        router.push('/ideas');
      }, 2000);

    } catch (e) {
      console.error(e);
      setStatus("오류가 발생했습니다. 콘솔을 확인하세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen pt-32 px-4 flex flex-col items-center bg-slate-50 font-body">
      <div className="bg-white p-8 rounded-[2rem] shadow-xl border-2 border-slate-200 max-w-lg w-full text-center">
        <h1 className="text-3xl font-black mb-4 font-headline text-slate-800">초기 데이터 세팅기</h1>
        <p className="mb-8 text-slate-600 font-bold whitespace-pre-wrap">{status}</p>
        <button 
          onClick={handleSeed} 
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-full font-black text-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? '처리 중...' : '데이터 리셋 & 생성 시작!'}
        </button>
      </div>
    </main>
  );
}
