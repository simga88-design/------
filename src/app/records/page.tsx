'use client';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Idea } from '@/components/IdeaCard';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import DecoStickerBoard from '@/components/DecoStickerBoard';
import NewDiaryModal from '@/components/NewDiaryModal';

export interface Diary {
  id: string;
  uid: string;
  date: string;
  mood: string;
  content: string;
  imageUrl?: string;
  createdAt: any;
}

export default function RecordsPage() {
  const { user, profile } = useUser();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'myIdeas' | 'upvotedIdeas' | 'myDiary'>('myIdeas');
  const [myIdeas, setMyIdeas] = useState<Idea[]>([]);
  const [upvotedIdeas, setUpvotedIdeas] = useState<Idea[]>([]);
  const [myDiaries, setMyDiaries] = useState<Diary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);

  useEffect(() => {
    if (!user || !profile) {
      setIsLoading(false);
      return;
    }

    // 1. 내가 올린 아이디어 (닉네임 기반 쿼리)
    const qMyIdeas = query(
      collection(db, 'ideas'), 
      where('authorName', '==', profile.nickname),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    // 2. 내가 공감해요를 누른 아이디어 (UID 배열 기반 쿼리)
    const qUpvoted = query(
      collection(db, 'ideas'),
      where('upvotedBy', 'array-contains', user.uid),
      orderBy('upvotes', 'desc'),
      limit(20)
    );

    // 3. 나만의 다이어리 (uid 기반 클라이언트 정렬용)
    const qDiaries = query(
      collection(db, 'diaries'),
      where('uid', '==', user.uid),
      limit(50)
    );

    const unsubMyIdeas = onSnapshot(qMyIdeas, (snapshot) => {
      setMyIdeas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Idea[]);
      setIsLoading(false);
    });

    const unsubUpvoted = onSnapshot(qUpvoted, (snapshot) => {
      setUpvotedIdeas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Idea[]);
    });

    const unsubDiaries = onSnapshot(qDiaries, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Diary[];
      // 인덱스 오류 방지를 위해 클라이언트 단에서 날짜/최신순 직렬화
      setMyDiaries(docs.sort((a,b) => b.date.localeCompare(a.date)));
    });

    return () => { unsubMyIdeas(); unsubUpvoted(); unsubDiaries(); };
  }, [user, profile]);

  if (!user) {
    return (
      <main className="pt-32 pb-32 flex flex-col items-center justify-center min-h-screen">
        <span className="material-symbols-outlined text-6xl text-pink-300 mb-4 animate-bounce">lock</span>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-4">로그인이 필요한 공간입니다!</h2>
        <button onClick={() => router.push('/profile')} className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold shadow-md hover:scale-105 transition-all">
          로그인하러 가기
        </button>
      </main>
    );
  }

  const currentList = activeTab === 'myIdeas' ? myIdeas : upvotedIdeas;

  return (
    <main className="pt-24 pb-32 px-4 sm:px-8 lg:px-12 w-full mx-auto relative min-h-screen overflow-x-hidden">
      {/* 흩날리는 데코레이션 배경 */}
      <div className="absolute top-24 left-4 opacity-30 rotate-[-15deg] pointer-events-none">
        <span className="material-symbols-outlined text-pink-400 text-6xl drop-shadow-md" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
      </div>
      <div className="absolute top-48 right-4 opacity-40 rotate-[25deg] pointer-events-none">
        <span className="material-symbols-outlined text-indigo-400 text-7xl drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
      </div>
      
      {/* === 다이어리 꾸미기 엔진 탑재 (투명 오버레이 레이어 및 팔레트) === */}
      {activeTab === 'myDiary' && <DecoStickerBoard />}

      <div className="text-center mb-10 relative z-10 mt-6">
        <h1 className="font-headline text-5xl md:text-6xl font-black text-slate-800 dark:text-white mb-2 tracking-tighter drop-shadow-md">
          나의 <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">기록실</span> 💿
        </h1>
        <div className="mt-4">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-pink-200/50 dark:border-pink-900/50 shadow-sm">
            <span className="text-slate-600 dark:text-slate-300 font-bold text-sm tracking-wide">
              {profile?.nickname} 님의 퍼스널 아카이브
            </span>
          </div>
        </div>
      </div>

      {/* 바인더 모티브 제거, 깔끔하고 힙한 Y2K 탭 버튼 */}
      <div className="flex justify-start gap-2 w-full relative z-10 px-4 mt-8 max-w-6xl mx-auto">
        <button 
          onClick={() => setActiveTab('myIdeas')}
          className={`flex-1 h-14 rounded-t-3xl font-black transition-all text-[13px] md:text-[15px] border-2 border-b-0 flex items-center justify-center gap-2 tracking-wide px-2 ${activeTab === 'myIdeas' ? 'bg-white dark:bg-slate-900 text-pink-500 border-pink-300 dark:border-pink-600 z-10 relative shadow-[0_-5px_15px_rgba(236,72,153,0.15)]' : 'bg-pink-50/50 dark:bg-slate-800/50 text-slate-400 border-pink-100 dark:border-slate-700 hover:bg-white'}`}
          style={{ marginBottom: activeTab === 'myIdeas' ? '-2px' : '0' }}
        >
          <span className="text-lg">💡</span> 내가 낸 아이디어
        </button>
        <button 
          onClick={() => setActiveTab('upvotedIdeas')}
          className={`flex-1 h-14 rounded-t-3xl font-black transition-all text-[13px] md:text-[15px] border-2 border-b-0 flex items-center justify-center gap-2 tracking-wide px-2 ${activeTab === 'upvotedIdeas' ? 'bg-white dark:bg-slate-900 text-indigo-500 border-indigo-300 dark:border-indigo-600 z-10 relative shadow-[0_-5px_15px_rgba(99,102,241,0.15)]' : 'bg-indigo-50/50 dark:bg-slate-800/50 text-slate-400 border-indigo-100 dark:border-slate-700 hover:bg-white'}`}
          style={{ marginBottom: activeTab === 'upvotedIdeas' ? '-2px' : '0' }}
        >
          <span className="text-lg">💖</span> 하트 스크랩
        </button>
        <button 
          onClick={() => setActiveTab('myDiary')}
          className={`flex-1 h-14 rounded-t-3xl font-black transition-all text-[13px] md:text-[15px] border-2 border-b-0 flex items-center justify-center gap-2 tracking-wide px-2 ${activeTab === 'myDiary' ? 'bg-white dark:bg-slate-900 text-violet-500 border-violet-300 dark:border-violet-600 z-10 relative shadow-[0_-5px_15px_rgba(139,92,246,0.15)]' : 'bg-violet-50/50 dark:bg-slate-800/50 text-slate-400 border-violet-100 dark:border-slate-700 hover:bg-white'}`}
          style={{ marginBottom: activeTab === 'myDiary' ? '-2px' : '0' }}
        >
          <span className="text-lg">🎧</span> 나만의 다이어리
        </button>
      </div>

      <NewDiaryModal isOpen={isDiaryModalOpen} onClose={() => setIsDiaryModalOpen(false)} />

      {/* 스크랩북 메인 글래스 컨테이너 (바인더 탈피) */}
      <div 
        className={`relative w-full max-w-6xl mx-auto border-2 rounded-3xl rounded-tl-none p-6 md:p-12 min-h-[600px] transition-all duration-500 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl ${activeTab === 'myIdeas' ? 'border-pink-300 dark:border-pink-600 shadow-pink-200/50' : activeTab === 'myDiary' ? 'border-violet-300 dark:border-violet-600 shadow-violet-200/50' : 'border-indigo-300 dark:border-indigo-600 shadow-indigo-200/50'}`} 
      >
        {/* 장식용 글래스 반사광 */}
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/40 via-transparent to-white/10 dark:from-white/5 pointer-events-none rounded-3xl"></div>
        
        {/* 빈 화면 및 중앙 컨테이너 처리 */}
        {isLoading ? (
          <div className="text-center py-32 w-full text-slate-400 font-bold animate-pulse font-headline text-2xl relative z-10">
            데이터를 불러오는 중입니다... 💿
          </div>
        ) : activeTab === 'myDiary' ? (
          <div className="relative z-10 w-full max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-10 border-b-[3px] border-dashed border-violet-200 dark:border-violet-800 pb-5">
              <h2 className="text-2xl font-black font-headline text-violet-600 dark:text-violet-400 flex items-center gap-2 drop-shadow-sm">
                🎧 나만의 다이어리
              </h2>
              <button 
                onClick={() => setIsDiaryModalOpen(true)}
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-black px-6 py-3 rounded-full shadow-lg hover:scale-105 hover:shadow-violet-400/50 active:scale-95 transition-all flex items-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span> 오늘 일기 쓰기
              </button>
            </div>

            {myDiaries.length === 0 ? (
              <div className="text-center py-24 w-full text-slate-400 font-black flex flex-col items-center">
                <span className="text-6xl mb-4 drop-shadow-sm">💭</span>
                아직 작성하신 일기가 없네요! 오늘 있었던 일을 남겨보세요.
              </div>
            ) : (
              <div className="space-y-12 pl-2 md:pl-6 w-full mx-auto font-body">
                {myDiaries.map(diary => (
                  <div key={diary.id} className="relative group">
                    {/* Y2K 깔끔한 타임라인 포인트 */}
                    <div className="absolute -left-5 md:-left-10 top-0 w-5 h-5 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.5)] z-20 border-4 border-white dark:border-slate-900"></div>
                    <div className="absolute -left-[12px] md:-left-[32px] top-5 bottom-[-48px] w-[3px] bg-violet-100 dark:bg-violet-900/50 z-10 group-last:hidden"></div>

                    <div className="mb-3 pl-4 flex items-center gap-3">
                      <p className="text-violet-600 dark:text-violet-400 font-black tracking-wider text-xl drop-shadow-sm">
                        {diary.date}
                      </p>
                      <span className="text-2xl drop-shadow-md">{diary.mood}</span>
                    </div>

                    <div className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-xl border-2 border-white dark:border-slate-700 hover:shadow-2xl transition-all duration-300 relative ml-4`}>
                      {diary.imageUrl && (
                        <div className="w-full aspect-[4/3] md:aspect-video mb-6 bg-slate-100 relative overflow-hidden rounded-2xl border-4 border-white dark:border-slate-700 shadow-md">
                          <img src={diary.imageUrl} alt="Diary Snapshot" className="w-full h-full object-cover hover:scale-105 transition-all duration-700" />
                        </div>
                      )}
                      <p className="text-slate-700 dark:text-slate-300 text-[16px] leading-loose whitespace-pre-wrap font-medium tracking-wide">
                        {diary.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center py-24 w-full text-slate-400 font-black flex flex-col items-center relative z-10">
            <span className="text-6xl mb-4 drop-shadow-sm">🗂️</span>
            {activeTab === 'myIdeas' ? '아직 작성하신 아이디어가 없네요! 반짝이는 기록을 남겨보세요.' : '스크랩 해둔 글이 없습니다! 마음에 드는 글을 찾아보세요.'}
          </div>
        ) : (
          <div className="w-full relative z-10 mb-10 columns-1 md:columns-2 lg:columns-3 gap-6 max-w-6xl mx-auto">
            {currentList.map((item, idx) => (
              <div key={item.id} className="break-inside-avoid relative group cursor-pointer w-full mb-6" onClick={() => router.push('/ideas')}>
                {/* 하이틴 Y2K 감성 카드 스타일 */}
                <div className={`bg-white dark:bg-slate-800 p-5 md:p-6 rounded-3xl shadow-lg border-2 border-white dark:border-slate-700 hover:shadow-2xl transition-all duration-300 relative group-hover:-translate-y-2`}>
                  
                  {/* 썸네일 사진 (존재 시) */}
                  {((item.isCompleted && item.resultImageUrl) || item.imageUrl) && (
                    <div className="w-full aspect-[4/3] mb-5 bg-slate-100 relative overflow-hidden rounded-2xl shadow-inner border border-slate-200/50">
                      <img src={(item.isCompleted && item.resultImageUrl) ? item.resultImageUrl : item.imageUrl!} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" />
                      {(item.isCompleted && item.resultImageUrl) && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-indigo-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md z-20">🎉 완성작</div>
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
                  
                  <div className="mt-5 flex justify-between items-center opacity-80 group-hover:opacity-100 transition-opacity">
                    <div className="text-[12px] font-bold text-slate-500 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">edit</span> {item.authorName}
                    </div>
                    <span className="text-[12px] font-black text-indigo-500 hover:text-indigo-400 flex items-center gap-0.5">
                      상세보기 <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
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
