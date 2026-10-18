import { useState } from "react";
import { BoutiqueBar } from "../components/BoutiqueBar";
import { ProfileAccess } from "../components/ProfileAccess";

export function NicknameScreen() {
  const [profileOpen, setProfileOpen] = useState(true);

  return (
    <main id="main" className="app-shell stack boutique-lounge">
      <BoutiqueBar profileOpen={profileOpen} cueProfile onProfile={() => setProfileOpen(true)} />
      <h1>다시 만나서 반가워요.</h1>
      <p className="lede">프로필 아이콘을 누르면, 닉네임과 PIN으로 옷장을 열 수 있어요.</p>
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
