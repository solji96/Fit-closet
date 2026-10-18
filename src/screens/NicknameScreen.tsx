import { useState } from "react";
import { BoutiqueBar } from "../components/BoutiqueBar";
import { ProfileAccess } from "../components/ProfileAccess";

export function NicknameScreen() {
  const [profileOpen, setProfileOpen] = useState(true);

  return (
    <main id="main" className="app-shell stack boutique-lounge">
      <BoutiqueBar
        profileOpen={profileOpen}
        cueProfile
        onProfile={() => setProfileOpen(true)}
        onLeave={() => setProfileOpen(false)}
      />
      <h1>다시 만나서 반가워요.</h1>
      <p className="lede">이름과 숫자 4자리를 입력하면 옷장이 열려요.</p>
      {profileOpen ? null : (
        <button className="onboarding-next is-sentence" type="button" onClick={() => setProfileOpen(true)}>
          옷장 열기
        </button>
      )}
      <ProfileAccess
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        submitLabel="옷장 열기"
        busyLabel="확인하고 있어요"
        onReady={() => setProfileOpen(false)}
      />
    </main>
  );
}
