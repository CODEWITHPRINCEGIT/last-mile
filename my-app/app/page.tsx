"use client";

import { useEffect, useState } from "react";
import { BackgroundEffects } from "../components/site/BackgroundEffects";
import { FAQSection } from "../components/site/FAQSection";
import { HeroSection } from "../components/site/HeroSection";
import { HowItWorksSection } from "../components/site/HowItWorksSection";
import { InteractiveFooter } from "../components/site/InteractiveFooter";
import { ModesSection } from "../components/site/ModesSection";
import { Navbar } from "../components/site/Navbar";
import { PricingSection } from "../components/site/PricingSection";
import type { NavItem, SectionId } from "../components/site/types";

const navItems: NavItem[] = [
  { id: "overview", label: "Overview" },
  { id: "modes", label: "Modes" },
  { id: "how-it-works", label: "How It Works" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
];

export default function Home() {
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [activeFooterLine, setActiveFooterLine] = useState<number | null>(null);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, behavior: "auto" });

    const sectionElements = navItems
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    const updateActiveSection = () => {
      if (window.scrollY < 40) {
        setActiveSection("overview");
        return;
      }

      const focusPoint = window.scrollY + window.innerHeight * 0.42;
      const currentSection = sectionElements.find((section) => {
        const top = section.getBoundingClientRect().top + window.scrollY;
        const bottom = top + section.offsetHeight;
        return focusPoint >= top && focusPoint < bottom;
      });

      if (currentSection) {
        setActiveSection(currentSection.id as SectionId);
      }
    };

    const animationFrame = window.requestAnimationFrame(updateActiveSection);
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  const handleNavigate = (sectionId: SectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="site-shell">
      <BackgroundEffects />
      <Navbar
        activeSection={activeSection}
        items={navItems}
        onNavigate={handleNavigate}
      />
      <main>
        <HeroSection onExplore={() => handleNavigate("modes")} />
        <ModesSection />
        <HowItWorksSection />
        <PricingSection />
        <FAQSection />
      </main>
      <InteractiveFooter
        activeIndex={activeFooterLine}
        onSelect={setActiveFooterLine}
      />
    </div>
  );
}
