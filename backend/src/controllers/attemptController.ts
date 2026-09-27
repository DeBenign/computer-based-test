import { Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import Exam from "../models/Exam";
import ExamAttempt from "../models/ExamAttempt";
import Question from "../models/Question";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Student starts or resumes an attempt. If one already exists and is
// in-progress, returns it as-is so a page refresh doesn't reshuffle
// or reset the clock.
export async function startOrResumeAttempt(req: AuthedRequest, res: Response) {
  const exam = await Exam.findOne({ _id: req.params.examId, schoolId: req.user!.schoolId });
  if (!exam) return res.status(404).json({ error: "Exam not found" });
  if (exam.status !== "scheduled" && exam.status !== "live") {
    return res.status(400).json({ error: "Exam is not open" });
  }

  const now = new Date();
  if (now < exam.startTime) return res.status(400).json({ error: "Exam has not started yet" });
  if (now > exam.endTime) return res.status(400).json({ error: "Exam window has closed" });

  let attempt = await ExamAttempt.findOne({ examId: exam._id, studentId: req.user!.userId });

  if (attempt) {
    // Already started -- return the frozen state, don't reshuffle.
    return res.json(attempt);
  }

  let questionOrder = exam.questionIds.map((id) => id.toString());
  if (exam.randomizeQuestions) questionOrder = shuffle(questionOrder);

  const serverEndTime = new Date(Math.min(
    now.getTime() + exam.duration * 60 * 1000,
    exam.endTime.getTime()
  ));

  attempt = await ExamAttempt.create({
    examId: exam._id,
    studentId: req.user!.userId,
    questionOrder,
    startedAt: now,
    serverEndTime,
    status: "in-progress",
    answers: [],
    flaggedEvents: []
  });

  // Return questions with options pre-shuffled per-student if configured,
  // so the client never has to reshuffle (and can't be tricked into it).
  const questions = await Question.find({ _id: { $in: questionOrder } });
  const questionsById = new Map(questions.map((q) => [q._id.toString(), q]));
  const orderedQuestions = questionOrder.map((id) => {
    const q = questionsById.get(id)!;
    const plain: any = q.toObject();
    if (exam.randomizeOptions && plain.type === "mcq") {
      plain.options = shuffle(plain.options);
    }
    // Never leak isCorrect to the student client.
    plain.options = plain.options?.map((o: any) => ({ text: o.text }));
    return plain;
  });

  res.status(201).json({ attempt, questions: orderedQuestions });
}

// Periodic autosave (client calls this every ~15s and also on reconnect).
export async function autosaveAnswers(req: AuthedRequest, res: Response) {
  const { answers } = req.body as {
    answers: { questionId: string; selectedOption?: string; answerText?: string; clientTimestamp: number }[];
  };

  const attempt = await ExamAttempt.findOne({ _id: req.params.id, studentId: req.user!.userId });
  if (!attempt) return res.status(404).json({ error: "Attempt not found" });
  if (attempt.status !== "in-progress") {
    return res.status(400).json({ error: "Attempt is no longer active" });
  }
  if (new Date() > attempt.serverEndTime) {
    return autoSubmit(attempt, res);
  }

  for (const incoming of answers) {
    const existingIndex = attempt.answers.findIndex(
      (a) => a.questionId.toString() === incoming.questionId
    );
    const record = { ...incoming, serverReceivedAt: new Date() } as any;

    if (existingIndex === -1) {
      attempt.answers.push(record);
    } else if (attempt.answers[existingIndex].clientTimestamp < incoming.clientTimestamp) {
      // last-write-wins by client timestamp
      attempt.answers[existingIndex] = record;
    }
  }

  await attempt.save();
  res.json({ synced: true, syncedAt: new Date(), remainingMs: attempt.serverEndTime.getTime() - Date.now() });
}

export async function submitAttempt(req: AuthedRequest, res: Response) {
  const attempt = await ExamAttempt.findOne({ _id: req.params.id, studentId: req.user!.userId });
  if (!attempt) return res.status(404).json({ error: "Attempt not found" });
  if (attempt.status !== "in-progress") {
    return res.status(400).json({ error: "Attempt already finalized" });
  }

  attempt.status = "submitted";
  attempt.submittedAt = new Date();
  await attempt.save();
  await gradeAttempt(attempt);
  res.json(attempt);
}

async function autoSubmit(attempt: any, res: Response) {
  attempt.status = "auto-submitted";
  attempt.submittedAt = attempt.serverEndTime;
  await attempt.save();
  await gradeAttempt(attempt);
  return res.status(200).json({ error: "Time expired, attempt auto-submitted", attempt });
}

// Auto-grade MCQ questions on submit. Theory questions (phase 2) are
// left ungraded here for manual review.
async function gradeAttempt(attempt: any) {
  const questions = await Question.find({ _id: { $in: attempt.questionOrder } });
  const byId = new Map(questions.map((q) => [q._id.toString(), q]));

  let score = 0;
  for (const answer of attempt.answers) {
    const question = byId.get(answer.questionId.toString());
    if (!question || question.type !== "mcq") continue;
    const correct = question.options.find((o) => o.isCorrect);
    if (correct && answer.selectedOption === correct.text) {
      score += question.marks;
    }
  }
  attempt.score = score;
  await attempt.save();
}
