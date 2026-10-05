import { Check, MoveUpRight } from "lucide-react";
import { SectionEyebrow } from "./SectionEyebrow";

const plans = [
  {
    name: "Sprint",
    detail: "For the occasional study emergency.",
    price: "Free",
    features: ["3 sessions each month", "Core study modes", "Shareable summaries"],
  },
  {
    name: "Flow",
    detail: "For a steady, clearer study rhythm.",
    price: "$12",
    features: ["Unlimited sessions", "All study modes", "Saved learning paths"],
    featured: true,
  },
];

export function PricingSection() {
  return (
    <section className="page-section pricing-section" id="pricing">
      <div className="section-content pricing-layout">
        <div className="section-intro">
          <SectionEyebrow>Keep your momentum</SectionEyebrow>
          <h2 className="section-title">
            Less friction.
            <span>More finished work.</span>
          </h2>
          <p className="section-copy">
            Start light, then make the engine part of your everyday rhythm when
            it earns a permanent place in your workflow.
          </p>
          <button type="button" className="text-link hover-glow-text">
            Compare all features <MoveUpRight size={15} />
          </button>
        </div>

        <div className="plans-grid">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`plan-card hover-glow-card ${plan.featured ? "is-featured" : ""}`}
            >
              {plan.featured && <span className="plan-tag">Most focused</span>}
              <div className="plan-topline">
                <h3>{plan.name}</h3>
                <span className="plan-price">{plan.price}<small>{plan.price !== "Free" && "/mo"}</small></span>
              </div>
              <p className="plan-detail">{plan.detail}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}><Check size={15} />{feature}</li>
                ))}
              </ul>
              <button type="button" className={`button plan-button hover-glow-button ${plan.featured ? "button-solid" : "button-quiet"}`}>
                Start {plan.name} <MoveUpRight size={15} />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
