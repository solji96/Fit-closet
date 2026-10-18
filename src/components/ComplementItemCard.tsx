import { CATEGORY_LABELS } from "../data/catalog";
import type { ComplementItem } from "../data/types";
import { KeepMarks } from "./Keeps";

interface Props {
  item: ComplementItem | null;
  completeWithoutPurchase: boolean;
}

export function ComplementItemCard({ item, completeWithoutPurchase }: Props) {
  if (completeWithoutPurchase || !item) {
    return (
      <aside className="stack">
        <p className="section-kicker">COMPLEMENT</p>
        <h3>추가 구매 없이 완성되는 코디</h3>
        <p className="muted">메인 룩과 얼터너티브 룩은 등록된 보유 아이템만으로 구성했습니다.</p>
      </aside>
    );
  }

  return (
    <aside className="stack">
      <p className="section-kicker">OPTIONAL PIECE</p>
      <h3>{item.name}</h3>
      <KeepMarks entry={{ kind: "wish", id: item.id, name: item.name, detail: "담고 싶은 제안" }} />
      <p className="status-tag">{CATEGORY_LABELS[item.category]} · 데모 데이터</p>
      <p>{item.reason}</p>
      <p className="helper">
        선택형 제안이며 제휴 API·재고·구매는 연결되어 있지 않습니다. 클릭해도 결제되지 않습니다.
      </p>
      {item.isAffiliate ? (
        <button className="btn" type="button" disabled>
          제휴 링크 (데모 · 비활성)
        </button>
      ) : null}
    </aside>
  );
}
