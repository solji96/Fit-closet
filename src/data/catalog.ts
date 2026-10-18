import { COMFORTABLE_CASUAL_LABEL, COMFORTABLE_CASUAL_LABEL_FULL } from "../domain/tags";
import type { ItemCategory, ItemMood, StyleMood, WardrobeItem } from "./types";

export type ItemLength = "short" | "midi" | "long";

export interface CatalogItem {
  id: string;
  category: ItemCategory;
  name: string;
  formality: number;
  moods: ItemMood[];
  defaultColor: string;
  optional?: boolean;
  englishName?: string;
  itemType?: string;
  style?: string;
  material?: string;
  fit?: string;
  colorTone?: string;
  length?: ItemLength;
  family?: string;
}

export const SKIP_IDS = {
  bag: "skip-bag",
  accessory: "skip-accessory",
} as const;

export const LEGACY_CATALOG_IDS: Record<string, string> = {
  shirt: "top-shirt-oversize",
  knit: "top-knit-rib",
  tee: "top-tee-standard",
  blouse: "top-blouse-silk",
  slacks: "bottom-slacks-tapered",
  jeans: "bottom-denim-straight",
  skirt: "skirt-midi",
  jacket: "jacket-tailored",
  cardigan: "cardigan-boxy",
  coat: "coat-long",
  bag: "bag-shoulder",
  accessory: "accessory-earrings-gold",
  "accessory-necklace": "necklace-chain",
  "accessory-belt": "belt-leather",
  "accessory-scarf": "scarf-long",
  "shoes-maryjane-heel": "shoes-ballerina-heel",
  "accessory-earrings-pearl": "accessory-earrings-gold",
};

function piece(
  category: ItemCategory,
  id: string,
  name: string,
  englishName: string,
  itemType: string,
  style: string,
  formality: number,
  moods: ItemMood[],
  defaultColor: string,
  extra: Partial<CatalogItem> = {},
): CatalogItem {
  return {
    id,
    category,
    name,
    englishName,
    itemType,
    style,
    formality,
    moods,
    defaultColor,
    ...extra,
  };
}

function outer(
  id: string,
  name: string,
  englishName: string,
  itemType: string,
  style: string,
  formality: number,
  moods: ItemMood[],
  defaultColor: string,
  material = "울 혼방",
  extra: Partial<CatalogItem> = {},
): CatalogItem {
  return piece("outer", id, name, englishName, itemType, style, formality, moods, defaultColor, { material, ...extra });
}

export const CHECKLIST_GROUPS: { category: ItemCategory; label: string; items: CatalogItem[] }[] =
  [
    {
      category: "top",
      label: "상의",
      items: [
        piece("top", "top-tee-standard", "스탠다드 반팔", "STANDARD TEE", "standard-tee", "classic", 2, ["comfortable", "neat"], "화이트", { material: "코튼" }),
        piece("top", "top-tee-crop", "크롭 반팔", "CROP TEE", "crop-tee", "trendy", 2, ["trendy", "comfortable"], "블랙", { material: "코튼" }),
        piece("top", "top-long-boxy", "루즈핏·오버핏 긴팔", "OVERFIT LONG SLEEVE", "boxy-long-sleeve", "boxy", 2, ["comfortable", "trendy"], "아이보리", { material: "코튼" }),
        piece("top", "top-sleeveless", "슬리브리스", "SLEEVELESS", "sleeveless", "minimal", 2, ["trendy", "comfortable"], "블랙", { material: "코튼" }),
        piece("top", "top-waffle-tee", "와플 티셔츠", "WAFFLE TEE", "waffle-tee", "minimal", 2, ["comfortable", "trendy"], "아이보리", { material: "와플 코튼" }),
        piece("top", "top-waffle-long", "와플 롱슬리브", "WAFFLE LONG SLEEVE", "waffle-long-sleeve", "minimal", 2, ["comfortable", "trendy"], "그레이", { material: "와플 코튼" }),
        piece("top", "top-terry-hoodie", "테리 후드", "TERRY HOODIE", "terry-hoodie", "soft", 2, ["comfortable", "neat"], "오트밀", { material: "테리" }),
        piece("top", "top-blouse-silk", "실크 블라우스", "SILK BLOUSE", "silk-blouse", "soft", 4, ["neat", "formal"], "아이보리", { material: "실크" }),
        piece("top", "top-shirt-oversize", "오버사이즈 셔츠", "OVERSIZE SHIRT", "oversize-shirt", "boxy", 3, ["neat", "trendy"], "화이트", { material: "코튼" }),
        piece("top", "top-shirt-oxford-check", "체크 옥스퍼드 셔츠", "CHECK OXFORD SHIRT", "oxford-check", "classic", 3, ["neat", "trendy"], "네이비 체크", { material: "코튼" }),
        piece("top", "top-blouse-paisley", "페이즐리 블라우스", "PAISLEY BLOUSE", "paisley-blouse", "soft", 3, ["trendy", "neat"], "페이즐리", { material: "실크" }),
        piece("top", "top-blouse-flower", "플라워 블라우스", "FLORAL BLOUSE", "flower-blouse", "soft", 3, ["trendy", "neat"], "플라워", { material: "실크" }),
        piece("top", "top-knit-rib", "슬림 리브 니트", "SLIM RIB KNIT", "slim-rib-knit", "minimal", 3, ["neat", "comfortable"], "블랙", { material: "니트" }),
        piece("top", "top-knit-cashmere", "캐시미어 V넥", "CASHMERE V-NECK", "cashmere-vneck", "classic", 4, ["neat", "comfortable"], "베이지", { material: "캐시미어" }),
        piece("top", "top-turtleneck", "터틀넥", "TURTLENECK", "turtleneck", "classic", 4, ["neat", "formal"], "네이비", { material: "니트" }),
        piece("top", "top-knit-vest", "니트 베스트", "KNIT VEST", "knit-vest", "classic", 3, ["neat", "comfortable"], "오트밀", { material: "니트" }),
        piece("top", "top-tailored-vest", "테일러드 베스트", "TAILORED VEST", "tailored-vest", "tailored", 4, ["neat", "formal"], "네이비", { material: "울 혼방" }),
        piece("top", "top-bustier", "테일러드 뷔스티에", "TAILORED BUSTIER", "bustier", "tailored", 3, ["trendy", "formal"], "블랙", { material: "코튼" }),
        piece("top", "top-hood-zip", "레이어드 후드 집업", "LAYERED HOOD ZIP", "hood-zip", "sport", 2, ["comfortable", "trendy"], "차콜", { material: "코튼" }),
        piece("top", "top-hoodie-cashmere", "캐시미어 후디", "CASHMERE HOODIE", "hoodie-cashmere", "soft", 3, ["comfortable", "neat"], "오트밀", { material: "캐시미어" }),
        piece("top", "top-hoodie-cotton", "코튼 후디", "COTTON HOODIE", "hoodie-cotton", "sport", 2, ["comfortable", "trendy"], "차콜", { material: "코튼" }),
        piece("top", "top-sweatshirt", "모던 스웨트셔츠", "MODERN SWEATSHIRT", "sweatshirt", "minimal", 2, ["comfortable", "neat"], "웜 아이보리", { material: "코튼" }),
      ],
    },
    {
      category: "bottom",
      label: "하의",
      items: [
        piece("bottom", "bottom-slacks-wide", "하이웨이스트 와이드 슬랙스", "HIGH-WAIST WIDE SLACKS", "wide-slacks", "tailored", 4, ["neat", "formal"], "차콜", { material: "울 혼방", fit: "wide", family: "slacks" }),
        piece("bottom", "bottom-slacks-tapered", "테이퍼드 슬랙스", "TAPERED SLACKS", "tapered-slacks", "tailored", 4, ["neat", "formal"], "네이비", { material: "울 혼방", fit: "tapered", family: "slacks" }),
        piece("bottom", "bottom-slacks-pintuck", "클래식 핀턱 슬랙스", "PINTUCK SLACKS", "pintuck-slacks", "tailored", 4, ["neat", "formal"], "차콜", { material: "울 혼방", fit: "straight", family: "slacks" }),
        piece("bottom", "bottom-slacks-bootcut", "부츠컷 슬랙스", "BOOTCUT SLACKS", "bootcut-slacks", "tailored", 3, ["neat", "trendy"], "네이비", { material: "울 혼방", fit: "bootcut", family: "slacks" }),
        piece("bottom", "bottom-slacks-two-tuck", "와이드 투턱 슬랙스", "TWO-TUCK WIDE SLACKS", "two-tuck-slacks", "tailored", 4, ["neat", "formal"], "차콜", { material: "울 혼방", fit: "wide", family: "slacks" }),
        piece("bottom", "bottom-slacks-straight", "스탠다드 일자 슬랙스", "STRAIGHT SLACKS", "straight-slacks", "tailored", 4, ["neat", "formal"], "네이비", { material: "울 혼방", fit: "straight", family: "slacks" }),
        piece("bottom", "bottom-jogger", "조거 팬츠", "JOGGER PANTS", "jogger", "sport", 2, ["comfortable", "trendy"], "차콜", { material: "코튼", fit: "tapered", family: "sweat" }),
        piece("bottom", "bottom-sweat", "스웨트 팬츠", "SWEAT PANTS", "sweat-pants", "sport", 2, ["comfortable"], "차콜", { material: "코튼", fit: "straight", family: "sweat" }),
        piece("bottom", "bottom-denim-straight", "스트레이트 데님", "STRAIGHT DENIM", "straight-denim", "denim", 2, ["comfortable", "trendy"], "미디엄 블루", { material: "데님", fit: "straight", colorTone: "미디엄 블루", family: "denim" }),
        piece("bottom", "bottom-denim-bootcut", "부츠컷 데님", "BOOTCUT DENIM", "bootcut-denim", "denim", 2, ["trendy", "comfortable"], "다크 인디고", { material: "데님", fit: "bootcut", colorTone: "다크 인디고", family: "denim" }),
        piece("bottom", "bottom-denim-light", "라이트 블루 데님", "LIGHT BLUE DENIM", "light-denim", "denim", 2, ["comfortable", "trendy"], "라이트 블루", { material: "데님", fit: "straight", colorTone: "라이트 블루", family: "denim" }),
        piece("bottom", "bottom-denim-black", "블랙/그레이시 데님", "GREY-BLACK DENIM", "black-denim", "denim", 3, ["neat", "trendy"], "차콜", { material: "데님", fit: "straight", colorTone: "블랙/그레이시", family: "denim" }),
        piece("bottom", "bottom-denim-check", "체크 데님", "CHECK DENIM", "check-denim", "denim", 2, ["trendy", "neat"], "네이비 체크", { material: "데님", fit: "straight", family: "pattern" }),
        piece("bottom", "bottom-denim-camo", "카모 데님", "CAMO DENIM", "camo-denim", "denim", 2, ["trendy", "comfortable"], "카키 카모", { material: "데님", fit: "straight", family: "pattern" }),
        piece("bottom", "bottom-denim-washed", "워시드 데님", "WASHED DENIM", "washed-denim", "denim", 2, ["trendy", "comfortable"], "미디엄 워시", { material: "데님", fit: "straight", family: "pattern" }),
        piece("bottom", "bottom-cotton-pattern", "패턴 코튼 팬츠", "PATTERN COTTON PANTS", "pattern-cotton", "casual", 2, ["comfortable", "trendy"], "체크", { material: "코튼", fit: "straight", family: "pattern" }),
        piece("bottom", "bottom-leather-pants", "레더 팬츠", "LEATHER PANTS", "leather-pants", "leather", 3, ["trendy", "neat"], "블랙", { material: "레더" }),
      ],
    },
    {
      category: "skirt",
      label: "스커트",
      items: [
        piece("skirt", "skirt-long", "롱 스커트", "LONG SKIRT", "long-skirt", "soft", 3, ["neat", "comfortable"], "블랙", { material: "울 혼방" }),
        piece("skirt", "skirt-midi", "미디 스커트", "MIDI SKIRT", "midi-skirt", "classic", 3, ["neat", "trendy"], "네이비", { material: "울 혼방" }),
        piece("skirt", "skirt-mini", "미니 스커트", "MINI SKIRT", "mini-skirt", "trendy", 2, ["trendy", "comfortable"], "블랙", { material: "코튼" }),
        piece("skirt", "skirt-pleats", "플리츠 스커트", "PLEATED SKIRT", "pleated-skirt", "classic", 3, ["neat", "formal"], "아이보리", { material: "폴리에스터" }),
        piece("skirt", "skirt-suede", "스웨이드 스커트", "SUEDE SKIRT", "suede-skirt", "soft", 4, ["neat", "trendy"], "브라운", { material: "스웨이드" }),
      ],
    },
    {
      category: "outer",
      label: "아우터",
      items: [
        outer("jacket-leather", "가죽 재킷", "LEATHER JACKET", "leather-jacket", "leather", 3, ["trendy", "neat"], "블랙", "레더", { length: "midi", family: "jacket" }),
        outer("jacket-denim", "데님 재킷", "DENIM JACKET", "denim-jacket", "denim", 2, ["comfortable", "trendy"], "인디고", "데님", { length: "midi", family: "jacket" }),
        outer("jacket-tailored", "테일러드 블레이저", "TAILORED BLAZER", "tailored-jacket", "tailored", 5, ["neat", "formal"], "네이비", "울 혼방", { length: "midi", family: "jacket" }),
        outer("jacket-suede", "스웨이드 재킷", "SUEDE JACKET", "suede-jacket", "soft", 3, ["neat", "trendy"], "카멜", "스웨이드", { length: "midi", family: "jacket" }),
        outer("jacket-bomber", "봄버", "BOMBER", "bomber", "sport", 2, ["trendy", "comfortable"], "블랙", "나일론", { length: "short", family: "jacket" }),
        outer("cardigan-short", "숏 가디건", "SHORT CARDIGAN", "short-cardigan", "short", 3, ["comfortable", "neat"], "카멜", "니트", { length: "short", family: "cardigan" }),
        outer("cardigan-long", "롱 가디건", "LONG CARDIGAN", "long-cardigan", "long", 3, ["comfortable", "neat"], "카멜", "니트", { length: "long", family: "cardigan" }),
        outer("cardigan-boxy", "오버핏 가디건", "OVERFIT CARDIGAN", "boxy-cardigan", "boxy", 2, ["comfortable", "trendy"], "아이보리", "니트", { length: "midi", family: "cardigan" }),
        outer("coat-short", "숏 코트", "SHORT COAT", "short-coat", "short", 4, ["neat", "formal"], "블랙", "울 혼방", { length: "short", family: "coat" }),
        outer("coat-midi", "오버핏 울 코트", "OVERFIT WOOL COAT", "overfit-wool-coat", "boxy", 4, ["neat", "trendy"], "카멜", "울", { length: "midi", family: "coat" }),
        outer("coat-long", "롱 코트", "LONG COAT", "long-coat", "long", 5, ["formal", "neat"], "블랙", "울 혼방", { length: "long", family: "coat" }),
        outer("coat-boxy", "오버핏 코트", "OVERFIT COAT", "boxy-coat", "boxy", 3, ["trendy", "neat"], "카멜", "울 혼방", { length: "midi", family: "coat" }),
        outer("coat-trench", "트렌치 코트", "TRENCH COAT", "trench-coat", "classic", 4, ["neat", "formal"], "베이지", "코튼", { length: "long", family: "coat" }),
        outer("puffer-short", "숏 푸퍼", "SHORT PUFFER", "short-puffer", "sport", 2, ["comfortable", "trendy"], "블랙", "나일론", { length: "short", family: "padding" }),
        outer("down-midi", "미디 다운", "MIDI DOWN", "midi-down", "classic", 4, ["neat", "comfortable"], "블랙", "다운", { length: "midi", family: "padding" }),
        outer("down-long", "롱 헤비 구스다운", "LONG HEAVY DOWN", "long-down", "classic", 4, ["neat", "comfortable"], "블랙", "다운", { length: "long", family: "padding" }),
        outer("fur-daily", "후드 에코 퍼", "HOODED FAUX FUR", "daily-fur", "soft", 2, ["comfortable", "trendy"], "크림", "에코퍼", { length: "midi", family: "fur" }),
        outer("fur-long", "미디·롱 퍼 코트", "LONG FUR COAT", "long-fur", "soft", 4, ["formal", "neat"], "크림", "에코퍼", { length: "long", family: "fur" }),
        outer("mustang-shearling", "시어링 무스탕", "SHEARLING MUSTANG", "shearling", "rugged", 3, ["trendy", "neat"], "브라운", "시어링", { length: "midi", family: "fur" }),
      ],
    },
    {
      category: "shoes",
      label: "신발",
      items: [
        piece("shoes", "loafers", "클래식 페니 로퍼", "PENNY LOAFER", "loafer", "classic", 4, ["neat", "formal"], "브라운", { material: "레더", family: "loafer" }),
        piece("shoes", "shoes-bloafer", "블로퍼·뮬", "BLOAFER MULE", "bloafer", "minimal", 3, ["neat", "trendy"], "블랙", { material: "레더", family: "loafer" }),
        piece("shoes", "shoes-maryjane", "메리제인 플랫", "MARY JANE FLAT", "mary-jane", "classic", 4, ["neat", "formal"], "블랙", { material: "레더", family: "ballet" }),
        piece("shoes", "shoes-ballerina-heel", "발레리나 힐 (메리제인·발레코어)", "BALLERINA HEEL", "ballerina-heel", "polished", 4, ["trendy", "neat"], "블랙", { material: "새틴", family: "ballet" }),
        piece("shoes", "shoes-satin-ballet", "새틴 발레슈즈 (플랫)", "SATIN BALLET FLAT", "satin-ballet", "soft", 3, ["neat", "trendy"], "베이지", { material: "새틴", family: "ballet" }),
        piece("shoes", "shoes-tabi", "타비 슈즈 (족발 슈즈)", "TABI SHOE", "tabi", "minimal", 3, ["trendy", "neat"], "블랙", { material: "레더", family: "ballet" }),
        piece("shoes", "shoes-pumps", "펌프스·슬링백", "PUMP SLINGBACK", "pumps", "polished", 5, ["formal", "neat"], "블랙", { material: "레더", family: "dress" }),
        piece("shoes", "dress-shoes", "더비 슈즈", "DERBY SHOE", "derby", "polished", 5, ["formal", "neat"], "블랙", { material: "레더", family: "dress" }),
        piece("shoes", "sneakers", "스포티 러닝화", "SPORT RUNNER", "runner", "sport", 2, ["comfortable", "trendy"], "화이트", { material: "메시", family: "sneaker" }),
        piece("shoes", "sneakers-leather", "미니멀 가죽 스니커즈", "LEATHER SNEAKER", "leather-sneaker", "minimal", 3, ["neat", "comfortable"], "화이트", { material: "레더", family: "sneaker" }),
        piece("shoes", "sneakers-canvas", "캔버스 단화", "CANVAS SNEAKER", "canvas-sneaker", "casual", 2, ["comfortable", "trendy"], "화이트", { material: "캔버스", family: "sneaker" }),
        piece("shoes", "boots", "가죽 숏 부츠", "LEATHER SHORT BOOT", "boot", "rugged", 3, ["trendy", "neat"], "다크브라운", { material: "레더", family: "boots", length: "short" }),
        piece("shoes", "boots-leather-long", "가죽 롱 부츠", "LEATHER LONG BOOT", "long-boot", "classic", 4, ["neat", "formal"], "블랙", { material: "레더", family: "boots", length: "long" }),
        piece("shoes", "boots-suede-mid", "스웨이드 미들 부츠", "SUEDE MID BOOT", "mid-boot", "soft", 3, ["neat", "trendy"], "카멜", { material: "스웨이드", family: "boots", length: "midi" }),
        piece("shoes", "boots-suede-ankle", "스웨이드 앵클 부츠", "SUEDE ANKLE BOOT", "ankle-boot", "soft", 3, ["trendy", "neat"], "브라운", { material: "스웨이드", family: "boots", length: "short" }),
        piece("shoes", "boots-chelsea", "첼시 부츠", "CHELSEA BOOT", "chelsea", "classic", 4, ["neat", "formal"], "블랙", { material: "레더", family: "boots", length: "short" }),
      ],
    },
    {
      category: "bag",
      label: "가방",
      items: [
        {
          id: "bag-tote",
          category: "bag",
          name: "토트백",
          englishName: "TOTE BAG",
          itemType: "tote",
          style: "structured",
          material: "레더",
          formality: 4,
          moods: ["neat", "formal"],
          defaultColor: "블랙",
          optional: true,
        },
        {
          id: "bag-shoulder",
          category: "bag",
          name: "숄더백",
          englishName: "SHOULDER BAG",
          itemType: "shoulder-bag",
          style: "minimal",
          material: "레더",
          formality: 3,
          moods: ["neat", "comfortable"],
          defaultColor: "탄",
          optional: true,
        },
        {
          id: "bag-crossbody",
          category: "bag",
          name: "크로스백",
          englishName: "CROSSBODY",
          itemType: "crossbody",
          style: "casual",
          material: "레더",
          formality: 2,
          moods: ["comfortable", "trendy"],
          defaultColor: "브라운",
          optional: true,
        },
        {
          id: "bag-backpack",
          category: "bag",
          name: "백팩",
          englishName: "BACKPACK",
          itemType: "backpack",
          style: "sport",
          material: "나일론",
          formality: 2,
          moods: ["comfortable", "trendy"],
          defaultColor: "블랙",
          optional: true,
        },
        {
          id: "bag-clutch",
          category: "bag",
          name: "클러치",
          englishName: "CLUTCH",
          itemType: "clutch",
          style: "evening",
          material: "레더",
          formality: 5,
          moods: ["formal", "neat"],
          defaultColor: "블랙",
          optional: true,
        },
        {
          id: "bag-mini",
          category: "bag",
          name: "미니백",
          englishName: "MINI BAG",
          itemType: "mini-bag",
          style: "minimal",
          material: "레더",
          formality: 3,
          moods: ["trendy", "neat"],
          defaultColor: "블랙",
          optional: true,
        },
      ],
    },
    {
      category: "accessory",
      label: "액세서리",
      items: [
        {
          id: "accessory-earrings-gold",
          category: "accessory",
          name: "골드 귀걸이",
          englishName: "GOLD EARRINGS",
          itemType: "earrings",
          style: "jewelry",
          material: "골드",
          formality: 3,
          moods: ["trendy", "neat"],
          defaultColor: "골드",
          optional: true,
        },
        {
          id: "accessory-earrings-silver",
          category: "accessory",
          name: "실버 귀걸이",
          englishName: "SILVER EARRINGS",
          itemType: "earrings",
          style: "jewelry",
          material: "실버",
          formality: 3,
          moods: ["neat", "trendy"],
          defaultColor: "실버",
          optional: true,
        },
        {
          id: "necklace-chain",
          category: "accessory",
          name: "베이직 체인 목걸이",
          englishName: "BASIC CHAIN",
          itemType: "chain-necklace",
          style: "jewelry",
          material: "골드",
          formality: 3,
          moods: ["neat", "trendy"],
          defaultColor: "골드",
          optional: true,
        },
        {
          id: "necklace-pearl",
          category: "accessory",
          name: "클래식 진주 목걸이",
          englishName: "CLASSIC PEARL",
          itemType: "pearl-necklace",
          style: "jewelry",
          material: "진주",
          formality: 4,
          moods: ["formal", "neat"],
          defaultColor: "진주",
          optional: true,
        },
        {
          id: "necklace-orbital-pearl",
          category: "accessory",
          name: "볼드 오비탈 진주 스타일",
          englishName: "BOLD ORBITAL PEARL",
          itemType: "orbital-pearl",
          style: "statement",
          material: "진주",
          formality: 3,
          moods: ["trendy", "formal"],
          defaultColor: "진주",
          optional: true,
        },
        {
          id: "necklace-pendant",
          category: "accessory",
          name: "미니멀 펜던트",
          englishName: "MINIMAL PENDANT",
          itemType: "pendant-necklace",
          style: "minimal",
          material: "실버",
          formality: 3,
          moods: ["neat", "comfortable"],
          defaultColor: "실버",
          optional: true,
        },
        {
          id: "belt-leather",
          category: "accessory",
          name: "가죽 벨트",
          englishName: "LEATHER BELT",
          itemType: "leather-belt",
          style: "classic",
          material: "레더",
          formality: 4,
          moods: ["neat", "formal"],
          defaultColor: "브라운",
          optional: true,
        },
        {
          id: "belt-chain",
          category: "accessory",
          name: "체인 벨트",
          englishName: "CHAIN BELT",
          itemType: "chain-belt",
          style: "statement",
          material: "골드",
          formality: 3,
          moods: ["trendy", "formal"],
          defaultColor: "골드",
          optional: true,
        },
        {
          id: "scarf-long",
          category: "accessory",
          name: "롱 스카프",
          englishName: "LONG SCARF",
          itemType: "long-scarf",
          style: "soft",
          material: "실크",
          formality: 3,
          moods: ["neat", "comfortable"],
          defaultColor: "버건디",
          optional: true,
        },
        {
          id: "scarf-petit",
          category: "accessory",
          name: "쁘띠 스카프",
          englishName: "PETIT SCARF",
          itemType: "petit-scarf",
          style: "soft",
          material: "실크",
          formality: 3,
          moods: ["trendy", "neat"],
          defaultColor: "베이지",
          optional: true,
        },
        {
          id: "sock-cotton-crew",
          category: "accessory",
          name: "코튼 크루 삭스 · 화이트",
          englishName: "COTTON CREW SOCK",
          itemType: "sock-crew",
          style: "soft",
          material: "코튼",
          formality: 2,
          moods: ["comfortable", "neat"],
          defaultColor: "화이트",
          family: "socks",
          optional: true,
        },
        {
          id: "sock-cotton-crew-black",
          category: "accessory",
          name: "코튼 크루 삭스 · 블랙",
          englishName: "COTTON CREW SOCK",
          itemType: "sock-crew",
          style: "soft",
          material: "코튼",
          formality: 2,
          moods: ["comfortable", "neat"],
          defaultColor: "블랙",
          family: "socks",
          optional: true,
        },
        {
          id: "sock-wool-rib",
          category: "accessory",
          name: "리브드 울 삭스 · 멜란지그레이",
          englishName: "RIBBED WOOL SOCK",
          itemType: "sock-wool",
          style: "soft",
          material: "울 혼방",
          formality: 2,
          moods: ["comfortable", "neat"],
          defaultColor: "멜란지그레이",
          family: "socks",
          optional: true,
        },
        {
          id: "sock-wool-rib-ivory",
          category: "accessory",
          name: "리브드 울 삭스 · 아이보리",
          englishName: "RIBBED WOOL SOCK",
          itemType: "sock-wool",
          style: "soft",
          material: "울 혼방",
          formality: 2,
          moods: ["comfortable", "neat"],
          defaultColor: "아이보리",
          family: "socks",
          optional: true,
        },
      ],
    },
  ];

export const ALL_CATALOG = CHECKLIST_GROUPS.flatMap((group) => group.items);

export function catalogByCategory(category: ItemCategory): CatalogItem[] {
  return ALL_CATALOG.filter((item) => item.category === category);
}

export const STYLE_LABELS: Record<string, string> = {
  classic: "클래식",
  sport: "스포티",
  polished: "폴리시드",
  rugged: "러기드",
  minimal: "미니멀",
  statement: "포인트",
  leather: "레더",
  denim: "데님",
  tailored: "테일러드",
  short: "숏",
  long: "롱",
  boxy: "오버핏",
  overfit: "오버핏",
  midi: "미디",
  structured: "정돈된",
  casual: "이지 캐주얼",
  evening: "이브닝",
  jewelry: "주얼리",
  soft: "소프트",
  wide: "와이드",
  tapered: "테이퍼드",
  straight: "스트레이트",
  bootcut: "부츠컷",
};

export function catalogFieldsForWardrobe(catalog: CatalogItem): Pick<
  WardrobeItem,
  "itemType" | "style" | "material" | "color" | "formality" | "moods" | "name" | "fit" | "colorTone" | "length" | "family"
> {
  return {
    name: catalog.name,
    color: catalog.defaultColor,
    itemType: catalog.itemType ?? catalog.id,
    style: catalog.style,
    material: catalog.material,
    formality: catalog.formality,
    moods: catalog.moods,
    fit: catalog.fit,
    colorTone: catalog.colorTone,
    length: catalog.length,
    family: catalog.family,
  };
}

export const STYLE_OPTIONS: {
  id: StyleMood;
  label: string;
  chipLabel: string;
  english: string;
  hint: string;
}[] = [
  {
    id: "minimal_classic",
    label: "미니멀 클래식",
    chipLabel: "미니멀 클래식",
    english: "Minimal Classic",
    hint: "정갈하고 군더더기 없는 실루엣",
  },
  {
    id: "quiet_luxury",
    label: "콰이어트 럭셔리",
    chipLabel: "콰이어트 럭셔리",
    english: "Quiet Luxury",
    hint: "절제된 소재감의 조용한 럭셔리",
  },
  {
    id: "office_chic",
    label: "오피스 시크 & 포멀",
    chipLabel: "오피스 시크",
    english: "Office Chic",
    hint: "도시적이고 격식 있는 비즈니스 무드",
  },
  {
    id: "natural_comfort",
    label: COMFORTABLE_CASUAL_LABEL_FULL,
    chipLabel: COMFORTABLE_CASUAL_LABEL,
    english: "Comfortable Casual",
    hint: "여유로운 실루엣의 정돈된 캐주얼 무드",
  },
  {
    id: "city_casual",
    label: "시티 캐주얼 & 모던",
    chipLabel: "시티 캐주얼",
    english: "City Casual",
    hint: "도시적이고 정돈된 캐주얼 무드",
  },
  {
    id: "romantic_feminine",
    label: "로맨틱 & 페미닌",
    chipLabel: "로맨틱 페미닌",
    english: "Romantic Feminine",
    hint: "우아하고 부드러운 무드",
  },
];

export const COLOR_OPTIONS = [
  "블랙",
  "화이트",
  "웜 아이보리",
  "크림",
  "오트밀",
  "베이지",
  "카멜",
  "차콜",
  "딥 버건디",
  "올리브 카키",
  "네이비",
  "인디고 블루",
  "뮤트 라벤더",
  "브라운",
  "그레이",
];

export const PALETTE_SWATCHES: { name: string; hex: string }[] = [
  { name: "블랙", hex: "#1A1A1A" },
  { name: "화이트", hex: "#F4F2EE" },
  { name: "웜 아이보리", hex: "#EFE8DC" },
  { name: "크림", hex: "#F3EDE1" },
  { name: "오트밀", hex: "#E4D5C1" },
  { name: "베이지", hex: "#D9CBB8" },
  { name: "카멜", hex: "#C4A574" },
  { name: "차콜", hex: "#4A4A4A" },
  { name: "딥 버건디", hex: "#4A1525" },
  { name: "올리브 카키", hex: "#6B6B43" },
  { name: "네이비", hex: "#1D2B4A" },
  { name: "인디고 블루", hex: "#2C3A6B" },
  { name: "뮤트 라벤더", hex: "#B7A8C4" },
  { name: "브라운", hex: "#6B4A32" },
  { name: "그레이", hex: "#8A8680" },
];

const PALETTE_ALIASES: Record<string, string> = {
  아이보리: "웜 아이보리",
  버건디: "딥 버건디",
  인디고: "인디고 블루",
  탄: "베이지",
  다크브라운: "브라운",
  골드: "카멜",
  멜란지그레이: "그레이",
  "미디엄 블루": "인디고 블루",
  "다크 인디고": "인디고 블루",
  "라이트 블루": "인디고 블루",
  "블랙/그레이시": "차콜",
};

export function paletteCatalogId(category: "top" | "bottom", color: string): string {
  return `palette-${category}:${color}`;
}

export function parsePaletteCatalogId(
  id: string,
): { category: "top" | "bottom"; color: string } | null {
  const match = /^palette-(top|bottom):(.+)$/.exec(id);
  if (!match) return null;
  return { category: match[1] as "top" | "bottom", color: match[2] };
}

export function nearestPaletteColor(color: string): string {
  if (COLOR_OPTIONS.includes(color)) return color;
  return PALETTE_ALIASES[color] ?? COLOR_OPTIONS[0];
}

export function colorsFromChecklistIds(ids: string[]): string[] {
  const colors: string[] = [];
  for (const id of ids) {
    const parsed = parsePaletteCatalogId(id);
    if (parsed && !colors.includes(parsed.color)) colors.push(parsed.color);
    const catalog = ALL_CATALOG.find((entry) => entry.id === resolveCatalogId(id));
    if (catalog?.defaultColor) {
      const mapped = nearestPaletteColor(catalog.defaultColor);
      if (!colors.includes(mapped)) colors.push(mapped);
    }
  }
  return colors;
}

export function isSkipId(id: string): id is (typeof SKIP_IDS)[keyof typeof SKIP_IDS] {
  return id === SKIP_IDS.bag || id === SKIP_IDS.accessory;
}

export function skipIdFor(category: "bag" | "accessory"): string {
  return SKIP_IDS[category];
}

export function catalogIdCategory(id: string): ItemCategory | "skip" | null {
  if (isSkipId(id)) return "skip";
  const parsed = parsePaletteCatalogId(id);
  if (parsed) return parsed.category;
  return ALL_CATALOG.find((entry) => entry.id === id)?.category ?? null;
}

export function resolveCatalogId(id: string): string {
  return LEGACY_CATALOG_IDS[id] ?? id;
}

export function checklistColorMap(
  items: { source?: string; catalogId?: string; color?: string }[],
): Record<string, string[]> {
  const colors: Record<string, string[]> = {};
  const add = (id: string, color: string) => {
    const list = colors[id] ?? [];
    if (!list.includes(color)) list.push(color);
    colors[id] = list;
  };
  let pearlSetting = false;
  for (const item of items) {
    if (item.source !== "checklist" || !item.catalogId || !item.color) continue;
    if (item.catalogId === "accessory-earrings-pearl") {
      pearlSetting = true;
      continue;
    }
    add(resolveCatalogId(item.catalogId), item.color);
  }
  if (pearlSetting) add("accessory-earrings-gold", "진주 세팅");
  return colors;
}

export function normalizeChecklistIds(ids: string[]): string[] {
  const next: string[] = [];
  const seen = new Set<string>();
  const add = (id: string) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    next.push(id);
  };
  for (const raw of ids) {
    const id = resolveCatalogId(raw);
    const parsed = parsePaletteCatalogId(id);
    if (parsed) {
      add(paletteCatalogId(parsed.category, nearestPaletteColor(parsed.color)));
      continue;
    }
    if (isSkipId(id)) {
      add(id);
      continue;
    }
    add(id);
  }

  const hasBagItem = next.some((id) => catalogIdCategory(id) === "bag");
  const hasAccessoryItem = next.some((id) => catalogIdCategory(id) === "accessory");
  return next.filter((id) => {
    if (id === SKIP_IDS.bag) return !hasBagItem;
    if (id === SKIP_IDS.accessory) return !hasAccessoryItem;
    return true;
  });
}

export const AGE_OPTIONS: { id: Exclude<import("./types").AgeGroup, "">; label: string }[] = [
  { id: "10s20s", label: "10–20대 (보조 정보)" },
  { id: "20s30s", label: "20–30대 (보조 정보)" },
  { id: "40s50s", label: "40–50대 (보조 정보)" },
];

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  top: "상의",
  bottom: "하의",
  skirt: "스커트",
  outer: "아우터",
  shoes: "슈즈",
  bag: "가방",
  accessory: "액세서리",
};

export interface CatalogFilterState {
  lengths: ItemLength[];
  families: string[];
  colorTones: string[];
}

export const EMPTY_FILTER: CatalogFilterState = { lengths: [], families: [], colorTones: [] };

export function toggleFilterValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

export function isFilterActive(filter: CatalogFilterState): boolean {
  return filter.lengths.length + filter.families.length + filter.colorTones.length > 0;
}

export function matchesCatalogFilter(item: CatalogItem, filter: CatalogFilterState): boolean {
  if (!isFilterActive(filter)) return true;
  if (filter.lengths.length) {
    if (!item.length || !filter.lengths.includes(item.length)) return false;
  }
  if (filter.families.length) {
    if (!item.family || !filter.families.includes(item.family)) return false;
  }
  if (filter.colorTones.length) {
    if (!item.colorTone || !filter.colorTones.includes(item.colorTone)) return false;
  }
  return true;
}

export const CATEGORY_FILTERS: Partial<
  Record<
    ItemCategory,
    {
      lengths?: { id: ItemLength; label: string }[];
      families?: { id: string; label: string }[];
      colorTones?: { id: string; label: string }[];
    }
  >
> = {
  outer: {
    lengths: [
      { id: "short", label: "숏" },
      { id: "midi", label: "미디" },
      { id: "long", label: "롱" },
    ],
    families: [
      { id: "coat", label: "코트" },
      { id: "jacket", label: "재킷" },
      { id: "cardigan", label: "가디건" },
      { id: "padding", label: "패딩" },
      { id: "fur", label: "무스탕·퍼" },
    ],
  },
  bottom: {
    families: [
      { id: "slacks", label: "슬랙스" },
      { id: "denim", label: "데님" },
      { id: "sweat", label: "컴포터블 캐주얼" },
    ],
    colorTones: [
      { id: "라이트 블루", label: "라이트 블루(연청)" },
      { id: "미디엄 블루", label: "미디엄 블루(중청)" },
      { id: "다크 인디고", label: "다크 인디고(진청)" },
      { id: "블랙/그레이시", label: "블랙·그레이시(흑청)" },
    ],
  },
  shoes: {
    families: [
      { id: "boots", label: "부츠" },
      { id: "loafer", label: "로퍼·구두" },
      { id: "dress", label: "펌프스·더비" },
      { id: "sneaker", label: "스니커즈" },
    ],
    lengths: [
      { id: "short", label: "숏" },
      { id: "midi", label: "미디" },
      { id: "long", label: "롱" },
    ],
  },
};
