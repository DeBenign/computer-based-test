export interface Subject {
  _id: string;
  name: string;
  classIds: string[];
}

export interface ClassRoom {
  _id: string;
  name: string;
  academicYear: string;
}

export interface AppUser {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "teacher" | "student";
  classId?: string;
  subjectIds?: string[];
  createdAt: string;
}

export interface Question {
  _id: string;
  subjectId: string;
  topic: string;
  type: "mcq" | "theory";
  difficulty: "easy" | "medium" | "hard";
  questionText: string;
  options: { text: string; isCorrect: boolean }[];
  marks: number;
  curriculumTag?: string;
}

export interface Exam {
  _id: string;
  subjectId: string;
  classId: string;
  title: string;
  questionIds: string[];
  duration: number;
  startTime: string;
  endTime: string;
  status: "draft" | "scheduled" | "live" | "closed";
}