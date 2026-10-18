import { Navigate, Route, Routes } from "react-router-dom";
import { BottomNav } from "./components/BottomNav";
import { useStore } from "./data/store";
import { CalendarScreen } from "./screens/CalendarScreen";
import { InboxScreen } from "./screens/InboxScreen";
import { NicknameScreen } from "./screens/NicknameScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { OutfitScreen } from "./screens/OutfitScreen";
import { PreferencesScreen } from "./screens/PreferencesScreen";
import { WardrobeScreen } from "./screens/WardrobeScreen";

function SyncNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="field-error app-sync-note" role="alert">
      {message}
    </p>
  );
}

export default function App() {
  const { state, ready, syncMessage, signedIn } = useStore();

  if (!ready) {
    return (
      <main className="app-shell boutique-lounge">
        <p className="brand-kicker">스마트 패션 캘린더</p>
        <h1>옷장을 불러오는 중</h1>
        <p className="lede">Supabase에 저장된 옷장과 프로필을 읽고 있습니다.</p>
      </main>
    );
  }

  if (!state.onboardingComplete) {
    return (
      <>
        <SyncNote message={syncMessage} />
        <Routes>
          <Route path="*" element={<OnboardingScreen />} />
        </Routes>
      </>
    );
  }

  if (!signedIn) {
    return (
      <>
        <SyncNote message={syncMessage} />
        <NicknameScreen />
      </>
    );
  }

  return (
    <>
      <a className="sr-only" href="#main">
        본문으로 건너뛰기
      </a>
      <SyncNote message={syncMessage} />
      <Routes>
        <Route path="/" element={<Navigate to="/outfit" replace />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="/calendar" element={<CalendarScreen />} />
        <Route path="/outfit" element={<OutfitScreen />} />
        <Route path="/outfit/:eventId" element={<OutfitScreen />} />
        <Route path="/wardrobe" element={<WardrobeScreen />} />
        <Route path="/inbox" element={<InboxScreen />} />
        <Route path="/preferences" element={<PreferencesScreen />} />
        <Route path="*" element={<Navigate to="/outfit" replace />} />
      </Routes>
      <BottomNav />
    </>
  );
}
