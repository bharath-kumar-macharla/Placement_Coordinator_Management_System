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

const STUDENTS_20 = [
  {
    name: "Rahul Sharma",
    email: "student1@demo.com",
    roll_no: "21CSE101",
    branch: "CSE",
    year: 4,
    cgpa: 8.85,
    backlogs: 0,
    skills: ["React", "Node.js", "JavaScript", "TypeScript", "SQL", "Git", "Docker", "AWS"],
    phone: "+91 98765 43201",
    linkedin: "https://linkedin.com/in/rahul-sharma-demo",
    projects: [
      { name: "DevFlow Cloud Platform", description: "Real-time collaborative code editor built with React, Node.js, and WebSockets.", url: "https://github.com/rahul/devflow" },
      { name: "Microservice E-Commerce", description: "Scalable store backend using Express, PostgreSQL, and Redis caching.", url: "https://github.com/rahul/store-api" },
    ],
    certifications: ["AWS Certified Developer Associate", "Meta Front-End Developer Specialization"],
    resume_text: `RAHUL SHARMA
Final Year Computer Science Engineering | CGPA: 8.85 | +91 98765 43201 | rahul.sharma@demo.com

SUMMARY
Full-Stack Developer with extensive hands-on experience in modern JavaScript ecosystems (React, Node.js, TypeScript). Demonstrated track record of building production-grade web services and deploying cloud containers.

TECHNICAL SKILLS
- Languages: JavaScript (ES6+), TypeScript, Python, SQL, C++
- Frontend: React.js, Next.js, Redux Toolkit, TailwindCSS, HTML5/CSS3
- Backend: Node.js, Express.js, REST APIs, GraphQL, PostgreSQL, MongoDB, Redis
- DevOps & Tools: Docker, Git/GitHub, AWS (S3, EC2, Lambda), Linux, Postman

EXPERIENCE & PROJECTS
DevFlow Cloud Platform (React, Node.js, WebSockets, Redis)
- Engineered a real-time collaborative code workspace supporting concurrent users with sub-50ms latency.
- Containerized frontend and microservices using Docker; deployed on AWS ECS with automated CI/CD pipeline.

Microservice E-Commerce API (Express, PostgreSQL, Redis)
- Designed database schema handling 50k+ transactions with optimized indexation.
- Implemented JWT authentication, role-based access control, and Stripe payment gateway.

EDUCATION
B.Tech in Computer Science and Engineering | ABC Institute of Technology | 2021 - 2025 | CGPA: 8.85 / 10.0`,
  },
  {
    name: "Priya Patel",
    email: "student2@demo.com",
    roll_no: "21IT102",
    branch: "IT",
    year: 4,
    cgpa: 9.15,
    backlogs: 0,
    skills: ["Python", "SQL", "Machine Learning", "Data Analysis", "Pandas", "Tableau", "Git"],
    phone: "+91 98765 43202",
    linkedin: "https://linkedin.com/in/priya-patel-demo",
    projects: [
      { name: "Customer Churn Predictor", description: "ML pipeline with XGBoost achieving 92% accuracy on telecom datasets.", url: "https://github.com/priya/churn-ml" },
      { name: "Campus Analytics Dashboard", description: "Streamlit and PostgreSQL analytics dashboard visualizing student placements.", url: "https://github.com/priya/campus-analytics" },
    ],
    certifications: ["Google Data Analytics Professional", "DeepLearning.AI Machine Learning Specialization"],
    resume_text: `PRIYA PATEL
Data Analyst & ML Enthusiast | CGPA: 9.15 | priya.patel@demo.com

TECHNICAL SKILLS: Python, SQL, Pandas, NumPy, Scikit-learn, Tableau, PowerBI, PostgreSQL, Git.
PROJECTS: Customer Churn Predictor (XGBoost 92% accuracy), Campus Analytics Dashboard with Streamlit and SQL.`,
  },
  {
    name: "Aarav Verma",
    email: "student3@demo.com",
    roll_no: "21CSE103",
    branch: "CSE",
    year: 4,
    cgpa: 8.40,
    backlogs: 0,
    skills: ["AWS", "Docker", "Kubernetes", "Linux", "Python", "Terraform", "Git"],
    phone: "+91 98765 43203",
    linkedin: "https://linkedin.com/in/aarav-verma-demo",
    projects: [
      { name: "Terraform Multi-Cloud Infra", description: "Automated provisioning of VPC, EKS cluster, and RDS on AWS.", url: "https://github.com/aarav/infra-as-code" },
      { name: "Log Aggregation Pipeline", description: "ELK Stack cluster processing 10k logs/sec with Prometheus monitoring.", url: "https://github.com/aarav/elk-monitoring" },
    ],
    certifications: ["AWS Certified Solutions Architect", "Certified Kubernetes Administrator (CKA)"],
    resume_text: `AARAV VERMA
Cloud & DevOps Engineer | CGPA: 8.40 | aarav.verma@demo.com

SKILLS: AWS, Docker, Kubernetes, Linux, Python, Bash, CI/CD, Terraform, Prometheus.`,
  },
  {
    name: "Ananya Iyer",
    email: "student4@demo.com",
    roll_no: "21ECE104",
    branch: "ECE",
    year: 4,
    cgpa: 8.65,
    backlogs: 0,
    skills: ["C", "C++", "Embedded Systems", "RTOS", "IoT", "Microcontrollers", "Python"],
    phone: "+91 98765 43204",
    linkedin: "https://linkedin.com/in/ananya-iyer-demo",
    projects: [
      { name: "Smart Agriculture IoT Hub", description: "ESP32 mesh network monitoring soil moisture and telemetry over MQTT.", url: "https://github.com/ananya/agri-iot" },
      { name: "FreeRTOS Drone Flight Controller", description: "Hard real-time quadcopter stabilization firmware written in C.", url: "https://github.com/ananya/rtos-drone" },
    ],
    certifications: ["Arm Accredited Engineer", "Embedded Systems with FreeRTOS"],
    resume_text: `ANANYA IYER
Embedded Systems & IoT Engineer | CGPA: 8.65 | ananya.iyer@demo.com

SKILLS: C, C++, FreeRTOS, STM32, ESP32, UART/I2C/SPI, IoT Protocols (MQTT), MATLAB.`,
  },
  {
    name: "Vikram Malhotra",
    email: "student5@demo.com",
    roll_no: "21CSE105",
    branch: "CSE",
    year: 4,
    cgpa: 7.95,
    backlogs: 0,
    skills: ["JavaScript", "React", "Node.js", "SQL", "Git", "MongoDB", "Express"],
    phone: "+91 98765 43205",
    linkedin: "https://linkedin.com/in/vikram-m-demo",
    projects: [
      { name: "TaskHive PM Tool", description: "Kanban board application with drag-and-drop, notifications, and team permissions.", url: "https://github.com/vikram/taskhive" },
    ],
    certifications: ["Full Stack Open (University of Helsinki)"],
    resume_text: `VIKRAM MALHOTRA
Full Stack Developer | CGPA: 7.95 | vikram.m@demo.com
SKILLS: React, Node.js, Express, MongoDB, SQL, Git, RESTful APIs.`,
  },
  {
    name: "Sneha Reddy",
    email: "student6@demo.com",
    roll_no: "21IT106",
    branch: "IT",
    year: 4,
    cgpa: 8.70,
    backlogs: 0,
    skills: ["Python", "SQL", "React", "Node.js", "Docker", "Machine Learning"],
    phone: "+91 98765 43206",
    linkedin: "https://linkedin.com/in/sneha-reddy-demo",
    projects: [
      { name: "Healthcare Patient Portal", description: "HIPAA-compliant React frontend with FastAPI backend and automated appointment alerts.", url: "https://github.com/sneha/health-portal" },
    ],
    certifications: ["Microsoft Azure AI Fundamentals"],
    resume_text: `SNEHA REDDY
Software Engineer | CGPA: 8.70 | sneha.reddy@demo.com
SKILLS: Python, SQL, React, Node.js, FastAPI, Docker.`,
  },
  {
    name: "Rohan Gupta",
    email: "student7@demo.com",
    roll_no: "22ECE107",
    branch: "ECE",
    year: 3,
    cgpa: 7.60,
    backlogs: 1,
    skills: ["C", "C++", "Embedded Systems", "IoT", "Arduino", "Python"],
    phone: "+91 98765 43207",
    linkedin: "https://linkedin.com/in/rohan-gupta-demo",
    projects: [
      { name: "Smart Home Security System", description: "PIR motion sensor trigger sending automated SMS alerts via SIM800L module.", url: "https://github.com/rohan/home-sec" },
    ],
    certifications: ["IoT Foundations with Raspberry Pi"],
    resume_text: `ROHAN GUPTA
Electronics & IoT Developer | CGPA: 7.60 | rohan.gupta@demo.com
SKILLS: C, C++, Embedded Systems, Microcontrollers, Python.`,
  },
  {
    name: "Tanvi Deshmukh",
    email: "student8@demo.com",
    roll_no: "21CSE108",
    branch: "CSE",
    year: 4,
    cgpa: 9.35,
    backlogs: 0,
    skills: ["Java", "Spring Boot", "React", "Microservices", "Docker", "Kubernetes", "PostgreSQL", "AWS"],
    phone: "+91 98765 43208",
    linkedin: "https://linkedin.com/in/tanvi-deshmukh-demo",
    projects: [
      { name: "FinTech Transaction Router", description: "High-throughput microservices architecture processing 5,000 TPS with zero data loss.", url: "https://github.com/tanvi/fintech-router" },
    ],
    certifications: ["Oracle Certified Professional: Java SE 17", "AWS Solutions Architect"],
    resume_text: `TANVI DESHMUKH
Backend Specialist & Distributed Systems | CGPA: 9.35 | tanvi.d@demo.com
SKILLS: Java, Spring Boot, Microservices, PostgreSQL, Docker, Kubernetes, AWS.`,
  },
  {
    name: "Aditya Joshi",
    email: "student9@demo.com",
    roll_no: "21EEE109",
    branch: "EEE",
    year: 4,
    cgpa: 8.10,
    backlogs: 0,
    skills: ["C", "MATLAB", "Embedded Systems", "IoT", "Power Systems", "Python"],
    phone: "+91 98765 43209",
    linkedin: "https://linkedin.com/in/aditya-joshi-demo",
    projects: [
      { name: "Solar Inverter Monitor", description: "Real-time solar panel MPPT voltage logger sending metrics to ThingsBoard cloud.", url: "https://github.com/aditya/solar-iot" },
    ],
    certifications: ["Renewable Energy Systems Design"],
    resume_text: `ADITYA JOSHI
Electrical & Embedded Engineer | CGPA: 8.10 | aditya.joshi@demo.com
SKILLS: C, MATLAB, IoT, Embedded Systems, Circuit Design.`,
  },
  {
    name: "Pooja Nair",
    email: "student10@demo.com",
    roll_no: "21IT110",
    branch: "IT",
    year: 4,
    cgpa: 7.95,
    backlogs: 0,
    skills: ["JavaScript", "React", "Node.js", "SQL", "Git", "HTML/CSS"],
    phone: "+91 98765 43210",
    linkedin: "https://linkedin.com/in/pooja-nair-demo",
    projects: [
      { name: "Library Portal System", description: "Campus book reservation system with automated fine calculation and email reminders.", url: "https://github.com/pooja/lib-portal" },
    ],
    certifications: ["Responsive Web Design (freeCodeCamp)"],
    resume_text: `POOJA NAIR
Full Stack Developer | CGPA: 7.95 | pooja.nair@demo.com
SKILLS: JavaScript, React, Node.js, SQL, Express.`,
  },
  {
    name: "Karthik Subramanian",
    email: "student11@demo.com",
    roll_no: "21ECE111",
    branch: "ECE",
    year: 4,
    cgpa: 8.55,
    backlogs: 0,
    skills: ["C", "C++", "RTOS", "Embedded Systems", "VHDL", "Python"],
    phone: "+91 98765 43211",
    linkedin: "https://linkedin.com/in/karthik-subra-demo",
    projects: [
      { name: "CAN Bus Automotive Simulator", description: "Automotive engine telemetry simulation using MCP2515 CAN transceiver and STM32.", url: "https://github.com/karthik/can-sim" },
    ],
    certifications: ["Embedded C Programming Specialist"],
    resume_text: `KARTHIK SUBRAMANIAN
Automotive Embedded Engineer | CGPA: 8.55 | karthik.s@demo.com
SKILLS: C, C++, RTOS, CAN Bus, STM32, Embedded Linux.`,
  },
  {
    name: "Meera Menon",
    email: "student12@demo.com",
    roll_no: "22CSE112",
    branch: "CSE",
    year: 3,
    cgpa: 8.25,
    backlogs: 0,
    skills: ["Python", "Java", "Data Structures", "Algorithms", "SQL", "Git"],
    phone: "+91 98765 43212",
    linkedin: "https://linkedin.com/in/meera-menon-demo",
    projects: [
      { name: "Pathfinding Visualizer", description: "Interactive A* and Dijkstra graph algorithm visualizer created in React.", url: "https://github.com/meera/path-viz" },
    ],
    certifications: ["Algorithmic Toolbox (UC San Diego)"],
    resume_text: `MEERA MENON
Software Developer | CGPA: 8.25 | meera.menon@demo.com
SKILLS: Python, Java, Data Structures, Algorithms, SQL, Git.`,
  },
  {
    name: "Siddharth Rao",
    email: "student13@demo.com",
    roll_no: "21MECH113",
    branch: "MECH",
    year: 4,
    cgpa: 7.80,
    backlogs: 0,
    skills: ["AutoCAD", "SolidWorks", "ANSYS", "Python", "MATLAB", "Robotics"],
    phone: "+91 98765 43213",
    linkedin: "https://linkedin.com/in/siddharth-rao-demo",
    projects: [
      { name: "Automated Robotic Arm", description: "6-DOF robotic manipulator modeled in SolidWorks with inverse kinematics solved in Python.", url: "https://github.com/siddharth/robot-arm" },
    ],
    certifications: ["CSWA - Certified SOLIDWORKS Associate"],
    resume_text: `SIDDHARTH RAO
Mechanical & Robotics Engineer | CGPA: 7.80 | siddharth.rao@demo.com
SKILLS: AutoCAD, SolidWorks, ANSYS, Python, MATLAB.`,
  },
  {
    name: "Divya Kulkarni",
    email: "student14@demo.com",
    roll_no: "21CSE114",
    branch: "CSE",
    year: 4,
    cgpa: 9.10,
    backlogs: 0,
    skills: ["React", "Node.js", "AWS", "Docker", "JavaScript", "SQL", "Git"],
    phone: "+91 98765 43214",
    linkedin: "https://linkedin.com/in/divya-kulkarni-demo",
    projects: [
      { name: "Cloud Video Transcoder", description: "Serverless video compression pipeline using AWS S3, Lambda, and FFmpeg.", url: "https://github.com/divya/cloud-transcode" },
    ],
    certifications: ["AWS Certified Developer"],
    resume_text: `DIVYA KULKARNI
Cloud-Native Engineer | CGPA: 9.10 | divya.k@demo.com
SKILLS: React, Node.js, AWS, Docker, Microservices, SQL.`,
  },
  {
    name: "Arjun Singhania",
    email: "student15@demo.com",
    roll_no: "21IT115",
    branch: "IT",
    year: 4,
    cgpa: 7.50,
    backlogs: 1,
    skills: ["Python", "SQL", "JavaScript", "React", "Git"],
    phone: "+91 98765 43215",
    linkedin: "https://linkedin.com/in/arjun-singhania-demo",
    projects: [
      { name: "Stock Portfolio Tracker", description: "Personal finance tracker syncing live stock prices with Yahoo Finance API.", url: "https://github.com/arjun/portfolio-tracker" },
    ],
    certifications: ["Python for Everybody (University of Michigan)"],
    resume_text: `ARJUN SINGHANIA
Junior Software Developer | CGPA: 7.50 | arjun.s@demo.com
SKILLS: Python, SQL, JavaScript, React, Git.`,
  },
  {
    name: "Ritu Bhatt",
    email: "student16@demo.com",
    roll_no: "22ECE116",
    branch: "ECE",
    year: 3,
    cgpa: 8.20,
    backlogs: 0,
    skills: ["C", "C++", "Embedded Systems", "IoT", "MATLAB"],
    phone: "+91 98765 43216",
    linkedin: "https://linkedin.com/in/ritu-bhatt-demo",
    projects: [
      { name: "Smart Wearable Health Band", description: "Wearable heart-rate and SpO2 sensor streaming Bluetooth BLE packets to mobile app.", url: "https://github.com/ritu/health-band" },
    ],
    certifications: ["Embedded C Programming"],
    resume_text: `RITU BHATT
Embedded & IoT Enthusiast | CGPA: 8.20 | ritu.bhatt@demo.com
SKILLS: C, C++, Embedded Systems, IoT, Bluetooth Low Energy.`,
  },
  {
    name: "Varun Kapoor",
    email: "student17@demo.com",
    roll_no: "21EEE117",
    branch: "EEE",
    year: 4,
    cgpa: 7.75,
    backlogs: 0,
    skills: ["C", "MATLAB", "Embedded Systems", "Control Systems", "Python"],
    phone: "+91 98765 43217",
    linkedin: "https://linkedin.com/in/varun-kapoor-demo",
    projects: [
      { name: "Brushless DC Motor Controller", description: "Field-oriented control algorithm implemented on TMS320 DSP for high-efficiency EV traction.", url: "https://github.com/varun/bldc-controller" },
    ],
    certifications: ["Power Electronics & Motor Drives"],
    resume_text: `VARUN KAPOOR
Power Electronics & Drives | CGPA: 7.75 | varun.kapoor@demo.com
SKILLS: C, MATLAB, DSP, BLDC Controllers, Control Systems.`,
  },
  {
    name: "Shreya Sen",
    email: "student18@demo.com",
    roll_no: "21CSE118",
    branch: "CSE",
    year: 4,
    cgpa: 8.95,
    backlogs: 0,
    skills: ["React", "Node.js", "Python", "SQL", "Git", "Docker", "AWS"],
    phone: "+91 98765 43218",
    linkedin: "https://linkedin.com/in/shreya-sen-demo",
    projects: [
      { name: "AI Proctoring Engine", description: "Browser-based video proctoring with face detection and gaze tracking using MediaPipe and WebRTC.", url: "https://github.com/shreya/ai-proctor" },
    ],
    certifications: ["Google Cloud Certified Associate Cloud Engineer"],
    resume_text: `SHREYA SEN
Full Stack & AI Engineer | CGPA: 8.95 | shreya.sen@demo.com
SKILLS: React, Node.js, Python, SQL, Docker, AWS, WebRTC.`,
  },
  {
    name: "Nikhil Saxena",
    email: "student19@demo.com",
    roll_no: "21MECH119",
    branch: "MECH",
    year: 4,
    cgpa: 7.35,
    backlogs: 0,
    skills: ["AutoCAD", "SolidWorks", "ANSYS", "Python", "Manufacturing"],
    phone: "+91 98765 43219",
    linkedin: "https://linkedin.com/in/nikhil-saxena-demo",
    projects: [
      { name: "Lightweight Chassis Design", description: "Topology optimization of Formula Student tubular chassis reducing weight by 14%.", url: "https://github.com/nikhil/fsae-chassis" },
    ],
    certifications: ["Design for Manufacturing and Assembly (DFMA)"],
    resume_text: `NIKHIL SAXENA
Automotive CAE & Design Engineer | CGPA: 7.35 | nikhil.saxena@demo.com
SKILLS: AutoCAD, SolidWorks, FEA (ANSYS), Python.`,
  },
  {
    name: "Kavya Krishnan",
    email: "student20@demo.com",
    roll_no: "21IT120",
    branch: "IT",
    year: 4,
    cgpa: 8.65,
    backlogs: 0,
    skills: ["Python", "SQL", "React", "Node.js", "Docker", "Git"],
    phone: "+91 98765 43220",
    linkedin: "https://linkedin.com/in/kavya-krishnan-demo",
    projects: [
      { name: "Smart Campus Food Delivery", description: "Food ordering portal with real-time order status tracking and vendor kitchen dashboard.", url: "https://github.com/kavya/campus-eats" },
    ],
    certifications: ["Meta Certified Full Stack Developer"],
    resume_text: `KAVYA KRISHNAN
Full Stack Software Developer | CGPA: 8.65 | kavya.k@demo.com
SKILLS: Python, SQL, React, Node.js, Docker, Git.`,
  },
];

async function run() {
  console.log("🚀 Populating 20 rich student accounts with applications, schedules & notifications...");

  // 1. Fetch drives & rounds
  const { data: drives } = await supabase
    .from("drives")
    .select("id, title, rounds(id, round_no, name)");

  if (!drives || drives.length === 0) {
    throw new Error("No drives found. Run npm run seed first.");
  }

  const driveMap = {};
  for (const d of drives) {
    driveMap[d.title] = d;
  }

  const techCorp = drives.find((d) => d.title.includes("TechCorp")) || drives[0];
  const dataDriven = drives.find((d) => d.title.includes("DataDriven")) || drives[1];
  const cloudNine = drives.find((d) => d.title.includes("CloudNine")) || drives[2];
  const smartEdge = drives.find((d) => d.title.includes("SmartEdge")) || drives[3];

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

  // 2. Loop through 20 students
  for (let i = 0; i < STUDENTS_20.length; i++) {
    const s = STUDENTS_20[i];
    console.log(`Processing student ${i + 1}/20: ${s.name} (${s.email})...`);

    // Upsert user
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", s.email)
      .maybeSingle();

    let userId = existingUser?.id;
    if (!userId) {
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          name: s.name,
          email: s.email,
          password_hash: passwordHash,
          role: "student",
          is_active: true,
        })
        .select("id")
        .single();
      if (error) throw error;
      userId = newUser.id;
    } else {
      await supabase
        .from("users")
        .update({ name: s.name, password_hash: passwordHash, role: "student", is_active: true })
        .eq("id", userId);
    }

    // Upsert profile
    await supabase.from("student_profiles").upsert(
      {
        user_id: userId,
        roll_no: s.roll_no,
        branch: s.branch,
        year: s.year,
        cgpa: s.cgpa,
        backlogs: s.backlogs,
        skills: s.skills,
        resume_text: s.resume_text,
        phone: s.phone,
        linkedin: s.linkedin,
        projects: s.projects,
        certifications: s.certifications,
      },
      { onConflict: "user_id" }
    );

    // Clean existing applications & slots for clean slate
    const { data: existingApps } = await supabase
      .from("applications")
      .select("id")
      .eq("student_id", userId);

    if (existingApps && existingApps.length > 0) {
      const appIds = existingApps.map((a) => a.id);
      await supabase.from("schedule_slots").delete().in("application_id", appIds);
      await supabase.from("applications").delete().eq("student_id", userId);
    }

    // Determine application profile for each student
    const studentApps = [];

    if (s.branch === "CSE" || s.branch === "IT") {
      // TechCorp App
      const techCorpStatus = i === 0 || i === 7 ? "selected" : i < 6 ? "shortlisted" : i < 14 ? "round_2" : "applied";
      studentApps.push({
        drive_id: techCorp.id,
        drive_title: techCorp.title,
        status: techCorpStatus,
        match_score: i === 0 ? 95 : 82 + (i % 12),
        coordinator_approved: techCorpStatus !== "applied",
        round_no: techCorpStatus === "selected" ? 3 : techCorpStatus === "shortlisted" ? 1 : 2,
        skill_gap: {
          matching: ["React", "Node.js", "JavaScript", "SQL"],
          missing: i === 0 ? [] : ["Docker"],
          missing_skills: i === 0 ? [] : ["Docker"],
          match_pct: i === 0 ? 95 : 85,
        },
        resume_feedback: {
          ats_score: 88,
          strengths: ["Strong full-stack project contributions", "Direct alignment with React & Node.js tech stack"],
          improvements: ["Consider adding more metrics in project outcomes"],
        },
        ai_reason: "Strong fit for Full Stack role based on GitHub repositories and core competencies.",
      });

      // DataDriven App
      const dataStatus = i % 2 === 0 ? "shortlisted" : i === 1 ? "selected" : "applied";
      studentApps.push({
        drive_id: dataDriven.id,
        drive_title: dataDriven.title,
        status: dataStatus,
        match_score: i === 1 ? 94 : 78 + (i % 14),
        coordinator_approved: dataStatus !== "applied",
        round_no: dataStatus === "selected" ? 3 : 1,
        skill_gap: {
          matching: ["Python", "SQL"],
          missing: ["Tableau"],
          missing_skills: ["Tableau"],
          match_pct: 82,
        },
        resume_feedback: {
          ats_score: 85,
          strengths: ["Clean analytical project breakdown", "Proficient in SQL aggregations"],
          improvements: ["Deepen domain knowledge in business metrics"],
        },
        ai_reason: "Solid analytical capability with Python data science libraries.",
      });

      // CloudNine App
      if (s.year === 4 && s.cgpa >= 7.5) {
        const cloudStatus = i === 2 ? "selected" : i < 8 ? "shortlisted" : "rejected";
        studentApps.push({
          drive_id: cloudNine.id,
          drive_title: cloudNine.title,
          status: cloudStatus,
          match_score: i === 2 ? 96 : 74 + (i % 15),
          coordinator_approved: cloudStatus === "shortlisted" || cloudStatus === "selected",
          round_no: cloudStatus === "selected" ? 3 : 2,
          skill_gap: {
            matching: ["AWS", "Docker", "Linux"],
            missing: cloudStatus === "rejected" ? ["Kubernetes", "Terraform"] : [],
            missing_skills: cloudStatus === "rejected" ? ["Kubernetes", "Terraform"] : [],
            match_pct: cloudStatus === "rejected" ? 62 : 91,
          },
          resume_feedback: {
            ats_score: 89,
            strengths: ["Certified cloud infrastructure experience", "Hands-on Linux & container deployments"],
            improvements: ["Expand on Kubernetes cluster management"],
          },
          ai_reason: cloudStatus === "rejected" ? "Skill gap in orchestrations required for production." : "Impressive cloud certifications and infrastructure projects.",
        });
      }
    } else if (s.branch === "ECE" || s.branch === "EEE") {
      // SmartEdge App
      const smartStatus = i === 3 ? "selected" : i < 12 ? "shortlisted" : "round_1";
      studentApps.push({
        drive_id: smartEdge.id,
        drive_title: smartEdge.title,
        status: smartStatus,
        match_score: i === 3 ? 94 : 83 + (i % 10),
        coordinator_approved: true,
        round_no: smartStatus === "selected" ? 2 : 1,
        skill_gap: {
          matching: ["C", "Embedded Systems", "IoT"],
          missing: ["RTOS"],
          missing_skills: ["RTOS"],
          match_pct: 87,
        },
        resume_feedback: {
          ats_score: 86,
          strengths: ["Hardware circuit prototyping and firmware design", "Hands-on microcontroller experience"],
          improvements: ["Document RTOS task synchronization techniques"],
        },
        ai_reason: "High hardware compatibility with embedded firmware stack.",
      });

      // DataDriven App for ECE
      studentApps.push({
        drive_id: dataDriven.id,
        drive_title: dataDriven.title,
        status: "applied",
        match_score: 75,
        coordinator_approved: false,
        round_no: 1,
        skill_gap: {
          matching: ["Python"],
          missing: ["SQL"],
          missing_skills: ["SQL"],
          match_pct: 70,
        },
        resume_feedback: {
          ats_score: 80,
          strengths: ["Solid math foundation"],
          improvements: ["Practice database querying and aggregation"],
        },
        ai_reason: "Eligible branch with emerging analytical skill profile.",
      });
    } else {
      // MECH
      studentApps.push({
        drive_id: smartEdge.id,
        drive_title: smartEdge.title,
        status: "applied",
        match_score: 72,
        coordinator_approved: false,
        round_no: 1,
        skill_gap: {
          matching: ["Python", "MATLAB"],
          missing: ["C", "Embedded Systems"],
          missing_skills: ["C", "Embedded Systems"],
          match_pct: 65,
        },
        resume_feedback: {
          ats_score: 78,
          strengths: ["Robotics modeling and CAD automation"],
          improvements: ["Strengthen embedded microcontroller programming"],
        },
        ai_reason: "Cross-disciplinary interest in smart robotics.",
      });
    }

    // Insert applications and create interview schedule slots
    for (let appIdx = 0; appIdx < studentApps.length; appIdx++) {
      const app = studentApps[appIdx];
      const { data: newApp, error: appErr } = await supabase
        .from("applications")
        .insert({
          drive_id: app.drive_id,
          student_id: userId,
          status: app.status,
          match_score: app.match_score,
          coordinator_approved: app.coordinator_approved,
          skill_gap: app.skill_gap,
          resume_feedback: app.resume_feedback,
          ai_reason: app.ai_reason,
        })
        .select("id")
        .single();

      if (appErr) {
        console.error(`  Application error for ${s.name}:`, appErr.message);
        continue;
      }

      // If shortlisted or round_1 or round_2, schedule an upcoming interview
      if (["shortlisted", "round_1", "round_2", "selected"].includes(app.status)) {
        const driveObj = drives.find((d) => d.id === app.drive_id);
        const round = driveObj?.rounds?.find((r) => r.round_no === app.round_no) || driveObj?.rounds?.[0];

        if (round) {
          const startTime = new Date();
          startTime.setDate(startTime.getDate() + 1 + (i % 4));
          startTime.setHours(10 + (i % 6), (i % 2) * 30, 0, 0);

          const endTime = new Date(startTime.getTime() + 45 * 60 * 1000);

          await supabase.from("schedule_slots").insert({
            round_id: round.id,
            application_id: newApp.id,
            room: i % 2 === 0 ? "Placement Cell, Room 204" : "Virtual Meet (Google Meet)",
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: "scheduled",
          });
        }
      }
    }

    // Refresh notifications for student
    await supabase.from("notifications").delete().eq("user_id", userId);

    await supabase.from("notifications").insert([
      {
        user_id: userId,
        drive_id: techCorp.id,
        type: "shortlist",
        title: "Shortlist Announcement",
        body: `Congratulations ${s.name.split(" ")[0]}! Your profile has been reviewed for TechCorp Solutions.`,
        is_read: false,
      },
      {
        user_id: userId,
        drive_id: dataDriven.id,
        type: "schedule",
        title: "Interview Schedule Updated",
        body: "Your upcoming placement round slot has been assigned. Please verify in your schedule tab.",
        is_read: false,
      },
      {
        user_id: userId,
        drive_id: cloudNine.id,
        type: "general",
        title: "AI ATS Resume Feedback Available",
        body: "PlacementAI has analyzed your resume against current drive requirements. View your feedback report.",
        is_read: true,
      },
    ]);
  }

  console.log("\n✅ Successfully seeded 20 rich student accounts with applications, slots & notifications!");
}

run()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .then(() => process.exit(0));
