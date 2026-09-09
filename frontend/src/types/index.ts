export type DocumentType =
  | "table"
  | "todolist"
  | "document"
  | "calendar"
  | "board"
  | "habit"
  | "journal";

export interface DataFile {
  name: string;
  file: string;
  data: any;
  /** Epoch ms from the filesystem; 0 when the host can't report it. */
  modified?: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  pending?: boolean;
}

/**
 * The six features the clustering model was trained on. This shape is the
 * backend contract for /recommend — do not add fields here.
 */
export interface UserProfile {
  age: number;
  gender: string;
  occupation: string;
  education_level: string;
  device_type: string;
  daily_usage_hours: number;
}

export type FocusArea =
  | "Fitness"
  | "Study"
  | "Work"
  | "Mindfulness"
  | "Finance"
  | "Creative"
  | "Social"
  | "Sleep";

export interface Goal {
  id: string;
  label: string;
  focus?: FocusArea;
  done: boolean;
}

/** Everything else we know about the person. Local only — never sent to the model. */
export interface PersonalProfile {
  name: string;
  wakeTime: string;
  sleepTime: string;
  focusAreas: FocusArea[];
  goals: Goal[];
}

export interface FullProfile {
  lifestyle: UserProfile;
  personal: PersonalProfile;
}

export interface RecommendedItem {
  name: string;
  type: string;
  [key: string]: any;
}

export interface ChatResponse {
  mode?: "tool" | "chat";
  generated_text?: string;
  result?: { content?: any };
}

export interface RecommendResponse {
  recommendations?: RecommendedItem[];
  cluster?: number | string;
  reason?: string;
}

export interface EnhanceResponse {
  enhanced: RecommendedItem;
}

export interface GmailMessage {
  id: string;
  snippet: string;
  headers: { name: string; value: string }[];
}
