"use client";

import { ArrowRight } from "lucide-react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import type { MouseEvent } from "react";
import { useRef } from "react";

export interface InteractiveFeatureLink {
  number: string;
  heading: string;
  subheading: string;
  imgSrc: string;
  href?: string;
}

interface InteractiveHoverLinksProps {
  links: readonly InteractiveFeatureLink[];
}

export function InteractiveHoverLinks({
  links,
}: InteractiveHoverLinksProps) {
  return (
    <ol className="interactive-feature-list">
      {links.map((link) => (
        <li key={link.number}>
          <InteractiveFeatureRow {...link} />
        </li>
      ))}
    </ol>
  );
}

function InteractiveFeatureRow({
  number,
  heading,
  subheading,
  imgSrc,
  href = "#features",
}: InteractiveFeatureLink) {
  const rowRef = useRef<HTMLAnchorElement | null>(null);
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { damping: 22, stiffness: 190 });
  const springY = useSpring(pointerY, { damping: 22, stiffness: 190 });
  const previewLeft = useTransform(springX, [-0.5, 0.5], ["43%", "67%"]);
  const previewTop = useTransform(springY, [-0.5, 0.5], ["30%", "70%"]);

  const handlePointerMove = (
    event: MouseEvent<HTMLAnchorElement, globalThis.MouseEvent>,
  ) => {
    const bounds = rowRef.current?.getBoundingClientRect();

    if (!bounds) {
      return;
    }

    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <motion.a
      className="interactive-feature-row"
      href={href}
      initial="rest"
      onMouseLeave={resetPointer}
      onMouseMove={handlePointerMove}
      ref={rowRef}
      whileFocus="hover"
      whileHover="hover"
    >
      <span className="interactive-feature-number">{number}</span>

      <div className="interactive-feature-copy">
        <motion.h3
          variants={{
            rest: { x: 0 },
            hover: { x: 16 },
          }}
          transition={{ type: "spring", damping: 18, stiffness: 240 }}
        >
          {heading}
        </motion.h3>
        <p>{subheading}</p>
      </div>

      <motion.img
        alt=""
        aria-hidden="true"
        className="interactive-feature-preview"
        src={imgSrc}
        style={{
          left: previewLeft,
          top: previewTop,
          translateX: "-50%",
          translateY: "-50%",
        }}
        transition={{ type: "spring", damping: 20, stiffness: 210 }}
        variants={{
          rest: { opacity: 0, rotate: -8, scale: 0.72 },
          hover: { opacity: 1, rotate: 5, scale: 1 },
        }}
      />

      <motion.span
        aria-hidden="true"
        className="interactive-feature-arrow"
        variants={{
          rest: { opacity: 0, x: 18 },
          hover: { opacity: 1, x: 0 },
        }}
        transition={{ type: "spring", damping: 18, stiffness: 240 }}
      >
        <ArrowRight />
      </motion.span>
    </motion.a>
  );
}
