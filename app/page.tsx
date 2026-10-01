import { ArrowRight, Waves } from "lucide-react";
import Link from "next/link";
import LandingHero from "@/components/landing-hero";

export default function Home() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="container landing-header-inner">
          <Link className="brand" href="/" aria-label="TunaGuard, beranda">
            <span className="brand-mark"><Waves size={23} strokeWidth={2.7} /></span>
            <span>Tuna<span>Guard</span><small>MONITORING SYSTEM</small></span>
          </Link>
          <Link className="landing-header-link" href="/dashboard">Dashboard <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </header>
      <main><LandingHero /></main>
    </div>
  );
}
