'use client';

/* eslint-disable @next/next/no-img-element -- The preview uses a temporary blob URL before upload. */

import { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useUser } from '@/context/UserContext';

export default function NewIdeaModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile, user, addPoints } = useUser();

  const quickMarks = ['AI', '공간', '행사', '기록', '돌봄', '앱', '캠페인', '도구'];

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('사진은 최대 5MB까지 업로드할 수 있어요.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!profile) {
      alert('로그인이 필요한 기능입니다. 내 정보에서 Google 계정으로 시작해주세요.');
      return;
    }
    if (!title.trim() || !description.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile && user) {
        const imageRef = ref(storage, `uploads/${user.uid}/idea_${Date.now()}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, 'ideas'), {
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || 'New',
        categoryColor: ['primary', 'secondary', 'tertiary'][Math.floor(Math.random() * 3)],
        author: profile.nickname,
        authorName: profile.nickname,
        authorPhotoUrl: profile.profileImage || null,
        imageUrl,
        upvotes: 0,
        upvotedBy: [],
        createdAt: serverTimestamp(),
      });

      await addPoints(500);
      resetForm();
      onClose();
    } catch (error) {
      console.error(error);
      alert('아이디어 등록 중 오류가 발생했어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm">
      <div className="bg-[#fffdf8] dark:bg-slate-950 rounded-lg w-full max-w-lg shadow-2xl overflow-hidden border border-[#e6dfd3] dark:border-slate-800">
        <div className="p-6 border-b border-[#e6dfd3] dark:border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black text-[#e85d55] mb-2">New Idea</p>
              <h2 className="text-[#172033] dark:text-white font-headline font-black text-2xl">새 아이디어 작성</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">작게 떠오른 생각도 괜찮아요. 먼저 남겨두면 함께 키울 수 있습니다.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 flex items-center justify-center"
              aria-label="닫기"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-black text-[#172033] dark:text-slate-100 mb-2">카테고리</label>
            <input
              type="text"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="예: 행사, 공간, 앱, 캠페인"
              className="w-full border border-[#e6dfd3] dark:border-slate-800 bg-white dark:bg-slate-900 dark:text-white rounded-lg px-4 py-3 font-bold focus:border-[#139c8f] outline-none transition-colors"
              maxLength={10}
            />
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {quickMarks.map((mark) => (
                <button
                  type="button"
                  key={mark}
                  onClick={() => setCategory(mark)}
                  className="text-xs font-black px-2.5 py-1.5 rounded-md border border-[#e6dfd3] dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-[#139c8f]/60"
                >
                  {mark}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-[#172033] dark:text-slate-100 mb-2">제목</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="예: 동아리 활동 기록을 자동으로 정리하는 도구"
              className="w-full border border-[#e6dfd3] dark:border-slate-800 bg-white dark:bg-slate-900 dark:text-white rounded-lg px-4 py-3 font-bold focus:border-[#e85d55] outline-none transition-colors"
              maxLength={40}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-black text-[#172033] dark:text-slate-100 mb-2">내용</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="무엇을 해결하고 싶은지, 누가 쓰면 좋은지, 어떻게 시작하면 좋을지 적어주세요."
              className="w-full border border-[#e6dfd3] dark:border-slate-800 bg-white dark:bg-slate-900 dark:text-white rounded-lg px-4 py-3 font-medium min-h-[130px] focus:border-[#139c8f] outline-none transition-colors resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-black text-[#172033] dark:text-slate-100 mb-2">대표 이미지</label>
            <div className="flex items-center gap-4">
              <label className={`w-24 h-24 shrink-0 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${imagePreview ? 'border-[#139c8f] bg-[#edf8f6]' : 'border-[#e6dfd3] bg-white hover:bg-[#f7f4ee] dark:border-slate-800 dark:bg-slate-900'}`}>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                {imagePreview ? (
                  <img src={imagePreview} alt="미리보기" className="w-full h-full object-cover rounded-md" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-slate-400">add_a_photo</span>
                    <span className="text-[10px] font-bold text-slate-400 mt-1">선택</span>
                  </>
                )}
              </label>
              <p className="flex-1 text-[13px] font-bold text-slate-500 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-[#e6dfd3] dark:border-slate-800">
                이미지는 선택 사항입니다. 스케치, 참고 사진, 활동 장면처럼 아이디어를 빠르게 이해할 수 있는 이미지를 올려보세요.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 bg-white hover:bg-[#f7f4ee] dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-[#e6dfd3] dark:border-slate-800 font-black py-3 rounded-lg transition-colors">
              취소
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-[2] bg-[#172033] text-white hover:bg-slate-800 transition-colors font-black py-3 rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {isSubmitting ? '등록 중...' : '등록하고 +500P 받기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
