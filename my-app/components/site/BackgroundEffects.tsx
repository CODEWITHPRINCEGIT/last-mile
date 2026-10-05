"use client";

import { motion } from "framer-motion";

const meteors = [
  { height: "h-28", duration: 2.8, delay: 0 },
  { height: "h-20", duration: 2.2, delay: 0.8 },
  { height: "h-36", duration: 3.2, delay: 1.4 },
  { height: "h-24", duration: 2.5, delay: 2 },
  { height: "h-16", duration: 2, delay: 2.7 },
];

export function BackgroundEffects() {
  return (
    <div className="background-effects" aria-hidden="true">
      <div className="star-field" />
      <div className="ambient-glow ambient-glow-one" />
      <div className="ambient-glow ambient-glow-two" />
      <div className="ambient-glow ambient-glow-three" />
      <div className="meteor-field">
        {meteors.map((meteor, index) => (
          <motion.span
            key={index}
            className={`meteor ${meteor.height}`}
            animate={{ y: [0, 420], opacity: [0, 0.8, 0] }}
            transition={{
              repeat: Infinity,
              duration: meteor.duration,
              delay: meteor.delay,
              ease: "linear",
            }}
          />
        ))}
      </div>
    </div>
  );
}
