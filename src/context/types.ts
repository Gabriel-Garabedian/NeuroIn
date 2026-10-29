export type Preferences = {
  largeText: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  voice: boolean;
  volume: number;
  confirmSpeech: boolean;
  fewerOptions: boolean;
  calm: boolean;
  view: "self" | "support";
};
export type DemoState = {
  preferences: Preferences;
  completed: string[];
  steps: Record<string, number[]>;
};
