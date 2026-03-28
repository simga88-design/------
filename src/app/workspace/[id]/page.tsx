'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useUser } from '@/context/UserContext';
import { Idea } from '@/components/IdeaCard';
import confetti from 'canvas-confetti';

interface Memo {
  id: string;
  text: string;
  author: string;
  assignee: string | null;
  status: 'todo' | 'in-progress' | 'done';
  createdAt: any;
}

interface Member {
  nickname: string;
  role?: string;
  joinedAt: any;
}

interface Resource {
  id: string;
  title: string;
  url: string;
  addedBy: string;
  createdAt: any;
}

interface TeamLog {
  id: string;
  text: string;
  author: string;
  createdAt: any;
}

interface WorkspaceComment {
  id: string;
  text: string;
  author: string;
  createdAt: any;
}

export default function WorkspacePage() {
  const params = useParams();
  const { profile, user, addPoints } = useUser();
  const workspaceId = (params?.id as string) || '';

  const [idea, setIdea] = useState<Idea | null>(null);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [comments, setComments] = useState<WorkspaceComment[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [teamLogs, setTeamLogs] = useState<TeamLog[]>([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("기획/PM");
  const [newResourceTitle, setNewResourceTitle] = useState("");
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [newTeamLog, setNewTeamLog] = useState("");
  const [newMemo, setNewMemo] = useState("");
  const [newComment, setNewComment] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [resultImageFile, setResultImageFile] = useState<File | null>(null);
  const [resultImagePreview, setResultImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleResultImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("앗! 자랑할 사진 용량은 최대 5MB까지만 가능해요! 📸");
        return;
      }
      setResultImageFile(file);
      setResultImagePreview(URL.createObjectURL(file));
    }
  };
  
  const isMember = members.some(m => m.nickname === profile?.nickname);
  const isIdeaOwner = profile && idea && (idea.authorName === profile.nickname || idea.author === profile.nickname);
  const canEdit = isMember || isIdeaOwner;
  const totalTasks = memos.length;
  const doneTasks = memos.filter(m => m.status === 'done').length;
  const progressPercent = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  // 폭죽 100% 달성 시 한 번만 터지게 하는 로직
  const hasCelebrated = useRef(false);

  useEffect(() => {
    if (progressPercent === 100 && totalTasks > 0 && !hasCelebrated.current) {
      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#f472b6', '#818cf8', '#34d399', '#fbbf24']
      });
      hasCelebrated.current = true;
    } else if (progressPercent < 100) {
      hasCelebrated.current = false;
    }
  }, [progressPercent, totalTasks]);

  useEffect(() => {
    if (!workspaceId) return;
    const fetchWorkspace = async () => {
      const wsRef = doc(db, 'workspaces', workspaceId);
      const wsSnap = await getDoc(wsRef);
      if (wsSnap.exists()) {
        const originalId = wsSnap.data().originalIdeaId;
        const ideaRef = doc(db, 'ideas', originalId);
        const ideaSnap = await getDoc(ideaRef);
        if (ideaSnap.exists()) setIdea({ id: ideaSnap.id, ...ideaSnap.data() } as Idea);
      }
    };
    fetchWorkspace();
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    
    // 1. 칸반 태스크 카드 구독
    const qMemos = query(collection(db, `workspaces/${workspaceId}/memos`), orderBy('createdAt', 'asc'));
    const unsubMemos = onSnapshot(qMemos, (snapshot) => {
      setMemos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Memo)));
    });

    // 2. 합류 멤버 구독
    const qMembers = query(collection(db, `workspaces/${workspaceId}/members`), orderBy('joinedAt', 'asc'));
    const unsubMembers = onSnapshot(qMembers, (snapshot) => {
      setMembers(snapshot.docs.map(doc => doc.data() as Member));
    });

    // 3. 방명록/댓글 구독
    const qComments = query(collection(db, `workspaces/${workspaceId}/comments`), orderBy('createdAt', 'desc'));
    const unsubComments = onSnapshot(qComments, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkspaceComment)));
    });

    const qResources = query(collection(db, `workspaces/${workspaceId}/resources`), orderBy('createdAt', 'desc'));
    const unsubResources = onSnapshot(qResources, (snapshot) => {
      setResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource)));
    });

    const qTeamLogs = query(collection(db, `workspaces/${workspaceId}/teamLogs`), orderBy('createdAt', 'asc'));
    const unsubTeamLogs = onSnapshot(qTeamLogs, (snapshot) => {
      setTeamLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamLog)));
    });

    return () => { unsubMemos(); unsubMembers(); unsubComments(); unsubResources(); unsubTeamLogs(); };
  }, [workspaceId]);

  const handleJoinClick = () => {
    if (!profile) return alert("앗! 로그인이 필요한 기능입니다. 프로필 탭에서 3초 만에 구글로 가입해주세요! 👋");
    setShowRoleModal(true);
  };

  const confirmJoin = async () => {
    if (!profile || !workspaceId) return;
    await setDoc(doc(db, `workspaces/${workspaceId}/members`, profile.nickname), {
      nickname: profile.nickname,
      role: selectedRole,
      joinedAt: serverTimestamp()
    });
    setShowRoleModal(false);
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return alert("프로젝트 멤버만 등록할 수 있습니다.");
    if (!newResourceTitle.trim() || !newResourceUrl.trim() || !workspaceId) return;
    await addDoc(collection(db, `workspaces/${workspaceId}/resources`), {
      title: newResourceTitle,
      url: newResourceUrl,
      addedBy: profile!.nickname,
      createdAt: serverTimestamp()
    });
    setNewResourceTitle("");
    setNewResourceUrl("");
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!canEdit) return alert("멤버만 삭제할 수 있습니다.");
    if (confirm("정규 리소스를 삭제할까요?")) {
      await deleteDoc(doc(db, `workspaces/${workspaceId}/resources`, resourceId));
    }
  };

  const handleAddTeamLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return alert("프로젝트 멤버만 작성할 수 있습니다.");
    if (!newTeamLog.trim() || !workspaceId) return;
    await addDoc(collection(db, `workspaces/${workspaceId}/teamLogs`), {
      text: newTeamLog,
      author: profile!.nickname,
      createdAt: serverTimestamp()
    });
    setNewTeamLog("");
  };

  const syncToIdea = async (updatedMemos: Memo[]) => {
    if (!idea) return;
    const tt = updatedMemos.length;
    const dt = updatedMemos.filter(m => m.status === 'done').length;
    const p = tt === 0 ? 0 : Math.round((dt / tt) * 100);
    await updateDoc(doc(db, 'ideas', idea.id), { progress: p });
  };

  const handleAddMemo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return alert("앗! 로그인이 필요한 기능입니다. 프로필 탭에서 3초 만에 구글로 가입해주세요! 👋");
    if (!canEdit) return alert("기획에 합류한 멤버만 태스크를 추가할 수 있습니다! 💖");
    if (!newMemo.trim() || !workspaceId) return;
    
    const newMemoObj = {
      text: newMemo,
      author: profile.nickname,
      assignee: null,
      status: 'todo' as const,
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, `workspaces/${workspaceId}/memos`), newMemoObj);
    setNewMemo("");
    syncToIdea([...memos, { ...newMemoObj, id: 'temp' }]);
  };

  const updateMemoStatus = async (id: string, newStatus: string) => {
    if (!canEdit) return alert("프로젝트 멤버만 상태를 변경할 수 있습니다.");
    await updateDoc(doc(db, `workspaces/${workspaceId}/memos`, id), { status: newStatus });
    syncToIdea(memos.map(m => m.id === id ? { ...m, status: newStatus as any } : m));
  };

  const updateMemoAssignee = async (id: string, assignee: string | null) => {
    if (!canEdit) return alert("프로젝트 멤버만 담당자를 배정할 수 있습니다.");
    await updateDoc(doc(db, `workspaces/${workspaceId}/memos`, id), { assignee });
  };

  const handleDeleteMemo = async (memoId: string) => {
    if (!canEdit) return alert("멤버만 삭제할 수 있습니다.");
    if (confirm('이 포스트잇을 떼어낼까요? 🗑️')) {
      await deleteDoc(doc(db, `workspaces/${workspaceId}/memos`, memoId));
      syncToIdea(memos.filter(m => m.id !== memoId));
    }
  };

  const handleEditMemo = async (memoId: string, currentText: string) => {
    if (!canEdit) return alert("멤버만 수정할 수 있습니다.");
    const newText = prompt('포스트잇 내용을 수정하세요:', currentText);
    if (newText && newText.trim() !== currentText) {
      await updateDoc(doc(db, `workspaces/${workspaceId}/memos`, memoId), { text: newText.trim() });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return alert("앗! 로그인이 필요한 기능입니다.");
    if (!newComment.trim() || !workspaceId) return;
    await addDoc(collection(db, `workspaces/${workspaceId}/comments`), {
      text: newComment,
      author: profile.nickname,
      createdAt: serverTimestamp()
    });
    setNewComment("");
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !idea || isSubmitting) return;
    if (!canEdit) return alert("프로젝트 멤버만 결과물을 제출할 수 있습니다.");
    if (!resultUrl) return alert("결과물을 확인할 수 있는 링크(URL)를 입력해주세요!");
    setIsSubmitting(true);
    try {
      let uploadedResultImageUrl = null;
      if (resultImageFile && user) {
        const imageRef = ref(storage, `uploads/${user.uid}/result_${Date.now()}`);
        await uploadBytes(imageRef, resultImageFile);
        uploadedResultImageUrl = await getDownloadURL(imageRef);
      }

      await updateDoc(doc(db, 'ideas', idea.id), {
        isCompleted: true,
        resultUrl: resultUrl.trim(),
        resultImageUrl: uploadedResultImageUrl,
        progress: 100
      });
      // 임시로 상태 업데이트 (화면 즉시 반영)
      setIdea({ ...idea, isCompleted: true, resultUrl: resultUrl.trim(), resultImageUrl: uploadedResultImageUrl || undefined });
      addPoints(200);
      alert("🎉 전설의 시작입니다! 결과물 등록이 완료되었고 +200P가 지급되었습니다!");
    } catch(err) {
      alert("제출 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const MemoCard = ({ memo }: { memo: Memo }) => (
    <div className={`p-4 rounded-xl shadow-sm border hover:shadow-lg transition-all group bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 flex flex-col relative`}>
      
      {/* 수정/삭제 버튼 (본인 작성 포스트잇 한정) */}
      {profile?.nickname === memo.author && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-md shadow-sm border border-slate-100 dark:border-slate-600">
          <button onClick={() => handleEditMemo(memo.id, memo.text)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition-colors">
            <span className="material-symbols-outlined text-[13px]">edit</span>
          </button>
          <button onClick={() => handleDeleteMemo(memo.id)} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
            <span className="material-symbols-outlined text-[13px]">delete</span>
          </button>
        </div>
      )}

      <p className="text-slate-800 dark:text-slate-200 font-bold text-[13px] leading-relaxed mb-3 mt-1 flex-grow break-words">{memo.text}</p>
      
      {/* 담당자 섹션 */}
      <div className="flex items-center justify-between mt-auto border-t border-slate-100 dark:border-slate-700 pt-3 text-xs">
        <div className="flex items-center gap-1">
          {memo.assignee ? (
            <span className="bg-gradient-to-r from-pink-100 to-indigo-100 text-indigo-700 dark:from-pink-900/50 dark:to-indigo-900/50 dark:text-pink-300 font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span> {memo.assignee}
            </span>
          ) : (
            <button 
              onClick={() => {
                if (!profile) return alert("앗! 로그인이 필요한 기능입니다. 프로필 탭에서 가입해주세요!");
                if (!canEdit) return alert("기획에 합류한 멤버만 담당자를 배정할 수 있습니다.");
                updateMemoAssignee(memo.id, profile.nickname);
              }} 
              className="text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-pink-400 font-bold flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[12px]">person_add</span> 담당자 배정
            </button>
          )}
        </div>
      </div>

      {/* 칸반 상태 컨트롤 */}
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
        <button 
          onClick={() => updateMemoStatus(memo.id, memo.status === 'done' ? 'in-progress' : 'todo')}
          disabled={memo.status === 'todo'}
          className={`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded-md transition-colors ${memo.status !== 'todo' ? 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700' : 'text-transparent cursor-default'}`}
        >
          ◀ 이전
        </button>
        <button 
          onClick={() => updateMemoStatus(memo.id, memo.status === 'todo' ? 'in-progress' : 'done')}
          disabled={memo.status === 'done'}
          className={`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded-md transition-colors ${memo.status !== 'done' ? 'text-indigo-600 dark:text-pink-400 hover:bg-indigo-50 dark:hover:bg-pink-900/30' : 'text-transparent cursor-default'}`}
        >
          진행 ▶
        </button>
      </div>
    </div>
  );

  return (
    <main className="pt-24 pb-32 px-4 sm:px-6 max-w-7xl mx-auto relative min-h-screen overflow-x-hidden">
      {/* 역할 선택 모달 */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border-4 border-pink-400">
            <h3 className="text-2xl font-black mb-2 text-center text-slate-900 dark:text-white">역할을 선택해 주세요!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">프로젝트에서 기여할 직무를 골라주세요. 💖</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {['기획/PM', '디자인', '프론트엔드', '백엔드', '마케팅', '기타'].map(role => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`py-3 rounded-xl font-bold border-2 transition-all ${selectedRole === role ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-pink-300 shadow-md' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  {role}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowRoleModal(false)} className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200">취소</button>
              <button onClick={confirmJoin} className="flex-1 py-3 px-4 rounded-xl font-black bg-pink-500 text-white hover:bg-pink-600 shadow-md">합류 완료 🚀</button>
            </div>
          </div>
        </div>
      )}

      {/* 키치 데코레이션 */}
      <div className="absolute top-20 left-4 md:left-12 opacity-60 rotate-[-15deg] pointer-events-none z-0">
        <span className="material-symbols-outlined text-pink-400 text-6xl drop-shadow-md" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
      </div>
      <div className="absolute top-60 right-4 md:right-16 opacity-50 rotate-[20deg] pointer-events-none z-0 hidden md:block">
        <span className="material-symbols-outlined text-indigo-400 text-7xl drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
      </div>
      <div className="absolute top-[600px] left-5 opacity-40 rotate-[-10deg] pointer-events-none z-0 hidden lg:block">
        <span className="material-symbols-outlined text-rose-400 text-5xl drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>music_note</span>
      </div>

      <div className="text-center mb-10 relative z-10 flex flex-col items-center">
        <div className="inline-block relative mt-4">
          <h1 className="font-headline text-5xl md:text-6xl mb-4 font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm sticker-rotate-left">
            다꾸 프로젝트 보드 🎨
          </h1>
          <span className="absolute -top-6 -right-8 material-symbols-outlined text-yellow-400 text-4xl animate-bounce" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
        </div>
        <p className="text-slate-800 font-bold text-lg bg-white/60 px-6 py-2 rounded-full backdrop-blur-md border border-pink-200/50 shadow-sm mt-2">
          연습실의 치열한 땀방울을 기록하세요!
        </p>
      </div>

      {idea && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-md border-4 border-dashed border-pink-300 dark:border-pink-800/50 mb-10 max-w-3xl mx-auto relative overflow-hidden group rotate-1">
          {/* 테이프 데코 */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-8 bg-white/60 backdrop-blur-sm rotate-[-3deg] border border-slate-200/50 shadow-sm rounded-sm z-10"></div>
          
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-pink-100 dark:bg-pink-900/40 rounded-full blur-2xl group-hover:bg-pink-200 transition-colors"></div>
          <h2 className="text-sm font-black text-pink-600 dark:text-pink-400 mb-3 font-headline tracking-widest flex items-center gap-1 bg-pink-50 dark:bg-pink-900/50 inline-block px-3 py-1 rounded-full border border-pink-100 dark:border-pink-800">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span> 원본 아이디어
          </h2>
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-4 leading-snug drop-shadow-sm relative z-10">{idea.title}</h3>
          <p className="text-slate-700 dark:text-slate-300 font-bold text-base leading-relaxed bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-xl relative z-10 border border-slate-100 dark:border-slate-800">{idea.description}</p>
        </div>
      )}

      {/* Team Building (Join) 구역 */}
      <div className="bg-white/60 dark:bg-[#1a1625]/60 backdrop-blur-md p-4 rounded-2xl mb-8 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex-1">
          <h3 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-3 text-sm">
            <span className="material-symbols-outlined text-indigo-500">groups</span> 참여 중인 콜라보레이터 ({members.length}명)
          </h3>
          <div className="flex flex-wrap gap-2">
            {members.length === 0 && <span className="text-xs text-slate-400 font-bold">아직 합류한 멤버가 없습니다. 첫 멤버가 되어보세요!</span>}
            {members.map(m => (
              <span key={m.nickname} className="flex items-center gap-1 bg-gradient-to-r from-pink-500 to-indigo-500 text-white px-3 py-1.5 rounded-full text-[12px] font-black shadow-md border border-white/20">
                <span className="bg-white/20 px-1.5 py-0.5 rounded-sm text-[10px] uppercase tracking-wider">{m.role || '팀원'}</span>
                {m.nickname}
              </span>
            ))}
          </div>
        </div>
        {!isMember && (
          <button 
            onClick={handleJoinClick}
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black px-6 py-3 rounded-full shadow-lg border-2 border-transparent hover:scale-105 hover:bg-gradient-to-r hover:from-pink-500 hover:to-indigo-500 hover:border-white transition-all whitespace-nowrap"
          >
            기획에 합류하기 💖
          </button>
        )}
      </div>

      {/* 리소스 아카이브 보드 (Resource Links) */}
      <div className="mb-10 bg-white/40 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm backdrop-blur-sm">
        <h3 className="font-headline font-black text-xl mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <span className="material-symbols-outlined text-pink-500">push_pin</span> 핵심 리소스 아카이브 🔗
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
          {resources.length === 0 && (
             <div className="col-span-full py-4 text-sm text-slate-400 font-bold mb-2">등록된 리소스가 없습니다. Figma, Github, Notion 등의 링크를 핀해보세요!</div>
          )}
          {resources.map(res => (
            <div key={res.id} className="group flex flex-col justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 shadow-sm hover:border-indigo-300 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <a href={res.url} target="_blank" rel="noopener noreferrer" className="font-bold text-slate-800 dark:text-white truncate pr-2 hover:text-indigo-500 hover:underline">{res.title}</a>
                {canEdit && (
                  <button onClick={() => handleDeleteResource(res.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-[10px] text-slate-400 font-bold max-w-[150px] truncate">{res.url}</span>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-500 font-bold">{res.addedBy}</span>
              </div>
            </div>
          ))}
        </div>
        {canEdit && (
          <form onSubmit={handleAddResource} className="flex flex-col xl:flex-row gap-2">
            <input type="text" value={newResourceTitle} onChange={e=>setNewResourceTitle(e.target.value)} placeholder="링크 제목 (예: 기획 노션, 깃허브)" className="xl:w-1/3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-sm focus:outline-none focus:border-indigo-400 transition-colors shadow-inner" />
            <input type="url" value={newResourceUrl} onChange={e=>setNewResourceUrl(e.target.value)} placeholder="URL 주소 붙여넣기 (https://...)" className="flex-1 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-sm focus:outline-none focus:border-pink-400 transition-colors shadow-inner" />
            <button type="submit" disabled={!newResourceTitle || !newResourceUrl} className="bg-indigo-500 text-white font-black px-6 py-2 rounded-xl disabled:opacity-50 hover:bg-indigo-600 transition-colors shadow-sm whitespace-nowrap flex items-center justify-center gap-1"><span className="material-symbols-outlined text-[16px]">add_link</span> 추가하기</button>
          </form>
        )}
      </div>

      {/* 진척도 (Progress Bar) */}
      <div className="mb-10 w-full bg-white/40 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800 backdrop-blur-sm shadow-sm">
        <div className="flex justify-between items-end mb-3">
          <div className="flex flex-col">
            <h3 className="font-headline font-black text-xl text-slate-800 dark:text-slate-200">프로젝트 진척도</h3>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Milestone Progress</span>
          </div>
          <span className="font-black text-4xl text-indigo-500 dark:text-pink-400 drop-shadow-sm">{progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-4 shadow-inner overflow-hidden border border-slate-300/50 dark:border-slate-700 relative">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: "linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)", backgroundSize: "1rem 1rem" }}></div>
          </div>
        </div>
      </div>

      {/* 3단 칸반(Kanban) 보드 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        
        {/* TO DO 칼럼 */}
        <div className="bg-slate-100/50 dark:bg-[#1a1325]/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/50 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">
            <h3 className="font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-sm uppercase tracking-widest">
              <span className="w-3 h-3 rounded-full bg-slate-400 shadow-sm border border-slate-300"></span> 할 일 (To-Do)
            </h3>
            <span className="bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full text-xs font-black text-slate-500 border border-slate-200 dark:border-slate-700">{memos.filter(m => m.status === 'todo').length}</span>
          </div>
          <div className="flex flex-col gap-4 flex-grow">
            {memos.filter(m => m.status === 'todo').map(memo => <MemoCard key={memo.id} memo={memo} />)}
            
            {/* 새 태스크 바텀 고정 입력창 */}
            {canEdit ? (
              <form onSubmit={handleAddMemo} className="mt-auto pt-2">
                <input 
                  type="text" 
                  value={newMemo}
                  onChange={e => setNewMemo(e.target.value)}
                  placeholder="+ 달성할 태스크 추가..."
                  className="w-full bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-indigo-400 dark:text-white dark:focus:border-pink-500 transition-colors shadow-sm"
                />
              </form>
            ) : (
              <div className="mt-auto pt-2">
                <div className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-slate-400 dark:text-slate-500 text-center">
                  프로젝트에 합류해야 작성할 수 있습니다
                </div>
              </div>
            )}
          </div>
        </div>

        {/* IN PROGRESS 칼럼 */}
        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/30 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 border-b border-indigo-200 dark:border-indigo-800/50 pb-3">
            <h3 className="font-black text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 text-sm uppercase tracking-widest">
              <span className="w-3 h-3 rounded-full bg-indigo-400 shadow-sm border border-indigo-300 animate-pulse"></span> 진행 중 (Doing)
            </h3>
            <span className="bg-white dark:bg-indigo-900 px-2.5 py-0.5 rounded-full text-xs font-black text-indigo-500 border border-indigo-100 dark:border-indigo-800">{memos.filter(m => m.status === 'in-progress').length}</span>
          </div>
          <div className="flex flex-col gap-4">
            {memos.filter(m => m.status === 'in-progress').map(memo => <MemoCard key={memo.id} memo={memo} />)}
          </div>
        </div>

        {/* DONE 칼럼 */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/30 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 border-b border-emerald-200 dark:border-emerald-800/50 pb-3">
            <h3 className="font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 text-sm uppercase tracking-widest">
              <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm border border-emerald-300"></span> 완료 (Done)
            </h3>
            <span className="bg-white dark:bg-emerald-900 px-2.5 py-0.5 rounded-full text-xs font-black text-emerald-500 border border-emerald-100 dark:border-emerald-800">{memos.filter(m => m.status === 'done').length}</span>
          </div>
          <div className="flex flex-col gap-4">
            {memos.filter(m => m.status === 'done').map(memo => <MemoCard key={memo.id} memo={memo} />)}
          </div>
        </div>

      </div>

      {/* 독립된 공간: 팀 전용 개발 로그 (회의록) */}
      <div className="mb-14 border-[3px] border-indigo-100 dark:border-indigo-900/50 rounded-3xl overflow-hidden shadow-sm bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 p-5 border-b border-indigo-100 dark:border-indigo-900/50 flex justify-between items-center">
          <h3 className="font-headline font-black text-xl text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
            <span className="material-symbols-outlined">forum</span> 팀 활동 로그 / 회의록📝
          </h3>
          <span className="text-xs font-bold text-indigo-500 bg-white dark:bg-slate-900 px-3 py-1 rounded-full shadow-sm">멤버 전용 읽기/쓰기</span>
        </div>
        
        <div className="p-6 flex flex-col gap-4 max-h-[350px] overflow-y-auto">
          {teamLogs.length === 0 && <p className="text-center text-slate-400 font-bold py-8 text-sm">아직 활동 기록이 없습니다. 팀원들과 업무 진행 상황을 핑퐁하세요! 🏓</p>}
          {teamLogs.map(log => (
            <div key={log.id} className="flex gap-3">
              <div className="w-9 h-9 flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center font-black text-indigo-600 dark:text-pink-300 text-sm">{log.author.slice(0,1)}</div>
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-[13px]">{log.author}</span>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-2 rounded-sm">{log.createdAt?.toDate().toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 rounded-2xl rounded-tl-sm text-[14px] font-bold text-slate-800 dark:text-slate-200 whitespace-pre-wrap shadow-sm leading-relaxed">{log.text}</div>
              </div>
            </div>
          ))}
        </div>
        
        {canEdit ? (
          <div className="p-4 bg-white/80 dark:bg-slate-900/80 border-t border-indigo-100 dark:border-slate-800 backdrop-blur-md">
             <form onSubmit={handleAddTeamLog} className="flex gap-2 relative">
               <textarea value={newTeamLog} onChange={e=>setNewTeamLog(e.target.value)} rows={1} placeholder="오늘의 작업 내용이나 회의록을 간략히 남겨주세요." className="flex-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:border-indigo-400 resize-none shadow-inner" onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddTeamLog(e as unknown as React.FormEvent); } }} />
               <button type="submit" disabled={!newTeamLog.trim()} className="bg-indigo-500 text-white rounded-xl px-4 flex items-center justify-center disabled:opacity-50 hover:bg-indigo-600 transition-colors shadow-md w-14"><span className="material-symbols-outlined text-xl">send</span></button>
             </form>
          </div>
        ) : (
          <div className="p-5 bg-slate-50 dark:bg-slate-900 border-t border-indigo-100 dark:border-slate-800 text-center font-bold text-sm text-slate-400">
            🔒 기획에 합류한 프로젝트 팀원만 새 로그를 작성할 수 있습니다.
          </div>
        )}
      </div>

      {/* 결과물 제출 (Submission) 축하 섹션 */}
      {progressPercent === 100 && totalTasks > 0 && idea && !idea.isCompleted && (
        <div className="bg-gradient-to-r from-pink-500 to-indigo-500 rounded-3xl p-1 mb-10 shadow-[0_10px_30px_rgba(236,72,153,0.3)] animate-in slide-in-from-bottom-5 duration-700">
          <div className="bg-white dark:bg-slate-900 rounded-[22px] p-8 text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: "radial-gradient(circle, rgba(236,72,153,0.1) 1px, transparent 1px)", backgroundSize: "10px 10px" }}></div>
             <h2 className="text-3xl font-black font-headline text-slate-900 dark:text-white mb-3 relative z-10">🎉 대망의 결과물을 자랑할 시간!</h2>
             <p className="text-slate-600 dark:text-slate-300 font-bold mb-8 relative z-10">모든 태스크가 완료되었습니다! 결과물(서비스 배포된 URL, 레포지토리, 노션 등) 링크와 예쁜 스크린샷 1장을 남기고 즉시 <strong className="text-pink-500">+200P</strong>를 받으세요!</p>
             <form onSubmit={handleSubmitResult} className="max-w-xl mx-auto flex flex-col gap-4 relative z-10">
               {/* 사진 썸네일 업로드 */}
               <label className={`w-full h-40 rounded-2xl border-[3px] border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden relative ${resultImagePreview ? 'border-pink-400 bg-pink-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800'}`}>
                 <input type="file" accept="image/*" onChange={handleResultImageChange} className="hidden" />
                 {resultImagePreview ? (
                   <img src={resultImagePreview} alt="Preview" className="w-full h-full object-cover" />
                 ) : (
                   <div className="text-center group bg-white/60 dark:bg-black/40 backdrop-blur-md px-6 py-4 rounded-xl border border-slate-200 dark:border-slate-700">
                     <span className="material-symbols-outlined text-pink-500 text-4xl mb-1 group-hover:scale-125 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>add_photo_alternate</span>
                     <p className="text-[15px] font-black text-slate-600 dark:text-slate-300 flex items-center justify-center"><span className="material-symbols-outlined text-sm">rocket_launch</span> 멋진 결과 화면 캡처 업로드 (5MB)</p>
                   </div>
                 )}
               </label>
               <input 
                 type="url" 
                 value={resultUrl} 
                 onChange={e=>setResultUrl(e.target.value)} 
                 required 
                 placeholder="예: https://my-awesome-app.vercel.app" 
                 className="w-full border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3.5 font-bold focus:border-pink-500 dark:focus:border-pink-500 outline-none transition-colors" 
               />
               <button 
                 type="submit" 
                 disabled={isSubmitting} 
                 className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-xl font-black text-lg hover:bg-gradient-to-r hover:from-pink-500 hover:to-indigo-500 hover:text-white hover:border-transparent transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 border-2 border-transparent"
               >
                 {isSubmitting ? '제출 중...' : '결과물 제출 등록하기 🚀'}
               </button>
             </form>
          </div>
        </div>
      )}

      {/* 이미 제출 완료된 상태 안내 */}
      {idea?.isCompleted && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-pink-300 dark:border-pink-800 rounded-3xl p-8 mb-10 text-center animate-in fade-in duration-500">
          <h2 className="text-2xl font-black font-headline text-pink-600 dark:text-pink-400 mb-4">✨ 이미 자랑스러운 결과물이 등록된 프로젝트입니다 ✨</h2>
          <a href={idea?.resultUrl || '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300 px-6 py-3 rounded-full font-black hover:scale-105 transition-transform shadow-sm">
             결과물 보러가기 구경 🚀
          </a>
        </div>
      )}

      {/* 🚀 응원 한마디 / 의견 남기기 (방명록) */}
      <div className="max-w-4xl mx-auto mt-16 relative z-10 border-t-4 border-dashed border-slate-200 dark:border-slate-800 pt-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-pink-500 text-3xl">chat_bubble</span> 피드백 라운지
          </h3>
          <span className="bg-pink-100 text-pink-600 font-black px-3 py-1 rounded-full text-sm">{comments.length}개의 멘션</span>
        </div>

        <form onSubmit={handleAddComment} className="mb-8 flex gap-3 relative flex-col md:flex-row">
          <div className="hidden md:block absolute -left-8 top-1/2 -translate-y-1/2 material-symbols-outlined text-indigo-400 text-4xl -rotate-12 opacity-40 z-0" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</div>
          <input 
            type="text" 
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="제안, 응원 메시지, 혹은 아이디어를 남겨보세요! 💖"
            className="flex-1 bg-white dark:bg-slate-800 border-[3px] border-slate-200 dark:border-slate-700 rounded-2xl md:rounded-full px-6 py-4 font-bold text-slate-900 dark:text-white focus:border-pink-400 dark:focus:border-pink-500 outline-none transition-all shadow-sm z-10"
          />
          <button type="submit" disabled={!newComment.trim()} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-xl md:rounded-full font-black hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-md z-10 whitespace-nowrap border-[3px] border-transparent hover:border-pink-400">
            의견 쏘기 ✨
          </button>
        </form>

        <div className="flex flex-col gap-4">
          {comments.map(comment => (
            <div key={comment.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-4 md:p-5 rounded-2xl md:rounded-full border-2 border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center gap-2 md:gap-4 group hover:border-pink-300 dark:hover:border-pink-700 transition-colors pointer-events-auto">
              <div className="flex items-center gap-2 md:w-32 lg:w-48 shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-400 to-indigo-500 flex items-center justify-center text-white font-black text-xs shadow-inner">
                  {comment.author.slice(0, 1)}
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300 truncate text-sm">{comment.author}</span>
              </div>
              <p className="text-slate-800 dark:text-slate-200 font-bold flex-1 break-words px-2">{comment.text}</p>
              <div className="text-xs font-bold text-slate-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block pl-4 border-l border-slate-200 dark:border-slate-700">
                {comment.createdAt?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-center py-12 text-slate-400 font-bold bg-white/40 dark:bg-slate-800/40 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-4xl mb-2 text-slate-300 block">maps_ugc</span>
              아직 남겨진 피드백이나 멘션이 없어요!<br/>자유롭게 의견을 무한대로 남겨주세요 🚀
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
