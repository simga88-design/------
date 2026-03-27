import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyAx0MY9206Ofb7bj9d4rIL62EjBNHetBCQ",
  projectId: "jcmhcmainportal"
});
const db = getFirestore(app);

async function run() {
  await addDoc(collection(db, "ideas"), {
    title: "뉴진스 화보 컨셉의 사원증 📸",
    description: "딱딱한 증명사진 대신 키치한 폴라로이드 감성으로 사원증을 리뉴얼하면 어떨까요? 다이어리 꾸미듯 자유롭게 팀을 표현하고 소속감도 올려봐요! 💎✨",
    category: "사내 문화",
    categoryColor: "primary",
    authorName: "스파클링 제니",
    upvotes: 125,
    rotation: "left"
  });

  await addDoc(collection(db, "ideas"), {
    title: "Y2K 감성 럭키드로우 간식 자판기 🍭",
    description: "탕비실에 랜덤으로 간식이 떨어지는 자판기를 설치해서 매일 뽑는 재미를 더해봐요! 레트로한 타이포그래피 스티커로 꾸미면 복도 전체가 하이틴 영화처럼 변할 거예요 🎧💕",
    category: "휴게 공간",
    categoryColor: "secondary",
    authorName: "체리 블라썸",
    upvotes: 48,
    rotation: "right"
  });

  await addDoc(collection(db, "ideas"), {
    title: "팀별 다마고치 키우기 대회 🐾",
    description: "각 팀마다 스마트폰이 아닌 진짜 아날로그 다마고치를 하나씩 배정받는 거예요! 출퇴근 시간에 돌아가면서 밥 주고 똥 치우면서 소통의 장벽을 박살내봐요 ㅋㅋㅋ 🏆",
    category: "소통 활성화",
    categoryColor: "tertiary",
    authorName: "블루베리 쿠키",
    upvotes: 312,
    rotation: "none"
  });

  console.log("Added Test Data Successfully");
  process.exit(0);
}
run();
