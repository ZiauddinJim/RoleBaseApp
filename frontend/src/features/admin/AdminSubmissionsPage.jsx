import { useEffect, useState } from "react";
import API from "../../API/api";

function toDisplayRows(section) {
  if (!section || typeof section !== "object") return [];
  return Object.entries(section)
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
    .map(([key, value]) => ({
      key: key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
      value: typeof value === "object" ? JSON.stringify(value) : String(value),
    }));
}

function SectionCard({ title, data }) {
  const rows = toDisplayRows(data);
  return (
    <div className="rounded-xl border border-base-300 bg-base-100 p-4">
      <h3 className="font-semibold mb-3">{title}</h3>
      {rows.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-2">
          {rows.map((r) => (
            <div key={`${title}:${r.key}`} className="rounded-lg bg-base-200 px-3 py-2">
              <p className="text-xs opacity-70">{r.key}</p>
              <p className="text-sm break-words">{r.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm opacity-60">No data</p>
      )}
    </div>
  );
}

export default function AdminSubmissionsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get("/submissions");
        setRows(data);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <span className="loading loading-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">All profile submissions</h1>
      <p className="text-sm opacity-70">Card-based overview for each user submission.</p>
      <div className="grid gap-4">
        {rows.map((s) => (
          <div key={s.id} className="card border border-primary/20 bg-base-200 shadow-sm">
            <div className="card-body gap-4">
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div>
                  <h2 className="font-semibold text-lg">{s.userName || "Unknown user"}</h2>
                  <p className="text-sm opacity-70">{s.userEmail || "-"}</p>
                  <p className="text-xs font-mono mt-1">{s.publicUserId || "No Public ID"}</p>
                </div>
                <span className="badge badge-outline">
                  {new Date(s.submittedAtUtc).toLocaleString()}
                </span>
              </div>
              <div className="grid lg:grid-cols-3 gap-3">
                <SectionCard title="Basic Info" data={s.step1} />
                <SectionCard title="Organization" data={s.step2} />
                <SectionCard title="Profile" data={s.step3} />
              </div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="opacity-70">No submissions yet.</p>}
      </div>
    </div>
  );
}
