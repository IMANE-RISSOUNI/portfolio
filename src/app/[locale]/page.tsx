import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { About } from "@/components/about";
import { Chat } from "@/components/chat/chat";
import { Contact } from "@/components/contact";
import { Experience } from "@/components/experience";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Navbar } from "@/components/navbar/navbar";
import { Projects } from "@/components/projects";
import { Skills } from "@/components/skills";
import { dictionaries } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { getContent } from "@/lib/content";
import { localeAlternates } from "../site-url";

export const revalidate = 300;

type LocalePageProps = { params: Promise<{ locale: string }> };

async function getLocale(params: LocalePageProps["params"]) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const locale = await getLocale(params);
  const { profile } = await getContent(locale);
  const { role, description } = dictionaries[locale].seo;
  const title = `${profile.name} – ${role}`;
  const canonical = localeAlternates[locale];
  return {
    title,
    description,
    alternates: { canonical, languages: localeAlternates },
    openGraph: { type: "website", url: canonical, title, description },
  };
}

export default async function Home({ params }: LocalePageProps) {
  const locale = await getLocale(params);
  const text = dictionaries[locale];
  const { profile, projects, experiences, skills } = await getContent(locale);
  return (
    <>
      <a className="skip-link" href="#main-content">
        {text.skip}
      </a>
      <Navbar
        name={profile.name}
        email={profile.email}
        linkedin={profile.links.linkedin}
        locale={locale}
        text={{ nav: text.nav, theme: text.theme, language: text.language }}
      />
      <main id="main-content" className="container" tabIndex={-1}>
        <Hero profile={profile} text={text.hero} />
        <About location={profile.location} text={text} />
        <Projects projects={projects} text={text} />
        <Experience experiences={experiences} text={text} />
        <Skills skills={skills} text={text} />
        <Contact email={profile.email} links={profile.links} text={text} />
      </main>
      <Footer
        name={profile.name}
        location={profile.location}
        label={text.footer}
      />
      <div lang="en">
        <Chat name={profile.name} email={profile.email} />
      </div>
    </>
  );
}
