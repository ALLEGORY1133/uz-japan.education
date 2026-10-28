"use client";

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type Props = { children: ReactNode; label: string; prev: string; next: string; auto?: number; className?: string };

/** Surilib ketadigan karusel: scroll-snap, tugmalar, nuqtalar, avto-aylanish (kursor ustida yoki ko'rinmaganda to'xtaydi). */
export default function Carousel({ children, label, prev, next, auto = 5500, className = "" }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const paused = useRef(false);
  const visible = useRef(true);
  const slides = Children.toArray(children);

  const go = useCallback((i: number) => {
    const el = track.current;
    if (!el) return;
    const kids = el.children;
    const n = kids.length;
    const to = ((i % n) + n) % n;
    const target = kids[to] as HTMLElement;
    el.scrollTo({ left: target.offsetLeft - (kids[0] as HTMLElement).offsetLeft, behavior: "smooth" });
  }, []);

  const onScroll = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const base = (el.children[0] as HTMLElement).offsetLeft;
    let best = 0, bd = Infinity;
    Array.from(el.children).forEach((c, i) => {
      const d = Math.abs((c as HTMLElement).offsetLeft - base - el.scrollLeft);
      if (d < bd) { bd = d; best = i; }
    });
    setIdx(best);
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      const el = track.current;
      if (!el || paused.current || !visible.current || document.hidden) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
      else go(idx + 1);
    }, auto);
    return () => clearInterval(t);
  }, [auto, idx, go, slides.length]);

  return (
    <div
      className={`cr ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
      onFocusCapture={() => { paused.current = true; }}
      onBlurCapture={() => { paused.current = false; }}
    >
      <div className="cr-track" ref={track} onScroll={onScroll} tabIndex={0}>
        {slides.map((s, i) => <div className="cr-slide" key={i}>{s}</div>)}
      </div>
      {slides.length > 1 && (
        <div className="cr-ctl">
          <button type="button" onClick={() => go(idx - 1)} aria-label={prev}>←</button>
          <div className="cr-dots">
            {slides.map((_, i) => <button type="button" key={i} className={i === idx ? "on" : ""} onClick={() => go(i)} aria-label={`${i + 1}/${slides.length}`} />)}
          </div>
          <button type="button" onClick={() => go(idx + 1)} aria-label={next}>→</button>
        </div>
      )}
    </div>
  );
}
