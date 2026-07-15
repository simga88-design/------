'use client';

/* eslint-disable @next/next/no-img-element -- Idea card media is user-uploaded and may come from arbitrary Firebase URLs. */

import { useState } from 'react';
import { arrayUnion, deleteDoc, doc, increment, updateDoc } from 'firebase/firestore';
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

interface IdeaCardProps {
  idea: Idea;
  onDeploy: () => void;
  isCreating: boolean;
}

const hasCode = (error: unknown): error is { code: string } => {
  return typeof error === 'object' && error !== null && 'code' in error;
};

export default function IdeaCard({ idea, onDeploy, isCreating }: IdeaCardProps) {
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { addPoints, profile, user } = useUser();

  const displayAuthor = idea.authorName || idea.author || '익명 친구';
  const displayTitle = idea.title || '제목 없는 아이디어';
  const displayDesc = idea.description || '';
  const displayUpvotes = idea.upvotes || 0;
  const displayCategory = idea.category || 'New';
  const previewImage = idea.isCompleted && idea.resultImageUrl ? idea.resultImageUrl : idea.imageUrl;

  const [editTitle, setEditTitle] = useState(displayTitle);
  const [editDesc, setEditDesc] = useState(displayDesc);
  const isOwner = profile?.nickname === displayAuthor;

  const handleUpvote = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!profile || !user) {
      alert('로그인이 필요한 기능입니다. 내 정보에서 Google 계정으로 시작해주세요.');
      return;
    }

    if ((idea.upvotedBy || []).includes(user.uid)) {
      alert('이미 공감한 아이디어입니다. 한 아이디어에는 한 번만 공감할 수 있어요.');
      return;
    }

    if (isUpvoting) return;
    setIsUpvoting(true);
    try {
      await updateDoc(doc(db, 'ideas', idea.id), {
        upvotes: increment(1),
        upvotedBy: arrayUnion(user.uid),
      });
      await addPoints(100);
    } catch (error) {
      if (hasCode(error) && error.code === 'permission-denied') {
        alert('공감하기 권한이 없습니다. Firestore 규칙을 확인해주세요.');
      } else {
        alert('공감 처리 중 오류가 발생했어요.');
      }
    } finally {
      setTimeout(() => setIsUpvoting(false), 300);
    }
  };

  const handleUpdate = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!editTitle.trim() || !editDesc.trim()) return;

    try {
      await updateDoc(doc(db, 'ideas', idea.id), {
        title: editTitle.trim(),
        description: editDesc.trim(),
      });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert('아이디어 수정 중 오류가 발생했어요.');
    }
  };

  const handleDelete = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!confirm('이 아이디어를 삭제할까요? 삭제한 내용은 복구할 수 없습니다.')) return;

    try {
      await deleteDoc(doc(db, 'ideas', idea.id));
    } catch (error) {
      console.error(error);
      alert('아이디어 삭제 중 오류가 발생했어요.');
    }
  };

  const getRotationClass = () => {
    switch (idea.rotation) {
      case 'left':
        return 'rotate-[-2deg] hover:rotate-0';
      case 'right':
        return 'rotate-[2deg] hover:rotate-0';
      default:
        return 'rotate-[-1deg] hover:rotate-0';
    }
  };

  const isSecondary = idea.categoryColor === 'secondary';
  const isTertiary = idea.categoryColor === 'tertiary';
  const tapeColor = isSecondary ? 'bg-indigo-400' : isTertiary ? 'bg-teal-400' : 'bg-pink-400';
  const iconName = isSecondary ? 'star' : isTertiary ? 'auto_awesome' : 'volunteer_activism';
  const hasWorkspace = Boolean(idea.workspaceId || (idea.progress !== undefined && idea.progress >= 0));

  return (
    <div className={`transition-all duration-300 transform ${getRotationClass()} relative mb-8 font-body group hover:scale-[1.02] hover:z-20`}>
      <div
        className={`absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-7 ${tapeColor} opacity-80 backdrop-blur-sm -rotate-3 z-20 shadow-[0_2px_5px_rgba(0,0,0,0.08)] border-x-[6px] border-x-dashed border-x-white/40 border-y border-y-white/10`}
        style={{ maskImage: 'linear-gradient(to right, rgba(0,0,0,0.8), black 5%, black 95%, rgba(0,0,0,0.8))', WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,0.8), black 5%, black 95%, rgba(0,0,0,0.8))' }}
      />

      <div className="bg-[#fffdf7] rounded-[4px] p-4 pb-6 shadow-[0_15px_35px_rgba(0,0,0,0.08)] border border-slate-200 flex flex-col h-full ring-1 ring-black/5 relative z-10 w-full">
        {isOwner && !isEditing && (
          <div className="absolute top-4 right-4 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button type="button" onClick={(event) => { event.stopPropagation(); setIsEditing(true); }} className="w-8 h-8 bg-white/90 hover:bg-white text-slate-500 hover:text-indigo-600 rounded-full shadow-md flex items-center justify-center backdrop-blur-sm transition-all border border-slate-200 hover:scale-110" aria-label="아이디어 수정">
              <span className="material-symbols-outlined text-[16px]">edit</span>
            </button>
            <button type="button" onClick={handleDelete} className="w-8 h-8 bg-white/90 hover:bg-white text-slate-500 hover:text-red-500 rounded-full shadow-md flex items-center justify-center backdrop-blur-sm transition-all border border-slate-200 hover:scale-110" aria-label="아이디어 삭제">
              <span className="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        )}

        <span className={`absolute top-6 right-6 material-symbols-outlined text-4xl opacity-[0.15] pointer-events-none ${isSecondary ? 'text-indigo-600 rotate-12' : isTertiary ? 'text-teal-600 -rotate-12' : 'text-pink-600 rotate-6'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {iconName}
        </span>

        {!isEditing && previewImage && (
          <div className="w-full aspect-square md:aspect-[4/3] mb-3 relative overflow-hidden flex-shrink-0 bg-slate-100 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] border border-slate-200/50">
            <img src={previewImage} alt="아이디어 대표 이미지" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
            {idea.isCompleted && idea.resultImageUrl && (
              <div className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] tracking-widest font-black px-2 py-1 rounded-sm shadow-md z-10">
                RESULT
              </div>
            )}
          </div>
        )}

        <div className={`w-full mb-3 rounded-sm relative flex flex-col justify-center ${!previewImage ? 'bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 p-5 min-h-[160px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.03)]' : 'px-1'}`}>
          <div className={`flex justify-start mb-2 relative z-10 ${!previewImage ? 'mb-3' : ''}`}>
            <span className={`text-[10px] font-bold ${tapeColor} px-2 py-0.5 rounded-sm text-white shadow-sm font-headline tracking-widest uppercase`}>
              {displayCategory}
            </span>
          </div>

          {isEditing ? (
            <input
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              className={`w-full bg-white/90 border-2 border-indigo-300 rounded-lg px-2 py-1 font-bold font-headline text-slate-900 mb-1 z-20 focus:outline-none focus:border-pink-400 shadow-sm ${!previewImage ? 'text-2xl' : 'text-xl'}`}
              placeholder="제목 수정"
            />
          ) : (
            <h3 className={`font-headline font-extrabold text-slate-900 z-10 break-keep ${!previewImage ? 'text-[28px] md:text-3xl leading-[1.3]' : 'text-xl md:text-2xl leading-snug drop-shadow-sm'}`}>
              {displayTitle}
            </h3>
          )}
        </div>

        {isEditing ? (
          <div className="px-2 mb-4 flex-grow flex flex-col gap-2 relative z-20">
            <textarea
              value={editDesc}
              onChange={(event) => setEditDesc(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              className="w-full bg-slate-50 border-2 border-indigo-300 rounded-lg px-3 py-2 text-[15px] font-medium text-slate-800 min-h-[120px] focus:outline-none focus:border-pink-400 resize-none shadow-sm"
              placeholder="내용 수정"
            />
            <div className="flex gap-2 justify-end mt-1 mb-2">
              <button type="button" onClick={(event) => { event.stopPropagation(); setIsEditing(false); setEditTitle(displayTitle); setEditDesc(displayDesc); }} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm rounded-lg transition-colors">
                취소
              </button>
              <button type="button" onClick={handleUpdate} className="px-4 py-2 bg-gradient-to-r from-pink-500 to-indigo-500 hover:scale-105 text-white font-bold text-sm rounded-lg shadow-md transition-all">
                수정 완료
              </button>
            </div>
          </div>
        ) : (
          <p className="text-slate-800 text-[15px] leading-relaxed mb-6 whitespace-pre-wrap flex-grow px-2 font-medium">
            {displayDesc}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-slate-200 pb-5 mb-5 px-2">
          <div className="flex items-center gap-2.5">
            {idea.authorPhotoUrl ? (
              <img src={idea.authorPhotoUrl} alt="작성자 프로필" className="w-9 h-9 rounded-full object-cover shadow-sm bg-white border border-slate-200" />
            ) : (
              <div className={`w-9 h-9 rounded-full ${tapeColor} flex items-center justify-center text-xs font-black text-white shadow-sm font-headline text-xl`}>
                {displayAuthor.slice(0, 1)}
              </div>
            )}
            <span className="text-base font-extrabold text-slate-800">{displayAuthor}</span>
          </div>

          <button
            type="button"
            onClick={handleUpvote}
            disabled={isUpvoting}
            className="flex items-center gap-1.5 bg-white text-pink-600 px-4 py-2 rounded-full text-sm font-bold hover:bg-pink-50 transition-all active:scale-[0.97] shadow-sm border border-pink-100 group/btn"
          >
            <span className={`material-symbols-outlined text-xl ${isUpvoting ? 'scale-125 text-pink-500 duration-200' : 'group-hover/btn:scale-110 duration-200'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
              favorite
            </span>
            <span className="font-headline tracking-wide">공감해요</span>
            <span className="bg-pink-100 text-pink-700 px-2.5 py-0.5 rounded-full text-xs ml-1 shadow-inner">{displayUpvotes}</span>
          </button>
        </div>

        {!idea.isCompleted && (
          <div className="w-full px-1 mt-auto">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (!profile) {
                  alert('로그인이 필요한 기능입니다. 내 정보에서 Google 계정으로 시작해주세요.');
                  return;
                }
                onDeploy();
              }}
              disabled={isCreating}
              className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r py-3 rounded-full text-white font-headline text-base md:text-lg font-black shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed group/deploy border border-white/20 ${
                hasWorkspace
                  ? 'from-indigo-500 hover:from-indigo-400 to-purple-500 hover:to-purple-400 ring-2 ring-indigo-300 ring-offset-2'
                  : 'from-pink-500 hover:from-pink-400 to-indigo-500 hover:to-indigo-400'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${isCreating ? 'animate-spin' : 'group-hover/deploy:rotate-12 transition-transform'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {isCreating ? 'autorenew' : hasWorkspace ? 'rocket_launch' : 'local_fire_department'}
              </span>
              {hasWorkspace ? '작업방 입장하기' : '작업방 만들기'}
            </button>
          </div>
        )}

        {(idea.progress !== undefined || idea.isCompleted) && (
          <div className="mt-auto pt-3 flex flex-col gap-2">
            {idea.progress !== undefined && !idea.isCompleted && idea.progress > 0 && (
              <div className="w-full flex items-center gap-2">
                <div className="flex-1 bg-slate-100 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden shadow-inner">
                  <div className="bg-gradient-to-r from-pink-400 to-indigo-500 h-full transition-all duration-500" style={{ width: `${idea.progress}%` }} />
                </div>
                <span className="text-[10px] font-black tracking-widest text-indigo-500">{idea.progress}%</span>
              </div>
            )}

            {idea.isCompleted && idea.resultUrl && (
              <a href={idea.resultUrl} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} className="w-full py-4 bg-slate-900 border-2 border-transparent hover:border-pink-500 dark:bg-slate-800 text-white font-black text-lg md:text-xl rounded-full flex items-center justify-center gap-2 hover:bg-gradient-to-r hover:from-pink-600 hover:to-indigo-600 transition-all shadow-[0_8px_20px_rgba(15,23,42,0.3)] hover:scale-105 active:scale-95 group/link">
                <span className="material-symbols-outlined text-[24px] group-hover/link:-translate-y-1 group-hover/link:translate-x-1 transition-transform">rocket_launch</span>
                완성본 보러 가기
              </a>
            )}
          </div>
        )}

        {idea.isCompleted && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 pointer-events-none z-40 opacity-90 drop-shadow-2xl scale-110 md:scale-125">
            <div className="border-4 md:border-[6px] border-rose-500 text-rose-500 font-extrabold font-headline text-3xl md:text-4xl px-4 py-2 rounded-lg origin-center animate-pulse tracking-widest bg-white/10 backdrop-blur-sm" style={{ textShadow: '0 0 15px rgba(244,63,94,0.4)' }}>
              COMPLETED
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
