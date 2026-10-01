"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { BellRing, Clock3, Database, Gauge, Home, Menu, X } from "lucide-react";
import { TransitionLink } from "@/components/page-transition";

const links = [
  { label: "Beranda", href: "/", icon: Home },
  { label: "Dashboard", href: "/dashboard", icon: Gauge },
  { label: "Riwayat", href: "/dashboard#riwayat", icon: Clock3 },
  { label: "Peringatan", href: "/dashboard#peringatan", icon: BellRing },
  { label: "Cara kerja", href: "/dashboard#cara-kerja", icon: Database },
];

export default function CircleNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
      if (event.key !== "Tab" || !stageRef.current) return;
      const elements = Array.from(stageRef.current.querySelectorAll<HTMLElement>("button, a"));
      const first = elements[0];
      const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
    launcherRef.current?.focus();
  }

  return (
    <>
      <button ref={launcherRef} className={`circle-nav-launcher ${open ? "is-hidden" : ""}`} type="button" aria-label="Buka navigasi" aria-expanded={open} aria-controls="circle-nav-panel" onClick={() => setOpen(true)}>
        <Menu size={24} aria-hidden="true" />
      </button>
      <div id="circle-nav-panel" className={`circle-nav-overlay ${open ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Navigasi utama" aria-hidden={!open}>
        <button className="circle-nav-backdrop" type="button" tabIndex={-1} aria-label="Tutup navigasi" onClick={closeMenu} />
        <nav ref={stageRef} className="circle-nav-stage" aria-label="Navigasi halaman">
          <button ref={closeRef} className="circle-nav-center" type="button" aria-label="Tutup navigasi" tabIndex={open ? 0 : -1} onClick={closeMenu}><X size={25} aria-hidden="true" /></button>
          {links.map(({ label, href, icon: Icon }, index) => {
            const angle = (-90 + index * 72) * Math.PI / 180;
            const style = { "--orbit-x": `${Math.cos(angle) * 105}px`, "--orbit-y": `${Math.sin(angle) * 105}px`, "--orbit-delay": `${index * 45}ms` } as CSSProperties;
            const current = href === pathname;
            return (
              <TransitionLink key={href} href={href} className={`circle-nav-item ${current ? "is-current" : ""}`} style={style} tabIndex={open ? 0 : -1} aria-current={current ? "page" : undefined} onClick={() => setOpen(false)}>
                <span className="circle-nav-item-icon"><Icon size={21} aria-hidden="true" /></span>
                <span className="circle-nav-item-label">{label}</span>
              </TransitionLink>
            );
          })}
        </nav>
      </div>
    </>
  );
}
