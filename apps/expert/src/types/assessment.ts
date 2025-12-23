import { JsonValue } from "@prisma/client/runtime/library";

export interface Answer {
  q: number;
  answer: string;
  [key: string]: string | number;
}

export interface LatestAssessment {
  id: number;
  user_id?: string | null;
  answered: Answer[] | JsonValue;
  score?: number | null;
  status?: string | null;
  created_at: Date; // Start time also
  updated_at: Date;
}

export interface AssessmentStatus {
  completed: boolean;
  latestAssessment: LatestAssessment | null;
  latestQuestionIndex?: number;
  timeLeft?: number;
  currentTime?: number;
}

export interface AssessmentQuestion {
  id?: number;
  order?: number;
  question: string;
  options: JsonValue;
  explanation?: string;
  correct_option: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface Option {
  id: number;
  text: string;
}
