import { useState, useEffect } from "react";
import { studentApi } from "../../api/index.js";
import { useToast } from "../../components/useToast.jsx";
import Spinner from "../../components/Spinner.jsx";

const BRANCHES = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AIDS", "CSBS"];

function TagInput({ label, id, value = [], onChange, placeholder }) {
  const [input, setInput] = useState("");

  function addTag() {
    const tag = input.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setInput("");
  }

  function removeTag(t) {
    onChange(value.filter((v) => v !== t));
  }

  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 bg-primary-100 text-primary-800 text-xs px-2.5 py-1 rounded-full font-medium">
            {t}
            <button type="button" onClick={() => removeTag(t)} aria-label={`Remove ${t}`} className="hover:text-primary-900 font-bold ml-1">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          className="input-field text-xs flex-1"
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
        />
        <button type="button" onClick={addTag} className="btn-secondary text-xs">Add</button>
      </div>
    </div>
  );
}

export default function Profile() {
  const { toast, ToastContainerEl } = useToast();
  const [profile, setProfile] = useState(null);
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [form,    setForm]    = useState({});

  useEffect(() => {
    studentApi.getMe()
      .then(({ data }) => {
        setUser(data.user);
        setProfile(data.profile);
        setForm({
          name:           data.user?.name ?? "",
          roll_no:        data.profile?.roll_no ?? "",
          branch:         data.profile?.branch ?? "",
          year:           data.profile?.year ?? "",
          cgpa:           data.profile?.cgpa ?? "",
          backlogs:       data.profile?.backlogs ?? 0,
          skills:         data.profile?.skills ?? [],
          phone:          data.profile?.phone ?? "",
          linkedin:       data.profile?.linkedin ?? "",
          resume_text:    data.profile?.resume_text ?? "",
          certifications: data.profile?.certifications ?? [],
        });
      })
      .catch(() => toast("Failed to load profile", "error"))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        year:     form.year     ? Number(form.year)     : undefined,
        cgpa:     form.cgpa     ? Number(form.cgpa)     : undefined,
        backlogs: form.backlogs !== "" ? Number(form.backlogs) : 0,
      };
      const { data } = await studentApi.updateMe(payload);
      setProfile(data.profile);
      toast("Profile saved successfully! ✅", "success");
    } catch (err) {
      toast(err.response?.data?.error?.message ?? "Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleAnalyzeResume() {
    if (!form.resume_text?.trim()) {
      toast("Please paste resume text to analyze.", "info");
      return;
    }
    setAnalyzing(true);
    try {
      const { data } = await studentApi.analyzeResume({ resume_text: form.resume_text });
      setAnalysis(data.analysis);
      toast("Resume analyzed successfully! ✨", "success");
    } catch (err) {
      console.error(err);
      toast("Failed to analyze resume", "error");
    } finally {
      setAnalyzing(false);
    }
  }

  function handleImportSkills() {
    if (!analysis?.detected_skills?.length) return;
    const combined = Array.from(new Set([...(form.skills || []), ...analysis.detected_skills]));
    set("skills", combined);
    toast(`Added ${analysis.detected_skills.length} skills to your profile!`, "success");
  }

  function loadResumePreset(type) {
    if (type === "arjun") {
      const sample = `ARJUN MEHTA
arjun.mehta@demo.com | +91 98400 11001 | linkedin.com/in/arjunmehta-demo

EDUCATION
B.E. Computer Science and Engineering, 2022-2026 | CGPA: 9.1/10

SKILLS
Languages: JavaScript, Python, SQL
Frontend: React, Tailwind CSS, Redux
Backend: Node.js, Express, REST APIs, JWT authentication
Database/Tools: PostgreSQL, MongoDB, Git, GitHub, Docker, Postman

PROJECTS
Campus Event Manager (React, Node.js, PostgreSQL)
- Built a full-stack event registration platform used by 400+ students in my college.
- Designed 12 REST APIs with JWT role-based access; reduced registration time from 5 minutes to 40 seconds.
- Deployed frontend on Vercel and backend on Render with CI via GitHub Actions.

Expense Tracker API (Node.js, Express, PostgreSQL)
- Created a REST API with pagination and filtering; wrote 30+ unit tests using Jest.

INTERNSHIP
Web Development Intern, BrightLabs (Jun-Aug 2025)
- Built 5 reusable React components and fixed 20+ UI bugs in a production dashboard.

CERTIFICATIONS
Meta Front-End Developer Certificate; AWS Cloud Practitioner
ACHIEVEMENTS
Finalist, Smart India Hackathon 2025 | 450+ LeetCode problems solved`;

      setForm((prev) => ({
        ...prev,
        name: "Arjun Mehta",
        roll_no: "CSE2022001",
        branch: "CSE",
        year: 2026,
        cgpa: 9.1,
        backlogs: 0,
        resume_text: sample,
        phone: "+91 98400 11001",
        linkedin: "https://linkedin.com/in/arjunmehta-demo",
        skills: ["JavaScript", "Python", "React", "Node.js", "Express", "PostgreSQL", "Docker", "Tailwind CSS"],
        certifications: ["Meta Front-End Developer", "AWS Cloud Practitioner"],
      }));
      toast("Loaded Arjun Mehta's (CSE) Resume!", "info");
    } else if (type === "priya") {
      const sample = `PRIYA RAMANATHAN
priya.r@demo.com | +91 98400 11002 | linkedin.com/in/priyar-demo

EDUCATION
B.Tech Information Technology, 2022-2026 | CGPA: 8.2/10

SKILLS
Java, Spring Boot, MySQL, HTML, CSS, JavaScript, Git, REST APIs

PROJECTS
Library Management System (Java, Spring Boot, MySQL)
- Developed a system to issue and return books with automatic fine calculation.
- Implemented CRUD operations, role-based access, and login module for 300+ students.

Online Assessment Portal (Spring Boot, HTML/CSS)
- Created an interactive quiz platform with real-time timers and instant score generation.

INTERNSHIP
Backend Engineering Intern, SoftPeak Solutions (May-Jul 2025)
- Learned Spring Boot enterprise development; created 8 RESTful services and SQL schemas.

CERTIFICATIONS
Oracle Certified Java SE Associate`;

      setForm((prev) => ({
        ...prev,
        name: "Priya Ramanathan",
        roll_no: "IT2022002",
        branch: "IT",
        year: 2026,
        cgpa: 8.2,
        backlogs: 0,
        resume_text: sample,
        phone: "+91 98400 11002",
        linkedin: "https://linkedin.com/in/priyar-demo",
        skills: ["Java", "Spring Boot", "MySQL", "HTML", "CSS", "JavaScript", "Git"],
        certifications: ["Oracle Java SE Foundations"],
      }));
      toast("Loaded Priya Ramanathan's (IT) Resume!", "info");
    } else if (type === "rahul") {
      const sample = `RAHUL VENKATESH
rahul.v@demo.com | +91 98400 11006 | linkedin.com/in/rahulv-demo

EDUCATION
B.E. Mechanical Engineering, 2022-2026 | CGPA: 8.4/10

SKILLS
AutoCAD, SolidWorks, ANSYS, MATLAB, MS Excel, basic Python, Finite Element Analysis

PROJECTS
Automotive 4-Speed Gearbox Design
- Designed a 4-speed manual gearbox in SolidWorks and performed stress analysis in ANSYS to verify a safety factor > 2.5.

Automated Sorting Conveyor
- Fabricated the structural mechanical frame and pulley drive assembly for a low-cost campus prototype.

INTERNSHIP
Manufacturing Operations Trainee, Apex Industries (May-Jun 2025)
- Observed CNC machining lines and prepared process optimization reports reducing part changeover time by 15%.`;

      setForm((prev) => ({
        ...prev,
        name: "Rahul Venkatesh",
        roll_no: "MECH2022006",
        branch: "MECH",
        year: 2026,
        cgpa: 8.4,
        backlogs: 0,
        resume_text: sample,
        phone: "+91 98400 11006",
        linkedin: "https://linkedin.com/in/rahulv-demo",
        skills: ["AutoCAD", "SolidWorks", "ANSYS", "MATLAB", "Python"],
        certifications: ["SolidWorks Mechanical Design Associate"],
      }));
      toast("Loaded Rahul Venkatesh's (MECH) Resume!", "info");
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string" && text.trim()) {
        set("resume_text", text);
        toast(`Loaded ${file.name} successfully!`, "success");
      }
    };
    reader.readAsText(file);
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in mx-auto">
      {ToastContainerEl}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">My Profile & Resume Intelligence</h1>
          <p className="page-subtitle">Update your credentials and run AI ATS analysis on your resume</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Quick Samples:</span>
          <button
            type="button"
            onClick={() => loadResumePreset("arjun")}
            className="btn-secondary text-xs px-2.5 py-1"
          >
            Arjun (CSE)
          </button>
          <button
            type="button"
            onClick={() => loadResumePreset("priya")}
            className="btn-secondary text-xs px-2.5 py-1"
          >
            Priya (IT)
          </button>
          <button
            type="button"
            onClick={() => loadResumePreset("rahul")}
            className="btn-secondary text-xs px-2.5 py-1"
          >
            Rahul (Mech)
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="label">Full Name</label>
              <input id="name" type="text" className="input-field" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div>
              <label htmlFor="roll_no" className="label">Roll Number</label>
              <input id="roll_no" type="text" className="input-field font-mono" value={form.roll_no} onChange={(e) => set("roll_no", e.target.value)} placeholder="e.g. CSE2022045" />
            </div>
            <div>
              <label htmlFor="phone" className="label">Phone</label>
              <input id="phone" type="tel" className="input-field" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 9XXXXXXXXX" />
            </div>
            <div>
              <label htmlFor="linkedin" className="label">LinkedIn URL</label>
              <input id="linkedin" type="url" className="input-field" value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="https://linkedin.com/in/..." />
            </div>
          </div>
        </div>

        {/* Academic info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Academic Details (Used for Drive Eligibility)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label htmlFor="branch" className="label">Branch</label>
              <select id="branch" className="input-field" value={form.branch} onChange={(e) => set("branch", e.target.value)}>
                <option value="">Select Branch</option>
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="year" className="label">Graduating Batch / Year</label>
              <select id="year" className="input-field" value={form.year} onChange={(e) => set("year", e.target.value)}>
                <option value="">Select</option>
                {[1,2,3,4,2024,2025,2026,2027].map((y) => (
                  <option key={y} value={y}>{typeof y === "number" && y > 2000 ? y : `Year ${y}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cgpa" className="label">CGPA (out of 10)</label>
              <input id="cgpa" type="number" step="0.01" min="0" max="10" className="input-field" value={form.cgpa} onChange={(e) => set("cgpa", e.target.value)} placeholder="8.50" />
            </div>
            <div>
              <label htmlFor="backlogs" className="label">Active Backlogs</label>
              <input id="backlogs" type="number" min="0" className="input-field" value={form.backlogs} onChange={(e) => set("backlogs", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
            <h2 className="font-bold text-slate-800 text-sm">Verified Skills & Tools</h2>
            <span className="text-xs text-slate-400">{form.skills?.length || 0} skills added</span>
          </div>
          <TagInput
            id="skills"
            label="Technical Skills (press Enter or click Add)"
            value={form.skills}
            onChange={(v) => set("skills", v)}
            placeholder="e.g. React, Python, SQL, Docker, Node.js"
          />
        </div>

        {/* Resume & AI Analysis */}
        <div className="card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Resume Content & Analysis</h2>
              <p className="text-xs text-slate-400">Paste your resume text or upload a file for instant ATS scoring & skill extraction</p>
            </div>
            <div className="flex items-center gap-2">
              <label className="btn-secondary text-xs flex items-center gap-1 cursor-pointer">
                <span>📁</span>
                <span>Upload File</span>
                <input
                  type="file"
                  accept=".txt,.doc,.docx,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={handleAnalyzeResume}
                disabled={analyzing || !form.resume_text?.trim()}
                className="btn-primary text-xs flex items-center gap-1.5"
              >
                {analyzing ? (
                  <>
                    <Spinner size="sm" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Analyze Resume with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <textarea
              id="resume_text"
              className="input-field min-h-[180px] font-mono text-xs leading-relaxed"
              value={form.resume_text}
              onChange={(e) => set("resume_text", e.target.value)}
              placeholder="Paste your plain text resume here (Education, Skills, Projects, Experience, Certifications)..."
            />
          </div>

          {/* AI Analysis Results Panel */}
          {analysis && (
            <div className="p-5 bg-gradient-to-br from-primary-50/50 via-indigo-50/30 to-slate-50 border border-primary-200 rounded-xl space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white ${
                    analysis.ats_score >= 80 ? "bg-emerald-600" : analysis.ats_score >= 60 ? "bg-amber-600" : "bg-red-600"
                  }`}>
                    {analysis.ats_score}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">ATS Compatibility Score</h3>
                    <p className="text-xs text-slate-500">
                      {analysis.ats_score >= 80 ? "Excellent formatting and keyword strength!" : "Good foundation — improve metrics for higher ranking."}
                    </p>
                  </div>
                </div>

                {analysis.detected_skills?.length > 0 && (
                  <button
                    type="button"
                    onClick={handleImportSkills}
                    className="btn-secondary text-xs flex items-center gap-1"
                  >
                    <span>➕</span>
                    <span>Import {analysis.detected_skills.length} Detected Skills</span>
                  </button>
                )}
              </div>

              {/* Detected Skills */}
              {analysis.detected_skills?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1.5">Detected Competencies:</p>
                  <div className="flex flex-wrap gap-1">
                    {analysis.detected_skills.map((s) => (
                      <span key={s} className="badge bg-white text-primary-700 border-primary-200 text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths */}
              {analysis.strengths?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-800 mb-1">Key Strengths:</p>
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5">
                    {analysis.strengths.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {analysis.suggestions?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-800 mb-1">Actionable Suggestions:</p>
                  <div className="space-y-1.5">
                    {analysis.suggestions.map((sug, i) => (
                      <div key={i} className="text-xs p-2 bg-white/80 rounded border border-amber-200 flex items-start gap-2">
                        <span className="badge bg-amber-100 text-amber-800 text-[10px] uppercase font-bold">{sug.section}</span>
                        <div>
                          <p className="font-medium text-slate-800">{sug.issue}</p>
                          <p className="text-slate-500">{sug.suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improved Bullet Points */}
              {analysis.improved_bullet_examples?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-primary-900 mb-1">High-Impact Bullet Point Examples (Try Using These):</p>
                  <div className="space-y-1">
                    {analysis.improved_bullet_examples.map((bullet, i) => (
                      <p key={i} className="text-xs p-2 bg-white/80 rounded border border-primary-100 font-mono text-slate-700">
                        • {bullet}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <TagInput
            id="certifications"
            label="Certifications & Badges"
            value={form.certifications}
            onChange={(v) => set("certifications", v)}
            placeholder="e.g. AWS Cloud Practitioner, Oracle Java Associate"
          />
        </div>

        <button type="submit" className="btn-primary w-full py-3 text-sm font-semibold" disabled={saving}>
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner size="sm" />
              <span>Saving Profile Changes...</span>
            </span>
          ) : (
            "Save Profile & Apply Changes"
          )}
        </button>
      </form>
    </div>
  );
}
