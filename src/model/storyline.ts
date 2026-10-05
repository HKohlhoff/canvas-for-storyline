export type StoryLineCategory = "scenes" | "sceneNotes" | "characters" | "locations";

export interface StoryLineElement {
  id: string;
  category: StoryLineCategory;
  title: string;
  sourcePath: string;
  chapter: string | null;
  act?: number;
  sequence?: number;
  notesFile?: string;
  characters?: string[];
  locations?: string[];
}

export interface StoryLineProject {
  name: string;
  rootPath: string;
  elements: StoryLineElement[];
}

export const CATEGORY_LABELS: Record<StoryLineCategory, string> = {
  scenes: "Szenen",
  sceneNotes: "Szenen-Notizen",
  characters: "Figuren",
  locations: "Orte",
};
