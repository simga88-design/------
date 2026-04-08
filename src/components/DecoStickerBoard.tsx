'use client';

import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useUser } from '@/context/UserContext';

export interface Sticker {
  id: string;
  type: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  rotate: number; 
  scale: number;
  customUrl?: string;
}

const STICKER_TYPES = [
  { id: 'bow', icon: '🎀', config: "text-4xl drop-shadow-md hover:drop-shadow-xl" },
  { id: 'sparkle', icon: '✨', config: "text-4xl drop-shadow-sm hover:drop-shadow-xl text-yellow-400" },
  { id: 'heart', icon: '💖', config: "text-4xl drop-shadow-md hover:drop-shadow-xl" },
  { id: 'star_eyes', icon: '🤩', config: "text-4xl drop-shadow-md hover:drop-shadow-xl" },
  { id: 'bunny', icon: '🐰', config: "text-4xl drop-shadow-md hover:drop-shadow-xl" },
  { id: 'cherry', icon: '🍒', config: "text-4xl drop-shadow-md hover:drop-shadow-xl" },
  { id: 'butterfly', icon: '🦋', config: "text-4xl drop-shadow-md hover:drop-shadow-xl" },
  { id: 'cd', icon: '💿', config: "text-4xl drop-shadow-md hover:drop-shadow-xl animate-[spin_10s_linear_infinite]" },
  { id: 'headphone', icon: '🎧', config: "text-4xl drop-shadow-md hover:drop-shadow-xl" },
  { id: 'clover', icon: '🍀', config: "text-4xl drop-shadow-md hover:drop-shadow-xl" },
  { id: 'teddy', icon: '🧸', config: "text-4xl drop-shadow-md hover:drop-shadow-xl" },
  { id: 'tulip', icon: '🌷', config: "text-4xl drop-shadow-md hover:drop-shadow-xl" },
  { id: 'sunflower', icon: '🌻', config: "text-4xl drop-shadow-md hover:drop-shadow-xl" },
  { id: 'rainbow', icon: '🌈', config: "text-4xl drop-shadow-md hover:drop-shadow-xl" },
  { id: 'strawberry', icon: '🍓', config: "text-4xl drop-shadow-md hover:drop-shadow-xl" },
  { id: 'cake', icon: '🎂', config: "text-4xl drop-shadow-md hover:drop-shadow-xl" },
  { id: 'magic', icon: '🔮', config: "text-4xl drop-shadow-md hover:drop-shadow-xl" },
  { id: 'palette', icon: '🎨', config: "text-4xl drop-shadow-md hover:drop-shadow-xl" },
];

export default function DecoStickerBoard() {
  const { user, addPoints } = useUser();
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  
  // 드래그 상태 관리
  const [draggingId, setDraggingId] = useState<string | null>(null);
  
  // 커스텀 스티커 업로드 상태
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists() && docSnap.data().deco) {
        setStickers(docSnap.data().deco);
      }
    });
    return () => unsub();
  }, [user]);

  const saveStickers = async (newStickers: Sticker[]) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), { deco: newStickers });
  };

  const handleCustomStickerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      alert("커스텀 스티커는 2MB 이하여야 합니다!");
      return;
    }
    
    setIsUploading(true);
    try {
      const imageRef = ref(storage, `uploads/${user.uid}/custom_sticker_${Date.now()}`);
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);
      addSticker('custom_image', url);
    } catch (err) {
      console.error(err);
      alert("사진 스티커 업로드 실패!");
    } finally {
      setIsUploading(false);
    }
  };

  const addSticker = (typeId: string, customUrl?: string) => {
    if (stickers.length >= 40) {
      alert("스티커는 최대 40개까지만 붙일 수 있어요! 너무 많으면 다이어리가 무거워져요 💦");
      return;
    }
    const newSticker: Sticker = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      type: typeId,
      customUrl: customUrl || undefined,
      x: 50 + (Math.random() * 10 - 5), // 중앙 부근 랜덤
      y: 50 + (Math.random() * 10 - 5),
      rotate: Math.random() * 60 - 30, // -30 ~ 30도
      scale: 1 + Math.random() * 0.5, // 1.0 ~ 1.5배
    };
    const updated = [...stickers, newSticker];
    setStickers(updated);
    saveStickers(updated);
    addPoints(100); // 다꾸 스티커 부착 시 100P 획득 (무제한)
  };

  const removeSticker = (id: string) => {
    const updated = stickers.filter(s => s.id !== id);
    setStickers(updated);
    saveStickers(updated);
  };

  const handleScale = (id: string, delta: number) => {
    setStickers(prev => {
      const updated = prev.map(s => {
        if (s.id === id) {
          return { ...s, scale: Math.max(0.3, Math.min(s.scale + delta, 3.5)) };
        }
        return s;
      });
      saveStickers(updated);
      return updated;
    });
  };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    setDraggingId(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isEditing || !draggingId || !boardRef.current) return;
    
    const rect = boardRef.current.getBoundingClientRect();
    const px = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const py = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    
    const xPct = (px / rect.width) * 100;
    const yPct = (py / rect.height) * 100;

    setStickers(prev => prev.map(s => s.id === draggingId ? { ...s, x: xPct, y: yPct } : s));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingId) return;
    setDraggingId(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    // 드래그 종료 시 Firestore 저장
    saveStickers(stickers);
  };

  if (!user) return null;

  return (
    <>
      {/* 화면 전체를 덮는 투명 다꾸 보드 */}
      <div 
        ref={boardRef}
        className={`absolute inset-0 overflow-hidden z-[40] ${isEditing ? 'pointer-events-auto touch-none' : 'pointer-events-none'}`}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {stickers.map(sticker => {
          const typeDef = STICKER_TYPES.find(t => t.id === sticker.type) || STICKER_TYPES[0];
          return (
            <div
              key={sticker.id}
              className={`absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 transition-transform group ${isEditing ? 'pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-110' : 'pointer-events-none'}`}
              style={{
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                transform: `translate(-50%, -50%) rotate(${sticker.rotate}deg) scale(${sticker.scale})`,
                zIndex: draggingId === sticker.id ? 50 : 10
              }}
              onPointerDown={(e) => handlePointerDown(e, sticker.id)}
            >
              {sticker.type === 'custom_image' && sticker.customUrl ? (
                <img src={sticker.customUrl} alt="custom sticker" className="w-24 h-24 object-contain drop-shadow-lg" draggable={false} style={{ userSelect: 'none' }} />
              ) : (
                <span className={`text-5xl ${typeDef.config}`} style={{ userSelect: 'none' }}>
                  {typeDef.icon}
                </span>
              )}
              
              {isEditing && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeSticker(sticker.id); }}
                    className="absolute -top-3 -right-3 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-xl transition-all duration-200 z-20 hover:scale-125 hover:bg-red-600"
                    style={{ opacity: 0.9 }}
                    title="스티커 떼기"
                  >
                    <span className="material-symbols-outlined text-[16px] font-black">close</span>
                  </button>
                  <div className="absolute -bottom-8 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-lg rounded-full px-2 py-1 flex gap-1 z-20 border border-slate-200 dark:border-slate-700 pointer-events-auto items-center transition-all opacity-0 group-hover:opacity-100 group-active:opacity-100">
                    <button onClick={(e) => { e.stopPropagation(); handleScale(sticker.id, 0.2); }} className="w-7 h-7 flex items-center justify-center bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-slate-800 dark:text-slate-200 font-black text-lg shadow-inner" title="크게">+</button>
                    <button onClick={(e) => { e.stopPropagation(); handleScale(sticker.id, -0.2); }} className="w-7 h-7 flex items-center justify-center bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full text-slate-800 dark:text-slate-200 font-black text-lg shadow-inner" title="작게">-</button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* 다꾸 모드 토글 및 팔레트 (하단 플로팅) */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
        {isEditing && (
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-3xl shadow-2xl border-2 border-pink-200 dark:border-pink-800 mb-2 w-72 animate-in slide-in-from-bottom-5">
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2 border-b border-pink-100 dark:border-slate-700 pb-3">
              <span className="text-xl">🎨</span> 다꾸 스티커 팩
            </h4>
             <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto pr-1 pb-2 scrollbar-thin scrollbar-thumb-pink-300 dark:scrollbar-thumb-pink-700">
               <label 
                htmlFor="customStickerUpload"
                className={`w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900 border border-indigo-200 dark:border-indigo-700 hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-indigo-500 dark:text-indigo-300 cursor-pointer shadow-inner relative hover:bg-indigo-100 dark:hover:bg-indigo-800 shrink-0`}
                title="내 사진으로 스티커 만들기 (최대 2MB)"
              >
                {isUploading ? (
                  <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-2xl font-black">add_photo_alternate</span>
                )}
                <input type="file" accept="image/*" className="hidden" id="customStickerUpload" onChange={handleCustomStickerUpload} disabled={isUploading} />
              </label>
              
              {STICKER_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => addSticker(type.id)}
                  className={`w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-700 hover:bg-pink-100 border border-slate-200 dark:border-slate-600 hover:scale-110 active:scale-95 transition-all flex items-center justify-center text-3xl shrink-0 shadow-sm`}
                >
                  {type.icon}
                </button>
              ))}
            </div>
            <p className="text-[11px] font-bold text-slate-500 mt-4 text-center bg-slate-100 dark:bg-slate-900 py-2 rounded-xl">스티커를 클릭, 삭제, 확대/축소 해보세요!</p>
          </div>
        )}
        
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-2 px-6 py-4 rounded-full font-black text-white shadow-xl transition-all hover:scale-105 active:scale-95 ${isEditing ? 'bg-slate-800 hover:bg-slate-900' : 'bg-gradient-to-r from-pink-500 to-indigo-500 hover:shadow-pink-300/50'}`}
        >
          <span className="text-xl">
            {isEditing ? '✨' : '🎀'}
          </span>
          {isEditing ? '다꾸 끝내기' : '스티커 꾸미기 모드'}
        </button>
      </div>
    </>
  );
}
