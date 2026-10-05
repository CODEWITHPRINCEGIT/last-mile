import { ArrowRight, FileText, GitBranch, Sparkles } from "lucide-react";
import { SectionEyebrow } from "./SectionEyebrow";

const steps = [
  {
    number: "01",
    title: "Drop in the chaos",
    copy: "Bring notes, slides, links, or the half-finished thought in your head.",
    icon: FileText,
  },
  {
    number: "02",
    title: "Choose a signal",
    copy: "Tell the engine whether you need speed, depth, structure, or recall.",
    icon: GitBranch,
  },
  {
    number: "03",
    title: "Leave with momentum",
    copy: "Get a focused path you can actually finish before the deadline arrives.",
    icon: Sparkles,
  },
];

export function HowItWorksSection() {
  return (
    <section className="page-section how-section" id="how-it-works">
      <div className="section-content">
        <div className="section-heading-row">
          <div>
            <SectionEyebrow>How it works</SectionEyebrow>
            <h2 className="section-title">
              From scattered notes
              <span>to a finished thought.</span>
            </h2>
          </div>
          <p className="section-copy section-copy-narrow">
            A simple three-step loop built for the part of studying where your
            attention is already running low.
          </p>
        </div>

        <div className="steps-grid">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div className="step-card hover-glow-card" key={step.number}>
                <div className="step-card-header">
                  <span className="step-number">{step.number}</span>
                  <Icon size={19} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
                {index < steps.length - 1 && (
                  <ArrowRight className="step-arrow" size={18} aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
