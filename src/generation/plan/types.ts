export interface GeneratedArtifact {
  path: string;
  content: string;
}

export interface GenerationPlan {
  projectPath: string;
  outputPath: string;
  artifacts: GeneratedArtifact[];
}
