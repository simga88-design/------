'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

const values = [
  {
    icon: 'emoji_objects',
    label: 'Collect',
    title: '작은 생각을 놓치지 않기',
    body: '정답을 내기 전에 먼저 기록하고, 동료의 시선으로 가능성을 넓힙니다.',
  },
  {
    icon: 'forum',
    label: 'Discuss',
    title: '공감과 피드백으로 고르기',
    body: '공감 수와 댓글은 다음 실험으로 넘어갈 아이디어를 고르는 가벼운 신호가 됩니다.',
  },
  {
    icon: 'rocket_launch',
    label: 'Make',
    title: '작업방에서 실행하기',
    body: '할 일, 자료, 메모, 결과물을 한곳에 모아 실제 프로젝트로 발전시킵니다.',
  },
];

const workflow = [
  ['edit_note', '아이디어 작성', '제목과 설명을 남기고 필요한 이미지를 붙입니다.'],
  ['favorite', '공감 확인', '친구들의 반응을 보며 실행할 제안을 고릅니다.'],
  ['task_alt', '작업방 완성', '역할을 나누고 결과물을 등록해 기록으로 남깁니다.'],
];

export default function Home() {
  const router = useRouter();
  const { user, login } = useUser();

  const handleStart = async () => {
    if (!user) await login();
    router.push('/ideas');
  };

  return (
    <main className="pt-24 pb-32 px-4 sm:px-6 max-w-6xl mx-auto space-y-8">
      <section className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-5 items-stretch">
        <div className="bg-[#fffdf8]/90 dark:bg-slate-950/85 border border-[#e6dfd3] dark:border-slate-800 rounded-lg p-6 md:p-10 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-lg bg-[#fff1ef] dark:bg-red-950/25 text-[#e85d55] px-3 py-1.5 text-sm font-black mb-6">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            복지메이커스 스튜디오
          </div>
          <h1 className="text-4xl md:text-6xl font-headline font-black tracking-tight text-[#172033] dark:text-white leading-tight mb-5">
            아이디어를 꺼내고
            <br />
            함께 완성하는 공간
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed font-bold">
            아이디어 나눔터는 동아리 안의 제안, 공감, 작업방, 결과물을 한 흐름으로 이어주는 메이커스 협업 도구입니다.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#172033] text-white rounded-lg font-headline font-black text-base shadow-sm hover:bg-slate-800 active:scale-[0.98] transition-all"
            >
              {user ? '아이디어 보러 가기' : 'Google로 시작하기'}
              <span className="material-symbols-outlined text-[19px]">arrow_forward</span>
            </button>
            <button
              type="button"
              onClick={() => router.push('/records')}
              className="inline-flex items-center gap-2 px-5 py-3.5 bg-white/80 dark:bg-slate-950/80 text-[#172033] dark:text-slate-100 border border-[#e6dfd3] dark:border-slate-800 rounded-lg font-black hover:border-[#139c8f]/60 transition-colors"
            >
              <span className="material-symbols-outlined text-[19px]">auto_stories</span>
              내 기록 보기
            </button>
          </div>
        </div>

        <div className="bg-[#172033] text-white rounded-lg p-6 md:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-sm font-black text-[#f0b429] mb-3">Studio Flow</p>
            <h2 className="text-2xl md:text-3xl font-headline font-black mb-4">좋은 제안은 흐름이 있을 때 자랍니다</h2>
            <p className="text-slate-300 text-sm leading-relaxed font-medium">
              장식보다 구조를, 경쟁보다 실행을 중심에 둔 공간으로 정리해가고 있습니다.
            </p>
          </div>
          <div className="mt-8 space-y-3">
            {workflow.map(([icon, title, body], index) => (
              <div key={title} className="flex gap-3 rounded-lg bg-white/6 border border-white/10 p-3">
                <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#7dd3c7] text-[19px]">{icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400">STEP {index + 1}</span>
                    <h3 className="font-black text-sm">{title}</h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {values.map((item) => (
          <article key={item.title} className="bg-[#fffdf8]/90 dark:bg-slate-950/85 border border-[#e6dfd3] dark:border-slate-800 rounded-lg p-6 shadow-sm">
            <div className="w-11 h-11 bg-[#edf8f6] dark:bg-teal-950/30 rounded-lg flex items-center justify-center mb-5 text-[#139c8f]">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
            </div>
            <p className="text-xs font-black tracking-widest text-[#e85d55] uppercase mb-2">{item.label}</p>
            <h2 className="font-headline font-black text-xl text-[#172033] dark:text-white mb-2">{item.title}</h2>
            <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">{item.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
