"use client";

import { useEffect, useState } from "react";

interface Promotion {
  id: string;
  name: string;
  desktop: string;
  mobile: string;
  alt: string;
  href: string;
}

export default function PromotionalBanner() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/promotions", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as {
          success?: boolean;
          data?: Promotion[];
          message?: string;
        };
        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          throw new Error(result.message || "Unable to load promotions.");
        }
        if (active) setPromotions(result.data.filter((promotion) => promotion.desktop));
      })
      .catch((error: unknown) => {
        console.error(
          error instanceof Error ? error.message : "Unable to load promotions.",
        );
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (promotions.length < 2) return;
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % promotions.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [promotions.length]);

  if (promotions.length === 0) return null;

  const banner = promotions[activeSlide % promotions.length];
  const image = (
    <picture>
      {banner.mobile ? (
        <source media="(max-width: 767px)" srcSet={banner.mobile} />
      ) : null}
      <img
        src={banner.desktop}
        alt={banner.alt}
        className="promo-slider-image"
      />
    </picture>
  );

  return (
    <section className="promo-slider" aria-label="Brand promotions">
      <div className="promo-slider-frame">
        {banner.href ? (
          <a href={banner.href} aria-label={banner.name}>
            {image}
          </a>
        ) : (
          image
        )}

        {promotions.length > 1 ? (
          <div className="promo-slider-dots" aria-label="Choose promotion">
            {promotions.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`promo-slider-dot${index === activeSlide ? " active" : ""}`}
                onClick={() => setActiveSlide(index)}
                aria-label={`Show ${item.name} banner`}
                aria-current={index === activeSlide ? "true" : undefined}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
