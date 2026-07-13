"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";
import { Quote, Star, BadgeCheck, MapPin, ArrowRight } from "lucide-react";
import {
  fadeIn,
  scaleIn,
  slideInLeft,
  slideInRight,
  staggerContainer,
  floatAnimation,
  ease,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

type Entrance = "left" | "right" | "scale" | "fade";

interface Testimonial {
  image: string;
  alt: string;
  quote: string;
  name: string;
  /** Occupation shown under the name (named `occupation`, not `role`, to avoid
   *  confusion with the ARIA `role` attribute). */
  occupation: string;
  rating: number;
  location: string;
  timeAgo: string;
  product: string;
  /** Aspect ratio of the card — drives the editorial mixed-proportion collage. */
  aspect: string;
  /** Desktop grid column span + vertical offset that break the grid rhythm. */
  span: string;
  offset: string;
  entrance: Entrance;
}

// Self-contained like the sibling sections (Reviews `reviews`, Lifestyle
// `editorialMoments`). Images are candid lifestyle photography in
// public/images/testimonials — swap paths here to change them.
const testimonials: Testimonial[] = [
  {
    image: "/images/testimonials/story-1.jpeg",
    alt: "Customer stretching joyfully at home",
    quote: "Eight weeks in and I've honestly stopped reaching for anything else.",
    name: "Thandi M.",
    occupation: "New mom & yoga teacher",
    rating: 5,
    location: "Cape Town, SA",
    timeAgo: "2 weeks ago",
    product: "Glow Collagen Blend",
    aspect: "aspect-[3/4]",
    span: "md:col-span-7",
    offset: "md:mt-0",
    entrance: "left",
  },
  {
    image: "/images/testimonials/story-2.jpeg",
    alt: "Customer with a green smoothie in a bright kitchen",
    quote: "The only supplement I actually look forward to every morning.",
    name: "Amara O.",
    occupation: "Creative director",
    rating: 5,
    location: "Johannesburg, SA",
    timeAgo: "1 month ago",
    product: "Plant Protein Luxe",
    aspect: "aspect-square",
    span: "md:col-span-5",
    offset: "md:mt-20",
    entrance: "right",
  },
  {
    image: "/images/testimonials/story-3.jpeg",
    alt: "Customer laughing after a workout",
    quote: "Three people asked what I'd changed. It was this.",
    name: "Lerato K.",
    occupation: "Attorney & marathon runner",
    rating: 5,
    location: "Durban, SA",
    timeAgo: "3 weeks ago",
    product: "Strength & Radiance",
    aspect: "aspect-[3/4]",
    span: "md:col-span-5",
    offset: "md:mt-0",
    entrance: "scale",
  },
  {
    image: "/images/testimonials/story-4.jpeg",
    alt: "Two friends laughing over coffee",
    quote: "My sister and I are both obsessed — it's our little ritual now.",
    name: "Nadia J.",
    occupation: "Pilates instructor",
    rating: 5,
    location: "Stellenbosch, SA",
    timeAgo: "5 days ago",
    product: "Morning Glow Ritual",
    aspect: "aspect-[4/3]",
    span: "md:col-span-7",
    offset: "md:mt-16",
    entrance: "fade",
  },
];

const entranceVariants: Record<Entrance, Variants> = {
  left: slideInLeft,
  right: slideInRight,
  scale: scaleIn,
  fade: fadeIn,
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className="flex gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={12}
          aria-hidden
          className={cn(
            i < rating ? "fill-rose-gold text-rose-gold" : "text-rose-gold/25"
          )}
        />
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const reducedMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  // Tiny image parallax as the card scrolls through view (ambient, not
  // whole-card drift). Disabled for reduced motion.
  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(
    scrollYProgress,
    [0, 1],
    reducedMotion ? ["0%", "0%"] : ["-6%", "6%"]
  );

  return (
    <motion.article
      ref={cardRef}
      variants={reducedMotion ? fadeIn : entranceVariants[testimonial.entrance]}
      className={cn(
        "group relative shrink-0 min-w-[82%] snap-center sm:min-w-[55%] md:min-w-0 md:shrink",
        testimonial.span,
        testimonial.offset
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl",
          testimonial.aspect
        )}
      >
        {/* Layer 1 — image (slow zoom on hover) + subtle scroll parallax */}
        <motion.div className="absolute inset-0 scale-[1.12]" style={{ y: imageY }}>
          <Image
            src={testimonial.image}
            alt={testimonial.alt}
            fill
            className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
            sizes="(max-width: 768px) 82vw, (max-width: 1024px) 45vw, 33vw"
          />
        </motion.div>

        {/* Layer 2 — vignette for depth + legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(30,24,20,0.72) 0%, rgba(30,24,20,0.15) 45%, transparent 70%)",
          }}
        />

        {/* Layer 3 — glass content card floated over the lower image */}
        <div className="absolute inset-x-3 bottom-3 md:inset-x-4 md:bottom-4">
          <div
            className="rounded-xl p-5 md:p-6"
            style={{
              background: "rgba(255,255,255,0.14)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: "1px solid rgba(255,255,255,0.22)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            {/* Quote icon — shared ambient float (wrapper) + slight rotate on
                hover (inner). Float disabled for reduced motion. */}
            <motion.div
              className="mb-3 inline-flex"
              {...(reducedMotion ? {} : floatAnimation)}
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-500 group-hover:rotate-[6deg]"
                style={{ background: "rgba(201,151,122,0.3)" }}
              >
                <Quote size={13} className="text-white" />
              </span>
            </motion.div>

            {/* Quote — subtle lift on hover */}
            <p
              className="heading-serif text-white text-lg md:text-xl leading-snug transition-transform duration-500 group-hover:-translate-y-0.5"
              style={{ fontFamily: "var(--font-cormorant)" }}
            >
              &ldquo;{testimonial.quote}&rdquo;
            </p>

            <div className="mt-4 flex items-center gap-1.5">
              <StarRating rating={testimonial.rating} />
            </div>

            {/* Attribution */}
            <div className="mt-3">
              <p className="text-white text-sm font-semibold">
                {testimonial.name}
              </p>
              <p className="text-white/60 text-xs">{testimonial.occupation}</p>
            </div>

            {/* Trust + product context */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-white/70 text-[10px]">
              <span className="inline-flex items-center gap-1">
                <BadgeCheck size={12} className="text-rose-gold" />
                Verified Buyer
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} />
                {testimonial.location}
              </span>
              <span>{testimonial.timeAgo}</span>
            </div>
            <p className="mt-2 label-caps text-[#e8c4ad] text-[9px]">
              Purchased — {testimonial.product}
            </p>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="testimonials"
      className="section-py section-padding overflow-hidden"
      style={{ background: "linear-gradient(180deg, #f0ebe3 0%, #faf7f4 100%)" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header — narrative bridge from Lifestyle */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-16 md:mb-20"
        >
          <motion.div
            variants={fadeIn}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="h-px w-10 bg-rose-gold" />
            <span className="label-caps text-rose-gold">In Their Words</span>
            <div className="h-px w-10 bg-rose-gold" />
          </motion.div>

          <motion.h2
            variants={fadeIn}
            className="heading-display text-ink"
            style={{
              fontFamily: "var(--font-cormorant)",
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
            }}
          >
            Wellness isn&rsquo;t just felt.
            <br />
            <em style={{ fontStyle: "italic", color: "#c9977a" }}>It&rsquo;s lived.</em>
          </motion.h2>
        </motion.div>

        {/* Collage — horizontal snap-carousel on mobile, asymmetric grid on md+ */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className={cn(
            "flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4",
            "md:grid md:grid-cols-12 md:gap-6 md:items-start md:overflow-visible md:pb-0",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          )}
        >
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} testimonial={t} />
          ))}
        </motion.div>

        {/* Bridge into the Reviews section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.8, ease: ease.cinematic }}
          className="mt-16 md:mt-20 flex items-center justify-center gap-2 text-center text-ink/60"
        >
          <span className="text-sm">
            Loved these? See why hundreds more rate us five stars
          </span>
          <ArrowRight size={15} className="text-rose-gold" />
        </motion.div>
      </div>
    </section>
  );
}
