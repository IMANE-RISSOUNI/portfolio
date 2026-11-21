import { Bricolage_Grotesque, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const headings = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-heading",
});

const body = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-body",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${headings.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
