import crypto from "crypto";

// Default password hash for "Demo@1234"
const DEMO_PW_HASH = "$2a$10$1y/BDPeBT07cHhiJ7rh/.O7wSYs50HgPdDqLm6INoe7x8FNhQFuoC";

export function createInitialStore() {
  const users = [
    {
      id: "11111111-1111-1111-1111-111111111111",
      name: "System Admin",
      email: "admin@demo.com",
      password_hash: DEMO_PW_HASH,
      role: "admin",
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      name: "Dr. Ramesh Kumar (Placement Officer)",
      email: "coordinator@demo.com",
      password_hash: DEMO_PW_HASH,
      role: "coordinator",
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "22222222-2222-2222-2222-222222222223",
      name: "Prof. Priya Sharma (Co-Coordinator)",
      email: "coordinator2@demo.com",
      password_hash: DEMO_PW_HASH,
      role: "coordinator",
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ];

  const student_profiles = [];
  const NAMED_STUDENTS = [
    {
      name: "Arjun Mehta",
      email: "student1@demo.com",
      branch: "CSE",
      year: 2026,
      cgpa: 9.1,
      backlogs: 0,
      skills: ["JavaScript", "Python", "React", "Node.js", "Express", "PostgreSQL", "Docker", "Tailwind CSS"],
      phone: "+91 98400 11001",
      linkedin: "https://linkedin.com/in/arjunmehta-demo",
      certifications: ["Meta Front-End Developer", "AWS Cloud Practitioner"],
    },
    {
      name: "Priya Ramanathan",
      email: "student2@demo.com",
      branch: "IT",
      year: 2026,
      cgpa: 8.2,
      backlogs: 0,
      skills: ["Java", "Spring Boot", "MySQL", "HTML", "CSS", "JavaScript", "Git", "REST APIs"],
      phone: "+91 98400 11002",
      linkedin: "https://linkedin.com/in/priyar-demo",
      certifications: ["Oracle Java SE Foundations"],
    },
    {
      name: "Rohan Deshmukh",
      email: "student3@demo.com",
      branch: "CSE",
      year: 2025,
      cgpa: 9.4,
      backlogs: 0,
      skills: ["Python", "Docker", "Kubernetes", "AWS", "Linux", "Node.js", "SQL", "Git"],
      phone: "+91 98400 11003",
      linkedin: "https://linkedin.com/in/rohand-demo",
      certifications: ["AWS Solutions Architect", "CKA Certified Kubernetes"],
    },
    {
      name: "Ananya Iyer",
      email: "student4@demo.com",
      branch: "CSE",
      year: 2026,
      cgpa: 7.8,
      backlogs: 0,
      skills: ["JavaScript", "React", "Node.js", "SQL", "Git", "HTML", "CSS"],
      phone: "+91 98400 11004",
      linkedin: "https://linkedin.com/in/ananyai-demo",
      certifications: ["Full Stack Development"],
    },
    {
      name: "Karthik Subramanian",
      email: "student5@demo.com",
      branch: "IT",
      year: 2025,
      cgpa: 7.4,
      backlogs: 0,
      skills: ["Python", "MySQL", "Git", "Linux", "Django"],
      phone: "+91 98400 11005",
      linkedin: "https://linkedin.com/in/karthiks-demo",
      certifications: ["Python Data Structures"],
    },
    {
      name: "Rahul Venkatesh",
      email: "student6@demo.com",
      branch: "MECH",
      year: 2026,
      cgpa: 8.4,
      backlogs: 0,
      skills: ["AutoCAD", "SolidWorks", "ANSYS", "MATLAB", "Python"],
      phone: "+91 98400 11006",
      linkedin: "https://linkedin.com/in/rahulv-demo",
      certifications: ["SolidWorks Mechanical Design Associate"],
    },
    {
      name: "Divya Nambiar",
      email: "student7@demo.com",
      branch: "AIDS",
      year: 2026,
      cgpa: 8.9,
      backlogs: 0,
      skills: ["Python", "SQL", "Data Structures", "TensorFlow", "React", "Pandas"],
      phone: "+91 98400 11007",
      linkedin: "https://linkedin.com/in/divyan-demo",
      certifications: ["DeepLearning.AI TensorFlow Developer"],
    },
    {
      name: "Suresh Nair (CGPA 6.3 - Low)",
      email: "student8@demo.com",
      branch: "CSE",
      year: 2025,
      cgpa: 6.3,
      backlogs: 0,
      skills: ["JavaScript", "HTML", "CSS", "MySQL"],
      phone: "+91 98400 11008",
      linkedin: "https://linkedin.com/in/sureshn-demo",
      certifications: ["Web Basics"],
    },
    {
      name: "Vikram Sethi (1 Active Backlog)",
      email: "student9@demo.com",
      branch: "CSE",
      year: 2026,
      cgpa: 7.9,
      backlogs: 1,
      skills: ["Java", "SQL", "React", "Node.js"],
      phone: "+91 98400 11009",
      linkedin: "https://linkedin.com/in/vikrams-demo",
      certifications: ["Java Certified"],
    },
    {
      name: "Meera Krishnan (2 Backlogs, 6.1 CGPA)",
      email: "student10@demo.com",
      branch: "ECE",
      year: 2025,
      cgpa: 6.1,
      backlogs: 2,
      skills: ["C", "C++", "MATLAB"],
      phone: "+91 98400 11010",
      linkedin: "https://linkedin.com/in/meerak-demo",
      certifications: ["VLSI Fundamentals"],
    },
    {
      name: "Harish Balaji (MECH Branch)",
      email: "student11@demo.com",
      branch: "MECH",
      year: 2025,
      cgpa: 7.6,
      backlogs: 0,
      skills: ["AutoCAD", "SolidWorks", "ANSYS", "Python"],
      phone: "+91 98400 11011",
      linkedin: "https://linkedin.com/in/harishb-demo",
      certifications: ["CAD/CAM Specialist"],
    },
    {
      name: "Sneha Kulkarni",
      email: "student12@demo.com",
      branch: "IT",
      year: 2026,
      cgpa: 8.7,
      backlogs: 0,
      skills: ["Python", "Docker", "Linux", "Kubernetes", "AWS", "Git"],
      phone: "+91 98400 11012",
      linkedin: "https://linkedin.com/in/snehak-demo",
      certifications: ["AWS Certified Developer", "Docker Pro"],
    },
    {
      name: "Tanvi Reddy",
      email: "student13@demo.com",
      branch: "CSBS",
      year: 2026,
      cgpa: 8.5,
      backlogs: 0,
      skills: ["Python", "SQL", "Data Structures", "React", "Financial Modeling"],
      phone: "+91 98400 11013",
      linkedin: "https://linkedin.com/in/tanvir-demo",
      certifications: ["FinTech Specialist"],
    },
    {
      name: "Aditya Joshi (Offer Accepted)",
      email: "student14@demo.com",
      branch: "CSE",
      year: 2025,
      cgpa: 9.3,
      backlogs: 0,
      skills: ["C++", "Go", "Distributed Systems", "Docker", "PostgreSQL", "React"],
      phone: "+91 98400 11014",
      linkedin: "https://linkedin.com/in/adityaj-demo",
      certifications: ["Distributed Systems Architect"],
    },
    {
      name: "Pooja Hegde",
      email: "student15@demo.com",
      branch: "ECE",
      year: 2026,
      cgpa: 7.7,
      backlogs: 0,
      skills: ["Embedded C", "IoT", "Python", "Linux", "Git"],
      phone: "+91 98400 11015",
      linkedin: "https://linkedin.com/in/poojah-demo",
      certifications: ["IoT Specialist"],
    },
    {
      name: "Nithin Verma",
      email: "student16@demo.com",
      branch: "EEE",
      year: 2025,
      cgpa: 7.1,
      backlogs: 0,
      skills: ["PLC", "Power Systems", "AutoCAD", "Python"],
      phone: "+91 98400 11016",
      linkedin: "https://linkedin.com/in/nithinv-demo",
      certifications: ["Industrial Automation"],
    },
    {
      name: "Shreya Patil",
      email: "student17@demo.com",
      branch: "AIDS",
      year: 2026,
      cgpa: 8.6,
      backlogs: 0,
      skills: ["Python", "SQL", "Data Structures", "PyTorch", "FastAPI"],
      phone: "+91 98400 11017",
      linkedin: "https://linkedin.com/in/shreyap-demo",
      certifications: ["AI Engineer Track"],
    },
    {
      name: "Deepak Menon (Exact 7.0 CGPA)",
      email: "student18@demo.com",
      branch: "CSE",
      year: 2025,
      cgpa: 7.0,
      backlogs: 0,
      skills: ["JavaScript", "React", "Node.js", "SQL"],
      phone: "+91 98400 11018",
      linkedin: "https://linkedin.com/in/deepakm-demo",
      certifications: ["Web Fundamentals"],
    },
    {
      name: "Gautham R (6.95 CGPA - Borderline)",
      email: "student19@demo.com",
      branch: "IT",
      year: 2026,
      cgpa: 6.95,
      backlogs: 0,
      skills: ["Python", "SQL", "Docker", "Git"],
      phone: "+91 98400 11019",
      linkedin: "https://linkedin.com/in/gauthamr-demo",
      certifications: ["Database Design"],
    },
    {
      name: "Kavita Saxena",
      email: "student20@demo.com",
      branch: "CSE",
      year: 2025,
      cgpa: 8.0,
      backlogs: 0,
      skills: ["React", "Node.js", "MongoDB", "Express", "Git"],
      phone: "+91 98400 11020",
      linkedin: "https://linkedin.com/in/kavitas-demo",
      certifications: ["MERN Full Stack"],
    },
  ];

  NAMED_STUDENTS.forEach((st, idx) => {
    const sIdx = idx + 1;
    const uId = `33333333-3333-3333-3333-${String(sIdx).padStart(12, "0")}`;
    users.push({
      id: uId,
      name: st.name,
      email: st.email,
      password_hash: DEMO_PW_HASH,
      role: "student",
      is_active: true,
      created_at: new Date().toISOString(),
    });
    student_profiles.push({
      user_id: uId,
      roll_no: `${st.branch}2022${String(sIdx).padStart(3, "0")}`,
      branch: st.branch,
      year: st.year,
      cgpa: st.cgpa,
      backlogs: st.backlogs,
      skills: st.skills,
      resume_text: `${st.name} — ${st.branch} Student with CGPA ${st.cgpa}.\nSkills: ${st.skills.join(", ")}.\nEducation: B.Tech ${st.branch}, Graduating Batch: ${st.year}. Backlogs: ${st.backlogs}.`,
      phone: st.phone,
      linkedin: st.linkedin,
      projects: [
        { name: `${st.branch} Core Capstone`, description: "Technical solution deployed on production", url: "https://github.com/demo" },
      ],
      certifications: st.certifications,
    });
  });

  // Additional background students 21 to 50 across branches
  const EXTRA_BRANCHES = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AIDS", "CSBS"];
  for (let sIdx = 21; sIdx <= 50; sIdx++) {
    const b = EXTRA_BRANCHES[sIdx % EXTRA_BRANCHES.length];
    const uId = `33333333-3333-3333-3333-${String(sIdx).padStart(12, "0")}`;
    const cgpa = parseFloat((6.2 + (sIdx % 35) * 0.1).toFixed(2));
    const backlogs = sIdx % 8 === 0 ? 1 : 0;
    const skills = [b === "MECH" || b === "CIVIL" ? "AutoCAD" : "Python", "SQL", "Git"];
    users.push({
      id: uId,
      name: `${b} Candidate ${sIdx}`,
      email: `student${sIdx}@demo.com`,
      password_hash: DEMO_PW_HASH,
      role: "student",
      is_active: true,
      created_at: new Date().toISOString(),
    });
    student_profiles.push({
      user_id: uId,
      roll_no: `${b}2022${String(sIdx).padStart(3, "0")}`,
      branch: b,
      year: 2026,
      cgpa,
      backlogs,
      skills,
      resume_text: `${b} Candidate ${sIdx} with ${cgpa} CGPA in ${b}.`,
      phone: `+91 98765${String(sIdx).padStart(5, "0")}`,
      linkedin: `https://linkedin.com/in/student${sIdx}`,
      projects: [],
      certifications: ["Foundations Certificate"],
    });
  }

  const companies = [
    {
      id: "44444444-4444-4444-4444-444444444441",
      name: "Acme Technologies",
      website: "https://acme.tech",
      industry: "Enterprise Software",
      description: "Leading enterprise SaaS solutions provider with global client base.",
    },
    {
      id: "44444444-4444-4444-4444-444444444442",
      name: "CloudScale Systems",
      website: "https://cloudscale.io",
      industry: "Cloud Infrastructure",
      description: "Specializing in distributed computing and multi-cloud orchestration.",
    },
    {
      id: "44444444-4444-4444-4444-444444444443",
      name: "FinTech Global Labs",
      website: "https://fintechglobal.com",
      industry: "Fintech",
      description: "High-frequency trading platforms and payment gateways.",
    },
  ];

  const drives = [
    {
      id: "55555555-5555-5555-5555-555555555551",
      company_id: companies[0].id,
      created_by: users[1].id,
      title: "Acme Tech Graduate Engineer Drive 2025",
      role_title: "Graduate Engineer Trainee",
      jd_text: "Seeking B.Tech CSE/IT graduates for Bangalore office. CTC: 12 LPA. Requires JavaScript, React, Node.js.",
      ctc_lpa: 12,
      location: "Bangalore",
      registration_deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      status: "open",
      criteria_confirmed: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "55555555-5555-5555-5555-555555555552",
      company_id: companies[1].id,
      created_by: users[1].id,
      title: "CloudScale Systems SRE Campus Drive",
      role_title: "Site Reliability Engineer",
      jd_text: "Hiring engineers passionate about cloud systems, Docker, and Python. CTC: 14.5 LPA.",
      ctc_lpa: 14.5,
      location: "Hyderabad / Remote",
      registration_deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
      status: "open",
      criteria_confirmed: true,
      created_at: new Date().toISOString(),
    },
    {
      id: "55555555-5555-5555-5555-555555555553",
      company_id: companies[2].id,
      created_by: users[1].id,
      title: "FinTech Global Quant & Platform Drive",
      role_title: "Platform Engineer & Analyst",
      jd_text: "Quantitative trading platform engineering with Python, SQL, and data structures. CTC: 16 LPA.",
      ctc_lpa: 16,
      location: "Mumbai / Hybrid",
      registration_deadline: new Date(Date.now() + 10 * 86400000).toISOString(),
      status: "open",
      criteria_confirmed: true,
      created_at: new Date().toISOString(),
    },
  ];

  const drive_criteria = [
    {
      drive_id: drives[0].id,
      min_cgpa: 7.0,
      max_backlogs: 0,
      allowed_branches: ["CSE", "IT"],
      allowed_years: [2025, 2026],
      required_skills: ["JavaScript", "React", "Node.js"],
      preferred_skills: ["Docker", "SQL"],
      mandatory_skills: [],
      extra_rules: null,
      ai_confidence: 0.92,
      ai_raw: {},
    },
    {
      drive_id: drives[1].id,
      min_cgpa: 7.5,
      max_backlogs: 0,
      allowed_branches: ["CSE", "IT", "ECE"],
      allowed_years: [2025, 2026],
      required_skills: ["Python", "Docker", "Linux"],
      preferred_skills: ["Kubernetes", "AWS"],
      mandatory_skills: [],
      extra_rules: null,
      ai_confidence: 0.88,
      ai_raw: {},
    },
    {
      drive_id: drives[2].id,
      min_cgpa: 8.0,
      max_backlogs: 0,
      allowed_branches: ["CSE", "IT", "AIDS", "CSBS"],
      allowed_years: [2025, 2026],
      required_skills: ["Python", "SQL", "Data Structures"],
      preferred_skills: ["PostgreSQL", "C++"],
      mandatory_skills: [],
      extra_rules: null,
      ai_confidence: 0.94,
      ai_raw: {},
    },
  ];

  const rounds = [
    {
      id: "66666666-6666-6666-6666-666666666661",
      drive_id: drives[0].id,
      round_no: 1,
      name: "Online Aptitude & Coding",
      type: "aptitude",
      duration_minutes: 60,
      mode: "online",
    },
    {
      id: "66666666-6666-6666-6666-666666666662",
      drive_id: drives[0].id,
      round_no: 2,
      name: "Technical Interview",
      type: "technical",
      duration_minutes: 45,
      mode: "offline",
    },
    {
      id: "66666666-6666-6666-6666-666666666663",
      drive_id: drives[1].id,
      round_no: 1,
      name: "Cloud Architecture Assessment",
      type: "coding",
      duration_minutes: 60,
      mode: "online",
    },
  ];

  const sid = (num) => `33333333-3333-3333-3333-${String(num).padStart(12, "0")}`;
  const appid = (num) => `77777777-7777-7777-7777-${String(num).padStart(12, "0")}`;

  const applications = [
    // ── Drive 0: Acme Technologies (Min CGPA: 7.0, Max Backlogs: 0, CSE/IT) ──
    {
      id: appid(1),
      drive_id: drives[0].id,
      student_id: sid(1), // Arjun Mehta (9.1 CGPA, CSE)
      status: "shortlisted",
      match_score: 92,
      skill_gap: { matched: ["JavaScript", "React", "Node.js"], missing: [] },
      ai_reason: "High alignment with Graduate Engineer Trainee; verified React & Node.js proficiency with 9.1 CGPA.",
      status_reason: "Shortlisted: Top 5% ranking based on full-stack credentials.",
      coordinator_approved: true,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: appid(2),
      drive_id: drives[0].id,
      student_id: sid(3), // Rohan Deshmukh (9.4 CGPA, CSE)
      status: "shortlisted",
      match_score: 90,
      skill_gap: { matched: ["Python", "Docker", "Node.js", "SQL"], missing: [] },
      ai_reason: "Outstanding academic performance (9.4 CGPA) and advanced system development skills.",
      status_reason: "Shortlisted: High technical score across algorithms and backend.",
      coordinator_approved: true,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 22).toISOString(),
    },
    {
      id: appid(3),
      drive_id: drives[0].id,
      student_id: sid(4), // Ananya Iyer (7.8 CGPA, CSE)
      status: "shortlisted",
      match_score: 83,
      skill_gap: { matched: ["JavaScript", "React", "Node.js"], missing: ["Docker"] },
      ai_reason: "Clear fit for web development stack; all mandatory skills confirmed.",
      status_reason: "Shortlisted: Strong web stack and eligible credentials.",
      coordinator_approved: true,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    },
    {
      id: appid(4),
      drive_id: drives[0].id,
      student_id: sid(18), // Deepak Menon (7.0 CGPA - EXACT BOUNDARY EDGE CASE)
      status: "shortlisted",
      match_score: 75,
      skill_gap: { matched: ["JavaScript", "React", "Node.js"], missing: ["Docker"] },
      ai_reason: "Exact 7.00 CGPA boundary match; satisfies all minimum criteria.",
      status_reason: "Shortlisted: Meets exact 7.00 CGPA minimum cut-off threshold.",
      coordinator_approved: true,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    },
    {
      id: appid(5),
      drive_id: drives[0].id,
      student_id: sid(2), // Priya Ramanathan (8.2 CGPA, IT)
      status: "applied",
      match_score: 72,
      skill_gap: { matched: ["JavaScript", "Git"], missing: ["React"] },
      ai_reason: "Strong Java backend candidate; learning frontend React.",
      status_reason: "Pending coordinator review.",
      coordinator_approved: false,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
    },
    {
      id: appid(6),
      drive_id: drives[0].id,
      student_id: sid(20), // Kavita Saxena (8.0 CGPA, CSE)
      status: "applied",
      match_score: 78,
      skill_gap: { matched: ["React", "Node.js"], missing: [] },
      ai_reason: "MERN stack developer awaiting coordinator shortlist approval.",
      status_reason: "Pending coordinator review.",
      coordinator_approved: false,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    },
    {
      id: appid(7),
      drive_id: drives[0].id,
      student_id: sid(8), // Suresh Nair (6.3 CGPA - BELOW MIN CUTOFF EDGE CASE)
      status: "rejected",
      match_score: 42,
      skill_gap: { matched: ["JavaScript"], missing: ["Node.js", "Docker"] },
      ai_reason: "CGPA 6.30 is below the minimum required 7.00 threshold.",
      status_reason: "Rejected: CGPA 6.30 does not meet the minimum 7.00 cut-off criteria.",
      coordinator_approved: false,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: appid(8),
      drive_id: drives[0].id,
      student_id: sid(9), // Vikram Sethi (1 BACKLOG EDGE CASE)
      status: "rejected",
      match_score: 55,
      skill_gap: { matched: ["React", "Node.js"], missing: [] },
      ai_reason: "1 active backlog exceeds drive criteria maximum permitted allowance of 0 backlogs.",
      status_reason: "Rejected: 1 active backlog exceeds the maximum allowance of 0 backlogs.",
      coordinator_approved: false,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    },
    {
      id: appid(9),
      drive_id: drives[0].id,
      student_id: sid(11), // Harish Balaji (MECH BRANCH EDGE CASE)
      status: "rejected",
      match_score: 28,
      skill_gap: { matched: ["Python"], missing: ["JavaScript", "React", "Node.js"] },
      ai_reason: "Branch 'MECH' is not among allowed branches [CSE, IT] for this software drive.",
      status_reason: "Rejected: Branch 'MECH' is not eligible for this Software Engineer drive.",
      coordinator_approved: false,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
      id: appid(10),
      drive_id: drives[0].id,
      student_id: sid(19), // Gautham R (6.95 CGPA - BORDERLINE EDGE CASE)
      status: "rejected",
      match_score: 48,
      skill_gap: { matched: ["SQL", "Docker"], missing: ["React"] },
      ai_reason: "CGPA 6.95 fails the 7.00 minimum cut-off by 0.05 points.",
      status_reason: "Rejected: CGPA 6.95 is below minimum 7.00 threshold.",
      coordinator_approved: false,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      id: appid(11),
      drive_id: drives[0].id,
      student_id: sid(14), // Aditya Joshi (PLACED OFFER MADE)
      status: "selected",
      match_score: 95,
      skill_gap: { matched: ["C++", "PostgreSQL", "React"], missing: [] },
      ai_reason: "Exceptional candidate; ranked #1 in coding test and technical interview.",
      status_reason: "Selected: Accepted formal placement offer (12 LPA).",
      coordinator_approved: true,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    },

    // ── Drive 1: CloudScale Systems (Min CGPA: 7.5, Max Backlogs: 0, CSE/IT/ECE) ──
    {
      id: appid(12),
      drive_id: drives[1].id,
      student_id: sid(12), // Sneha Kulkarni (8.7 CGPA, IT, SRE Fit)
      status: "shortlisted",
      match_score: 94,
      skill_gap: { matched: ["Python", "Docker", "Linux", "Kubernetes", "AWS"], missing: [] },
      ai_reason: "Flawless alignment with SRE profile; cloud containers and Linux verified.",
      status_reason: "Shortlisted: Top tier SRE candidate with production Docker & AWS.",
      coordinator_approved: true,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 15).toISOString(),
    },
    {
      id: appid(13),
      drive_id: drives[1].id,
      student_id: sid(3), // Rohan Deshmukh (9.4 CGPA, CSE)
      status: "shortlisted",
      match_score: 95,
      skill_gap: { matched: ["Python", "Docker", "Linux", "Kubernetes", "AWS"], missing: [] },
      ai_reason: "CKA Certified Kubernetes + 9.4 CGPA.",
      status_reason: "Shortlisted: Top percentile Cloud & DevOps engineer.",
      coordinator_approved: true,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
    },
    {
      id: appid(14),
      drive_id: drives[1].id,
      student_id: sid(1), // Arjun Mehta (9.1 CGPA, CSE)
      status: "shortlisted",
      match_score: 85,
      skill_gap: { matched: ["Python", "Docker"], missing: ["Linux"] },
      ai_reason: "Strong systems foundation with Docker containerization background.",
      status_reason: "Shortlisted: Approved based on high academic and container skills.",
      coordinator_approved: true,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: appid(15),
      drive_id: drives[1].id,
      student_id: sid(15), // Pooja Hegde (7.7 CGPA, ECE)
      status: "applied",
      match_score: 68,
      skill_gap: { matched: ["Python", "Linux"], missing: ["Docker"] },
      ai_reason: "ECE graduate with Linux familiarity; awaiting Docker assessment.",
      status_reason: "Pending coordinator review.",
      coordinator_approved: false,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
      id: appid(16),
      drive_id: drives[1].id,
      student_id: sid(8), // Suresh Nair (6.3 CGPA)
      status: "rejected",
      match_score: 30,
      skill_gap: { matched: [], missing: ["Python", "Docker", "Linux"] },
      ai_reason: "CGPA 6.30 is below minimum 7.50 requirement and missing Docker/Linux.",
      status_reason: "Rejected: CGPA 6.30 does not meet the minimum 7.50 requirement.",
      coordinator_approved: false,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 7).toISOString(),
    },
    {
      id: appid(17),
      drive_id: drives[1].id,
      student_id: sid(10), // Meera Krishnan (6.1 CGPA, 2 backlogs)
      status: "rejected",
      match_score: 32,
      skill_gap: { matched: [], missing: ["Python", "Docker", "Linux"] },
      ai_reason: "2 active backlogs and 6.10 CGPA violate eligibility requirements.",
      status_reason: "Rejected: Active backlogs and CGPA below 7.50 requirement.",
      coordinator_approved: false,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: appid(18),
      drive_id: drives[1].id,
      student_id: sid(6), // Rahul Venkatesh (MECH)
      status: "rejected",
      match_score: 22,
      skill_gap: { matched: ["Python"], missing: ["Docker", "Linux"] },
      ai_reason: "Branch 'MECH' not allowed (Allowed: CSE, IT, ECE) & missing Docker.",
      status_reason: "Rejected: Disallowed branch MECH and missing mandatory Docker competencies.",
      coordinator_approved: false,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },

    // ── Drive 2: FinTech Global Labs (Min CGPA: 8.0, Max Backlogs: 0, CSE/IT/AIDS/CSBS) ──
    {
      id: appid(19),
      drive_id: drives[2].id,
      student_id: sid(13), // Tanvi Reddy (8.5 CGPA, CSBS)
      status: "shortlisted",
      match_score: 89,
      skill_gap: { matched: ["Python", "SQL", "Data Structures"], missing: [] },
      ai_reason: "Ideal profile for quantitative systems; strong financial modeling & SQL.",
      status_reason: "Shortlisted: CSBS quant specialist with 8.5 CGPA.",
      coordinator_approved: true,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 9).toISOString(),
    },
    {
      id: appid(20),
      drive_id: drives[2].id,
      student_id: sid(7), // Divya Nambiar (8.9 CGPA, AIDS)
      status: "shortlisted",
      match_score: 88,
      skill_gap: { matched: ["Python", "SQL", "Data Structures"], missing: [] },
      ai_reason: "AI/Data specialization with 8.9 CGPA and verified data structure capability.",
      status_reason: "Shortlisted: High analytics and algorithmic problem solving score.",
      coordinator_approved: true,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 7).toISOString(),
    },
    {
      id: appid(21),
      drive_id: drives[2].id,
      student_id: sid(17), // Shreya Patil (8.6 CGPA, AIDS)
      status: "shortlisted",
      match_score: 86,
      skill_gap: { matched: ["Python", "SQL", "Data Structures"], missing: [] },
      ai_reason: "Strong Python backend and SQL optimization with 8.6 CGPA.",
      status_reason: "Shortlisted: Quantitative data structures verified.",
      coordinator_approved: true,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: appid(22),
      drive_id: drives[2].id,
      student_id: sid(2), // Priya Ramanathan (8.2 CGPA, IT)
      status: "applied",
      match_score: 81,
      skill_gap: { matched: ["SQL", "Java"], missing: ["Python"] },
      ai_reason: "Eligible 8.2 CGPA; strong database foundations.",
      status_reason: "Pending coordinator review.",
      coordinator_approved: false,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: appid(23),
      drive_id: drives[2].id,
      student_id: sid(5), // Karthik Subramanian (7.4 CGPA)
      status: "rejected",
      match_score: 52,
      skill_gap: { matched: ["Python", "MySQL"], missing: ["Data Structures"] },
      ai_reason: "CGPA 7.40 is below FinTech Global cut-off of 8.00.",
      status_reason: "Rejected: CGPA 7.40 does not meet the minimum 8.00 cut-off criteria.",
      coordinator_approved: false,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: appid(24),
      drive_id: drives[2].id,
      student_id: sid(16), // Nithin Verma (EEE)
      status: "rejected",
      match_score: 24,
      skill_gap: { matched: ["Python"], missing: ["SQL", "Data Structures"] },
      ai_reason: "Branch 'EEE' is not in allowed branches [CSE, IT, AIDS, CSBS].",
      status_reason: "Rejected: Branch 'EEE' is not permitted for FinTech Platform drive.",
      coordinator_approved: false,
      reminders_sent: {},
      created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
  ];

  const application_events = [];
  const schedule_slots = [];
  const notifications = [
    {
      id: "88888888-8888-8888-8888-888888888881",
      user_id: "33333333-3333-3333-3333-000000000001",
      drive_id: drives[0].id,
      type: "drive_match",
      title: "New Drive Match: Acme Technologies",
      body: "Your profile matches Acme Technologies for Graduate Engineer Trainee (12 LPA). Apply before deadline!",
      is_read: false,
      created_at: new Date().toISOString(),
    },
  ];

  const audit_logs = [
    {
      id: "99999999-9999-9999-9999-999999999991",
      actor_id: users[1].id,
      action: "DRIVE_PUBLISH",
      entity_type: "drive",
      entity_id: drives[0].id,
      before: { status: "draft" },
      after: { status: "open" },
      created_at: new Date().toISOString(),
    },
  ];

  return {
    users,
    student_profiles,
    companies,
    drives,
    drive_criteria,
    rounds,
    applications,
    application_events,
    schedule_slots,
    notifications,
    audit_logs,
  };
}

export class MockQueryBuilder {
  constructor(store, table) {
    this.store = store;
    this.table = table;
    this.filters = [];
    this.selectFields = "*";
    this.orderConfig = null;
    this.limitCount = null;
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.operation = "SELECT";
    this.mutationData = null;
  }

  select(fields = "*") {
    this.selectFields = fields;
    return this;
  }

  insert(data) {
    this.operation = "INSERT";
    this.mutationData = data;
    return this;
  }

  update(data) {
    this.operation = "UPDATE";
    this.mutationData = data;
    return this;
  }

  delete() {
    this.operation = "DELETE";
    return this;
  }

  upsert(data) {
    this.operation = "UPSERT";
    this.mutationData = data;
    return this;
  }

  range(from, to) {
    this.rangeConfig = { from, to };
    return this;
  }

  not(column, op, value) {
    this.filters.push({ column, op: "not_" + op, value });
    return this;
  }

  gte(column, value) {
    this.filters.push({ column, op: "gte", value });
    return this;
  }

  lte(column, value) {
    this.filters.push({ column, op: "lte", value });
    return this;
  }

  eq(column, value) {
    this.filters.push({ column, op: "eq", value });
    return this;
  }

  neq(column, value) {
    this.filters.push({ column, op: "neq", value });
    return this;
  }

  in(column, values) {
    this.filters.push({ column, op: "in", value: values });
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orderConfig = { column, ascending };
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async execute() {
    const tableData = this.store[this.table] || [];

    if (this.operation === "INSERT") {
      const records = Array.isArray(this.mutationData) ? this.mutationData : [this.mutationData];
      const inserted = records.map((r) => {
        const item = {
          id: r.id || crypto.randomUUID(),
          created_at: new Date().toISOString(),
          ...r,
        };
        tableData.push(item);
        return item;
      });
      const res = Array.isArray(this.mutationData) ? inserted : inserted[0];
      return { data: res, error: null };
    }

    if (this.operation === "UPSERT") {
      const records = Array.isArray(this.mutationData) ? this.mutationData : [this.mutationData];
      const results = [];
      for (const r of records) {
        const idx = tableData.findIndex((item) => {
          if (r.id && item.id === r.id) return true;
          if (r.user_id && item.user_id === r.user_id) return true;
          if (r.drive_id && r.student_id && item.drive_id === r.drive_id && item.student_id === r.student_id) return true;
          return false;
        });
        if (idx !== -1) {
          Object.assign(tableData[idx], r, { updated_at: new Date().toISOString() });
          results.push(tableData[idx]);
        } else {
          const item = {
            id: r.id || crypto.randomUUID(),
            created_at: new Date().toISOString(),
            ...r,
          };
          tableData.push(item);
          results.push(item);
        }
      }
      const res = this.isSingle ? results[0] : (Array.isArray(this.mutationData) ? results : results[0]);
      return { data: res, error: null };
    }

    if (this.operation === "UPDATE") {
      let updatedCount = 0;
      let lastUpdated = null;
      for (const item of tableData) {
        const matches = this.filters.every((f) => item[f.column] === f.value);
        if (matches) {
          Object.assign(item, this.mutationData, { updated_at: new Date().toISOString() });
          lastUpdated = item;
          updatedCount++;
        }
      }
      return { data: lastUpdated, count: updatedCount, error: null };
    }

    if (this.operation === "DELETE") {
      const remaining = tableData.filter((item) => {
        return !this.filters.every((f) => item[f.column] === f.value);
      });
      this.store[this.table] = remaining;
      return { data: null, error: null };
    }

    // SELECT
    let rows = [...tableData];
    for (const f of this.filters) {
      if (f.op === "eq") rows = rows.filter((r) => r[f.column] == f.value);
      else if (f.op === "neq") rows = rows.filter((r) => r[f.column] != f.value);
      else if (f.op === "not_eq") rows = rows.filter((r) => r[f.column] != f.value);
      else if (f.op === "not_in") rows = rows.filter((r) => !Array.isArray(f.value) || !f.value.includes(r[f.column]));
      else if (f.op === "in") rows = rows.filter((r) => Array.isArray(f.value) && f.value.includes(r[f.column]));
      else if (f.op === "gte") rows = rows.filter((r) => r[f.column] >= f.value);
      else if (f.op === "lte") rows = rows.filter((r) => r[f.column] <= f.value);
    }

    // Order
    if (this.orderConfig) {
      const { column, ascending } = this.orderConfig;
      rows.sort((a, b) => {
        if (a[column] < b[column]) return ascending ? -1 : 1;
        if (a[column] > b[column]) return ascending ? 1 : -1;
        return 0;
      });
    }

    // Range or Limit
    if (this.rangeConfig) {
      const { from, to } = this.rangeConfig;
      rows = rows.slice(from, to + 1);
    } else if (this.limitCount) {
      rows = rows.slice(0, this.limitCount);
    }

    // Joins handling (supports both standard and !inner joins)
    if (this.selectFields && typeof this.selectFields === "string") {
      const sf = this.selectFields;
      rows = rows.map((r) => {
        const item = { ...r };
        if ((sf.includes("companies(") || sf.includes("companies!")) && item.company_id) {
          item.companies = this.store.companies?.find((c) => c.id === item.company_id) || null;
        }
        if ((sf.includes("users(") || sf.includes("users!")) && (item.user_id || item.actor_id)) {
          item.users = this.store.users?.find((u) => u.id === (item.user_id || item.actor_id)) || null;
        }
        if ((sf.includes("student_profiles(") || sf.includes("student_profiles!")) && (item.student_id || item.user_id)) {
          const sId = item.student_id || item.user_id;
          const sp = this.store.student_profiles?.find((p) => p.user_id === sId) || null;
          if (sp) {
            item.student_profiles = {
              ...sp,
              users: this.store.users?.find((u) => u.id === sp.user_id) || null,
            };
          } else {
            item.student_profiles = null;
          }
        }
        if ((sf.includes("drives(") || sf.includes("drives!")) && item.drive_id) {
          const d = this.store.drives?.find((d) => d.id === item.drive_id) || null;
          if (d) {
            const comp = this.store.companies?.find((c) => c.id === d.company_id) || null;
            const crit = this.store.drive_criteria?.find((dc) => dc.drive_id === d.id) || null;
            item.drives = {
              ...d,
              companies: comp,
              drive_criteria: crit,
            };
          } else {
            item.drives = null;
          }
        }
        if ((sf.includes("drive_criteria(") || sf.includes("drive_criteria!")) && (item.id || item.drive_id)) {
          const dId = item.drive_id || item.id;
          item.drive_criteria = this.store.drive_criteria?.find((dc) => dc.drive_id === dId) || null;
        }
        if ((sf.includes("rounds(") || sf.includes("rounds!")) && item.round_id) {
          item.rounds = this.store.rounds?.find((rd) => rd.id === item.round_id) || null;
        }
        return item;
      });
    }

    if (this.isSingle) {
      if (rows.length === 0) return { data: null, count: 0, error: { message: "Row not found" } };
      return { data: rows[0], count: 1, error: null };
    }

    if (this.isMaybeSingle) {
      return { data: rows[0] || null, count: rows[0] ? 1 : 0, error: null };
    }

    return { data: rows, count: rows.length, error: null };
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  catch(reject) {
    return this.execute().catch(reject);
  }
}
