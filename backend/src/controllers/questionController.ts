import { Response } from "express";
import { AuthedRequest } from "../middleware/auth";
import Question from "../models/Question";

export async function createQuestion(req: AuthedRequest, res: Response) {
  const { subjectId, topic, difficulty, questionText, options, marks, curriculumTag } = req.body;
  const question = await Question.create({
    schoolId: req.user!.schoolId,
    subjectId,
    topic,
    type: "mcq",
    difficulty,
    questionText,
    options,
    marks,
    curriculumTag,
    createdBy: req.user!.userId
  });
  res.status(201).json(question);
}

export async function listQuestions(req: AuthedRequest, res: Response) {
  const { subjectId, topic, difficulty } = req.query;
  const filter: Record<string, unknown> = { schoolId: req.user!.schoolId };
  if (subjectId) filter.subjectId = subjectId;
  if (topic) filter.topic = topic;
  if (difficulty) filter.difficulty = difficulty;

  const questions = await Question.find(filter).sort({ createdAt: -1 });
  res.json(questions);
}

export async function updateQuestion(req: AuthedRequest, res: Response) {
  const question = await Question.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user!.schoolId },
    req.body,
    { new: true }
  );
  if (!question) return res.status(404).json({ error: "Question not found" });
  res.json(question);
}

export async function deleteQuestion(req: AuthedRequest, res: Response) {
  const result = await Question.findOneAndDelete({
    _id: req.params.id,
    schoolId: req.user!.schoolId
  });
  if (!result) return res.status(404).json({ error: "Question not found" });
  res.status(204).send();
}
