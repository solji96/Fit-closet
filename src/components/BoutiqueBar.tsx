import { useState } from "react";
import { useStore } from "../data/store";
import { KeepSheet } from "./Keeps";

interface Props {
  profileOpen: boolean;
  cueProfile?: boolean;
  onProfile: () => void;
}

export function BoutiqueBar({ profileOpen, cueProfile, onProfile }: Props) {
  const { state } = useStore();
  const [keep, setKeep] = useState<"loved" | "bag" | null>(null);

  return (
    <>
      <div className="boutique-bar">
        <p className="brand-kicker">MY CURATED WARDROBE</p>
        <nav className="line-nav" aria-label="바로가기">
          <button
            className={state.loved.length && keep !== "loved" ? "line-icon is-cue" : "line-icon"}
            type="button"
            aria-label={state.loved.length ? `애정 템 ${state.loved.length}` : "애정 템"}
            aria-expanded={keep === "loved"}
            onClick={() => setKeep("loved")}
          >
            <HeartIcon />
          </button>
          <button
            className={cueProfile && !profileOpen ? "line-icon is-cue" : "line-icon"}
            type="button"
            aria-label="프로필"
            aria-expanded={profileOpen}
            onClick={onProfile}
          >
            <PersonIcon />
          </button>
          <button
            className={state.bag.length && keep !== "bag" ? "line-icon is-cue" : "line-icon"}
            type="button"
            aria-label={state.bag.length ? `장바구니 ${state.bag.length}` : "장바구니"}
            aria-expanded={keep === "bag"}
            onClick={() => setKeep("bag")}
          >
            <BagIcon />
          </button>
        </nav>
      </div>
      <KeepSheet open={keep} onClose={() => setKeep(null)} />
    </>
  );
}

export function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 18.6c-.3-.2-6.4-3.8-6.4-8a3.5 3.5 0 0 1 6-2.4 3.5 3.5 0 0 1 6 2.4c0 4.2-6.1 7.8-6.4 8z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3" />
      <path d="M5.6 19.2c.7-3 3.1-4.5 6.4-4.5s5.7 1.5 6.4 4.5" />
    </svg>
  );
}

export function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.6 8.4h10.8l-.8 10.4H7.4L6.6 8.4z" />
      <path d="M9 8.4V7a3 3 0 0 1 6 0v1.4" />
    </svg>
  );
}
