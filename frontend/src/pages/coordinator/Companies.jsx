import { useState, useEffect } from "react";
import { companyApi } from "../../api/index.js";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Modal from "../../components/Modal.jsx";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("Technology");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  async function loadCompanies() {
    try {
      const { data } = await companyApi.list();
      setCompanies(data.companies ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await companyApi.create({
        name,
        industry,
        website,
        description,
      });
      setShowModal(false);
      setName("");
      setWebsite("");
      setDescription("");
      await loadCompanies();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error?.message || "Failed to add company");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Hiring Partners & Companies</h1>
          <p className="page-subtitle">
            Manage recruiting organizations participating in campus drives
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-sm flex items-center gap-1.5"
        >
          <span>➕</span>
          <span>Add Company</span>
        </button>
      </div>

      {companies.length === 0 ? (
        <EmptyState
          icon={<span className="text-2xl">🏭</span>}
          title="No companies registered"
          description="Click 'Add Company' to register a new recruiting organization."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((c) => (
            <div key={c.id} className="card p-5 flex flex-col justify-between hover:border-slate-300 transition-all">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                  <span className="badge bg-slate-100 text-slate-700 text-xs">{c.industry || "General"}</span>
                </div>
                {c.website && (
                  <a
                    href={c.website.startsWith("http") ? c.website : `https://${c.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary-600 hover:underline mt-1 inline-block"
                  >
                    🔗 {c.website}
                  </a>
                )}
                <p className="text-xs text-slate-600 mt-3 line-clamp-3 leading-relaxed">
                  {c.description || "No description provided."}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowModal(false)}
          title="Add New Hiring Partner"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">Company Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Google India"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">Industry / Sector</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Information Technology / Fintech"
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://company.com"
                className="input-field"
              />
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of the company..."
                className="input-field text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-xs"
              >
                {submitting ? "Saving..." : "Add Partner"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
