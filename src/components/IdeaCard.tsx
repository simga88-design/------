'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc, increment, deleteDoc, arrayUnion, query, where, getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUser } from '@/context/UserContext';

export interface Idea {
  id: string;
  category?: string;
  categoryColor?: 'primary' | 'secondary' | 'tertiary';
  title?: string;
  description?: string;
  authorName?: string;
  author?: string;
  upvotes?: number;
  rotation?: string;
  upvotedBy?: string[];
  progress?: number;
  isCompleted?: boolean;
  resultUrl?: string;
  resultImageUrl?: string;
  imageUrl?: string;
  authorPhotoUrl?: string;
  workspaceId?: string;
}

export default function IdeaCard({ idea, onDeploy, isCreating }: { idea: Idea, onDeploy: () => void, isCreating: boolean }) {
  const [isUpvoting, setIsUpvoting] = useState(false);
  const { addPoints, profile, user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  
  const displayAuthor = idea.authorName || idea.author || '비밀친구';
  const displayTitle = idea.title || '재미있는 아이디어✨';
  const displayDesc = idea.description || '';
  const displayUpvotes = idea.upvotes || 0;
  const displayCategory = idea.category || 'New 💡';

  const [editTitle, setEditTitle] = useState(displayTitle);
  const [editDesc, setEditDesc] = useState(displayDesc);
  const isOwner = profile?.nickname === displayAuthor;
  const [fetchedPhotoUrl, setFetchedPhotoUrl] = useState<string | null>(idea.authorPhotoUrl || null);

  // 구버전 데이터 호환 (authorPhotoUrl이 없는 경우 users 컬렉션에서 닉네임으로 조회)
  useEffect(() => {
    if (idea.authorPhotoUrl || !displayAuthor || displayAuthor === '비밀친구') return;
    
    const fetchAuthorPhoto = async () => {
      try {
        const q = query(collection(db, 'users'), where('nickname', '==', displayAuthor));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setFetchedPhotoUrl(snap.docs[0].data().profileImage || null);
        }
      } catch (e) {
        console.error("작성자 프사 조회 실패:", e);
      }
    };
    fetchAuthorPhoto();
  }, [idea.authorPhotoUrl, displayAuthor]);

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile || !user) return alert("앗! 로그인이 필요한 기능입니다. 프로필 탭에서 3초 만에 구글로 가입해주세요! 👋");
    
    // 어뷰징(무한클릭) 방지: 이미 투표한 사람인지 검사
    if ((idea.upvotedBy || []).includes(user.uid)) {
      return alert("이미 이 아이디어에 공감하셨네요! 하나의 글에는 한 번만 공감할 수 있습니다 💖");
    }

    if (isUpvoting) return;
    setIsUpvoting(true);
    try {
      const ideaRef = doc(db, 'ideas', idea.id);
      await updateDoc(ideaRef, { 
        upvotes: increment(1),
        upvotedBy: arrayUnion(user.uid)
      });
      addPoints(100); // 공감하기 성공 시 포인트 100점 획득 (인플레이션 적용)
    } catch (error: any) {
      if (error.code === 'permission-denied') alert('공감하기 권한이 없습니다.');
    } finally {
      setTimeout(() => setIsUpvoting(false), 300);
    }
  };

  const handleUpdate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editTitle.trim() || !editDesc.trim()) return;
    try {
      await updateDoc(doc(db, 'ideas', idea.id), { title: editTitle.trim(), description: editDesc.trim() });
      setIsEditing(false);
    } catch (error) {
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("정말로 이 빛나는 아이디어를 삭제하시겠습니까? 😢 (복구 불가)")) {
      try {
        await deleteDoc(doc(db, 'ideas', idea.id));
      } catch (error) {
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const getRotationClass = () => {
    switch (idea.rotation) {
      case 'left': return 'rotate-[-2deg] hover:rotate-0';
      case 'right': return 'rotate-[2deg] hover:rotate-0';
      default: return 'rotate-[-1deg] hover:rotate-0';
    }
  };

  // 폴라로이드 감성의 상단 테이프 컬러
  const isSecondary = idea.categoryColor === 'secondary';
  const isTertiary = idea.categoryColor === 'tertiary';
  const tapeColor = isSecondary ? 'bg-indigo-400' 
                  : isTertiary ? 'bg-teal-400' 
                  : 'bg-pink-400';

  return (
    <div className={`transition-all duration-300 transform ${getRotationClass()} relative mb-8 font-body group hover:scale-[1.02] hover:z-20`}>
      
      {/* 반투명 마스킹 테이프 장식 */}
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-8 ${tapeColor} opacity-80 backdrop-blur-md rotate-[-2deg] z-20 shadow-sm border border-white/20`}
           style={{ maskImage: "linear-gradient(to right, rgba(0,0,0,0.8), black 5%, black 95%, rgba(0,0,0,0.8))", WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,0.8), black 5%, black 95%, rgba(0,0,0,0.8))" }}></div>
           
      {/* 폴라로이드 몸체 박스 */}
      <div className="bg-[#fffdf7] rounded-[4px] p-4 pb-6 shadow-[0_15px_35px_rgba(0,0,0,0.08)] border border-slate-200 flex flex-col h-full ring-1 ring-black/5 relative z-10 w-full">
        
        {/* 수정/삭제 관리 오버레이 (본인만) */}
        {isOwner && !isEditing && (
          <div className="absolute top-4 right-4 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="w-8 h-8 bg-white/90 hover:bg-white text-slate-500 hover:text-indigo-600 rounded-full shadow-md flex items-center justify-center backdrop-blur-sm transition-all border border-slate-200 hover:scale-110">
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
            <button onClick={handleDelete} className="w-8 h-8 bg-white/90 hover:bg-white text-slate-500 hover:text-red-500 rounded-full shadow-md flex items-center justify-center backdrop-blur-sm transition-all border border-slate-200 hover:scale-110">
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        )}

        {/* 귀여운 장식 스티커 아이콘 (카테고리별 분기) */}
        <span className={`absolute top-6 right-6 material-symbols-outlined text-4xl opacity-[0.15] pointer-events-none ${isSecondary ? 'text-indigo-600 rotate-12' : isTertiary ? 'text-teal-600 -rotate-12' : 'text-pink-600 rotate-6'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {isSecondary ? 'star' : isTertiary ? 'auto_awesome' : 'volunteer_activism'}
        </span>

        {/* 폴라로이드 렌즈(이미지 위치) */}
        {(!isEditing && (idea.isCompleted && idea.resultImageUrl || idea.imageUrl)) && (
          <div className="w-full aspect-square md:aspect-[4/3] mb-3 relative overflow-hidden flex-shrink-0 bg-slate-100 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] border border-slate-200/50">
            <img src={(idea.isCompleted && idea.resultImageUrl) ? idea.resultImageUrl : idea.imageUrl!} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
            
            {/* 결과물 뱃지 (경우에 따라) */}
            {(idea.isCompleted && idea.resultImageUrl) && (
              <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] tracking-widest font-black px-2 py-1 rounded-sm shadow-md z-10 animate-bounce">
                🎉 RESULT
              </div>
            )}
          </div>
        )}

        {/* 타이틀 헤더 영역 */}
        <div className={`w-full mb-3 rounded-sm relative flex flex-col justify-center ${(!idea.resultImageUrl && !idea.imageUrl) ? 'bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 p-5 min-h-[160px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.03)]' : 'px-1'}`}>
            <div className={`flex justify-start mb-2 relative z-10 ${(!idea.resultImageUrl && !idea.imageUrl) ? 'mb-3' : ''}`}>
              <span className={`text-[10px] font-bold ${tapeColor} px-2 py-0.5 rounded-sm text-white shadow-sm font-headline tracking-widest uppercase`}>
                {displayCategory}
              </span>
            </div>
            
            {isEditing ? (
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} onClick={e => e.stopPropagation()} className={`w-full bg-white/90 border-2 border-indigo-300 rounded-lg px-2 py-1 font-bold font-headline text-slate-900 mb-1 z-20 focus:outline-none focus:border-pink-400 shadow-sm ${(!idea.resultImageUrl && !idea.imageUrl) ? 'text-2xl' : 'text-xl'}`} placeholder="제목 수정" />
            ) : (
              <h3 className={`font-headline font-extrabold text-slate-900 z-10 break-keep ${(!idea.resultImageUrl && !idea.imageUrl) ? 'text-[28px] md:text-3xl leading-[1.3]' : 'text-xl md:text-2xl leading-snug drop-shadow-sm'}`}>{displayTitle}</h3>
            )}
        </div>
        
        {/* 본문 디스크립션 (가독성 높은 다크 그레이 텍스트) */}
        {isEditing ? (
          <div className="px-2 mb-4 flex-grow flex flex-col gap-2 relative z-20">
             <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} onClick={e => e.stopPropagation()} className="w-full bg-slate-50 border-2 border-indigo-300 rounded-lg px-3 py-2 text-[15px] font-medium text-slate-800 min-h-[120px] focus:outline-none focus:border-pink-400 resize-none shadow-sm" placeholder="내용 수정" />
             <div className="flex gap-2 justify-end mt-1 mb-2">
               <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); setEditTitle(displayTitle); setEditDesc(displayDesc); }} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm rounded-lg transition-colors">취소</button>
               <button onClick={handleUpdate} className="px-4 py-2 bg-gradient-to-r from-pink-500 to-indigo-500 hover:scale-105 text-white font-bold text-sm rounded-lg shadow-md transition-all">수정 완료 ✨</button>
             </div>
          </div>
        ) : (
          <p className="text-slate-800 text-[15px] leading-relaxed mb-6 whitespace-pre-wrap flex-grow px-2 font-medium">
            {displayDesc}
          </p>
        )}
        
        {/* 하단 작성자 정보 & 공감해요 버튼 박스 */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-slate-200 pb-5 mb-5 px-2">
          {/* 작성자 정보 */}
          <div className="flex items-center gap-2.5">
            {fetchedPhotoUrl ? (
              <img src={fetchedPhotoUrl} alt="Author Profilfe" className="w-9 h-9 rounded-full object-cover shadow-sm bg-white border border-slate-200" />
            ) : (
              <div className={`w-9 h-9 rounded-full ${tapeColor} flex items-center justify-center text-xs font-black text-white shadow-sm font-headline text-xl`}>
                {displayAuthor.slice(0, 1)}
              </div>
            )}
            <span className="text-base font-extrabold text-slate-800">{displayAuthor}</span>
          </div>
          
          {/* 공감해요 버튼 */}
          <button 
            onClick={handleUpvote}
            disabled={isUpvoting}
            className="flex items-center gap-1.5 bg-white text-pink-600 px-4 py-2 rounded-full text-sm font-bold hover:bg-pink-50 transition-all active:scale-[0.97] shadow-sm border border-pink-100 group/btn"
          >
            <span className={`material-symbols-outlined text-xl ${isUpvoting ? 'scale-125 text-pink-500 duration-200' : 'group-hover/btn:scale-110 duration-200'}`} style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
            <span className="font-headline tracking-wide">공감해요</span>
            <span className="bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full text-xs ml-1 shadow-inner">{displayUpvotes}</span>
          </button>
        </div>

        {/* [내가 해볼게!] 메인 액션 둥근 버튼 (완료 시 숨김) */}
        {!idea.isCompleted && (
          <div className="w-full px-1 mt-auto">
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (!profile) return alert("앗! 로그인이 필요한 기능입니다. 프로필 탭에서 3초 만에 구글로 가입해주세요! 👋");
                onDeploy(); 
              }}
              disabled={isCreating}
              className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r py-4 rounded-full text-white font-headline text-2xl md:text-3xl font-black shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_25px_rgba(0,0,0,0.2)] hover:scale-[1.03] active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed group/deploy border border-white/20 ${
                (idea.workspaceId || (idea.progress !== undefined && idea.progress >= 0)) 
                  ? 'from-indigo-500 hover:from-indigo-400 to-purple-500 hover:to-purple-400 ring-2 ring-indigo-300 ring-offset-2' 
                  : 'from-pink-500 hover:from-pink-400 to-indigo-500 hover:to-indigo-400'
              }`}
            >
              <span className={`material-symbols-outlined text-3xl ${isCreating ? 'animate-spin' : 'group-hover/deploy:rotate-12 transition-transform'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {isCreating ? 'autorenew' : (idea.workspaceId || (idea.progress !== undefined && idea.progress >= 0)) ? 'rocket_launch' : 'local_fire_department'}
              </span>
              {(idea.workspaceId || (idea.progress !== undefined && idea.progress >= 0)) ? '작업방 입장하기 🚀' : '내가 해볼게!'}
            </button>
          </div>
        )}

        {/* 미니 프로그레스 바 & 산출물 구경가기 버튼 */}
        {(idea.progress !== undefined || idea.isCompleted) && (
          <div className="mt-auto pt-3 flex flex-col gap-2">
            {idea.progress !== undefined && !idea.isCompleted && idea.progress > 0 && (
               <div className="w-full flex items-center gap-2">
                 <div className="flex-1 bg-slate-100 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden shadow-inner">
                   <div className="bg-gradient-to-r from-pink-400 to-indigo-500 h-full transition-all duration-500" style={{ width: `${idea.progress}%` }}></div>
                 </div>
                 <span className="text-[10px] font-black tracking-widest text-indigo-500">{idea.progress}%</span>
               </div>
            )}
            
            {idea.isCompleted && idea.resultUrl && (
               <a href={idea.resultUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="w-full py-4 bg-slate-900 border-2 border-transparent hover:border-pink-500 dark:bg-slate-800 text-white font-black text-lg md:text-xl rounded-full flex items-center justify-center gap-2 hover:bg-gradient-to-r hover:from-pink-600 hover:to-indigo-600 transition-all shadow-[0_8px_20px_rgba(15,23,42,0.3)] hover:scale-105 active:scale-95 group/link">
                 <span className="material-symbols-outlined text-[24px] group-hover/link:-translate-y-1 group-hover/link:translate-x-1 transition-transform">rocket_launch</span> 완성본 구경가기 🚀
               </a>
            )}
          </div>
        )}

        {/* 대각선으로 찍히는 짱큰 완료 도장 스티커 */}
        {idea.isCompleted && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none z-40 opacity-90 drop-shadow-2xl scale-110 md:scale-125">
            <div className="border-4 md:border-[6px] border-rose-500 text-rose-500 font-extrabold font-headline text-3xl md:text-4xl px-4 py-2 rounded-lg origin-center animate-pulse tracking-widest bg-white/10 backdrop-blur-sm" style={{ textShadow: "0 0 15px rgba(244,63,94,0.4)" }}>
              COMPLETED
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
