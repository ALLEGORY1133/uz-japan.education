const KEYS = [
  "eyebrow", "title", "deadline", "cta", "external", "closed", "noAccount", "firstName", "lastName", "email", "phone",
  "degree", "funding", "message", "submit", "sending", "cancel", "doneTitle", "doneText", "error", "tooMany",
  "birth", "citizenship", "city", "passportNo", "program", "personal", "step1", "step2", "step3", "next", "back",
  "docsTitle", "docsHint", "addFiles", "remove", "optional", "badType", "tooBig", "tooManyFiles", "reviewTitle",
  "filesCount", "consent", "uploading", "uploadFailed", "retry", "codeTitle", "codeText", "copy", "copied",
  "checkStatus", "close",
  "doc.passport", "doc.diploma", "doc.transcript", "doc.language_cert", "doc.cv", "doc.motivation",
  "doc.recommendation", "doc.photo", "doc.other",
  "status.title", "status.sub", "status.code", "status.check", "status.notfound", "status.uni", "status.docs",
  "status.nodocs", "status.addMore", "status.draft", "status.new", "status.reviewing", "status.accepted", "status.rejected",
];

/** Ariza formasi va holat sahifasi uchun barcha tarjimalarni bitta obyektga yig'adi. */
export function applyLabels(t: (k: string) => string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of KEYS) out[k] = t(`apply.${k}`);
  out.contract = t("uni.contract");
  out.grant = t("uni.grant");
  for (const d of ["bachelor", "master", "doctoral"]) out[`degree.${d}`] = t(`common.degree.${d}`);
  return out;
}
