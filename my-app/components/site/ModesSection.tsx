"use client";

import { useState } from "react";
import { Brain, Droplet, Share2, Triangle, Zap } from "lucide-react";
import { SectionEyebrow } from "./SectionEyebrow";

const modes = [
  {
    name: "Panic Mode",
    shortName: "Panic",
    description: "Get an immediate, high-signal route through the noise.",
    icon: Triangle,
  },
  {
    name: "Reverse Revision",
    shortName: "Reverse",
    description: "Start with the answer and work backward to the why.",
    icon: Zap,
  },
  {
    name: "Deep Architecture",
    shortName: "Deep",
    description: "Turn disconnected notes into a map you can remember.",
    icon: Share2,
  },
  {
    name: "Zero-time Summary",
    shortName: "Summary",
    description: "Compress a long chapter into its essential signal.",
    icon: Droplet,
  },
];

export function ModesSection() {
  const [selectedMode, setSelectedMode] = useState(0);
  const selected = modes[selectedMode];

  return (
    <section className="page-section modes-section" id="modes">
      <div className="section-content modes-layout">
        <div className="section-intro">
          <SectionEyebrow>Choose your mode</SectionEyebrow>
          <h2 className="section-title">
            Different pressure.
            <span>One clear path.</span>
          </h2>
          <p className="section-copy">
            Every study session has a different shape. Pick the mode that fits
            your moment and let the engine handle the structure.
          </p>
          <div className="selected-mode-copy" aria-live="polite">
            <span className="selected-mode-index">0{selectedMode + 1}</span>
            <div>
              <h3>{selected.name}</h3>
              <p>{selected.description}</p>
            </div>
          </div>
        </div>

        <div className="mode-grid" aria-label="Study modes">
          {modes.map((mode, index) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === index;

            return (
              <button
                type="button"
                key={mode.name}
                className={`mode-card hover-glow-card ${
                  isSelected ? "is-selected" : ""
                }`}
                onClick={() => setSelectedMode(index)}
                aria-pressed={isSelected}
              >
                <span className="mode-card-topline">
                  <span className="mode-icon"><Icon size={18} /></span>
                  <span className="mode-index">0{index + 1}</span>
                </span>
                <span className="mode-name">{mode.shortName}</span>
                <span className="mode-label">MODE</span>
                <span className="mode-connector" />
              </button>
            );
          })}
          <div className="mode-orbit mode-orbit-one" />
          <div className="mode-orbit mode-orbit-two" />
          <div className="mode-core" aria-hidden="true"><Brain size={22} /></div>
        </div>
      </div>
    </section>
  );
}
