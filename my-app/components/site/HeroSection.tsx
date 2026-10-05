"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, ArrowUpRight, Zap } from "lucide-react";

type HeroSectionProps = {
  onExplore: () => void;
};

export function HeroSection({ onExplore }: HeroSectionProps) {
  return (
    <section className="page-section hero-section" id="overview">
      <div className="hero-content section-content">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="hero-badge hover-glow-card"
        >
          <Zap size={14} fill="currentColor" />
          Unlock the New ERA of Studying!
          <ArrowRight size={14} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="hero-title"
        >
          Last-Mile
          <span>Study Engine</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="hero-description"
        >
          The new era of studying: turn chaos into your cheat sheet, then make
          the last mile feel effortless.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="hero-actions"
        >
          <a href="/launch" className="button button-quiet hover-glow-button">
            Open App <ArrowUpRight size={16} />
          </a>
          <button
            type="button"
            className="button button-solid hover-glow-button"
            onClick={onExplore}
          >
            Discover More
          </button>
        </motion.div>

        <button
          type="button"
          className="scroll-cue hover-glow-text"
          onClick={onExplore}
        >
          <span className="scroll-cue-icon">
            <ArrowDown size={14} />
          </span>
          Explore the system
        </button>
      </div>

      <div className="hero-side-note hero-side-note-left" aria-hidden="true">
        <span />
        <p>Focused learning<br />for the final stretch.</p>
      </div>
      <div className="hero-side-note hero-side-note-right" aria-hidden="true">
        <p>01 / 05</p>
        <span />
      </div>
    </section>
  );
}
