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

  const emojis = ['✨', '💡', '🚀', '🎨', '📌', '🧩', '🌱', '🤝', '🔥', '📚', '🎯', '🛠️'];

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border-2 border-pink-300 dark:border-pink-800 scale-in-center">
        <div className="bg-gradient-to-r from-pink-400 to-indigo-500 p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
          <h2 className="text-white font-headline font-black text-2xl relative z-10 drop-shadow-sm">새 아이디어 작성</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">카테고리 태그</label>
            <input
              type="text"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="예: 행사, 공간, 앱, 캠페인"
              className="w-full border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 font-bold focus:border-pink-400 dark:focus:border-pink-500 outline-none transition-colors shadow-sm"
              maxLength={10}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">아이디어 제목</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="예: 동아리 활동 기록을 자동으로 정리하는 도구"
              className="w-full border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 font-bold focus:border-pink-400 dark:focus:border-pink-500 outline-none transition-colors shadow-sm"
              maxLength={40}
              required
            />
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {emojis.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setTitle((prev) => prev + emoji)}
                  className="text-[16px] hover:scale-125 transition-all active:scale-95 bg-slate-50 hover:bg-white hover:border-pink-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:border-pink-500 w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm focus:outline-none"
                  aria-label={`${emoji} 추가`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">내용</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="무엇을 해결하고 싶은지, 누가 쓰면 좋은지, 어떻게 시작하면 좋을지 적어주세요."
              className="w-full border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 font-medium min-h-[120px] focus:border-indigo-400 dark:focus:border-indigo-500 outline-none transition-colors shadow-sm resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">대표 사진 선택</label>
            <div className="flex items-center gap-4">
              <label className={`w-24 h-24 shrink-0 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${imagePreview ? 'border-pink-400 bg-pink-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800'}`}>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                {imagePreview ? (
                  <img src={imagePreview} alt="미리보기" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-slate-400">add_a_photo</span>
                    <span className="text-[10px] font-bold text-slate-400 mt-1">사진 추가</span>
                  </>
                )}
              </label>
              <div className="flex-1 text-[13px] font-bold text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                이미지는 선택 사항입니다. 아이디어를 빠르게 이해할 수 있는 사진이나 스케치를 올리면 카드가 더 잘 읽힙니다.
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-1">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black py-3.5 rounded-xl transition-colors">
              취소
            </button>
            <button type="submit" disabled={isSubmitting} className="flex-[2] bg-slate-900 border border-transparent dark:bg-white text-white dark:text-slate-900 hover:bg-gradient-to-r hover:from-pink-500 hover:to-indigo-500 hover:text-white hover:border-white transition-all font-black py-3.5 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {isSubmitting ? '등록 중...' : '등록하고 +500P 받기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
