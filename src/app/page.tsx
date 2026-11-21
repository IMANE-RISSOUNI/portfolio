import type { Metadata } from "next";
import { Contact } from "@/components/contact";
import { Experience } from "@/components/experience";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { Projects } from "@/components/projects";
import { Skills } from "@/components/skills";
import { getContent } from "@/lib/content";
import { siteUrl } from "./site-url";

// Revalidate future Supabase content every five minutes and keep serving the
// cached page if the database is unavailable during regeneration.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getContent();
  const title = `${profile.name} – Software Engineer`;

  return {
    title,
    description: profile.bio,
    openGraph: {
      type: "website",
      url: siteUrl,
      title,
      description: profile.bio,
    },
  };
}

export default async function Home() {
  const { profile, projects, experiences, skills } = await getContent();

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header name={profile.name} />
      <main id="main-content" className="container" tabIndex={-1}>
        <Hero
          headline={profile.headline}
          bio={profile.bio}
          availability={profile.availability}
        />
        <Projects projects={projects} />
        <Experience experiences={experiences} />
        <Skills skills={skills} />
        <Contact email={profile.email} links={profile.links} />
      </main>
      <Footer name={profile.name} location={profile.location} />
    </>
  );
}
