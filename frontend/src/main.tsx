import React, { useState, useCallback } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { SplashScreen } from "@/components/sentinel/SplashScreen";
import "./styles.css";

const router = getRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  // Sentinel splash plays once per browser session and respects reduced-motion
  const [splashDone, setSplashDone] = useState(() => {
    if (typeof window !== "undefined") {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const seen = sessionStorage.getItem("argus_sentinel_seen") === "true";
      return reduced || seen;
    }
    return false;
  });

  const handleSplashComplete = useCallback(() => {
    setSplashDone(true);
  }, []);

  return (
    <>
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
      {/* Mount router immediately so it can preload; hidden behind splash */}
      <div
        aria-hidden={!splashDone}
        style={splashDone ? undefined : { visibility: "hidden", pointerEvents: "none" }}
      >
        <RouterProvider router={router} />
      </div>
    </>
  );
}

const rootElement = document.getElementById("root");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
