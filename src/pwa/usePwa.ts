import { useEffect, useState } from "react";
import { useStore } from "../data/store";

const INSTALL_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

export function usePwa() {
  const { state } = useStore();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const notificationSupported = typeof window !== "undefined" && "Notification" in window;

  useEffect(() => {
    const onPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      const dismissed = state.installDismissedAt
        ? Date.now() - new Date(state.installDismissedAt).getTime() < INSTALL_COOLDOWN_MS
        : false;
      if (!dismissed) setDeferred(event);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [state.installDismissedAt]);

  return {
    notificationSupported,
    canInstall: Boolean(deferred),
    install: async () => {
      await deferred?.prompt();
      setDeferred(null);
    },
    dismiss: () => setDeferred(null),
  };
}

export function registerServiceWorker() {
  if ("serviceWorker" in navigator && (import.meta.env.PROD || import.meta.env.VITE_VAPID_PUBLIC_KEY)) {
    void navigator.serviceWorker.register("/sw.js");
  }
}
