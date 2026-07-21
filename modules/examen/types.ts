export interface GuestExamProps {
  guestMode?: boolean;
  examTab?: string;
}

export interface ExamViewProps extends GuestExamProps {
  seriesId: string;
}
