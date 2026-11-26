"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import HeroSlideshow from "@/components/storefront/home/HeroSlideshow";
import WhatDoYouSew from "@/components/storefront/home/WhatDoYouSew";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { Shirt, Scissors, Sparkles, Flower2 } from "lucide-react";
import {
PackageSearch,
  Wrench,
  CreditCard,
  PackageCheck,
  ArrowUpRight,
} from "lucide-react";
import { fetchCategories, fetchProducts } from "@/lib/api/catalog";
import type { Category, Product } from "@/types";
import PromotionalBanner from "@/components/storefront/home/PromotionalBanner";

const applications = [
  {
    title: "Sewing & Construction",
    copy: "Single needle, overlock and interlock systems.",
    tag: "sewing-machines",
    image: products[0].images[0],
    icon: Shirt,
  },
  {
    title: "Cutting & Preparation",
    copy: "Tools that keep every cut accurate and efficient.",
    tag: "cutting",
    image: products[2].images[0],
    icon: Scissors,
  },
  {
    title: "Finishing & Pressing",
    copy: "A polished finish for every production line.",
    tag: "ironing-finishing",
    image: products[4].images[0],
    icon: Sparkles,
  },
  {
    title: "Embroidery & Detail",
    copy: "Bring precision and personality to every piece.",
    tag: "embroidery",
    image: products[6].images[0],
    icon: Flower2,
  },
];

const categoryImages: Record<string, string> = {
  "sewing-machines": products[0].images[0],
  cutting: products[2].images[0],
  "ironing-finishing": products[4].images[0],
  embroidery: products[6].images[0],
  "spare-parts": products[7].images[0],
};

const brandLogos = [
  { name: "Worlden", src: "/images/brand-logos/slazzer-preview-xy5r7.png" },
  { name: "Jack", src: "/images/brand-logos/jack.webp" },
  { name: "Silverstar", src: "/images/brand-logos/silverstar-removebg-preview.png" },
  { name: "Singer", src: "/images/brand-logos/singer-logo.webp" },
  { name: "Golden Eagle", src: "/images/brand-logos/golden-eagle.webp" },
  { name: "Zoje", src: "/images/brand-logos/slazzer-preview-ebz95.png" },
  { name: "Shengtian", src: "/images/brand-logos/sheng-removebg-preview.png" },
];

export default function HomePage() {
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [liveCategories, setLiveCategories] = useState<Category[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([fetchProducts(), fetchCategories()]).then(([nextProducts, nextCategories]) => {
      if (!active) return;
      setLiveProducts(nextProducts);
      setLiveCategories(nextCategories);
    });
    return () => { active = false; };
  }, []);

  const sourceProducts = liveProducts.length ? liveProducts : products;
  const sourceCategories = liveCategories.length ? liveCategories : categories;
  const collections = sourceCategories.slice(0, 5);

  return (
    <>
    <PromotionalBanner />
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <p className="eyebrow">The workshop partner</p>
            <h1>Make more.<br /><em>Make it better.</em></h1>
            <p className="hero-lede">Industrial sewing, cutting and finishing equipment selected for the people who keep Sri Lanka&apos;s apparel industry moving.</p>
            <div className="hero-actions">
              <Link href="/products" className="btn btn-primary">Explore equipment <span>↗</span></Link>
              <Link href="/services-repair" className="text-link">Talk to a specialist <span>↗</span></Link>
            </div>
            <div className="hero-proof"><span>01</span><p>Trusted machines<br />for serious makers</p></div>
          </div>
          <HeroSlideshow
            slides={[
              { image: sourceProducts[0]?.images[0] || products[0].images[0], alt: `${sourceProducts[0]?.name || "Industrial"} product`, eyebrow: "Featured", title: sourceProducts[0]?.name || "productive workshops." },
              { image: sourceProducts[1]?.images[0] || products[2].images[0], alt: `${sourceProducts[1]?.name || "Product"}`, eyebrow: "Available now", title: sourceProducts[1]?.name || "every production line." },
              { image: sourceProducts[2]?.images[0] || products[4].images[0], alt: `${sourceProducts[2]?.name || "Product"}`, eyebrow: "Workshop ready", title: sourceProducts[2]?.name || "confidence." },
            ]}
          />
        </div>
      </section>

      <section className="trust-strip">
        <div className="container trust-strip-inner">
          <span>Genuine brands</span><span>Island-wide delivery</span><span>Technician support</span><span>Koko 3× installments</span>
        </div>
      </section>

      <section className="container">
        <div className="special-discount-banner" role="region" aria-label="Special discounts">
          <div>
            <p>Lowest Price Guaranteed</p>
            <strong>Special discounts available</strong>
          </div>
          <span>අඩුම මිල – Guaranteed!</span>
        </div>
      </section>

      <section className="section home-section">
        <div className="container">
          <div className="section-intro"><div><p className="eyebrow">Find your fit</p><h2>What are you making?</h2></div><p>Start with the work you do. We&apos;ll help you find equipment that earns its place on the floor.</p></div>
          <div className="application-grid">
            {applications.map((application, index) => {
              const Icon = application.icon;

              return (
                <Link
                  key={application.tag}
                  href={`/products?category=${application.tag}`}
                  className="application-card"
                >
                  <Image
                    src={application.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="application-image"
                  />

                  <span className="application-overlay" />

                  <span className="application-topline">
                    <span className="application-number">0{index + 1}</span>
                    <span className="application-icon">
                      <Icon size={21} strokeWidth={1.7} />
                    </span>
                  </span>

                  <span className="application-content">
                    <h3>{application.title}</h3>
                    <p>{application.copy}</p>
                  </span>

                  <span className="card-arrow">↗</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* Product customization - What do you sew? */}
      <WhatDoYouSew />

      <section className="section production-process-section">
        <div className="container">
          <div className="section-intro">
            <div><p className="eyebrow">Production process</p><h2>What Are We Making?</h2></div>
            <p>From prepared fabric to a finished product, our process keeps every production stage clear and controlled.</p>
          </div>
          <div className="production-timeline">
            {[
              { number: "01", title: "Cutting and Preparation", icon: Scissors },
              { number: "02", title: "Embroidery and Detail", icon: Flower2 },
              { number: "03", title: "Sewing and Construction", icon: Shirt },
              { number: "04", title: "Finishing and Pressing", icon: Sparkles },
            ].map(({ number, title, icon: Icon }) => (
              <article className="production-step" key={title}>
                <span className="production-number">{number}</span>
                <span className="production-icon"><Icon size={25} /></span>
                <h3>{title}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section home-section home-dashboard-section">
        <div className="container">

          <div className="section-header">
            <div>
              <p className="eyebrow">Your workshop, simplified</p>
              <h2>Ready for the next run?</h2>
            </div>
            <p className="dashboard-description">
              Everything you need to keep your production moving, all in one place.
            </p>
          </div>

          <div className="dashboard-grid">

            <Link href="/products" className="dashboard-card dashboard-card-primary">
              <span className="dashboard-card-icon">
                <PackageSearch size={25} />
              </span>
              <span className="dashboard-card-content">
                <small>01 / EXPLORE</small>
                <h3>Browse Equipment</h3>
                <p>Find the right machines and equipment for your production needs.</p>
              </span>
              <span className="dashboard-card-arrow">
                <ArrowUpRight size={22} />
              </span>
            </Link>

            <Link href="/services-repair" className="dashboard-card">
              <span className="dashboard-card-icon">
                <Wrench size={25} />
              </span>
              <span className="dashboard-card-content">
                <small>02 / SUPPORT</small>
                <h3>Services & Repair</h3>
                <p>Get technical assistance, maintenance and repair support.</p>
              </span>
              <span className="dashboard-card-arrow">
                <ArrowUpRight size={22} />
              </span>
            </Link>

            <Link href="/installments" className="dashboard-card">
              <span className="dashboard-card-icon">
                <CreditCard size={25} />
              </span>
              <span className="dashboard-card-content">
                <small>03 / PAYMENT</small>
                <h3>Installment Plans</h3>
                <p>Explore flexible payment options for your equipment purchases.</p>
              </span>
              <span className="dashboard-card-arrow">
                <ArrowUpRight size={22} />
              </span>
            </Link>

            <Link href="/track-order" className="dashboard-card">
              <span className="dashboard-card-icon">
                <PackageCheck size={25} />
              </span>
              <span className="dashboard-card-content">
                <small>04 / DELIVERY</small>
                <h3>Track Your Order</h3>
                <p>Stay informed about the progress of your order.</p>
              </span>
              <span className="dashboard-card-arrow">
                <ArrowUpRight size={22} />
              </span>
            </Link>

          </div>
        </div>
      </section>

      <section className="section home-section">
        <div className="container">
          <div className="section-intro"><div><p className="eyebrow">The right tools, together</p><h2>Build your line</h2></div><p>From first stitch to final press, explore the equipment families that make a complete workshop.</p></div>
          <div className="collection-grid">
            {collections.map((category) => {
              const matchingProduct = sourceProducts.find((product) => product.category === category.name);
              const image = category.image || categoryImages[category.slug] || matchingProduct?.images[0] || products[0].images[0];
              return <Link href={`/categories/${category.slug}`} key={category.slug} className="collection-card"><Image src={image} alt={category.name} fill sizes="(max-width: 640px) 100vw, 20vw" /><span className="collection-overlay" /><div><p>{category.description}</p><h3>{category.name}</h3><span className="text-link">View collection ↗</span></div></Link>;
            })}
          </div>
        </div>
      </section>

      <section className="section service-callout">
      <div className="container service-callout-inner"><div><p className="eyebrow">More than a machine</p><h2>Keep production moving.</h2><p>Need a recommendation, installation, or a part that keeps a familiar machine running? Our team knows the work behind the work.</p></div><div className="service-actions"><Link href="/services-repair" className="btn btn-primary">Service & repair</Link><Link href="/quotations" className="btn btn-light">Get a quotation</Link></div></div>
      </section>

      <section className="section home-section brand-section">
        <div className="container"><div className="section-header"><div><p className="eyebrow">Brands we stand behind</p><h2>Made to work hard</h2></div></div><div className="brand-grid">{brandLogos.map((brand) => <div className="brand-wordmark" key={brand.name}><Image src={brand.src} alt={brand.name} width={190} height={72} /></div>)}</div></div>
      </section>
    </>
  );
}
