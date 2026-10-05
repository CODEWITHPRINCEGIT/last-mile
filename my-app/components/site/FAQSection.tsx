import { ChevronDown } from "lucide-react";
import { SectionEyebrow } from "./SectionEyebrow";

const questions = [
  ["What can I bring into the engine?", "Notes, slides, links, and rough ideas all work. The goal is to give the engine enough signal to make the next step obvious."],
  ["Can I switch modes halfway through?", "Yes. A session can change shape as your understanding changes, so you can move from a fast summary to a deeper architecture whenever you need."],
  ["Is this built for last-minute studying only?", "No. The modes are designed for deadline pressure, but the same structure is useful for weekly review and long-term learning."],
];

export function FAQSection() {
  return (
    <section className="page-section faq-section" id="faq">
      <div className="section-content faq-layout">
        <div className="section-intro">
          <SectionEyebrow>One less thing to wonder</SectionEyebrow>
          <h2 className="section-title">
            Clear answers
            <span>before you begin.</span>
          </h2>
          <p className="section-copy">
            Still have a question? The footer lines in the corner are ready for
            the next chapter of this story.
          </p>
        </div>

        <div className="faq-list">
          {questions.map(([question, answer], index) => (
            <details className="faq-item hover-glow-card" key={question} open={index === 0}>
              <summary className="hover-glow-text">
                <span>{question}</span>
                <ChevronDown size={18} />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
