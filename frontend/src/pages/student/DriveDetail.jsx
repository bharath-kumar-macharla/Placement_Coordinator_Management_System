import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { driveApi, applicationApi, aiApi } from "../../api/index.js";
import { useToast } from "../../components/useToast.jsx";
import Spinner from "../../components/Spinner.jsx";
import ScoreRing from "../../components/ScoreRing.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import Modal from "../../components/Modal.jsx";

function CriteriaList({ criteria }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      {criteria.min_cgpa    && <div><span className="text-slate-400">Min CGPA:</span> <strong>{criteria.min_cgpa}</strong></div>}
      {criteria.max_backlogs !== null && <div><span className="text-slate-400">Max Backlogs:</span> <strong>{criteria.max_backlogs}</strong></div>}
      {criteria.allowed_branches?.length > 0 && (
        <div className="col-span-2"><span className="text-slate-400">Branches:</span> <strong>{criteria.allowed_branches.join(", ")}</strong></div>
      )}
      {criteria.allowed_years?.length > 0 && (
        <div><span className="text-slate-400">Years:</span> <strong>{criteria.allowed_years.join(", ")}</strong></div>
      )}
      {criteria.extra_rules && (
        <div className="col-span-2 text-slate-500 italic">{criteria.extra_rules}</div>
      )}
    </div>
  );
}

export default function DriveDetail() {
  const { id } = useParams();
  const { toast, ToastContainerEl } = useToast();
  const [drive,       setDrive]       = useState(null);
  const [myApp,       setMyApp]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [applying,    setApplying]    = useState(false);
  const [feedback,    setFeedback]    = useState(null);
  const [prep,        setPrep]        = useState(null);
  const [feedLoading, setFeedLoading] = useState(false);
  const [prepLoading, setPrepLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showPrep,     setShowPrep]     = useState(false);

  useEffect(() => {
    driveApi.getById(id)
      .then(({ data }) => {
        setDrive(data.drive);
        setMyApp(data.myApplication);
      })
      .catch(() => toast("Failed to load drive", "error"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleApply() {
    setApplying(true);
    try {
      const { data } = await applicationApi.apply(id);
      setMyApp(data.application);
      toast("Successfully applied! 🎉", "success");
    } catch (err) {
      toast(err.response?.data?.error?.message ?? "Failed to apply", "error");
    } finally {
      setApplying(false);
    }
  }

  async function loadResumeFeedback() {
    setFeedLoading(true);
    try {
      const targetId = myApp?.id || id;
      const { data } = await aiApi.resumeFeedback(targetId);
      setFeedback(data.feedback);
      setShowFeedback(true);
    } catch (err) {
      toast("Failed to get resume feedback", "error");
    } finally {
      setFeedLoading(false);
    }
  }

  async function loadInterviewPrep() {
    setPrepLoading(true);
    try {
      const { data } = await aiApi.interviewPrep(id);
      setPrep(data.prep);
      setShowPrep(true);
    } catch (err) {
      toast("Failed to load interview prep", "error");
    } finally {
      setPrepLoading(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!drive) return <div className="text-center py-20 text-slate-400">Drive not found</div>;

  const criteria = drive.drive_criteria;
  const canApply = myApp?.status === "eligible";
  const applied  = myApp && !["eligible"].includes(myApp.status);

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      {ToastContainerEl}

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-900">{drive.title}</h1>
              <StatusBadge status={drive.status} />
            </div>
            <p className="text-slate-500">{drive.companies?.name} · {drive.companies?.industry}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
              {drive.ctc_lpa   && <span>💰 ₹{drive.ctc_lpa} LPA</span>}
              {drive.location  && <span>📍 {drive.location}</span>}
              {drive.registration_deadline && (
                <span>⏰ Deadline: {new Date(drive.registration_deadline).toLocaleDateString("en-IN")}</span>
              )}
            </div>
          </div>
          {myApp?.match_score !== null && myApp?.match_score !== undefined && (
            <div className="text-center flex-shrink-0">
              <ScoreRing score={myApp.match_score} size={90} />
              <p className="text-xs text-slate-400 mt-1">Your match</p>
            </div>
          )}
        </div>

        {/* Apply / Status */}
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100">
          {canApply && (
            <button id="apply-btn" onClick={handleApply} className="btn-primary" disabled={applying}>
              {applying ? <Spinner size="sm" /> : "Apply Now"}
            </button>
          )}
          {applied && (
            <div className="flex items-center gap-2">
              <StatusBadge status={myApp.status} />
              <span className="text-sm text-slate-500">Your current status</span>
            </div>
          )}
          {!myApp && <span className="badge-red">You are not eligible for this drive</span>}
          <button onClick={loadInterviewPrep} className="btn-secondary" disabled={prepLoading}>
            {prepLoading ? <Spinner size="sm" /> : "🎯 Interview Prep"}
          </button>
          {myApp && (
            <button onClick={loadResumeFeedback} className="btn-secondary" disabled={feedLoading}>
              {feedLoading ? <Spinner size="sm" /> : "📄 Resume Feedback"}
            </button>
          )}
        </div>
      </div>

      {/* Status reason / eligibility */}
      {myApp?.status_reason && (
        <div className="card p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-700">
            <strong>Not eligible:</strong> {myApp.status_reason}
          </p>
        </div>
      )}

      {/* Skill gap */}
      {myApp?.skill_gap && (
        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-slate-800">Skill Analysis</h2>
          {myApp.skill_gap.matched_skills?.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1.5">Matched Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {myApp.skill_gap.matched_skills.map((s) => (
                  <span key={s} className="badge-green text-xs">{s}</span>
                ))}
              </div>
            </div>
          )}
          {myApp.skill_gap.missing_skills?.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1.5">Skills to Develop</p>
              <div className="flex flex-wrap gap-1.5">
                {myApp.skill_gap.missing_skills.map((s) => (
                  <span key={s} className="badge-red text-xs">{s}</span>
                ))}
              </div>
            </div>
          )}
          {myApp.ai_reason && (
            <p className="text-sm text-slate-600 italic border-t border-slate-100 pt-3">{myApp.ai_reason}</p>
          )}
        </div>
      )}

      {/* Criteria */}
      {criteria && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Eligibility Criteria</h2>
          <CriteriaList criteria={criteria} />
          {criteria.required_skills?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-400 uppercase font-medium tracking-wider mb-1.5">Required Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {criteria.required_skills.map((s) => (
                  <span key={s} className="badge-blue text-xs">{s}</span>
                ))}
              </div>
            </div>
          )}
          {criteria.mandatory_skills?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-red-500 uppercase font-medium tracking-wider mb-1.5">Mandatory Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {criteria.mandatory_skills.map((s) => (
                  <span key={s} className="badge-red text-xs">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* JD */}
      {drive.jd_text && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Job Description</h2>
          <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans leading-relaxed">{drive.jd_text}</pre>
        </div>
      )}

      {/* Resume Feedback Modal */}
      <Modal isOpen={showFeedback} onClose={() => setShowFeedback(false)} title="AI Resume Feedback" size="lg">
        {feedback ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">{feedback.summary}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">ATS Score:</span>
              <span className={`font-bold text-lg ${feedback.ats_score >= 70 ? "text-green-600" : feedback.ats_score >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                {feedback.ats_score}/100
              </span>
            </div>
            {feedback.keywords_to_add?.length > 0 && (
              <div>
                <p className="font-medium text-sm mb-2">Keywords to Add:</p>
                <div className="flex flex-wrap gap-1.5">
                  {feedback.keywords_to_add.map((k) => <span key={k} className="badge-purple">{k}</span>)}
                </div>
              </div>
            )}
            {feedback.role_specific_suggestions?.length > 0 && (
              <div>
                <p className="font-medium text-sm mb-2">Suggestions:</p>
                <ul className="space-y-2">
                  {feedback.role_specific_suggestions.map((s, i) => (
                    <li key={i} className="text-sm border border-slate-200 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-slate-700">{s.section}</p>
                        <span className={`badge flex-shrink-0 ${s.priority === "high" ? "badge-red" : s.priority === "medium" ? "badge-yellow" : "badge-gray"}`}>
                          {s.priority}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-1">{s.issue}</p>
                      <p className="text-primary-700 mt-1">💡 {s.suggestion}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : <Spinner />}
      </Modal>

      {/* Interview Prep Modal */}
      <Modal isOpen={showPrep} onClose={() => setShowPrep(false)} title="Interview Preparation Guide" size="lg">
        {prep ? (
          <div className="space-y-4">
            {prep.likely_topics?.length > 0 && (
              <div>
                <p className="font-medium text-sm mb-2">Likely Topics:</p>
                <div className="flex flex-wrap gap-1.5">
                  {prep.likely_topics.map((t) => <span key={t} className="badge-blue">{t}</span>)}
                </div>
              </div>
            )}
            {prep.practice_questions?.length > 0 && (
              <div>
                <p className="font-medium text-sm mb-2">Practice Questions:</p>
                <ul className="space-y-3">
                  {prep.practice_questions.slice(0, 6).map((q, i) => (
                    <li key={i} className="p-3 bg-slate-50 rounded-lg">
                      <span className="badge-gray mb-1 inline-block">{q.type}</span>
                      <p className="text-sm font-medium text-slate-800">{q.question}</p>
                      <p className="text-xs text-slate-400 mt-1">💡 {q.hint}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {prep.one_week_plan?.length > 0 && (
              <div>
                <p className="font-medium text-sm mb-2">7-Day Plan:</p>
                <ol className="space-y-1.5">
                  {prep.one_week_plan.map((day, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-primary-600 font-bold flex-shrink-0">Day {i + 1}:</span>
                      <span className="text-slate-600">{day}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ) : <Spinner />}
      </Modal>
    </div>
  );
}
