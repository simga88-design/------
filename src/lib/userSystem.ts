export interface UserProfile {
  nickname: string;
  points: number;
  profileImage?: string;
}

export const generateKitschNickname = (): string => {
  const adjs = [
    "반짝이는",
    "상냥한",
    "용감한",
    "다정한",
    "톡톡 튀는",
    "따뜻한",
    "느긋한",
    "멋진",
    "새로운",
    "든든한",
    "명랑한",
    "진지한",
    "기발한",
    "차분한",
    "빛나는",
  ];
  const nouns = [
    "메이커",
    "기획자",
    "아이디어",
    "별빛",
    "친구",
    "리더",
    "탐험가",
    "연구원",
    "디자이너",
    "작가",
    "발명가",
    "기록자",
    "응원단",
    "도전자",
    "마스코트",
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
  if (level >= 99) return "전설의 아이디어 마스터";
  if (level >= 95) return "모두가 찾는 문제 해결사";
  if (level >= 90) return "프로젝트를 여는 선구자";
  if (level >= 85) return "생각을 현실로 바꾸는 사람";
  if (level >= 80) return "협업을 이끄는 리더";
  if (level >= 75) return "명예의 전당 단골 멤버";
  if (level >= 70) return "든든한 성장 메이커";
  if (level >= 65) return "아이디어 큐레이터";
  if (level >= 60) return "실행력 좋은 메이커";
  if (level >= 55) return "반짝이는 기획자";
  if (level >= 50) return "작업방 장인";
  if (level >= 45) return "공감 부스터";
  if (level >= 40) return "토론을 여는 사람";
  if (level >= 35) return "기록이 탄탄한 멤버";
  if (level >= 30) return "무대를 채우는 크리에이터";
  if (level >= 25) return "동료를 모으는 아이디어러";
  if (level >= 20) return "생각을 키우는 탐험가";
  if (level >= 15) return "나눔터 단골 멤버";
  if (level >= 10) return "첫 프로젝트 준비생";
  if (level >= 5) return "박자를 맞추는 새싹";
  return "막 시작한 메이커";
};
