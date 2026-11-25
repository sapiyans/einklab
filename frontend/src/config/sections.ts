export const sections = ["screensaver", "firmware", "xteink"] as const;

export type Section = (typeof sections)[number];

export const isSection = (value: string): value is Section =>
  (sections as readonly string[]).includes(value);
