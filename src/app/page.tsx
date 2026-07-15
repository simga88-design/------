'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

const values = [
  {
    icon: 'emoji_objects',
    label: '생각 기록',
    title: '작게 떠오른 생각도 놓치지 않기',
    body: '정답을 찾기보다 먼저 적어두고, 다른 사람의 시선으로 조금씩 다듬습니다.',
  },
  {
    icon: 'groups',
    label: '함께 성장',
    title: '공감과 댓글로 방향 잡기',
    body: '좋은 아이디어는 혼자 완성되지 않습니다. 공감과 피드백이 다음 단계를 만듭니다.',
  },
  {
    icon: 'rocket_launch',
    label: '실행 연결',
    title: '작업방에서 프로젝트로 전환',
    body: '가능성이 보이는 아이디어는 작업방을 열어 할 일, 자료, 결과물을 함께 정리합니다.',
  },
];

const steps = [
  ['edit_note', '아이디어 쓰기', '제목, 설명, 카테고리와 이미지를 붙여 생각을 공유합니다.'],
  ['favorite', '공감으로 고르기', '친구들이 공감한 아이디어를 보고 다음 실험 후보를 찾습니다.'],
  ['task_alt', '작업방에서 실행하기', '역할, 메모, 자료, 결과물을 모아 실제 프로젝트로 발전시킵니다.'],
];

export default function Home() {
  const router = useRouter();
  const { user, login } = useUser();

  const handleStart = async () => {
    if (!user) await login();
    router.push('/ideas');
  };

  return (
    <main className="pt-24 pb-32 px-5 sm:px-6 max-w-5xl mx-auto space-y-12">
      <section className="relative py-10 md:py-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/70 dark:bg-slate-900/70 border border-pink-100 dark:border-pink-900/40 px-4 py-2 rounded-full text-sm font-black text-pink-600 dark:text-pink-300 shadow-sm mb-6">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            복지메이커스 아이디어 허브
          </div>
          <h1 className="text-4xl md:text-6xl font-headline font-black tracking-tight text-slate-950 dark:text-white leading-tight mb-5">
            작은 생각을 모아
            <br />
            함께 실행하는 공간
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-lg md:text-xl max-w-2xl leading-relaxed font-bold">
            아이디어 나눔터는 동아리 안의 제안, 공감, 작업방, 결과물을 한 흐름으로 이어주는 협업 도구입니다.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={handleStart}
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-full font-headline font-black text-lg shadow-lg hover:scale-[1.03] active:scale-95 transition-all"
            >
              {user ? '아이디어 보러 가기' : 'Google로 시작하기'}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <button
              onClick={() => router.push('/records')}
              className="inline-flex items-center gap-2 px-6 py-4 bg-white/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-full font-bold hover:border-pink-300 transition-colors"
            >
              <span className="material-symbols-outlined">auto_stories</span>
              내 기록 보기
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {values.map((item) => (
          <article key={item.title} className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 rounded-lg p-6 shadow-sm">
            <div className="w-12 h-12 bg-pink-50 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mb-5 text-pink-500">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
            </div>
            <p className="text-xs font-black tracking-widest text-indigo-500 uppercase mb-2">{item.label}</p>
            <h2 className="font-headline font-black text-xl text-slate-900 dark:text-white mb-2">{item.title}</h2>
            <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="bg-slate-950 text-white rounded-lg p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-pink-300 text-sm font-black mb-2">추천 사용 흐름</p>
            <h2 className="text-2xl md:text-3xl font-headline font-black">아이디어에서 결과물까지</h2>
          </div>
          <p className="text-slate-300 text-sm md:text-base max-w-md font-medium">
            포인트와 레벨은 재미 요소로 두고, 실제 목표는 좋은 제안을 놓치지 않고 함께 실행하는 것입니다.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map(([icon, title, body], index) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="material-symbols-outlined text-pink-300">{icon}</span>
                <span className="text-xs font-black text-slate-400">STEP {index + 1}</span>
              </div>
              <h3 className="font-headline font-black text-lg mb-2">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-300">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
