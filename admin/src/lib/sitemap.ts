export type SiteLeaf = { perm: string; href: string; label: string; icon: string; desc: string; tags?: string[] };
export type SitePage = { key: string; label: string; icon: string; lead: string; leaves: SiteLeaf[] };

/** Veb-saytdagi sahifalar va ularning ichki qismlari — admin menyu va markaziy sahifalar shu ro'yxatdan quriladi. */
export const SITE: SitePage[] = [
  {
    key: "home", label: "Boş sahifa", icon: "dashboard",
    lead: "Saytning bosh sahifasidagi barça bölimlar: har biri uchun alohida joy.",
    leaves: [
      { perm: "hero", href: "/hero", label: "Slayder", icon: "hero", desc: "Yuqoridagi katta slayd: sarlavha, rasm, video va tugmalar.", tags: ["Matn", "Rasm", "Video", "Havola"] },
      { perm: "stats", href: "/stats", label: "Statistika", icon: "stats", desc: "Slayder tagidagi raqamlar paneli.", tags: ["Raqam", "Matn"] },
      { perm: "site_media", href: "/gallery", label: "Galereya", icon: "media", desc: "Aylanib turuvçi rasmlar lentasi (12 ta + qöşimcha).", tags: ["Rasm"] },
      { perm: "pages", href: "/pages/home", label: "Matn va rasm bölimlari", icon: "news", desc: "Katta video bandi, yangiliklar, talaba kabineti va ariza bölimlarining matni.", tags: ["Matn", "Rasm", "Video"] },
      { perm: "site_media", href: "/site-media", label: "Katta rasm va videolar", icon: "media", desc: "Katta video, ariza foni va kabinet kartasi rasmlari.", tags: ["Rasm", "Video"] },
      { perm: "admin", href: "/links", label: "Foydali havolalar", icon: "links", desc: "Footer va bosh sahifadagi foydali havolalar röyxati.", tags: ["Havola"] },
    ],
  },
  {
    key: "news", label: "Yangiliklar", icon: "news",
    lead: "Yangiliklar sahifasi va uning ichki bölimlari: har biriga öz ma’lumot, rasm va video qöşiladi.",
    leaves: [
      { perm: "news", href: "/news", label: "Barça yozuvlar", icon: "news", desc: "Yangilik, hamkorlik, tadbir va sayt yangiliklari — bitta röyxatda.", tags: ["Matn", "Rasm", "Video"] },
      { perm: "news", href: "/cooperation", label: "Hamkorlik", icon: "news", desc: "Universitetlar va taşkilotlar bilan hamkorlik xabarlari.", tags: ["Matn", "Rasm", "Video"] },
      { perm: "news", href: "/events", label: "Tadbirlar", icon: "news", desc: "Kelgusi tadbirlar: sana, joy, rasm va video.", tags: ["Sana", "Rasm", "Video"] },
      { perm: "news", href: "/updates", label: "Sayt yangiliklari", icon: "news", desc: "Platformaning özi haqidagi yangiliklar.", tags: ["Matn", "Rasm", "Video"] },
      { perm: "pages", href: "/pages/news", label: "Sahifa matni va rasmi", icon: "hero", desc: "«Yangiliklar» sahifasining sarlavhasi, matni va fon rasmi.", tags: ["Matn", "Rasm"] },
    ],
  },
  {
    key: "universities", label: "Universitetlar", icon: "university",
    lead: "Universitetlar sahifasi va har bir universitetning ma’lumotlari.",
    leaves: [
      { perm: "admin", href: "/universities", label: "Universitetlar röyxati", icon: "university", desc: "Universitet qöşiş, tahrirlaş: banner, galereya, ma’lumotlar.", tags: ["Matn", "Rasm", "Video"] },
      { perm: "pages", href: "/pages/universities", label: "Sahifa matni va rasmi", icon: "hero", desc: "«Universitetlar» sahifasining sarlavhasi va fon rasmi.", tags: ["Matn", "Rasm"] },
    ],
  },
  {
    key: "about", label: "Biz haqimizda", icon: "cap",
    lead: "«Biz haqimizda» va «Talaba kabineti» sahifalari.",
    leaves: [
      { perm: "pages", href: "/pages/about", label: "Biz haqimizda", icon: "news", desc: "Sahifa boşi, «Biz nima qilamiz», «Kabinetda nimalar bor» va pastki chaqiruv.", tags: ["Matn", "Rasm", "Havola"] },
      { perm: "pages", href: "/pages/cabinet", label: "Talaba kabineti", icon: "hero", desc: "Kabinet sahifasining sarlavhasi, matni va fon rasmi/videosi.", tags: ["Matn", "Rasm", "Video"] },
    ],
  },
];
