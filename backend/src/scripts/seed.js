/**
 * Seed script for the Placement Coordinator demo.
 * Run: npm run seed (from backend/)
 * Idempotent: checks for existing records before inserting.
 *
 * Creates:
 *   - 1 admin, 2 coordinators
 *   - 60 students across CSE, IT, ECE, EEE, MECH
 *   - 6 companies
 *   - 4 drives (2 with deliberately overlapping shortlists for clash demo)
 */

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import "../config/env.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

const DEMO_PASSWORD = "Demo@1234";
const SALT_ROUNDS = 10;
const hash = (pw) => bcrypt.hash(pw, SALT_ROUNDS);

// ── Helpers ───────────────────────────────────────────────────────────────────
async function upsertUser({ name, email, role }) {
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) return existing.id;

  const password_hash = await hash(DEMO_PASSWORD);
  const { data, error } = await supabase
    .from("users")
    .insert({ name, email, password_hash, role })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to create user ${email}: ${error.message}`);
  return data.id;
}

async function upsertCompany({ name, website, description, industry }) {
  const { data: existing } = await supabase
    .from("companies")
    .select("id")
    .eq("name", name)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("companies")
    .insert({ name, website, description, industry })
    .select("id")
    .single();
  if (error) throw new Error(`Failed to create company ${name}: ${error.message}`);
  return data.id;
}

// ── Data definitions ──────────────────────────────────────────────────────────

const BRANCHES = ["CSE", "IT", "ECE", "EEE", "MECH"];
const SKILL_POOLS = {
  CSE:  ["Java", "Python", "JavaScript", "React", "Node.js", "SQL", "Data Structures", "Algorithms", "Git", "Docker", "AWS", "Machine Learning"],
  IT:   ["Python", "JavaScript", "HTML/CSS", "React", "MySQL", "PHP", "REST APIs", "Git", "Linux", "Networking"],
  ECE:  ["C", "C++", "MATLAB", "Embedded Systems", "VHDL", "Python", "Signal Processing", "PCB Design", "IoT"],
  EEE:  ["C", "MATLAB", "Power Systems", "PLC", "AutoCAD", "Python", "Control Systems", "Circuit Design"],
  MECH: ["AutoCAD", "SolidWorks", "ANSYS", "Python", "MATLAB", "Manufacturing Processes", "Thermodynamics", "CAD/CAM"],
};

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomBetween(min, max, decimals = 0) {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

// Generate 60 students
function generateStudents() {
  const students = [];
  let idx = 1;
  for (const branch of BRANCHES) {
    for (let i = 0; i < 12; i++) {
      const cgpa = randomBetween(5.5, 9.5, 2);
      const backlogs = cgpa > 7.5 ? 0 : cgpa > 6.5 ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 4);
      const year = [3, 4][Math.floor(Math.random() * 2)];
      const skillCount = Math.floor(Math.random() * 5) + 3;
      const skills = pickRandom(SKILL_POOLS[branch], skillCount);

      students.push({
        name:    `${branch} Student ${String(idx).padStart(2, "0")}`,
        email:   `student${idx}@demo.com`,
        role:    "student",
        profile: {
          roll_no:  `${branch}${2021 + (4 - year)}${String(idx).padStart(3, "0")}`,
          branch,
          year,
          cgpa,
          backlogs,
          skills,
          phone:    `+91 9${String(Math.floor(Math.random() * 1e9)).padStart(9, "0")}`,
          resume_text: `${branch} Student ${idx} — ${year}th year student with CGPA ${cgpa}.\n\nSkills: ${skills.join(", ")}.\n\nProjects:\n- Built a web application using ${skills[0] ?? "Java"} demonstrating knowledge of core concepts.\n- Participated in college technical festival and won 2nd place.\n\nCertifications: Completed online course in ${skills[1] ?? "Python"}.\n\nEducation: B.Tech in ${branch} from ABC Engineering College.`,
          projects: [
            { name: `${branch} Mini Project`, description: `Academic project using ${skills[0] ?? "C++"}`, url: "" },
          ],
          certifications: [`${skills[1] ?? "Java"} Fundamentals`],
        },
      });
      idx++;
    }
  }
  return students;
}

const COMPANIES_DATA = [
  { name: "TechCorp Solutions",    website: "https://techcorp.example.com",    description: "Leading software company",             industry: "Software" },
  { name: "DataDriven Inc",        website: "https://datadriven.example.com",  description: "Data analytics and AI company",        industry: "Analytics" },
  { name: "CloudNine Systems",     website: "https://cloudnine.example.com",   description: "Cloud infrastructure provider",        industry: "Cloud" },
  { name: "Innovatech Labs",       website: "https://innovatech.example.com",  description: "R&D and product innovation",           industry: "Technology" },
  { name: "SmartEdge Pvt Ltd",     website: "https://smartedge.example.com",   description: "Edge computing and IoT solutions",     industry: "IoT" },
  { name: "GlobalFinance Tech",    website: "https://gftech.example.com",      description: "Fintech solutions and banking systems", industry: "Fintech" },
];

// ── Main seed function ────────────────────────────────────────────────────────
async function seed() {
  console.log("🌱 Starting seed...\n");

  // 1. Create admin
  console.log("Creating admin...");
  const adminId = await upsertUser({ name: "Admin User", email: "admin@demo.com", role: "admin" });

  // 2. Create coordinators
  console.log("Creating coordinators...");
  const coord1Id = await upsertUser({ name: "Coordinator Alice", email: "coordinator@demo.com", role: "coordinator" });
  const coord2Id = await upsertUser({ name: "Coordinator Bob",   email: "coordinator2@demo.com", role: "coordinator" });

  // 3. Create 60 students
  console.log("Creating 60 students...");
  const studentDefs = generateStudents();
  const studentIds = [];
  for (const s of studentDefs) {
    const id = await upsertUser({ name: s.name, email: s.email, role: s.role });
    studentIds.push(id);

    // Upsert profile
    const { data: existingProfile } = await supabase
      .from("student_profiles")
      .select("user_id")
      .eq("user_id", id)
      .maybeSingle();

    if (!existingProfile) {
      await supabase.from("student_profiles").insert({ user_id: id, ...s.profile });
    }
  }
  console.log(`  ✓ ${studentIds.length} students created/verified`);

  // 4. Create companies
  console.log("Creating companies...");
  const companyIds = {};
  for (const c of COMPANIES_DATA) {
    companyIds[c.name] = await upsertCompany(c);
  }

  // 5. Create drives
  console.log("Creating drives...");

  async function upsertDrive({ title, companyName, createdBy, roleTitle, jdText, ctcLpa, location, deadline, status, criteria, rounds }) {
    const { data: existing } = await supabase
      .from("drives")
      .select("id")
      .eq("title", title)
      .maybeSingle();

    let driveId = existing?.id;
    if (!driveId) {
      const { data: drive, error } = await supabase
        .from("drives")
        .insert({
          company_id:            companyIds[companyName],
          created_by:            createdBy,
          title,
          role_title:            roleTitle,
          jd_text:               jdText,
          ctc_lpa:               ctcLpa,
          location,
          registration_deadline: deadline,
          status,
          criteria_confirmed:    true,
        })
        .select("id")
        .single();
      if (error) throw new Error(`Drive creation failed: ${error.message}`);
      driveId = drive.id;
    }

    // Upsert criteria
    await supabase.from("drive_criteria").upsert(
      { drive_id: driveId, ...criteria },
      { onConflict: "drive_id" }
    );

    // Upsert rounds
    for (const r of rounds) {
      const { data: existingRound } = await supabase
        .from("rounds")
        .select("id")
        .eq("drive_id", driveId)
        .eq("round_no", r.round_no)
        .maybeSingle();
      if (!existingRound) {
        await supabase.from("rounds").insert({ drive_id: driveId, ...r });
      }
    }

    return driveId;
  }

  const futureDeadline1 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const futureDeadline2 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const futureDeadline3 = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
  const futureDeadline4 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const drive1Id = await upsertDrive({
    title:       "TechCorp — Full Stack Developer 2025",
    companyName: "TechCorp Solutions",
    createdBy:   coord1Id,
    roleTitle:   "Full Stack Developer",
    ctcLpa:      8.5,
    location:    "Bangalore",
    deadline:    futureDeadline1,
    status:      "open",
    jdText: `TechCorp Solutions is hiring Full Stack Developers.
Requirements: B.Tech in CSE/IT, minimum CGPA 7.0, no active backlogs.
Skills: React, Node.js, JavaScript, SQL, Git.
CTC: 8.5 LPA. Location: Bangalore.`,
    criteria: {
      min_cgpa:         7.0,
      max_backlogs:     0,
      allowed_branches: ["CSE", "IT"],
      allowed_years:    [4],
      required_skills:  ["JavaScript", "React", "Node.js"],
      preferred_skills: ["Docker", "AWS", "SQL"],
      mandatory_skills: [],
      extra_rules:      "Only final year students. No active backlogs.",
      ai_confidence:    0.95,
    },
    rounds: [
      { round_no: 1, name: "Online Aptitude Test", type: "aptitude",  duration_minutes: 60,  mode: "online"  },
      { round_no: 2, name: "Technical Interview",   type: "technical", duration_minutes: 45,  mode: "offline" },
      { round_no: 3, name: "HR Interview",           type: "hr",        duration_minutes: 30,  mode: "offline" },
    ],
  });

  // Drive 2 — deliberately overlaps with Drive 1 for clash demo
  const drive2Id = await upsertDrive({
    title:       "DataDriven — Data Analyst 2025",
    companyName: "DataDriven Inc",
    createdBy:   coord1Id,
    roleTitle:   "Data Analyst",
    ctcLpa:      7.5,
    location:    "Hyderabad",
    deadline:    futureDeadline2,
    status:      "open",
    jdText: `DataDriven Inc is hiring Data Analysts.
Requirements: B.Tech in CSE/IT/ECE, minimum CGPA 6.5, max 1 backlog.
Skills: Python, SQL, Machine Learning, Data Analysis.
CTC: 7.5 LPA. Location: Hyderabad.`,
    criteria: {
      min_cgpa:         6.5,
      max_backlogs:     1,
      allowed_branches: ["CSE", "IT", "ECE"],
      allowed_years:    [4],
      required_skills:  ["Python", "SQL"],
      preferred_skills: ["Machine Learning", "Data Structures"],
      mandatory_skills: [],
      extra_rules:      "Final year students preferred.",
      ai_confidence:    0.92,
    },
    rounds: [
      { round_no: 1, name: "Aptitude + Coding Test", type: "aptitude",  duration_minutes: 90,  mode: "online"  },
      { round_no: 2, name: "Data Case Study",          type: "technical", duration_minutes: 60,  mode: "offline" },
      { round_no: 3, name: "HR Round",                  type: "hr",        duration_minutes: 30,  mode: "offline" },
    ],
  });

  const drive3Id = await upsertDrive({
    title:       "CloudNine — Cloud Engineer 2025",
    companyName: "CloudNine Systems",
    createdBy:   coord2Id,
    roleTitle:   "Cloud Engineer",
    ctcLpa:      12.0,
    location:    "Pune",
    deadline:    futureDeadline3,
    status:      "open",
    jdText: `CloudNine Systems seeks Cloud Engineers.
Requirements: CSE/IT, minimum CGPA 7.5, no backlogs.
Mandatory: AWS or Docker.
CTC: 12 LPA. Location: Pune.`,
    criteria: {
      min_cgpa:         7.5,
      max_backlogs:     0,
      allowed_branches: ["CSE", "IT"],
      allowed_years:    [4],
      required_skills:  ["AWS", "Docker", "Linux"],
      preferred_skills: ["Kubernetes", "Python"],
      mandatory_skills: ["AWS", "Docker"],
      extra_rules:      "At least one cloud certification preferred.",
      ai_confidence:    0.88,
    },
    rounds: [
      { round_no: 1, name: "Technical MCQ",           type: "aptitude",  duration_minutes: 60,  mode: "online"  },
      { round_no: 2, name: "System Design Interview",  type: "technical", duration_minutes: 60,  mode: "offline" },
      { round_no: 3, name: "HR + Culture Fit",         type: "hr",        duration_minutes: 45,  mode: "offline" },
    ],
  });

  const drive4Id = await upsertDrive({
    title:       "SmartEdge — Embedded Systems Engineer",
    companyName: "SmartEdge Pvt Ltd",
    createdBy:   coord2Id,
    roleTitle:   "Embedded Systems Engineer",
    ctcLpa:      6.0,
    location:    "Chennai",
    deadline:    futureDeadline4,
    status:      "open",
    jdText: `SmartEdge Pvt Ltd is looking for Embedded Systems Engineers.
Requirements: ECE/EEE, minimum CGPA 6.0, max 2 backlogs.
Skills: C, Embedded Systems, RTOS, IoT.
CTC: 6 LPA. Location: Chennai.`,
    criteria: {
      min_cgpa:         6.0,
      max_backlogs:     2,
      allowed_branches: ["ECE", "EEE"],
      allowed_years:    [3, 4],
      required_skills:  ["C", "Embedded Systems"],
      preferred_skills: ["RTOS", "IoT", "Python"],
      mandatory_skills: [],
      extra_rules:      "Hardware project experience preferred.",
      ai_confidence:    0.9,
    },
    rounds: [
      { round_no: 1, name: "Technical Test",    type: "aptitude",  duration_minutes: 60,  mode: "online"  },
      { round_no: 2, name: "Technical Interview", type: "technical", duration_minutes: 45,  mode: "offline" },
    ],
  });

  console.log("  ✓ 4 drives created/verified");

  // 6. Run eligibility for all drives and create applications
  console.log("Running eligibility and creating applications...");
  const { data: allProfiles } = await supabase
    .from("student_profiles")
    .select("*, users!inner(id, role, is_active)")
    .eq("users.role", "student")
    .eq("users.is_active", true);

  const drives = [
    { id: drive1Id, criteria: { min_cgpa: 7.0, max_backlogs: 0, allowed_branches: ["CSE", "IT"], allowed_years: [4], mandatory_skills: [], required_skills: ["JavaScript", "React", "Node.js"] } },
    { id: drive2Id, criteria: { min_cgpa: 6.5, max_backlogs: 1, allowed_branches: ["CSE", "IT", "ECE"], allowed_years: [4], mandatory_skills: [], required_skills: ["Python", "SQL"] } },
    { id: drive3Id, criteria: { min_cgpa: 7.5, max_backlogs: 0, allowed_branches: ["CSE", "IT"], allowed_years: [4], mandatory_skills: ["AWS", "Docker"], required_skills: [] } },
    { id: drive4Id, criteria: { min_cgpa: 6.0, max_backlogs: 2, allowed_branches: ["ECE", "EEE"], allowed_years: [3, 4], mandatory_skills: [], required_skills: ["C", "Embedded Systems"] } },
  ];

  function checkEligible(profile, criteria) {
    const cgpa     = parseFloat(profile.cgpa ?? 0);
    const backlogs = parseInt(profile.backlogs ?? 0, 10);
    const branch   = (profile.branch ?? "").toLowerCase();
    const year     = parseInt(profile.year ?? 0, 10);
    const skills   = (profile.skills ?? []).map((s) => s.toLowerCase());

    if (criteria.min_cgpa !== null && cgpa < criteria.min_cgpa) return false;
    if (criteria.max_backlogs !== null && backlogs > criteria.max_backlogs) return false;
    if (criteria.allowed_branches?.length && !criteria.allowed_branches.map((b) => b.toLowerCase()).includes(branch)) return false;
    if (criteria.allowed_years?.length && !criteria.allowed_years.includes(year)) return false;
    for (const ms of criteria.mandatory_skills ?? []) {
      if (!skills.includes(ms.toLowerCase())) return false;
    }
    return true;
  }

  const eligibilityResults = {};
  for (const drive of drives) {
    const eligible = [];
    for (const profile of allProfiles ?? []) {
      if (checkEligible(profile, drive.criteria)) {
        eligible.push(profile.user_id ?? profile.users?.id);
      }
    }
    eligibilityResults[drive.id] = eligible;

    for (const studentId of eligible) {
      const { data: existing } = await supabase
        .from("applications")
        .select("id")
        .eq("drive_id", drive.id)
        .eq("student_id", studentId)
        .maybeSingle();
      if (!existing) {
        await supabase.from("applications").insert({
          drive_id:   drive.id,
          student_id: studentId,
          status:     "eligible",
        });
      }
    }
  }

  // 7. Shortlist 10 students from both drive1 and drive2 (same students for clash demo)
  console.log("Creating shortlists with deliberate clash for demo...");

  // Find students eligible for BOTH drive1 and drive2
  const eligD1 = new Set(eligibilityResults[drive1Id] ?? []);
  const eligD2 = new Set(eligibilityResults[drive2Id] ?? []);
  const bothEligible = [...eligD1].filter((id) => eligD2.has(id));
  const clashStudents = bothEligible.slice(0, Math.min(10, bothEligible.length));

  console.log(`  ℹ️  ${clashStudents.length} students eligible for both Drive 1 & Drive 2 (clash demo)`);

  for (const studentId of clashStudents) {
    // Shortlist in drive1
    await supabase.from("applications").update({ status: "shortlisted", coordinator_approved: true, match_score: Math.floor(Math.random() * 20) + 70 })
      .eq("drive_id", drive1Id).eq("student_id", studentId);

    // Shortlist in drive2 (creates scheduling conflict)
    await supabase.from("applications").update({ status: "shortlisted", coordinator_approved: true, match_score: Math.floor(Math.random() * 20) + 60 })
      .eq("drive_id", drive2Id).eq("student_id", studentId);
  }

  // Apply some non-clash students too
  const drive1Only = [...eligD1].filter((id) => !eligD2.has(id)).slice(0, 5);
  for (const studentId of drive1Only) {
    await supabase.from("applications").update({ status: "applied" })
      .eq("drive_id", drive1Id).eq("student_id", studentId);
  }

  // ── Print demo credentials ────────────────────────────────────────────────
  console.log("\n" + "=".repeat(60));
  console.log("✅  SEED COMPLETE — Demo Credentials");
  console.log("=".repeat(60));
  console.log("\nRole         | Email                    | Password");
  console.log("-------------|--------------------------|------------");
  console.log("Admin        | admin@demo.com            | Demo@1234");
  console.log("Coordinator  | coordinator@demo.com      | Demo@1234");
  console.log("Coordinator  | coordinator2@demo.com     | Demo@1234");
  console.log("Student      | student1@demo.com         | Demo@1234");
  console.log("Student      | student2@demo.com         | Demo@1234");
  console.log("  ... (student1 to student60)");
  console.log("\nClash demo students (shortlisted in Drive 1 AND Drive 2):");
  console.log(`  ${clashStudents.length} students are shortlisted in both TechCorp AND DataDriven drives`);
  console.log("\nDrives created:");
  console.log(`  1. TechCorp Full Stack (ID: ${drive1Id})`);
  console.log(`  2. DataDriven Data Analyst (ID: ${drive2Id}) ← CLASH with Drive 1`);
  console.log(`  3. CloudNine Cloud Engineer (ID: ${drive3Id})`);
  console.log(`  4. SmartEdge Embedded Systems (ID: ${drive4Id})`);
  console.log("=".repeat(60) + "\n");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
