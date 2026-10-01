"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Phase = "idle" | "cover" | "reveal";

const NavigationContext = createContext<(href: string) => void>(() => {});

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const target = useRef<string | null>(null);

  const navigate = useCallback((href: string) => {
    const nextPath = href.split("#")[0] || pathname;
    if (nextPath === pathname || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(href);
      return;
    }
    if (target.current) return;
    target.current = href;
    setPhase("cover");
  }, [pathname, router]);

  useEffect(() => {
    if (phase !== "cover" || !target.current || pathname !== target.current.split("#")[0]) return;
    const frame = window.requestAnimationFrame(() => setPhase("reveal"));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname, phase]);

  useEffect(() => {
    if (phase !== "cover") return;
    const timeout = window.setTimeout(() => setPhase("reveal"), 4000);
    return () => window.clearTimeout(timeout);
  }, [phase]);

  return (
    <NavigationContext.Provider value={navigate}>
      {children}
      <div
        className={`page-wipe page-wipe-${phase}`}
        aria-hidden="true"
        onAnimationEnd={() => {
          if (phase === "cover" && target.current) router.push(target.current);
          if (phase === "reveal") {
            target.current = null;
            setPhase("idle");
          }
        }}
      />
    </NavigationContext.Provider>
  );
}

export function TransitionLink({ href, onClick, ...props }: Omit<React.ComponentProps<typeof Link>, "href"> & { href: string }) {
  const navigate = useContext(NavigationContext);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (new URL(href, window.location.href).pathname === window.location.pathname) return;
    event.preventDefault();
    navigate(href);
  }

  return <Link href={href} onClick={handleClick} {...props} />;
}
