export type SectionId =
  | "overview"
  | "modes"
  | "how-it-works"
  | "pricing"
  | "faq";

export type NavItem = {
  id: SectionId;
  label: string;
};
