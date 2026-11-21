import { z } from "zod";

const text = z.string().trim().min(1);
const webUrl = z.url({ protocol: /^https?$/ });
const year = z.int().min(1900).max(9999);
const ordered = { sortOrder: z.int(), visible: z.boolean() };

export const profileSchema = z.object({
  name: text,
  headline: text,
  bio: text,
  location: text,
  email: z.email(),
  availability: z.object({ available: z.boolean(), text }),
  links: z.object({
    github: webUrl,
    linkedin: webUrl,
    cv: z.union([webUrl, z.string().regex(/^\/(?![\/\\])[^\\]+$/)]),
  }),
});

export const projectSchema = z.object({
  title: text,
  description: text,
  stack: z.array(text).min(1),
  repoUrl: webUrl.optional(),
  demoUrl: webUrl.optional(),
  year: year.optional(),
  ...ordered,
});

export const experienceSchema = z
  .object({
    role: text,
    organization: text,
    type: z.enum(["work", "education"]),
    startYear: year,
    endYear: year.nullable(),
    description: text,
    location: text,
    ...ordered,
  })
  .refine(
    ({ startYear, endYear }) => endYear === null || endYear >= startYear,
    {
      path: ["endYear"],
      message: "End year must be on or after the start year",
    },
  );

export const skillSchema = z.object({
  category: text,
  items: z.array(text).min(1),
  ...ordered,
});

export const contentSchema = z.object({
  profile: profileSchema,
  projects: z.array(projectSchema),
  experiences: z.array(experienceSchema),
  skills: z.array(skillSchema),
});

export type Profile = z.infer<typeof profileSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type Content = z.infer<typeof contentSchema>;
