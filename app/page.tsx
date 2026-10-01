import { ArrowRight, Waves } from "lucide-react";
import LandingHero from "@/components/landing-hero";
import { TransitionLink } from "@/components/page-transition";

export default function Home() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="container landing-header-inner">
          <TransitionLink className="brand" href="/" aria-label="TunaGuard, beranda">
            <span className="brand-mark"><Waves size={23} strokeWidth={2.7} /></span>
            <span>Tuna<span>Guard</span><small>MONITORING SYSTEM</small></span>
          </TransitionLink>
          <TransitionLink className="landing-header-link" href="/dashboard">Dashboard <ArrowRight size={16} aria-hidden="true" /></TransitionLink>
        </div>
      </header>
      <main><LandingHero /></main>
    </div>
  );
}
