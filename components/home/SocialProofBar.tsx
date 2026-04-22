"use client";

import { useEffect, useRef, useState } from "react";

interface StatItem {
  icon: string;
  numericValue: number;
  decimals?: number;
  suffix: string;
  label: string;
}

interface SocialProofBarProps {
  stats: StatItem[];
}

function CountUp({
  target,
  decimals = 0,
  duration = 1600,
}: {
  target: number;
  decimals?: number;
  duration?: number;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        const startTime = Date.now();
        const tick = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // easeOutQuart easing
          const eased = 1 - Math.pow(1 - progress, 4);
          setValue(parseFloat((target * eased).toFixed(decimals)));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, decimals, duration]);

  const display =
    decimals > 0
      ? value.toFixed(decimals)
      : value >= 1000
      ? (value / 1000).toFixed(value >= 10000 ? 0 : 1) + "K"
      : value.toString();

  return <span ref={ref}>{display}</span>;
}

export default function SocialProofBar({ stats }: SocialProofBarProps) {
  if (!stats.length) return null;

  return (
    <section className="bg-primary py-5 px-4 border-t border-white/5">
      <div className="max-w-md mx-auto">
        <div className="flex">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex-1 flex flex-col items-center gap-1 py-1 ${
                i < stats.length - 1 ? "border-l border-white/10" : ""
              }`}
            >
              <span className="text-2xl leading-none">{stat.icon}</span>
              <span className="text-lg font-black text-white leading-none tabular-nums">
                <CountUp target={stat.numericValue} decimals={stat.decimals} />
                {stat.suffix}
              </span>
              <span className="text-white/40 text-[11px] text-center leading-tight">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
