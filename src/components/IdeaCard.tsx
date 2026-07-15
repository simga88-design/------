'use client';

/* eslint-disable @next/next/no-img-element -- Idea media is user-uploaded and can come from Firebase or blob URLs. */

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

const colorClasses: Record<NonNullable<Idea['categoryColor']>, { chip: string; icon: string; soft: string }> = {
  primary: {
    chip: 'bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-900/30 dark:text-pink-200 dark:border-pink-800',
    icon: 'text-pink-500 bg-pink-50 dark:bg-pink-900/30',
    soft: 'from-pink-500 to-rose-500',
  },
  secondary: {
    chip: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-800',
    icon: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30',
    soft: 'from-indigo-500 to-violet-500',
  },
  tertiary: {
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30',
    soft: 'from-emerald-500 to-teal-500',
  },
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
  const categoryColor = idea.categoryColor || 'primary';
  const palette = colorClasses[categoryColor];
  const previewImage = idea.isCompleted && idea.resultImageUrl ? idea.resultImageUrl : idea.imageUrl;
  const hasWorkspace = Boolean(idea.workspaceId || (idea.progress !== undefined && idea.progress >= 0));
  const isOwner = profile?.nickname === displayAuthor;
  const isAlreadyUpvoted = Boolean(user && (idea.upvotedBy || []).includes(user.uid));

  const [editTitle, setEditTitle] = useState(displayTitle);
  const [editDesc, setEditDesc] = useState(displayDesc);

  const statusLabel = idea.isCompleted ? '완성됨' : hasWorkspace ? '작업방 진행' : '제안 단계';
  const statusIcon = idea.isCompleted ? 'task_alt' : hasWorkspace ? 'rocket_launch' : 'lightbulb';
  const statusClass = idea.isCompleted
    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800'
    : hasWorkspace
      ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-800'
      : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

  const handleUpvote = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!profile || !user) {
      alert('로그인이 필요한 기능입니다. 내 정보에서 Google 계정으로 시작해주세요.');
      return;
    }

    if (isAlreadyUpvoted) {
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

  const handleCancelEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    setEditTitle(displayTitle);
    setEditDesc(displayDesc);
    setIsEditing(false);
  };

  return (
    <article className="group relative h-full rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${palette.soft}`} />

      {previewImage && !isEditing && (
        <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <img src={previewImage} alt="아이디어 대표 이미지" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          <div className="absolute left-3 top-3 flex gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black backdrop-blur ${statusClass}`}>
              <span className="material-symbols-outlined text-[14px]">{statusIcon}</span>
              {statusLabel}
            </span>
          </div>
        </div>
      )}

      <div className="p-5 flex flex-col min-h-[320px]">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black ${palette.chip}`}>
              {displayCategory}
            </span>
            {!previewImage && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black ${statusClass}`}>
                <span className="material-symbols-outlined text-[14px]">{statusIcon}</span>
                {statusLabel}
              </span>
            )}
          </div>

          {isOwner && !isEditing && (
            <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsEditing(true);
                }}
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-indigo-600 flex items-center justify-center"
                aria-label="아이디어 수정"
              >
                <span className="material-symbols-outlined text-[17px]">edit</span>
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-red-500 flex items-center justify-center"
                aria-label="아이디어 삭제"
              >
                <span className="material-symbols-outlined text-[17px]">delete</span>
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-3 mb-4">
            <input
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              className="w-full rounded-lg border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-950 px-3 py-2 text-lg font-black text-slate-900 dark:text-white outline-none focus:border-pink-400"
              placeholder="제목 수정"
            />
            <textarea
              value={editDesc}
              onChange={(event) => setEditDesc(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              className="w-full rounded-lg border-2 border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 min-h-[120px] outline-none focus:border-pink-400 resize-none"
              placeholder="내용 수정"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={handleCancelEdit} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm">
                취소
              </button>
              <button type="button" onClick={handleUpdate} className="px-4 py-2 rounded-lg bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-sm">
                저장
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="font-headline text-2xl font-black leading-tight text-slate-950 dark:text-white mb-3 break-keep">
              {displayTitle}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-medium line-clamp-4 mb-5 whitespace-pre-wrap">
              {displayDesc}
            </p>
          </>
        )}

        {hasWorkspace && !idea.isCompleted && idea.progress !== undefined && idea.progress > 0 && (
          <div className="mb-5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3">
            <div className="flex items-center justify-between text-[11px] font-black text-slate-500 dark:text-slate-400 mb-2">
              <span>진행률</span>
              <span>{idea.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-indigo-500" style={{ width: `${idea.progress}%` }} />
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 min-w-0">
              {idea.authorPhotoUrl ? (
                <img src={idea.authorPhotoUrl} alt="작성자 프로필" className="w-8 h-8 rounded-full object-cover bg-white border border-slate-200" />
              ) : (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${palette.icon}`}>
                  {displayAuthor.slice(0, 1)}
                </div>
              )}
              <span className="text-sm font-black text-slate-700 dark:text-slate-200 truncate">{displayAuthor}</span>
            </div>

            <button
              type="button"
              onClick={handleUpvote}
              disabled={isUpvoting || isAlreadyUpvoted}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-black transition-all ${
                isAlreadyUpvoted
                  ? 'bg-pink-50 text-pink-600 border-pink-100 dark:bg-pink-900/30 dark:border-pink-800'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-pink-600 hover:border-pink-200'
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${isUpvoting ? 'scale-125' : ''}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                favorite
              </span>
              {displayUpvotes}
            </button>
          </div>

          {idea.isCompleted && idea.resultUrl ? (
            <a
              href={idea.resultUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="w-full h-11 rounded-lg bg-emerald-600 text-white font-black inline-flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors"
            >
              <span className="material-symbols-outlined text-[19px]">open_in_new</span>
              완성본 보기
            </a>
          ) : (
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
              className={`w-full h-11 rounded-lg text-white font-black inline-flex items-center justify-center gap-2 transition-all disabled:opacity-60 ${
                hasWorkspace
                  ? 'bg-indigo-600 hover:bg-indigo-500'
                  : 'bg-slate-950 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200'
              }`}
            >
              <span className={`material-symbols-outlined text-[19px] ${isCreating ? 'animate-spin' : ''}`}>
                {isCreating ? 'autorenew' : hasWorkspace ? 'rocket_launch' : 'add_task'}
              </span>
              {hasWorkspace ? '작업방 입장' : '작업방 만들기'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
