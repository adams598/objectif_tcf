import type { ExamType } from "@prisma/client";

export interface DashboardExamInfo {
  targetExamDate: string | null;
  targetCountry: string | null;
  daysLeft: number | null;
  hasExamDate: boolean;
  examType?: ExamType;
}

export interface DashboardDailyGoal {
  currentMinutes: number;
  goalMinutes: number;
  currentStreak: number;
  completedWeekDays: number[];
}

export interface DashboardWeeklyReport {
  sessionsCompleted: number;
  topSkill: string | null;
  topSkillPoints: number;
  weakestSkill: string | null;
  weakestSkillGap: number;
}

export interface DashboardInProgressAttempt {
  id: string;
  seriesId: string;
  title: string;
  description: string | null;
  skill: string;
}

export interface SkillGap {
  subject: string;
  score: number;
  target: number;
  gap: number;
  attemptsCount: number;
  priority: "high" | "medium" | "low";
}

export interface DashboardStats {
  competencies: Array<{ subject: string; score: number; target: number }>;
  skillGaps: SkillGap[];
  weakestSkill: string | null;
  weakestSkillGap: number;
  globalNclc: number;
  progressPercent: number;
  targetNclc: number;
  exam: DashboardExamInfo;
  dailyGoal: DashboardDailyGoal;
  weeklyReport: DashboardWeeklyReport;
  inProgressAttempt: DashboardInProgressAttempt | null;
  hasActivity: boolean;
}
