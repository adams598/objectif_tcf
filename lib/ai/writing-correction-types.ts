export interface WritingTaskInput {
  taskId: number;
  questionId: string;
  prompt: string;
  minWords: number;
  maxWords: number;
  text: string;
}

export interface WritingTaskFeedback {
  taskId: number;
  score: number;
  wordCount: number;
  compliant: boolean;
  strengths: string[];
  improvements: string[];
  errors: Array<{
    type: string;
    excerpt: string;
    suggestion: string;
  }>;
}

export interface WritingCorrectionResult {
  overallScore: number;
  cecrLevel: string;
  nclcLevel: number;
  globalFeedback: string;
  tasks: WritingTaskFeedback[];
  source: "gemini" | "heuristic";
}

export type WritingCorrectionPollStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface WritingCorrectionPollResponse {
  status: WritingCorrectionPollStatus;
  result?: WritingCorrectionResult;
  resultSource?: string | null;
}
