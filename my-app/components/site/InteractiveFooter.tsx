"use client";

type InteractiveFooterProps = {
  activeIndex: number | null;
  onSelect: (index: number | null) => void;
};

const footerLines = [
  { label: "Start with clarity", message: "Your next step can be smaller than you think." },
  { label: "Build your signal", message: "Choose a mode and let the noise fall away." },
  { label: "Make it memorable", message: "Good structure gives your attention somewhere to land." },
  { label: "Keep moving", message: "The last mile is still progress. Keep your pace." },
];

export function InteractiveFooter({ activeIndex, onSelect }: InteractiveFooterProps) {
  const activeLine = activeIndex === null ? null : footerLines[activeIndex];

  return (
    <aside className="interactive-footer" aria-label="Project notes">
      {activeLine && (
        <div className="footer-message" aria-live="polite">
          <span>{activeLine.label}</span>
          <p>{activeLine.message}</p>
        </div>
      )}
      <div className="footer-controls">
        <span className="footer-caption">Curated by Prince Modi</span>
        <div className="footer-lines" role="tablist" aria-label="Project notes">
          {footerLines.map((line, index) => (
            <button
              type="button"
              role="tab"
              key={line.label}
              aria-label={`Show note ${index + 1}: ${line.label}`}
              aria-selected={activeIndex === index}
              className={`footer-line hover-glow-button ${activeIndex === index ? "is-active" : ""}`}
              onClick={() => onSelect(activeIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
