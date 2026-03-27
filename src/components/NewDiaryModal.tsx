'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useUser } from '@/context/UserContext';

export default function NewDiaryModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user } = useUser();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mood, setMood] = useState('💖');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const moods = ['💖', '🤩', '😎', '✍️', '🤔', '🥲', '🤬', '💤'];

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("앗! 일기장 사진 용량은 최대 5MB까지만 붙일 수 있어요 📸");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("앗! 로그인이 필요한 기능입니다.");
    if (!content.trim()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const imageRef = ref(storage, `uploads/${user.uid}/diary_${Date.now()}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, 'diaries'), {
        uid: user.uid,
        date,
        mood,
        content,
        imageUrl,
        createdAt: serverTimestamp()
      });
      
      onClose();
      setContent('');
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error(error);
      alert('다이어리 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" style={{ zIndex: 10000 }}>
      {/* 바인더 스타일 모달 */}
      <div className="bg-[#fffdf7] rounded-3xl w-full max-w-lg shadow-2xl border-4 border-indigo-200 dark:border-indigo-800 scale-in-center flex flex-col h-[90vh] md:h-auto overflow-hidden">
        
        {/* 상단 띠지 (헤더) */}
        <div className="bg-gradient-to-r from-indigo-400 to-teal-400 p-6 text-center relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "10px 10px" }}></div>
          <h2 className="text-white font-headline font-black text-2xl relative z-10 drop-shadow-sm tracking-widest">나만의 다이어리 쓰기 📝</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto">
          {/* 날짜와 기분 수평 배치 */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">오늘의 날짜 🗓️</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 font-bold focus:border-indigo-400 outline-none shadow-sm"
                required 
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">오늘의 기분 (Mood)</label>
              <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide py-1">
                {moods.map(m => (
                  <button 
                    type="button" 
                    key={m} 
                    onClick={() => setMood(m)} 
                    className={`w-10 h-10 shrink-0 text-2xl flex items-center justify-center rounded-full transition-all border-2 ${mood === m ? 'bg-indigo-50 border-indigo-400 scale-110 shadow-sm' : 'bg-slate-50 border-transparent hover:bg-slate-100 grayscale-[0.5] hover:grayscale-0'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">비밀 일기장 (누구에게도 공유되지 않아요) 💖</label>
            <textarea 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              placeholder="오늘은 어떤 멋진 일들이 있었나요?" 
              className="w-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 font-medium min-h-[160px] focus:border-teal-400 outline-none shadow-sm resize-none font-handwriting text-lg leading-relaxed"
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">추억의 사진 한 장 (선택)</label>
            <div className="flex items-center gap-4">
              <label className={`w-24 h-24 shrink-0 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${imagePreview ? 'border-teal-400 bg-teal-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800'}`}>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-slate-400">add_a_photo</span>
                    <span className="text-[10px] font-bold text-slate-400 mt-1">사진 추가</span>
                  </>
                )}
              </label>
              <div className="flex-1 text-[13px] font-bold text-slate-500 leading-relaxed bg-slate-50 border border-slate-100 dark:bg-slate-800/80 p-3 rounded-xl dark:border-slate-700">
                오늘 나의 모습, 코딩 중이던 화면, 혹은 예쁜 하늘 사진을 붙여보세요! 일기장에 폴라로이드처럼 남습니다. 📸
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4 shrink-0">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black py-4 rounded-xl transition-colors">덮어두기</button>
            <button type="submit" disabled={isSubmitting} className="flex-[2] bg-slate-900 border border-transparent dark:bg-white text-white dark:text-slate-900 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-teal-500 hover:text-white hover:border-white transition-all font-black py-4 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 tracking-widest text-lg">
              {isSubmitting ? '기록 중...' : '다이어리 작성 완료 ✨'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
