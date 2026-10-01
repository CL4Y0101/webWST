"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const titles = ["terpantau.", "terkendali.", "terjaga."];

export default function LandingHero() {
  const [activeTitle, setActiveTitle] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActiveTitle((current) => (current + 1) % titles.length), 2600);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="landing container" aria-labelledby="landing-title">
      <div className="landing-copy">
        <p className="landing-kicker">PEMANTAUAN RANTAI DINGIN TUNA</p>
        <h1 id="landing-title" aria-label="Rantai dingin yang terpantau, terkendali, dan terjaga.">
          <span>Rantai dingin yang</span>
          <span className="landing-rotator" aria-hidden="true">
            {titles.map((title, index) => (
              <span key={title} className={`landing-word ${index === activeTitle ? "is-current" : index === (activeTitle + titles.length - 1) % titles.length ? "is-past" : ""}`}>
                {title}
              </span>
            ))}
          </span>
        </h1>
        <p className="landing-lede">Pantau suhu dan kelembapan ruang penyimpanan tuna, dari sensor di armada hingga pembacaan di dashboard.</p>
        <div className="landing-actions">
          <Link className="landing-cta" href="/dashboard">Buka dashboard <ArrowRight size={18} aria-hidden="true" /></Link>
          <Link className="landing-link" href="/dashboard#cara-kerja">Lihat cara kerja</Link>
        </div>
        <p className="landing-path">DHT22 + ESP32 <span aria-hidden="true">/</span> Firebase <span aria-hidden="true">/</span> Dashboard</p>
      </div>
    </section>
  );
}
