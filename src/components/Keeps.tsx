import { useEffect, useId, useRef, useState } from "react";
import { isKept, type KeepEntry } from "../data/keeps";
import { useStore } from "../data/store";
import { BagIcon, HeartIcon } from "./BoutiqueBar";
import { ProfileMenu } from "./ProfileAccess";

export function KeepMarks({ entry }: { entry: KeepEntry }) {
  const { state, dispatch } = useStore();
  const loved = isKept(state.loved, entry.kind, entry.id);
  const bagged = isKept(state.bag, entry.kind, entry.id);
  const toggle = (list: "loved" | "bag") => dispatch({ type: "toggle_keep", list, entry });

  return (
    <span className="keep-marks">
      <button
        className={loved ? "line-icon keep-toggle is-loved is-on" : "line-icon keep-toggle is-loved"}
        type="button"
        aria-pressed={loved}
        aria-label={loved ? `${entry.name} 애정 템에서 빼기` : `${entry.name} 애정 템에 담기`}
        onClick={(event) => {
          event.stopPropagation();
          toggle("loved");
        }}
      >
        <HeartIcon />
      </button>
      <button
        className={bagged ? "line-icon keep-toggle is-bag is-on" : "line-icon keep-toggle is-bag"}
        type="button"
        aria-pressed={bagged}
        aria-label={bagged ? `${entry.name} 장바구니에서 빼기` : `${entry.name} 장바구니에 담기`}
        onClick={(event) => {
          event.stopPropagation();
          toggle("bag");
        }}
      >
        <BagIcon />
      </button>
    </span>
  );
}

export function KeepNav() {
  const { state } = useStore();
  const [open, setOpen] = useState<"loved" | "bag" | null>(null);

  return (
    <>
      <div className="line-nav keep-nav" aria-label="보관한 아이템">
        <button
          className={state.loved.length && open !== "loved" ? "line-icon is-cue" : "line-icon"}
          type="button"
          aria-label={state.loved.length ? `애정 템 ${state.loved.length}` : "애정 템"}
          aria-expanded={open === "loved"}
          onClick={() => setOpen("loved")}
        >
          <HeartIcon />
        </button>
        <ProfileMenu />
        <button
          className={state.bag.length && open !== "bag" ? "line-icon is-cue" : "line-icon"}
          type="button"
          aria-label={state.bag.length ? `장바구니 ${state.bag.length}` : "장바구니"}
          aria-expanded={open === "bag"}
          onClick={() => setOpen("bag")}
        >
          <BagIcon />
        </button>
      </div>
      <KeepSheet open={open} onClose={() => setOpen(null)} />
    </>
  );
}

export function KeepSheet({ open, onClose }: { open: "loved" | "bag" | null; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const list = open === "loved" ? state.loved : state.bag;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const title = open === "loved" ? "애정 템" : "장바구니";
  const empty =
    open === "loved"
      ? "아직 담아 둔 애정 템이 없어요. 하트를 누르면 여기에 모여요."
      : "나중에 보고 싶은 아이템을 쇼핑백으로 담아 두세요.";

  return (
    <div className="profile-backdrop" onClick={onClose}>
      <aside
        className="profile-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="profile-sheet-top">
          <p className="brand-kicker">{open === "loved" ? "LOVED" : "BAG"}</p>
          <button ref={closeRef} className="line-icon sheet-close" type="button" aria-label="닫기" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <h2 id={titleId}>{title}</h2>
        {list.length === 0 ? (
          <p className="lede">{empty}</p>
        ) : (
          <ul className="keep-list">
            {list.map((entry) => (
              <li key={`${entry.kind}:${entry.id}`} className="keep-row">
                <span>
                  <strong>{entry.name}</strong>
                  {entry.detail ? <span className="muted"> {entry.detail}</span> : null}
                </span>
                <button
                  className={open === "loved" ? "line-icon keep-toggle is-loved is-on" : "line-icon keep-toggle is-bag is-on"}
                  type="button"
                  aria-label={`${entry.name} ${title}에서 빼기`}
                  onClick={() => dispatch({ type: "toggle_keep", list: open, entry })}
                >
                  {open === "loved" ? <HeartIcon /> : <BagIcon />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7l10 10M17 7L7 17" />
    </svg>
  );
}
