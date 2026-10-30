import { useState, useEffect } from "react";
import { adminApi } from "../../api/index.js";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Modal from "../../components/Modal.jsx";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New user form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("coordinator");

  async function loadUsers() {
    try {
      const { data } = await adminApi.users();
      setUsers(data.users ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleToggleStatus(userId, currentStatus) {
    try {
      await adminApi.setUserStatus(userId, !currentStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u))
      );
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error?.message || "Failed to update user status");
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await adminApi.createUser({ name, email, password, role });
      setShowModal(false);
      setName("");
      setEmail("");
      setPassword("");
      await loadUsers();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.error?.message || "Failed to create user");
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

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            Administer student, placement coordinator, and institutional administrator accounts
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary text-sm flex items-center gap-1.5"
        >
          <span>➕</span>
          <span>Create Account</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="input-field text-sm flex-1"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-field text-sm sm:w-48"
        >
          <option value="all">All Roles</option>
          <option value="student">Student</option>
          <option value="coordinator">Coordinator</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No users match this filter"
              description="Adjust the filter or create a new user account above."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs text-slate-700 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`badge text-xs capitalize ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-800 border-purple-200"
                            : u.role === "coordinator"
                            ? "bg-primary-100 text-primary-800 border-primary-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`badge text-xs ${
                          u.is_active
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }`}
                      >
                        {u.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-400">
                      {new Date(u.created_at).toLocaleDateString("en-IN", {
                        dateStyle: "medium",
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.is_active)}
                        className={`btn-ghost text-xs py-1 px-2.5 ${
                          u.is_active ? "text-red-600 hover:text-red-700" : "text-emerald-600 hover:text-emerald-700"
                        }`}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowModal(false)}
          title="Create New User Account"
        >
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. S. Sharma"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coordinator@demo.com"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="input-field"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="label">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input-field"
              >
                <option value="coordinator">Coordinator</option>
                <option value="admin">Administrator</option>
                <option value="student">Student</option>
              </select>
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
                {submitting ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
