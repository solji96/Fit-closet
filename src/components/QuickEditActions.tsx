interface Props {
  onAction: (action: "reroll_top" | "change_bottom" | "more_formal" | "other_mood") => void;
}

const ACTIONS = [
  { id: "reroll_top" as const, label: "상의만 재추천" },
  { id: "change_bottom" as const, label: "하의만 다시 맞추기" },
  { id: "more_formal" as const, label: "더 단정하게" },
  { id: "other_mood" as const, label: "다른 무드로 보기" },
];

export function QuickEditActions({ onAction }: Props) {
  return (
    <div className="quick-grid">
      {ACTIONS.map((action) => (
        <button key={action.id} className="btn" type="button" onClick={() => onAction(action.id)}>
          {action.label}
        </button>
      ))}
    </div>
  );
}
