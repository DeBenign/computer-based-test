import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db";
import School from "../models/School";
import Class from "../models/Class";
import Subject from "../models/Subject";
import User from "../models/User";
import mongoose from "mongoose";

dotenv.config();

// Fixed demo credentials -- change these before using in anything but local dev.
const DEMO = {
  admin: { name: "Admin User", email: "admin@debenign.test", password: "Admin@123" },
  teacher: { name: "Teacher User", email: "teacher@debenign.test", password: "Teacher@123" },
  student: { name: "Student User", email: "student@debenign.test", password: "Student@123" }
};

async function seed() {
  await connectDB();

  let school = await School.findOne({ name: "De-Benign School (Demo)" });
  if (!school) {
    school = await School.create({ name: "De-Benign School (Demo)", address: "Ibadan, Nigeria" });
    console.log("Created school:", school._id);
  }

  let klass = await Class.findOne({ schoolId: school._id, name: "JSS2A" });
  if (!klass) {
    klass = await Class.create({ schoolId: school._id, name: "JSS2A", academicYear: "2025/2026" });
    console.log("Created class:", klass._id);
  }

  let subject = await Subject.findOne({ schoolId: school._id, name: "Basic Science" });
  if (!subject) {
    subject = await Subject.create({ schoolId: school._id, name: "Basic Science", classIds: [klass._id] });
    console.log("Created subject:", subject._id);
  }

  async function upsertUser(role: "admin" | "teacher" | "student", info: { name: string; email: string; password: string }) {
    const existing = await User.findOne({ email: info.email });
    if (existing) {
      console.log(`${role} already exists: ${info.email}`);
      return;
    }
    const passwordHash = await bcrypt.hash(info.password, 10);
    await User.create({
      schoolId: school!._id,
      name: info.name,
      email: info.email,
      passwordHash,
      role,
      classId: role === "student" ? klass!._id : undefined,
      subjectIds: role === "teacher" ? [subject!._id] : undefined
    });
    console.log(`Created ${role}: ${info.email} / ${info.password}`);
  }

  await upsertUser("admin", DEMO.admin);
  await upsertUser("teacher", DEMO.teacher);
  await upsertUser("student", DEMO.student);

  console.log("\nDemo login details:");
  console.log("--------------------------------------------------");
  console.log(`Admin   -> ${DEMO.admin.email} / ${DEMO.admin.password}`);
  console.log(`Teacher -> ${DEMO.teacher.email} / ${DEMO.teacher.password}`);
  console.log(`Student -> ${DEMO.student.email} / ${DEMO.student.password}`);
  console.log("--------------------------------------------------");
  console.log(`School ID: ${school._id}`);
  console.log(`Class ID (JSS2A): ${klass._id}`);
  console.log(`Subject ID (Basic Science): ${subject._id}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
