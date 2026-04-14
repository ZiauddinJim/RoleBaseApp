import { useEffect, useState } from "react";
import API from "../../API/api";
import Swal from "sweetalert2";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([API.get("/admin/users"), API.get("/roles")]);
      setUsers(u.data);
      setRoles(r.data.map((x) => x.name));
    } catch {
      setUsers([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveRoles = async (userId, roleNames) => {
    try {
      await API.put(`/admin/users/${userId}/roles`, { roleNames });
      Swal.fire({ icon: "success", title: "Updated", timer: 900, showConfirmButton: false });
      await load();
    } catch (err) {
      Swal.fire({ icon: "error", text: err.response?.data || "" });
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <span className="loading loading-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Users</h1>
      <div className="overflow-x-auto rounded-lg border border-base-300">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Public ID</th>
              <th>Roles</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow
                key={`${u.id}:${(u.roles || []).slice().sort().join(",")}`}
                user={u}
                allRoleNames={roles}
                onSave={(names) => saveRoles(u.id, names)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRow({ user, allRoleNames, onSave }) {
  const [sel, setSel] = useState(() => new Set(user.roles || []));

  const toggle = (name) => {
    const next = new Set(sel);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSel(next);
  };

  return (
    <tr>
      <td>{user.name}</td>
      <td className="text-xs">{user.email}</td>
      <td className="font-mono text-xs">{user.publicUserId || "—"}</td>
      <td>
        <div className="flex flex-wrap gap-1">
          {allRoleNames.map((name) => (
            <button
              key={name}
              type="button"
              className={sel.has(name) ? "badge badge-primary" : "badge badge-ghost"}
              onClick={() => toggle(name)}
            >
              {name}
            </button>
          ))}
          <button type="button" className="btn btn-xs btn-primary" onClick={() => onSave([...sel])}>
            Save
          </button>
        </div>
      </td>
    </tr>
  );
}
