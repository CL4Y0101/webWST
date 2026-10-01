"use client";

import { Fragment, useEffect, useRef, useState } from "react";

const text = "Saat suhu berubah di perjalanan, pembacaan sensor membantu tim melihat kondisi dan menentukan tindakan.";
const words = text.split(" ");

function wordOpacity(progress: number, index: number) {
  const start = (index / Math.max(1, words.length - 1)) * 0.8;
  const amount = Math.max(0, Math.min(1, (progress - start) / 0.2));
  return 0.2 + amount * 0.8;
}

export default function ScrollWordReveal() {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;

    const update = () => {
      frame = 0;
      const section = sectionRef.current;
      if (!section) return;
      const bounds = section.getBoundingClientRect();
      const start = window.innerHeight * 0.78;
      const distance = window.innerHeight * 0.48;
      setProgress(Math.max(0, Math.min(1, (start - bounds.top) / distance)));
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section ref={sectionRef} className="scroll-reveal-section" aria-labelledby="scroll-reveal-heading">
      <div className="container scroll-reveal-inner">
        <div className="scroll-reveal-track" aria-hidden="true"><span style={progress !== null ? { transform: `scaleY(${progress})` } : undefined} /></div>
        <div>
          <p className="scroll-reveal-kicker">DARI DATA KE TINDAKAN</p>
          <h2 id="scroll-reveal-heading" aria-label={text}>
            {words.map((word, index) => (
              <Fragment key={`${word}-${index}`}>
                <span className="scroll-reveal-word" aria-hidden="true" style={progress !== null ? { opacity: wordOpacity(progress, index) } : undefined}>{word}</span>
                {index < words.length - 1 ? " " : null}
              </Fragment>
            ))}
          </h2>
        </div>
      </div>
    </section>
  );
}
