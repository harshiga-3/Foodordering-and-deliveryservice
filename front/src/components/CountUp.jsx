import React, { useEffect, useRef, useState } from 'react';

export default function CountUp({ value = 0, duration = 800, formatter = (n) => n.toLocaleString() }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const from = fromRef.current;
    const to = Number(value) || 0;
    const d = Math.max(200, duration);

    const step = (now) => {
      const t = Math.min(1, (now - start) / d);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const v = Math.round(from + (to - from) * eased);
      setDisplay(v);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
        rafRef.current = null;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [value, duration]);

  return <span>{formatter(display)}</span>;
}
