import { useEffect, useState } from "react";

/**
 * PageLoader — shown during route transitions.
 * Usage: render it in __root.tsx when router is pending.
 */
export function PageLoader({ isLoading }: { isLoading: boolean }) {
  const [visible, setVisible] = useState(false);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setPct(15);
      const t1 = setTimeout(() => setPct(40), 120);
      const t2 = setTimeout(() => setPct(65), 350);
      const t3 = setTimeout(() => setPct(85), 700);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setPct(100);
      const t = setTimeout(() => {
        setVisible(false);
        setPct(0);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [isLoading]);

  if (!visible) return null;

  return (
    <>
      {/* Top progress bar */}
      <div
        className="page-loader-bar"
        style={{ width: `${pct}%`, opacity: pct === 100 ? 0 : 1 }}
        aria-hidden="true"
      />
      {/* Subtle overlay with scanning line */}
      {isLoading && (
        <div className="page-loader-overlay" aria-hidden="true">
          <div className="page-loader-scan" />
        </div>
      )}
    </>
  );
}
