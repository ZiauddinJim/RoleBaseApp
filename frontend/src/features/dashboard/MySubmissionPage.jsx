import { useEffect, useMemo, useState } from "react";
import API from "../../API/api";
import Swal from "sweetalert2";

export default function MySubmissionPage() {
  const [data, setData] = useState(undefined);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    company: "",
    department: "",
    bio: "",
    goals: "",
    profileImageUrl: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const { data: profile } = await API.get("/auth/profile");
        setData(profile ?? null);
        setForm({
          fullName: profile?.fullName ?? "",
          email: profile?.email ?? "",
          company: profile?.company ?? "",
          department: profile?.department ?? "",
          bio: profile?.bio ?? "",
          goals: profile?.goals ?? "",
          profileImageUrl: profile?.profileImageUrl ?? "",
        });
      } catch (e) {
        setErr(e.response?.data || "Could not load");
      }
    })();
  }, []);

  const submittedAtText = useMemo(() => {
    if (!data?.updatedAtUtc) return "";
    return new Date(data.updatedAtUtc).toLocaleString();
  }, [data]);

  const saveSubmission = async () => {
    if (!form.fullName.trim() || !form.email.trim()) {
      Swal.fire({ icon: "warning", title: "Full name and email are required" });
      return;
    }

    setSaving(true);
    try {
      const { data: res } = await API.put("/auth/profile", {
        step1: { fullName: form.fullName.trim(), email: form.email.trim() },
        step2: { company: form.company, department: form.department },
        step3: { bio: form.bio, goals: form.goals, profileImageUrl: form.profileImageUrl?.trim() ?? "" },
      });
      setData(res.profile);
      await Swal.fire({ icon: "success", title: "Profile updated" });
    } catch (e) {
      Swal.fire({ icon: "error", title: "Update failed", text: String(e.response?.data || "Could not save") });
    } finally {
      setSaving(false);
    }
  };

  if (err) {
    return (
      <div className="p-6">
        <div className="alert alert-error">{String(err)}</div>
      </div>
    );
  }

  if (data === undefined) {
    return (
      <div className="p-6 flex justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (data === null) {
    // Show editable form below so user can create first submission after login.
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">My profile</h1>
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body space-y-4">
          <p className="text-sm opacity-70">Any user or admin can view and update profile details here.</p>
          <p className="text-xs opacity-70">
            Public ID login is active. If your account has no Public ID yet, it is created automatically on profile update.
          </p>
          {data?.publicUserId ? (
            <div className="badge badge-outline font-mono">Public ID: {data.publicUserId}</div>
          ) : null}

          <div className="grid md:grid-cols-2 gap-3">
            <label className="form-control">
              <span className="label-text">Full name</span>
              <input
                className="input input-bordered"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </label>
            <label className="form-control">
              <span className="label-text">Email</span>
              <input
                type="email"
                className="input input-bordered"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <label className="form-control">
              <span className="label-text">Company</span>
              <input
                className="input input-bordered"
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              />
            </label>
            <label className="form-control">
              <span className="label-text">Department</span>
              <input
                className="input input-bordered"
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              />
            </label>
          </div>

          <label className="form-control">
            <span className="label-text">Bio</span>
            <textarea
              className="textarea textarea-bordered h-24"
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            />
          </label>

          <label className="form-control">
            <span className="label-text">Goals</span>
            <textarea
              className="textarea textarea-bordered h-24"
              value={form.goals}
              onChange={(e) => setForm((f) => ({ ...f, goals: e.target.value }))}
            />
          </label>

          <label className="form-control">
            <span className="label-text">Profile picture URL</span>
            <input
              type="url"
              className="input input-bordered"
              placeholder="https://example.com/avatar.jpg"
              value={form.profileImageUrl}
              onChange={(e) => setForm((f) => ({ ...f, profileImageUrl: e.target.value }))}
            />
          </label>
          {form.profileImageUrl?.trim() ? (
            <div>
              <p className="text-sm mb-2 opacity-70">Preview</p>
              <img
                src={form.profileImageUrl}
                alt="Profile preview"
                className="w-24 h-24 rounded-full object-cover border border-base-300"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                onLoad={(e) => {
                  e.currentTarget.style.display = "block";
                }}
              />
            </div>
          ) : null}

          {submittedAtText ? (
            <p className="text-xs opacity-60">
              Last updated: {submittedAtText}
            </p>
          ) : null}

          <button type="button" className="btn btn-primary" onClick={saveSubmission} disabled={saving}>
            {saving ? <span className="loading loading-spinner" /> : "Update profile"}
          </button>
        </div>
      </div>
    </div>
  );
}
