import { FieldDef } from "@/components/Form";

const COUNTRY = [{ value: "uz", label: "Özbekiston" }, { value: "jp", label: "Yaponiya" }];

export const UNIVERSITY_CREATE_FIELDS: FieldDef[] = [
  { name: "slug", label: "Slug (URL uçun, lotinça)", required: true, help: "Masalan: kyoto-university" },
  { name: "country", label: "Davlat", type: "select", options: COUNTRY, required: true },
  { name: "name", label: "Nomi", tr: true, required: true },
  { name: "short_name", label: "Qisqa nom" },
  { name: "brand_color", label: "Brend rangi", type: "color" },
];

export const MAIN_FIELDS: FieldDef[] = [
  { name: "name", label: "Nomi", tr: true, required: true },
  { name: "city", label: "Şahar", tr: true },
  { name: "short_name", label: "Qisqa nom" },
  { name: "native_name", label: "Mahalliy nomi (masalan 京都大学)" },
  { name: "description", label: "Tavsif", tr: true, type: "textarea" },
  { name: "logo", label: "Logotip", type: "image" },
  { name: "banner", label: "Banner rasmi", type: "image" },
  { name: "brand_color", label: "Brend rangi", type: "color" },
  { name: "website_url", label: "Rasmiy veb-sayt", type: "url", help: "Universitet sahifasida çiroyli havola bloki sifatida körinadi" },
  { name: "admission_url", label: "Qabul bölimi sahifasi", type: "url" },
  { name: "contact_email", label: "Aloqa email (arizalar şu manzilga keladi)", type: "email" },
  { name: "contact_phone", label: "Aloqa telefon" },
  { name: "instruction_language", label: "Ta’lim tili", tr: true },
  { name: "latitude", label: "Kenglik (xarita)", type: "number" },
  { name: "longitude", label: "Uzunlik (xarita)", type: "number" },
  { name: "slug", label: "Slug", adminOnly: true },
  { name: "country", label: "Davlat", type: "select", options: COUNTRY, adminOnly: true },
  { name: "is_published", label: "Saytda körsatilsin", type: "bool", adminOnly: true },
];

export const ADMISSION_FIELDS: FieldDef[] = [
  { name: "admission_status", label: "Qabul holati", type: "select", options: [
    { value: "open", label: "Qabul oçiq" }, { value: "soon", label: "Tez orada" }, { value: "closed", label: "Qabul yopiq" },
  ] },
  { name: "has_bachelor", label: "Bakalavr", type: "bool" },
  { name: "has_master", label: "Magistratura", type: "bool" },
  { name: "has_doctoral", label: "Doktorantura", type: "bool" },
  { name: "application_start", label: "Ariza boşlanişi", type: "date" },
  { name: "application_deadline", label: "Ariza muddati", type: "date" },
  { name: "results_date", label: "Natijalar e’loni", type: "date" },
  { name: "term_start", label: "Öqiş boşlanişi", type: "date" },
  { name: "apply_mode", label: "Ariza topşiriş usuli", type: "select", options: [
    { value: "platform", label: "UzJapan platformasi orqali" }, { value: "external", label: "Universitet sayti orqali" },
  ] },
  { name: "apply_url", label: "Taşqi ariza havolasi", type: "url", showIf: (v) => v.apply_mode === "external" },
];

export const FUNDING_FIELDS: FieldDef[] = [
  { name: "contract_fee", label: "Kontrakt narxi", tr: true },
  { name: "payment_terms", label: "Tölov şartlari", tr: true },
  { name: "living_cost", label: "Yaşaş xarajati", tr: true },
  { name: "grant_name", label: "Grant nomi", tr: true },
  { name: "grant_coverage", label: "Grant nimani qoplaydi", tr: true, type: "textarea" },
  { name: "grant_criteria", label: "Grant mezonlari", tr: true, type: "textarea" },
];

export const REQUIREMENT_FIELDS: FieldDef[] = [
  { name: "title", label: "Talab", tr: true, required: true },
  { name: "detail", label: "Izoh", tr: true },
];

export const PROGRAM_FIELDS: FieldDef[] = [
  { name: "level", label: "Daraja", type: "select", required: true, options: [
    { value: "bachelor", label: "Bakalavr" }, { value: "master", label: "Magistratura" }, { value: "doctoral", label: "Doktorantura" },
  ] },
  { name: "name", label: "Yönaliş nomi", tr: true, required: true },
];

export const MEDIA_FIELDS: FieldDef[] = [
  { name: "kind", label: "Turi", type: "select", options: [{ value: "image", label: "Rasm" }, { value: "video", label: "Video" }] },
  { name: "slot", label: "Joylaşuvi", type: "select", options: [
    { value: "gallery", label: "Galereya" }, { value: "campus_video", label: "Kampus videosi (asosiy)" },
  ] },
  { name: "file", label: "Fayl (rasm yoki video)", type: "file" },
  { name: "video_url", label: "Video havolasi (YouTube/Vimeo)", type: "url", showIf: (v) => v.kind === "video" },
  { name: "caption", label: "Izoh", tr: true },
  { name: "is_visible", label: "Saytda körsatilsin", type: "bool" },
];

export const LINK_FIELDS: FieldDef[] = [
  { name: "title", label: "Sarlavha", tr: true, required: true },
  { name: "description", label: "Qisqa izoh", tr: true },
  { name: "url", label: "Havola", required: true, help: "https://... yoki /uz/sahifa" },
  { name: "icon", label: "Belgi", type: "select", options: [
    { value: "scholarship", label: "Stipendiya" }, { value: "language", label: "Til" }, { value: "visa", label: "Viza va hujjatlar" },
    { value: "housing", label: "Yaşaş joyi" }, { value: "other", label: "Boşqa" },
  ] },
  { name: "is_external", label: "Taşqi havola (yangi oynada oçiladi)", type: "bool" },
  { name: "is_visible", label: "Saytda körsatilsin", type: "bool" },
];
