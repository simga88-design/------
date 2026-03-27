export interface UserProfile {
  nickname: string;
  points: number;
  profileImage?: string;
}

export const generateKitschNickname = (): string => {
  const adjs = [
    "반짝이는", "키치한", "러블리한", "힙한", "블링블링", 
    "스윗한", "통통튀는", "마법의", "상큼한", "체리맛",
    "홀로그램", "오로라빛", "은하수", "솜사탕", "별빛"
  ];
  const nouns = [
    "토끼", "체리", "스타", "요정", "크리에이터", 
    "아이돌", "베리", "프린세스", "하이틴", "에이스",
    "마녀", "천사", "비쥬얼", "리더", "마스코트"
  ];
  const adj = adjs[Math.floor(Math.random() * adjs.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
};

export const calculateLevel = (points: number): number => {
  const level = Math.floor(Math.sqrt(points / 50)) + 1;
  return Math.min(level, 99);
};

export const getTitleByLevel = (level: number): string => {
  if (level >= 99) return "✨ 영원한 K-POP 레전드";
  if (level >= 95) return "💸 소속사 건물주 등극";
  if (level >= 90) return "🌌 단독 콘서트 전석 1초 매진";
  if (level >= 85) return "🏆 연말 대상 싹쓸이 머신";
  if (level >= 80) return "🦄 빌보드 씹어먹는 괴물루키";
  if (level >= 75) return "💖 명품 앰버서더 발탁 (인간 샤넬)";
  if (level >= 70) return "📸 파파라치 몰고다니는 월드스타";
  if (level >= 65) return "🚨 떴다 스캔들 메이커";
  if (level >= 60) return "📰 일간지 1면 단골 트러블메이커";
  if (level >= 55) return "👑 음원차트 박살내는 음원깡패";
  if (level >= 50) return "🌟 첫 정산 완료! 소고기 쏘는 날";
  if (level >= 45) return "🔥 음악방송 첫 1위 기념 폭풍오열";
  if (level >= 40) return "📺 길가다 캐스팅 당한 미친 비쥬얼";
  if (level >= 35) return "🎤 소름돋는 메보급 가창력 탑재";
  if (level >= 30) return "💫 무대 찢는 확신의 센터";
  if (level >= 25) return "🚀 데뷔조 합류 성공!";
  if (level >= 20) return "🎵 월말평가 1등 (데뷔 임박)";
  if (level >= 15) return "💦 땀내나는 지하연습실 고인물";
  if (level >= 10) return "🫖 지하연습실 주전자 당번";
  if (level >= 5) return "🐣 박자도 못 맞추는 뚝딱이 연습생";
  return "🌱 이제 막 오디션 통과한 뉴비";
};
