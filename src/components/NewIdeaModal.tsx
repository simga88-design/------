'use client';
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useUser } from '@/context/UserContext';

export default function NewIdeaModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { profile, user, addPoints } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emojis = ['✨', '🔥', '🚀', '🤖', '👾', '💻', '🔮', '🎧', '💎', '🌈', '🍒', '😎'];

  const appendEmoji = (emoji: string) => {
    setTitle(prev => prev + emoji);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      alert("앗! 로그인이 필요한 기능입니다. 프로필 탭에서 3초 만에 구글로 가입해주세요! 👋");
      return;
    }
    if (!title.trim() || !description.trim()) return;
    if (isSubmitting) return;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) {
          alert("앗! 다이어리 사진 용량은 최대 5MB까지만 붙일 수 있어요 📸");
          return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    };

    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (imageFile && user) {
        const imageRef = ref(storage, `uploads/${user.uid}/idea_${Date.now()}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, 'ideas'), {
        title,
        description,
        category: category.trim() || 'New 💡',
        categoryColor: ['primary', 'secondary', 'tertiary'][Math.floor(Math.random() * 3)],
        author: profile.nickname,
        authorName: profile.nickname,
        authorPhotoUrl: profile.profileImage || null,
        imageUrl,
        upvotes: 0,
        createdAt: serverTimestamp()
      });
      addPoints(500); // 글 작성 시 경험치 500P 즉시 부여 (인플레이션 적용)
      
      // 상태 초기화
      onClose();
      setTitle('');
      setDescription('');
      setCategory('');
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error(error);
      alert('아이디어 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden border-2 border-pink-300 dark:border-pink-800 scale-in-center">
        <div className="bg-gradient-to-r from-pink-400 to-indigo-500 p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "10px 10px" }}></div>
          <h2 className="text-white font-headline font-black text-2xl relative z-10 drop-shadow-sm">새로운 아이디어 반짝! ✨</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">카테고리 태그</label>
            <input 
              type="text" 
              value={category} 
              onChange={e => setCategory(e.target.value)} 
              placeholder="예: 해커톤, 스터디, 메이커톤 (선택사항)" 
              className="w-full border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-2.5 font-bold focus:border-pink-400 dark:focus:border-pink-500 outline-none transition-colors shadow-sm"
              maxLength={10}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">어떤 아이디어인가요?</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="예: 귀여운 AI 페르소나 챗봇 만들기 🤖" 
              className="w-full border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 font-bold focus:border-pink-400 dark:focus:border-pink-500 outline-none transition-colors shadow-sm"
              maxLength={40}
              required 
            />
            {/* 힙한 이모티콘 선택 스토어 */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {emojis.map(emoji => (
                <button 
                  type="button" 
                  key={emoji} 
                  onClick={() => appendEmoji(emoji)} 
                  className="text-[16px] hover:scale-125 transition-transform active:scale-95 bg-slate-50 hover:bg-white dark:bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">자세히 들려주세요 (내용)</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="어떤 멋진 AI 프로젝트를 만들까요? (사용 스택이나 재미있는 기획을 적어주세요!)" 
              className="w-full border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl px-4 py-3 font-medium min-h-[120px] focus:border-indigo-400 dark:focus:border-indigo-500 outline-none transition-colors shadow-sm resize-none"
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">썸네일 사진 첨부 (선택, 최대 5MB)</label>
            <div className="flex items-center gap-4">
              <label className={`w-24 h-24 shrink-0 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${imagePreview ? 'border-pink-400 bg-pink-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800'}`}>
                <input type="file" accept="image/*" onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    if (file.size > 5 * 1024 * 1024) {
                      alert("사진 용량은 최대 5MB까지만 가능해요! 📸");
                      return;
                    }
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  }
                }} className="hidden" />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-slate-400">add_a_photo</span>
                    <span className="text-[10px] font-bold text-slate-400 mt-1">사진 추가</span>
                  </>
                )}
              </label>
              <div className="flex-1 text-[13px] font-bold text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                아이디어를 가장 잘 나타내는 상징적인 사진을 하나 넣어주세요! 바탕화면이나 스크랩북에 예쁜 폴라로이드 사진으로 걸리게 됩니다 📸
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-1">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black py-3.5 rounded-xl transition-colors">취소</button>
            <button type="submit" disabled={isSubmitting} className="flex-[2] bg-slate-900 border border-transparent dark:bg-white text-white dark:text-slate-900 hover:bg-gradient-to-r hover:from-pink-500 hover:to-indigo-500 hover:text-white hover:border-white transition-all font-black py-3.5 rounded-xl shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {isSubmitting ? '올리는 중...' : '등록하고 +50P 받기 💎'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
