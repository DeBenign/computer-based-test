import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db";
import School from "../models/School";
import Class from "../models/Class";
import Subject from "../models/Subject";
import User from "../models/User";
import mongoose from "mongoose";

dotenv.config();

// Set your real admin credentials here before running this script.
const ADMIN = {
  name: process.env.SEED_ADMIN_NAME || "Admin",
  email: process.env.SEED_ADMIN_EMAIL || "",
  password: process.env.SEED_ADMIN_PASSWORD || ""
};

if (!ADMIN.email || !ADMIN.password) {
  console.error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in backend/.env before seeding.");
  process.exit(1);
}

async function seed() {
  await connectDB();

  let school = await School.findOne({ name: "De-Benign School" });
  if (!school) {
    school = await School.create({ name: "De-Benign School", address: "Ibadan, Nigeria" });
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

  const existingAdmin = await User.findOne({ email: ADMIN.email });
  if (existingAdmin) {
    console.log(`Admin already exists: ${ADMIN.email}`);
  } else {
    const passwordHash = await bcrypt.hash(ADMIN.password, 10);
    await User.create({
      schoolId: school._id,
      name: ADMIN.name,
      email: ADMIN.email,
      passwordHash,
      role: "admin"
    });
    console.log(`Created admin: ${ADMIN.email}`);
  }

  console.log(`\nSchool ID: ${school._id}`);
  console.log(`Class ID (JSS2A): ${klass._id}`);
  console.log(`Subject ID (Basic Science): ${subject._id}`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});