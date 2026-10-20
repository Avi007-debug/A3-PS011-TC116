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
  // Always trigger the military cyber boot animation on page load or refresh
  const [splashDone, setSplashDone] = useState(false);

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
