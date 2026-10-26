"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import HeroArt from "./HeroArt";
import SmartLink from "./SmartLink";
import { embedUrl, mediaUrl } from "@/lib/media";
import type { HeroSlide, Locale } from "@/lib/types";

const DURATION = 7000;

type Props = {
  slides: HeroSlide[];
  locale: Locale;
  labels: { prev: string; next: string; pause: string };
};

function renderTitle(title: string, highlight: string) {
  if (highlight) {
    const i = title.toLowerCase().indexOf(highlight.toLowerCase());
    if (i >= 0) {
      return (
        <>
          {title.slice(0, i)}
          <em>{title.slice(i, i + highlight.length)}</em>
          {title.slice(i + highlight.length)}
        </>
      );
    }
  }
  return title;
}

function hasMedia(s: HeroSlide) {
  return (s.media_kind === "image" && !!s.image) || (s.media_kind === "video" && (!!s.video || !!embedUrl(s.video_url)));
}

/** Rasm yuklanguncha mavzu fon ko'rinadi, so'ng yumshoq paydo bo'ladi (xira "miltillash" bo'lmaydi). */
function HeroImg({ src, first, extra = [], active = true }: { src: string; first: boolean; extra?: string[]; active?: boolean }) {
  const all = [src, ...extra.map((e) => mediaUrl(e)!).filter(Boolean)];
  const [cur, setCur] = useState(0);
  useEffect(() => {
    if (all.length < 2 || !active) return;
    const id = window.setInterval(() => setCur((c) => (c + 1) % all.length), 4200);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all.length, active]);
  if (all.length > 1) {
    return (
      <>
        {all.map((u, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={u + i} className={`slide-media ready multi ${i === cur ? "cur" : ""}`} src={u} alt="" decoding="async" loading="eager" />
        ))}
      </>
    );
  }
  return <HeroImgOne src={src} first={first} />;
}

function HeroImgOne({ src, first }: { src: string; first: boolean }) {
  const [ok, setOk] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) setOk(true);
  }, []);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      className={`slide-media ${ok ? "ready" : ""}`}
      src={src}
      alt=""
      decoding="async"
      fetchPriority={first ? "high" : "auto"}
      loading="eager"
      onLoad={() => setOk(true)}
    />
  );
}

function SlideMedia({ s, first, active }: { s: HeroSlide; first: boolean; active: boolean }) {
  if (s.media_kind === "image" && s.image) {
    return <HeroImg src={mediaUrl(s.image)!} first={first} extra={s.images} active={active} />;
  }
  if (s.media_kind === "video") {
    if (s.video) {
      return <video className="slide-media ready" src={mediaUrl(s.video)!} autoPlay muted loop playsInline preload="auto" />;
    }
    const e = embedUrl(s.video_url);
    if (e) {
      return (
        <iframe
          className="slide-media ready"
          src={`${e}?autoplay=1&mute=1&controls=0&playsinline=1`}
          title=""
          allow="autoplay; encrypted-media"
          tabIndex={-1}
        />
      );
    }
  }
  return <HeroArt theme={s.theme} id={s.id} />;
}

/** Bezak zarralar: kuz — gul barglari, firuza — oltin chang, binafsha — yulduzlar. Faqat CSS animatsiya. */
function Particles({ theme }: { theme: string }) {
  return (
    <div className={`particles p-${theme}`} aria-hidden="true">
      {Array.from({ length: 18 }).map((_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37 + 11) % 97}%`,
            animationDelay: `${-((i * 5.3) % 17)}s`,
            animationDuration: `${13 + ((i * 7) % 9)}s`,
            ["--s" as any]: `${8 + ((i * 5) % 11)}px`,
            ["--dx" as any]: `${-60 - ((i * 23) % 140)}px`,
          }}
        />
      ))}
    </div>
  );
}

export default function HeroSlider({ slides, locale, labels }: Props) {
  const n = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0); // progress animatsiyasini qayta boshlash uchun
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (i: number) => {
      setIndex(((i % n) + n) % n);
      setTick((v) => v + 1);
    },
    [n],
  );

  useEffect(() => {
    if (paused || n < 2) return;
    const id = window.setTimeout(() => go(index + 1), DURATION);
    return () => window.clearTimeout(id);
  }, [index, tick, paused, n, go]);

  if (n === 0) return null;

  const pad = (v: number) => String(v).padStart(2, "0");

  return (
    <section className="hero" aria-roledescription="carousel">
      <div
        className="hero-stage"
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(index - 1);
          if (e.key === "ArrowRight") go(index + 1);
        }}
      >
        {slides.map((s, i) => {
          const active = i === index;
          return (
            <div
              key={s.id}
              className={`slide ${s.theme} ${active ? "active" : ""} ${hasMedia(s) ? "has-media" : "is-art"}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${n}`}
              aria-hidden={!active}
            >
              {(active || s.media_kind === "none" || s.media_kind === "image") && <SlideMedia s={s} first={i === 0} active={active} />}
              <div className="slide-shade" />
              <div className="slide-body">
                {s.eyebrow && (
                  <div className="pill">
                    <i />
                    {s.eyebrow}
                  </div>
                )}
                {i === 0 ? (
                  <h1 className="slide-title">{renderTitle(s.title, s.highlight)}</h1>
                ) : (
                  <h2 className="slide-title">{renderTitle(s.title, s.highlight)}</h2>
                )}
                {s.description && <p className="slide-desc">{s.description}</p>}
                <div className="slide-actions">
                  {s.primary_label && s.primary_url && (
                    <SmartLink href={s.primary_url} locale={locale} className="btn btn-primary">
                      {s.primary_label} →
                    </SmartLink>
                  )}
                  {s.secondary_label && s.secondary_url && (
                    <SmartLink href={s.secondary_url} locale={locale} className="btn btn-ghost">
                      {s.secondary_label}
                    </SmartLink>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <Particles theme={slides[index]?.theme || "sunset"} />

        <div className="hero-count" aria-hidden="true">
          <b>{pad(index + 1)}</b>
          <span>/ {pad(n)}</span>
        </div>

        <div className="hero-controls">
          <div className="hero-controls-in">
            <div className="hero-progress" style={{ ["--play" as any]: paused ? "paused" : "running", ["--dur" as any]: `${DURATION}ms` }}>
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`${i + 1}: ${s.eyebrow || s.title}`}
                  aria-current={i === index}
                  onClick={() => go(i)}
                >
                  <small>
                    <span className="num">{pad(i + 1)}</span>
                    <span className="lbl">{s.eyebrow || s.title}</span>
                  </small>
                  <span className="bar">
                    <i key={`${i}-${i === index ? tick : 0}`} />
                  </span>
                </button>
              ))}
            </div>
            <div className="hero-btns">
              <button type="button" className="circle-btn" aria-label={labels.prev} onClick={() => go(index - 1)}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 3L5 9l6 6" />
                </svg>
              </button>
              <button type="button" className="circle-btn solid" aria-label={labels.next} onClick={() => go(index + 1)}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#15132b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M7 3l6 6-6 6" />
                </svg>
              </button>
              <button
                type="button"
                className="circle-btn"
                aria-label={labels.pause}
                aria-pressed={paused}
                onClick={() => {
                  setPaused((p) => !p);
                  setTick((v) => v + 1);
                }}
              >
                {paused ? (
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="#fff" aria-hidden="true">
                    <path d="M2 1l9 5-9 5z" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="#fff" aria-hidden="true">
                    <rect x="2" y="1" width="3" height="10" />
                    <rect x="7" y="1" width="3" height="10" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
