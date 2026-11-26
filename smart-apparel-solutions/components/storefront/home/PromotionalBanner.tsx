"use client";

import { useEffect, useState } from "react";

const banners = [
  {
    name: "BRUCE",
    desktop: "/images/banners/bruce-desktop.jpeg",
    mobile: "/images/banners/bruce-mobile.jpeg",
    alt: "BRUCE sewing machines promotional banner",
  },
  {
    name: "WORLDEN",
    desktop: "/images/banners/worlden-desktop.jpeg",
    mobile: "/images/banners/worlden-mobile.jpeg",
    alt: "WORLDEN sewing machines promotional banner",
  },
];

export default function PromotionalBanner() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % banners.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const banner = banners[activeSlide];

  return (
    <section className="promo-slider" aria-label="Brand promotions">
      <div className="promo-slider-frame">
        <picture>
          <source
            media="(max-width: 767px)"
            srcSet={banner.mobile}
          />

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.desktop}
            alt={banner.alt}
            className="promo-slider-image"
          />
        </picture>

        <div className="promo-slider-dots" aria-label="Choose promotion">
          {banners.map((item, index) => (
            <button
              key={item.name}
              type="button"
              className={`promo-slider-dot ${
                index === activeSlide ? "active" : ""
              }`}
              onClick={() => setActiveSlide(index)}
              aria-label={`Show ${item.name} banner`}
              aria-current={index === activeSlide ? "true" : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}