'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

export default function Home() {
  const router = useRouter();
  const { user, login } = useUser();

  return (
    <main className="pt-24 pb-32 px-6 max-w-4xl mx-auto space-y-16">
      <section className="relative text-center py-12">
        <div className="absolute -top-4 -left-4 sticker-rotate-neg bg-tertiary-container text-on-tertiary-container px-4 py-1 rounded-sm shadow-sm font-headline text-sm font-bold z-10">NEW!</div>
        <div className="absolute top-0 right-0 animate-bounce">
          <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-headline font-extrabold tracking-tight text-on-surface mb-6 relative inline-block">
          환영해! <br className="md:hidden"/> 아이디어 나눔터에
          <div className="absolute -bottom-2 left-0 w-full h-3 bg-primary-container/30 -z-10 rounded-full"></div>
        </h2>
        <p className="text-on-surface-variant text-lg max-w-lg mx-auto leading-relaxed">
          우리의 상상이 현실이 되는 마법 같은 공간, <br/>
          당신의 소중한 조각들을 여기서 함께 맞춰보세요!
        </p>
        <div className="absolute bottom-4 left-10 text-secondary opacity-40">
          <span className="material-symbols-outlined text-3xl">star</span>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary">auto_fix_high</span>
          <h3 className="text-2xl font-headline font-bold text-secondary">우리의 가치</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.04)] sticker-rotate-neg flex flex-col items-center text-center relative border-t-8 border-primary-container/20">
            <div className="w-16 h-16 bg-primary-container/20 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_objects</span>
            </div>
            <span className="bg-primary text-on-primary px-3 py-1 rounded-sm text-xs font-bold mb-3 shadow-sm uppercase tracking-widest">Thought</span>
            <h4 className="text-xl font-bold mb-2">자유로운 생각</h4>
            <p className="text-sm text-on-surface-variant">정답은 없어요. 당신이 꿈꾸는 모든 것이 아이디어가 됩니다.</p>
          </div>
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.04)] sticker-rotate-pos flex flex-col items-center text-center relative border-t-8 border-secondary-container/20">
            <div className="w-16 h-16 bg-secondary-container/20 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
            </div>
            <span className="bg-secondary text-on-secondary px-3 py-1 rounded-sm text-xs font-bold mb-3 shadow-sm uppercase tracking-widest">Growth</span>
            <h4 className="text-xl font-bold mb-2">함께하는 성장</h4>
            <p className="text-sm text-on-surface-variant">서로의 생각에 영감을 더해 더 큰 가치를 만들어가요.</p>
          </div>
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.04)] flex flex-col items-center text-center relative border-t-8 border-tertiary-container/20">
            <div className="w-16 h-16 bg-tertiary-container/20 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-tertiary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <span className="bg-tertiary text-on-tertiary px-3 py-1 rounded-sm text-xs font-bold mb-3 shadow-sm uppercase tracking-widest">Inspiration</span>
            <h4 className="text-xl font-bold mb-2">반짝이는 영감</h4>
            <p className="text-sm text-on-surface-variant">일상의 작은 조각들이 이곳에선 찬란한 빛이 됩니다.</p>
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low rounded-xl p-8 md:p-12 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary-container/10 rounded-full blur-3xl"></div>
        <div className="text-center mb-12">
          <h3 className="text-3xl font-headline font-extrabold text-on-surface">어떻게 사용하나요?</h3>
          <p className="text-on-surface-variant mt-2">간단한 3단계로 시작하는 아이디어 여행</p>
        </div>
        <div className="space-y-6 relative">
          <div className="flex items-start gap-6 bg-surface-container-lowest p-6 rounded-lg shadow-sm border-l-4 border-primary">
            <div className="flex-shrink-0 w-12 h-12 bg-primary text-on-primary rounded-full flex items-center justify-center font-headline font-black text-xl">1</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                <h4 className="font-bold text-lg">아이디어 기록하기</h4>
              </div>
              <p className="text-on-surface-variant text-sm">떠오르는 생각을 자유롭게 캔버스에 담아보세요. 낙서도 좋아요!</p>
            </div>
          </div>
          <div className="flex items-start gap-6 bg-surface-container-lowest p-6 rounded-lg shadow-sm border-l-4 border-secondary translate-x-2 md:translate-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-secondary text-on-secondary rounded-full flex items-center justify-center font-headline font-black text-xl">2</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-secondary">lightbulb</span>
                <h4 className="font-bold text-lg">함께 나누고 다듬기</h4>
              </div>
              <p className="text-on-surface-variant text-sm">다른 친구들의 피드백을 받고 생각을 더욱 구체화해보세요.</p>
            </div>
          </div>
          <div className="flex items-start gap-6 bg-surface-container-lowest p-6 rounded-lg shadow-sm border-l-4 border-tertiary">
            <div className="flex-shrink-0 w-12 h-12 bg-tertiary text-on-tertiary rounded-full flex items-center justify-center font-headline font-black text-xl">3</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-tertiary">celebration</span>
                <h4 className="font-bold text-lg">프로젝트 시작!</h4>
              </div>
              <p className="text-on-surface-variant text-sm">완성된 아이디어로 팀을 꾸리거나 직접 실행에 옮겨보세요.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 칭호 및 레벨 시스템 안내 코너 */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2rem] p-8 md:p-12 relative overflow-hidden text-white shadow-xl mt-4 border-2 border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="text-center mb-10 relative z-10">
          <span className="bg-gradient-to-r from-pink-500 to-indigo-500 text-white px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-4 inline-block shadow-lg">Level Up System</span>
          <h3 className="text-3xl md:text-4xl font-headline font-black mb-4 tracking-tight">성장하는 인공지능 메이커 🚀</h3>
          <p className="text-indigo-200 font-bold">재밌는 활동을 통해 경험치(P)를 얻고, 나만의 레벨과 칭호를 키워보세요!</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center hover:bg-white/10 transition-colors">
            <div className="text-4xl mb-3">🐣</div>
            <div className="text-xs text-indigo-300 font-black tracking-wide mb-1">Lv.1~4</div>
            <div className="font-bold text-sm">삐약삐약 연습생</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center hover:bg-white/10 transition-colors">
            <div className="text-4xl mb-3">💫</div>
            <div className="text-xs text-indigo-300 font-black tracking-wide mb-1">Lv.20~24</div>
            <div className="font-bold text-sm">반짝반짝 데뷔조</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center hover:bg-white/10 transition-colors">
            <div className="text-4xl mb-3">👑</div>
            <div className="text-xs text-indigo-300 font-black tracking-wide mb-1">Lv.50~54</div>
            <div className="font-bold text-sm">밀리언셀러</div>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-indigo-600 rounded-2xl p-6 border border-white/20 text-center shadow-lg transform hover:-translate-y-1 transition-transform">
            <div className="text-4xl mb-3 animate-pulse">💎</div>
            <div className="text-xs text-pink-200 font-black tracking-wide mb-1">Lv.99 MAX</div>
            <div className="font-bold text-sm">전설의 월드스타</div>
          </div>
        </div>

        <div className="mt-8 text-center relative z-10 bg-black/30 rounded-2xl p-5 border border-white/5 flex flex-col md:flex-row items-center justify-center gap-4">
          <p className="text-sm font-bold text-indigo-100 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-pink-400 text-xl font-bold">edit_note</span>
            아이디어 포스팅 시 <span className="text-pink-400 font-black text-base">+500P</span>
          </p>
          <span className="hidden md:block text-slate-600">|</span>
          <p className="text-sm font-bold text-indigo-100 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-xl font-bold">favorite</span>
            하트 꾹 공감 시 <span className="text-indigo-400 font-black text-base">+100P</span>
          </p>
        </div>
      </section>

      <section className="text-center py-8">
        <button 
          onClick={async () => {
            if (user) {
              router.push('/ideas');
            } else {
              await login();
              router.push('/ideas');
            }
          }}
          className="group relative px-12 py-5 bg-gradient-to-r from-primary to-secondary text-white rounded-full font-headline font-extrabold text-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-300">
          <span className="relative z-10 flex items-center gap-2">
            {!user && <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5 bg-white rounded-full p-0.5" />}
            {user ? "[아이디어 나눔터 입장하기!]" : "[구글로 3초 가입하고 시작!]"}
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </span>
          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-20 bg-white transition-opacity"></div>
        </button>
        <p className="mt-6 text-on-surface-variant text-[15px] flex items-center justify-center gap-2 font-bold">
          <span className="material-symbols-outlined text-[18px] text-pink-500">auto_awesome</span>
          열심히 활동해서 전설의 <span className="text-pink-500 font-black tracking-wide">월드스타</span>가 될 때까지! ✨
        </p>
      </section>
    </main>
  );
}
