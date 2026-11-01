"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Yagona harakat tili: har bir blok o'z "janri"da paydo bo'ladi, lekin hammasi bir xil egri chiziq va
 * bir xil ritm (90 ms) bilan. CSS: refine.css → "Scroll reveal".
 *
 *  panel   — qidiruv paneli: pastdan, ichidagi maydonlar ketma-ket
 *  tiles   — tezkor menyu: kataklar chiziq bilan ochiladi
 *  wipe-l / wipe-r — rangli kartalar: parda kabi chapdan/o'ngdan ochiladi, matn keyin
 *  flags   — bayroqlar ustunga ko'tariladi
 *  title   — bo'lim sarlavhasi: so'zma-so'z ochiladi, tepasida chiziq chiziladi
 *  stats   — raqamlar: tepadagi chiziq chiziladi, so'ng raqam ko'tariladi
 *  cards   — havola/yangilik kartalari: ketma-ket ko'tariladi, rasm "pardasi" ochiladi
 *  fade    — lenta: xiralikdan ochiladi
 */
const MAP: [string, string][] = [
  [".finder", "panel"],
  [".quick", "tiles"],
  [".hm-about .hm-cards", "cards"],
  [".hm-q", "rise"],
  [".bento.students", "wipe-l"],
  [".bento.collab", "wipe-r"],
  [".bento.map", "flags"],
  [".bento.online", "wipe-r"],
  [".event-card", "rise"],
  [".section-head", "title"],
  [".mq", "fade"],
  [".stats", "stats"],
  ["#links .grid-cards, #news .grid-cards, .grid-cards", "cards"],
  [".uni-grid, .unis", "cards"],
  [".panel", "rise"],
  [".gallery", "cards"],
  [".web-card, .side-col > *", "rise"],
  [".page-hero .wrap > *", "rise"],
  [".article", "rise"],
  [".footer-cols", "cards"],
];

function splitWords(el: HTMLElement) {
  if (el.dataset.split || el.children.length > 0 || !el.textContent) return;
  const words = el.textContent.trim().split(/\s+/);
  if (words.length < 2 || words.length > 14) return;
  el.dataset.split = "1";
  el.setAttribute("aria-label", el.textContent.trim());
  el.textContent = "";
  words.forEach((w, i) => {
    const o = document.createElement("span");
    o.className = "w";
    o.setAttribute("aria-hidden", "true");
    const inner = document.createElement("span");
    inner.textContent = w;
    inner.style.setProperty("--wi", String(i));
    o.appendChild(inner);
    el.appendChild(o);
    if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
  });
}

export default function RevealRoot() {
  const path = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;

    const root = document.documentElement;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        document.querySelectorAll<HTMLElement>(".bento-glyph").forEach((g) => {
          const r = g.getBoundingClientRect();
          const k = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
          g.style.setProperty("--py", `${(k * -28).toFixed(1)}px`);
        });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const seen = new Set<Element>();
    const targets: HTMLElement[] = [];
    for (const [sel, fx] of MAP) {
      document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        if (seen.has(el) || el.closest(".hero")) return;
        seen.add(el);
        el.dataset.fx = fx;
        const kids = Array.from(el.children) as HTMLElement[];
        kids.forEach((k, i) => k.style.setProperty("--i", String(Math.min(i, 9))));
        if (fx === "title") el.querySelectorAll<HTMLElement>(".h2, h2").forEach(splitWords);
        targets.push(el);
      });
    }

    const vh = window.innerHeight;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -7% 0px" },
    );
    targets.forEach((el) => {
      el.classList.remove("in");
      if (el.getBoundingClientRect().top < vh * 0.88) el.classList.add("in");
      else io.observe(el);
    });
    root.classList.add("rv-on");

    const fail = window.setTimeout(() => targets.forEach((el) => el.classList.add("in")), 8000);
    return () => {
      io.disconnect();
      window.clearTimeout(fail);
      window.removeEventListener("scroll", onScroll);
    };
  }, [path]);

  return null;
}
