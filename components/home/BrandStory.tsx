interface BrandStoryProps {
  brandStory?: string;
  establishedYear?: string;
}

export default function BrandStory({ brandStory, establishedYear }: BrandStoryProps) {
  const storyText =
    brandStory ||
    "مطعم خلدون — مش بس أكل، ده تجربة بتبدأ من أول ما تلاقي ريحة الشاورما الطازجة لحد ما تاخد آخر لقمة. بنطبخ بحب وبخبرة سنين، وبنفضل نقدم أحسن نكهات شامية أصيلة بأيدي جاهزة وبقلوب أحن.";

  return (
    <section className="bg-primary px-4 py-12 overflow-hidden relative">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-60 h-60 bg-accent/15 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-gold/10 rounded-full blur-2xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative z-10 max-w-md mx-auto">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/40 to-gold/40" />
          <span className="text-gold text-xs font-bold tracking-widest uppercase whitespace-nowrap">
            قصة خلدون
          </span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gold/40 to-gold/40" />
        </div>

        {/* Chef illustration area */}
        <div className="flex items-center justify-center mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent/30 to-gold/20 border border-gold/20 flex items-center justify-center text-6xl shadow-lg">
            👨‍🍳
          </div>
        </div>

        {/* Headline */}
        <h2 className="text-white font-black text-2xl text-center mb-2">
          طعم بيفرق
        </h2>
        {establishedYear && (
          <p className="text-gold text-center text-sm font-bold mb-4">
            نخدمك بإخلاص منذ {establishedYear}
          </p>
        )}

        {/* Gold divider */}
        <div className="flex items-center gap-2 mb-5">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gold/50" />
          <span className="text-gold text-lg" aria-hidden>✦</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gold/50" />
        </div>

        {/* Story text */}
        <p className="text-white/65 text-sm leading-loose text-center">
          {storyText}
        </p>

        {/* Signature */}
        <div className="mt-6 text-center">
          <span className="text-gold text-2xl font-black">
            خلدون ✦
          </span>
        </div>
      </div>
    </section>
  );
}
