import { Bricolage_Grotesque, Source_Serif_4 } from "next/font/google";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/i18n/locales";
import { themeScript } from "@/lib/theme";
import "../globals.css";

const headings = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-heading",
});
const body = Source_Serif_4({ subsets: ["latin"], variable: "--font-body" });

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html
      lang={locale}
      className={`${headings.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body id="top">{children}</body>
    </html>
  );
}
