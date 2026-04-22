"use client";

import { useEffect, useRef, useState } from "react";

const TESTIMONIALS = [
  {
    id: 1,
    name: "أحمد محمود",
    rating: 5,
    text: "أكل تحفة والتوصيل سريع جداً! الشاورما أحسن من أي حتة جربتها في القاهرة. هاطلب تاني أكيد 🔥",
    emoji: "😍",
  },
  {
    id: 2,
    name: "سارة علي",
    rating: 5,
    text: "رولات خلدون دي حاجة مش طبيعية! طعم أصيل وحجم كبير بسعر معقول جداً. أنصح الكل يجرب",
    emoji: "🤩",
  },
  {
    id: 3,
    name: "محمد حسين",
    rating: 5,
    text: "من زبائن خلدون من سنين وما بخيبش ظننا أبداً. الطعام دايماً طازج والخدمة ممتازة 👌",
    emoji: "🥙",
  },
  {
    id: 4,
    name: "نورا إبراهيم",
    rating: 5,
    text: "جربت الطلب أونلاين أول مرة وكانت تجربة رائعة! الأكل وصل ساخن وفي الوقت المحدد تماماً",
    emoji: "⭐",
  },
];

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAuto = () => {
    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 3500);
  };

  useEffect(() => {
    startAuto();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleDot = (idx: number) => {
    setActive(idx);
    if (intervalRef.current) clearInterval(intervalRef.current);
    startAuto();
  };

  const t = TESTIMONIALS[active];

  return (
    <section className="bg-background px-4 py-10">
      {/* Heading */}
      <div className="text-center mb-8">
        <span className="text-accent text-xs font-bold tracking-widest uppercase block mb-2">
          آراء عملاؤنا
        </span>
        <h2 className="section-heading text-2xl font-black text-text inline-block">
          بيقولوا عنا إيه؟
        </h2>
      </div>

      {/* Card */}
      <div
        key={t.id}
        className="max-w-sm mx-auto bg-white rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.08)] border border-gray-100 animate-fade-up"
      >
        {/* Stars */}
        <div className="flex gap-0.5 mb-4 justify-center">
          {Array.from({ length: t.rating }).map((_, i) => (
            <span key={i} className="text-yellow-400 text-lg">★</span>
          ))}
        </div>

        {/* Emoji quote */}
        <div className="text-4xl text-center mb-3" aria-hidden>{t.emoji}</div>

        {/* Text */}
        <p className="text-text/75 text-sm leading-relaxed text-center mb-5">
          &ldquo;{t.text}&rdquo;
        </p>

        {/* Name */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-accent font-black text-sm">
            {t.name[0]}
          </div>
          <span className="font-bold text-sm text-text">{t.name}</span>
        </div>
      </div>

      {/* Dots */}
      <div className="flex gap-2 justify-center mt-5">
        {TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            onClick={() => handleDot(i)}
            className={`rounded-full transition-all duration-300 ${
              i === active
                ? "w-6 h-2.5 bg-accent"
                : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`تقييم ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
