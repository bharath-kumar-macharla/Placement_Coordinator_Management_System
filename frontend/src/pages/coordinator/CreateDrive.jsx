import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { driveApi, companyApi } from "../../api/index.js";
import Spinner from "../../components/Spinner.jsx";

const ALL_BRANCHES = ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AIDS", "CSBS"];
const ALL_YEARS = [2024, 2025, 2026, 2027];

export default function CreateDrive() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");

  // Step 1 Form
  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [location, setLocation] = useState("Bangalore / Remote");
  const [ctcLpa, setCtcLpa] = useState("");
  const [deadline, setDeadline] = useState("");
  const [jdText, setJdText] = useState("");

  // Step 2 AI Extracted Criteria
  const [createdDriveId, setCreatedDriveId] = useState(null);
  const [aiConfidence, setAiConfidence] = useState(null);
  const [ambiguities, setAmbiguities] = useState([]);

  const [minCgpa, setMinCgpa] = useState("7.0");
  const [maxBacklogs, setMaxBacklogs] = useState("0");
  const [allowedBranches, setAllowedBranches] = useState(["CSE", "IT"]);
  const [allowedYears, setAllowedYears] = useState([2025]);
  const [requiredSkills, setRequiredSkills] = useState(["JavaScript", "Node.js", "React"]);
  const [preferredSkills, setPreferredSkills] = useState(["Docker", "PostgreSQL"]);
  const [mandatorySkills, setMandatorySkills] = useState([]);
  const [extraRules, setExtraRules] = useState("");

  // Input states for tag chips
  const [reqSkillInput, setReqSkillInput] = useState("");
  const [prefSkillInput, setPrefSkillInput] = useState("");
  const [mandSkillInput, setMandSkillInput] = useState("");

  useEffect(() => {
    companyApi.list()
      .then(({ data }) => {
        setCompanies(data.companies ?? []);
        if (data.companies?.length > 0) {
          setCompanyId(data.companies[0].id);
        }
      })
      .catch(console.error);
  }, []);

  async function handleExtract(e) {
    e.preventDefault();
    if (!jdText.trim()) {
      setError("Please paste the job description text.");
      return;
    }
    setError("");
    setExtracting(true);

    try {
      // 1. First extract criteria with Gemini
      const { data: ext } = await driveApi.extractCriteria({ jd_text: jdText });
      const c = ext.criteria || {};

      setAiConfidence(c.confidence ?? 0.85);
      setAmbiguities(c.ambiguities ?? []);

      if (c.role_title && !roleTitle) setRoleTitle(c.role_title);
      if (c.ctc_lpa && !ctcLpa) setCtcLpa(c.ctc_lpa);
      if (c.min_cgpa !== undefined && c.min_cgpa !== null) setMinCgpa(String(c.min_cgpa));
      if (c.max_backlogs !== undefined && c.max_backlogs !== null) setMaxBacklogs(String(c.max_backlogs));
      if (c.allowed_branches?.length) setAllowedBranches(c.allowed_branches);
      if (c.allowed_years?.length) setAllowedYears(c.allowed_years);
      if (c.required_skills?.length) setRequiredSkills(c.required_skills);
      if (c.preferred_skills?.length) setPreferredSkills(c.preferred_skills);
      if (c.extra_rules) setExtraRules(c.extra_rules);

      // 2. Create the drive in draft status
      const drivePayload = {
        company_id: companyId,
        title: title || `${roleTitle || "Software Engineer"} Drive`,
        role_title: roleTitle || c.role_title || "Software Engineer",
        jd_text: jdText,
        location,
        ctc_lpa: ctcLpa ? parseFloat(ctcLpa) : (c.ctc_lpa ? parseFloat(c.ctc_lpa) : null),
        registration_deadline: deadline ? new Date(deadline).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString(),
      };

      const { data: driveRes } = await driveApi.create(drivePayload);
      setCreatedDriveId(driveRes.drive.id);
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error?.message || "Failed to extract criteria. Please check your JD text.");
    } finally {
      setExtracting(false);
    }
  }

  async function handleSaveAndPublish(shouldPublish = true) {
    if (!createdDriveId) return;
    setLoading(true);
    setError("");

    try {
      // 1. Save criteria
      await driveApi.saveCriteria(createdDriveId, {
        min_cgpa: minCgpa ? parseFloat(minCgpa) : null,
        max_backlogs: maxBacklogs !== "" ? parseInt(maxBacklogs, 10) : 0,
        allowed_branches: allowedBranches,
        allowed_years: allowedYears,
        required_skills: requiredSkills,
        preferred_skills: preferredSkills,
        mandatory_skills: mandatorySkills,
        extra_rules: extraRules,
        ai_confidence: aiConfidence,
      });

      // 2. Publish if requested
      if (shouldPublish) {
        await driveApi.publish(createdDriveId);
      }

      navigate(`/coordinator/drives/${createdDriveId}/manage`);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error?.message || "Failed to save criteria and publish drive.");
    } finally {
      setLoading(false);
    }
  }

  function toggleBranch(b) {
    setAllowedBranches((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  }

  function toggleYear(y) {
    setAllowedYears((prev) =>
      prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y]
    );
  }

  function addSkill(type) {
    if (type === "req" && reqSkillInput.trim()) {
      setRequiredSkills((p) => [...new Set([...p, reqSkillInput.trim()])]);
      setReqSkillInput("");
    } else if (type === "pref" && prefSkillInput.trim()) {
      setPreferredSkills((p) => [...new Set([...p, prefSkillInput.trim()])]);
      setPrefSkillInput("");
    } else if (type === "mand" && mandSkillInput.trim()) {
      setMandatorySkills((p) => [...new Set([...p, mandSkillInput.trim()])]);
      setMandSkillInput("");
    }
  }

  function removeSkill(type, skill) {
    if (type === "req") setRequiredSkills((p) => p.filter((s) => s !== skill));
    if (type === "pref") setPreferredSkills((p) => p.filter((s) => s !== skill));
    if (type === "mand") setMandatorySkills((p) => p.filter((s) => s !== skill));
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Create Placement Drive</h1>
        <p className="page-subtitle">
          Paste a raw job description — Gemini extracts criteria automatically for coordinator review
        </p>
      </div>

      {/* Stepper Indicator */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            step === 1 ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-700"
          }`}
        >
          <span>1</span>
          <span>Drive Details & JD</span>
        </div>
        <span className="text-slate-300">→</span>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
            step === 2 ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-400"
          }`}
        >
          <span>2</span>
          <span>Review AI Criteria & Publish</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* STEP 1: Paste JD and Drive Meta */}
      {step === 1 && (
        <form onSubmit={handleExtract} className="card p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Company *</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="input-field"
                required
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.industry || "Tech"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Drive Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Acme Corp Campus Drive 2025"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">Role Title</label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Associate Software Engineer"
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Package (CTC in LPA)</label>
              <input
                type="number"
                step="0.5"
                value={ctcLpa}
                onChange={(e) => setCtcLpa(e.target.value)}
                placeholder="e.g. 14.5"
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Registration Deadline</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">Job Description (JD) Text *</label>
              <button
                type="button"
                onClick={() => {
                  setJdText(
                    `Acme Technologies is hiring Graduate Engineer Trainees (GET) for Bangalore office. CTC: 12 LPA.\n\nEligibility:\n- B.Tech CSE, IT, ECE from 2025 batch.\n- Minimum 7.5 CGPA throughout academics with 0 active backlogs.\n\nRequired Skills:\n- Strong problem-solving skills in Data Structures and Algorithms.\n- Proficiency in JavaScript, React, Node.js or Python.\n- Good knowledge of SQL and Relational Databases.\n\nPreferred Skills:\n- Familiarity with Docker, AWS, or CI/CD pipelines.\n- Open-source contributions or hackathon projects.`
                  );
                  if (!title) setTitle("Acme Tech 2025 GET Drive");
                  if (!roleTitle) setRoleTitle("Graduate Engineer Trainee");
                  if (!ctcLpa) setCtcLpa("12");
                }}
                className="text-xs text-primary-600 hover:underline"
              >
                Paste Sample JD
              </button>
            </div>
            <textarea
              rows={10}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="Paste the company's JD, email, or circular text here..."
              className="input-field font-mono text-xs leading-relaxed"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={extracting}
              className="btn-primary flex items-center gap-2"
            >
              {extracting ? (
                <>
                  <Spinner size="sm" />
                  <span>Extracting Criteria with Gemini AI...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Extract Criteria with AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: Review and Edit AI Extracted Criteria */}
      {step === 2 && (
        <div className="space-y-6">
          {/* AI Confidence and Ambiguities Banner */}
          <div className="card p-5 bg-gradient-to-r from-primary-50 to-indigo-50 border border-primary-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    AI Criteria Extraction Complete
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review and fine-tune criteria before publishing to students.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">AI Confidence:</span>
                <span
                  className={`badge text-xs px-2.5 py-1 font-bold ${
                    (aiConfidence ?? 0) >= 0.8
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : (aiConfidence ?? 0) >= 0.6
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-red-100 text-red-800 border-red-300"
                  }`}
                >
                  {Math.round((aiConfidence ?? 0.8) * 100)}% Confidence
                </span>
              </div>
            </div>

            {ambiguities.length > 0 && (
              <div className="mt-3 pt-3 border-t border-primary-200/50">
                <p className="text-xs font-semibold text-amber-800">⚠️ Ambiguities flagged by AI:</p>
                <ul className="list-disc list-inside text-xs text-amber-700 mt-1 space-y-0.5">
                  {ambiguities.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Criteria Form */}
          <div className="card p-6 space-y-5">
            <h3 className="font-bold text-slate-800 text-base">Drive Eligibility Criteria</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Minimum CGPA</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Maximum Active Backlogs</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={maxBacklogs}
                  onChange={(e) => setMaxBacklogs(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            {/* Allowed Branches */}
            <div>
              <label className="label">Allowed Branches</label>
              <div className="flex flex-wrap gap-2">
                {ALL_BRANCHES.map((b) => {
                  const selected = allowedBranches.includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() => toggleBranch(b)}
                      className={`badge px-3 py-1 text-xs cursor-pointer transition-all ${
                        selected
                          ? "bg-primary-600 text-white border-primary-600"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {selected ? "✓ " : "+ "}
                      {b}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Allowed Years */}
            <div>
              <label className="label">Eligible Graduating Batches</label>
              <div className="flex flex-wrap gap-2">
                {ALL_YEARS.map((y) => {
                  const selected = allowedYears.includes(y);
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => toggleYear(y)}
                      className={`badge px-3 py-1 text-xs cursor-pointer transition-all ${
                        selected
                          ? "bg-primary-600 text-white border-primary-600"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {selected ? "✓ " : "+ "}
                      {y}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Required Skills */}
            <div>
              <label className="label">Required Skills (Feeds AI Match Score)</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {requiredSkills.map((s) => (
                  <span
                    key={s}
                    className="badge bg-blue-50 text-blue-700 border-blue-200 gap-1 px-2.5 py-1 text-xs"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSkill("req", s)}
                      className="hover:text-red-600 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={reqSkillInput}
                  onChange={(e) => setReqSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("req"))}
                  placeholder="Add a required skill..."
                  className="input-field text-xs py-1.5"
                />
                <button
                  type="button"
                  onClick={() => addSkill("req")}
                  className="btn-secondary text-xs"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Preferred Skills */}
            <div>
              <label className="label">Preferred Skills (Bonus weight)</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {preferredSkills.map((s) => (
                  <span
                    key={s}
                    className="badge bg-purple-50 text-purple-700 border-purple-200 gap-1 px-2.5 py-1 text-xs"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSkill("pref", s)}
                      className="hover:text-red-600 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={prefSkillInput}
                  onChange={(e) => setPrefSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("pref"))}
                  placeholder="Add a preferred skill..."
                  className="input-field text-xs py-1.5"
                />
                <button
                  type="button"
                  onClick={() => addSkill("pref")}
                  className="btn-secondary text-xs"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Mandatory Skills (Hard Rejection) */}
            <div>
              <label className="label">
                Mandatory Skills <span className="text-red-500 font-normal">(Hard rejects candidates missing these)</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {mandatorySkills.map((s) => (
                  <span
                    key={s}
                    className="badge bg-rose-50 text-rose-700 border-rose-200 gap-1 px-2.5 py-1 text-xs"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSkill("mand", s)}
                      className="hover:text-red-600 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mandSkillInput}
                  onChange={(e) => setMandSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("mand"))}
                  placeholder="Add mandatory skill (e.g. Java, Python)..."
                  className="input-field text-xs py-1.5"
                />
                <button
                  type="button"
                  onClick={() => addSkill("mand")}
                  className="btn-secondary text-xs"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Extra Rules */}
            <div>
              <label className="label">Additional Guidelines / Rules</label>
              <input
                type="text"
                value={extraRules}
                onChange={(e) => setExtraRules(e.target.value)}
                placeholder="e.g. Must have completed a 6-month internship or have 1 full-stack project"
                className="input-field"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-ghost text-sm"
              >
                ← Back to JD
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSaveAndPublish(false)}
                  disabled={loading}
                  className="btn-secondary text-sm"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAndPublish(true)}
                  disabled={loading}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" />
                      <span>Publishing Drive...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Confirm Criteria & Publish</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
