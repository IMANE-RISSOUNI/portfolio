export const siteUrl = new URL(process.env.SITE_URL ?? "http://localhost:3000")
  .origin;

export const localeAlternates = {
  en: `${siteUrl}/en`,
  fr: `${siteUrl}/fr`,
  "x-default": `${siteUrl}/`,
};
