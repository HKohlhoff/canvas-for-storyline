export type StoryLineCategory = "scenes" | "sceneNotes" | "characters" | "locations";

export interface StoryLineElement {
  id: string;
  category: StoryLineCategory;
  title: string;
  description?: string;
  sourcePath: string;
  chapter: string | null;
  act?: number;
  sequence?: number;
  notesFile?: string;
  characters?: string[];
  locations?: string[];
  status?: string;
}

export interface StoryLineProject {
  name: string;
  vaultName?: string;
  seriesName?: string;
  bookNumber?: number;
  rootPath: string;
  elements: StoryLineElement[];
  actLabels: Record<string, string>;
  actDescriptions: Record<string, string>;
  chapterLabels: Record<string, string>;
  chapterDescriptions: Record<string, string>;
}

export interface StoryLineSeriesContext {
  vaultName?: string;
  seriesName?: string;
  bookNumber?: number;
}

export const CATEGORY_LABELS: Record<StoryLineCategory, string> = {
  scenes: "Szenen",
  sceneNotes: "Szenen-Notizen",
  characters: "Figuren",
  locations: "Orte",
};
