"use client";

import { useEffect } from "react";

export default function SplashHydrationGate() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem("hasSeenSplash") === "true") {
        document.documentElement.classList.add("splash-seen");
      }
    } catch {}
  }, []);

  return null;
}
