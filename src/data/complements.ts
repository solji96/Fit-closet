import type { ComplementItem, ItemCategory } from "./types";

export const DEMO_COMPLEMENTS: ComplementItem[] = [
  {
    id: "demo-shoes-loafers",
    name: "심플 레더 로퍼 (데모)",
    category: "shoes",
    reason: "현재 코디에 자연스럽게 어울리는 슈즈를 선택형으로 제안해 드립니다.",
    isAffiliate: true,
    isDemo: true,
    affiliateUrl: undefined,
  },
  {
    id: "demo-bottom-slacks",
    name: "테이퍼드 슬랙스 (데모)",
    category: "bottom",
    reason: "지금 상의와 맞춰 입을 수 있는 하의를 선택형으로 제안합니다.",
    isAffiliate: true,
    isDemo: true,
  },
  {
    id: "demo-top-shirt",
    name: "오픈카라 셔츠 (데모)",
    category: "top",
    reason: "현재 하의와 자연스럽게 이어지는 상의를 선택형으로 제안합니다.",
    isAffiliate: true,
    isDemo: true,
  },
  {
    id: "demo-outer-jacket",
    name: "싱글 재킷 (데모)",
    category: "outer",
    reason: "격식 있는 일정에 맞춰 실루엣을 마무리할 수 있는 아우터를 선택형으로 제안합니다.",
    isAffiliate: true,
    isDemo: true,
  },
];

export function demoComplementFor(category: ItemCategory): ComplementItem | undefined {
  return DEMO_COMPLEMENTS.find((item) => item.category === category);
}
