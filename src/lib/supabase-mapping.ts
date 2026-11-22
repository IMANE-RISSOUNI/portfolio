import type { Content, Experience, Profile, Project, Skill } from "./schemas";

export function profileToRow(profile: Profile) {
  return {
    id: 1,
    name: profile.name,
    headline: profile.headline,
    bio: profile.bio,
    location: profile.location,
    email: profile.email,
    availability: profile.availability.available,
    availability_text: profile.availability.text,
    github_url: profile.links.github,
    linkedin_url: profile.links.linkedin,
    cv_url: profile.links.cv,
  };
}

export function projectToRow(project: Project) {
  return {
    title: project.title,
    description: project.description,
    stack: project.stack,
    repo_url: project.repoUrl ?? null,
    demo_url: project.demoUrl ?? null,
    year: project.year ?? null,
    sort_order: project.sortOrder,
    visible: project.visible,
  };
}

export function experienceToRow(experience: Experience) {
  return {
    role: experience.role,
    organization: experience.organization,
    type: experience.type,
    start_year: experience.startYear,
    end_year: experience.endYear,
    description: experience.description,
    location: experience.location,
    sort_order: experience.sortOrder,
    visible: experience.visible,
  };
}

export function skillToRow(skill: Skill) {
  return {
    category: skill.category,
    items: skill.items,
    sort_order: skill.sortOrder,
    visible: skill.visible,
  };
}

type ProfileRow = ReturnType<typeof profileToRow>;
type ProjectRow = ReturnType<typeof projectToRow>;
type ExperienceRow = ReturnType<typeof experienceToRow>;
type SkillRow = ReturnType<typeof skillToRow>;

type Table<Row> = {
  Row: Row & { id: number };
  Insert: Row & { id: number };
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profile: Table<ProfileRow>;
      projects: Table<ProjectRow>;
      experiences: Table<ExperienceRow>;
      skills: Table<SkillRow>;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
  };
};

export function mapProfile(row: ProfileRow): Profile {
  return {
    name: row.name,
    headline: row.headline,
    bio: row.bio,
    location: row.location,
    email: row.email,
    availability: { available: row.availability, text: row.availability_text },
    links: {
      github: row.github_url,
      linkedin: row.linkedin_url,
      cv: row.cv_url,
    },
  };
}

export function mapProject(row: ProjectRow): Project {
  return {
    title: row.title,
    description: row.description,
    stack: row.stack,
    repoUrl: row.repo_url ?? undefined,
    demoUrl: row.demo_url ?? undefined,
    year: row.year ?? undefined,
    sortOrder: row.sort_order,
    visible: row.visible,
  };
}

export function mapExperience(row: ExperienceRow): Experience {
  return {
    role: row.role,
    organization: row.organization,
    type: row.type,
    startYear: row.start_year,
    endYear: row.end_year,
    description: row.description,
    location: row.location,
    sortOrder: row.sort_order,
    visible: row.visible,
  };
}

export function mapSkill(row: SkillRow): Skill {
  return {
    category: row.category,
    items: row.items,
    sortOrder: row.sort_order,
    visible: row.visible,
  };
}

export function hasPortfolioEntries({
  projects,
  experiences,
}: Content): boolean {
  return projects.length > 0 || experiences.length > 0;
}
