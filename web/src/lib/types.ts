export type Locale = "uz" | "ja" | "en";

export type HeroSlide = {
  id: number;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  primary_label: string;
  primary_url: string;
  secondary_label: string;
  secondary_url: string;
  theme: "sunset" | "teal" | "violet";
  media_kind: "none" | "image" | "video";
  image: string | null;
  video: string | null;
  video_url: string;
  images?: string[];
};

export type UniversityListItem = {
  id: number;
  slug: string;
  country: "uz" | "jp";
  city: string;
  name: string;
  short_name: string;
  native_name: string;
  logo: string | null;
  banner?: string | null;
  brand_color: string;
  website_url: string;
  admission_status: "open" | "soon" | "closed";
  application_deadline: string | null;
  degrees: ("bachelor" | "master" | "doctoral")[];
};

export type MediaItem = {
  id: number;
  kind: "image" | "video";
  slot: "gallery" | "campus_video";
  file: string | null;
  video_url: string;
  caption: string;
};

export type LinkItem = {
  id: number;
  title: string;
  description: string;
  url: string;
  is_external: boolean;
  icon: "scholarship" | "language" | "visa" | "housing" | "other";
  image?: string | null;
  video?: string | null;
};

export type UniversityDetail = UniversityListItem & {
  description: string;
  banner: string | null;
  admission_url: string;
  contact_email: string;
  contact_phone: string;
  instruction_language: string;
  apply_mode: "platform" | "external";
  apply_url: string;
  application_start: string | null;
  results_date: string | null;
  term_start: string | null;
  contract_fee: string;
  payment_terms: string;
  living_cost: string;
  grant_name: string;
  grant_coverage: string;
  grant_criteria: string;
  latitude: string | null;
  longitude: string | null;
  requirements: { id: number; title: string; detail: string }[];
  programs: { id: number; level: "bachelor" | "master" | "doctoral"; name: string }[];
  media: MediaItem[];
  links: LinkItem[];
};

export type NewsItem = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  category: "news" | "cooperation" | "event" | "platform";
  cover: string | null;
  link_type: "internal" | "external";
  external_url: string;
  source_name: string;
  published_at: string;
  event_starts_at: string | null;
  event_location: string;
  href: string;
  video?: string | null;
  body?: string;
  media?: { id: number; kind: "image" | "video"; file: string | null; video_url: string; caption: string }[];
};

export type SiteMediaItem = {
  key: string;
  kind: "none" | "image" | "video";
  image: string | null;
  video: string | null;
  video_url: string;
  caption: string;
};

export type Stat = { id: number; label: string; value: number; suffix: string };

export type SiteSettings = {
  contact_email: string;
  contact_phone: string;
  extra_emails?: string[];
  extra_phones?: string[];
  address: string;
  map_query?: string;
  telegram_url: string;
  youtube_url: string;
  linkedin_url: string;
  instagram_url: string;
};

export type Operator = { name: string; role: string; phone: string; telegram: string };

export type AboutItem = {
  id: number;
  kind: "history" | "achievement" | "analysis";
  title: string;
  summary: string;
  body: string;
  year: number | null;
  image: string | null;
  video: string | null;
};
export type AboutData = { history: AboutItem[]; achievements: AboutItem[]; analyses: AboutItem[] };

export type HomeData = {
  hero: HeroSlide[];
  stats: Stat[];
  universities: UniversityListItem[];
  news: NewsItem[];
  events?: NewsItem[];
  updates?: NewsItem[];
  achievements?: AboutItem[];
  links: LinkItem[];
  media: Record<string, SiteMediaItem>;
  gallery_extra?: { id: number; image: string | null }[];
  settings: SiteSettings;
};

export type Block = {
  title: Record<Locale, string>;
  text: Record<Locale, string>;
  link_label: Record<Locale, string>;
  link_url: string;
  image: string | null;
  video: string | null;
};
export type Blocks = Record<string, Block>;
