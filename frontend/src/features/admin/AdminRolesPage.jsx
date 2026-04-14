import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Trash2 } from "lucide-react";
import API from "../../API/api";
import Swal from "sweetalert2";

export default function AdminRolesPage() {
  const [roles, setRoles] = useState([]);
  const [perms, setPerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const { register, handleSubmit, reset } = useForm({ defaultValues: { name: "" } });

  const load = async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([API.get("/roles"), API.get("/permissions")]);
      setRoles(r.data);
      setPerms(p.data);
    } catch {
      setRoles([]);
      setPerms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreateRole = async (data) => {
    try {
      await API.post("/roles", { name: data.name });
      reset();
      await load();
      Swal.fire({ icon: "success", title: "Role created", timer: 900, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", text: err.response?.data || "" });
    }
  };

  const savePermissions = async () => {
    if (!selectedRoleId) return;
    const checked = Array.from(
      document.querySelectorAll(`input[data-rp="${selectedRoleId}"]:checked`)
    ).map((el) => el.value);
    try {
      await API.put(`/roles/${selectedRoleId}/permissions`, { permissionIds: checked });
      Swal.fire({ icon: "success", title: "Saved", timer: 900, showConfirmButton: false });
      await load();
    } catch (err) {
      Swal.fire({ icon: "error", text: err.response?.data || "" });
    }
  };

  const deleteRole = async (id, name) => {
    const r = await Swal.fire({ title: `Delete ${name}?`, showCancelButton: true, icon: "warning" });
    if (!r.isConfirmed) return;
    try {
      await API.delete(`/roles/${id}`);
      if (selectedRoleId === id) setSelectedRoleId("");
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

  const current = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Roles & permissions</h1>
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body flex-row flex-wrap gap-2 items-end">
          <form className="flex gap-2 flex-1 min-w-[200px]" onSubmit={handleSubmit(onCreateRole)}>
            <input className="input input-bordered input-sm flex-1" placeholder="New role name" {...register("name", { required: true })} />
            <button type="submit" className="btn btn-primary btn-sm">
              Create role
            </button>
          </form>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body">
            <h2 className="card-title text-base">Roles</h2>
            <ul className="space-y-1">
              {roles.map((r) => (
                <li key={r.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    className={`btn btn-sm flex-1 justify-start ${selectedRoleId === r.id ? "btn-primary" : "btn-ghost"}`}
                    onClick={() => setSelectedRoleId(r.id)}
                  >
                    {r.name}
                  </button>
                  {r.name !== "Admin" && r.name !== "User" && (
                    <button type="button" className="btn btn-ghost btn-sm btn-square text-error" onClick={() => deleteRole(r.id, r.name)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="card bg-base-200 border border-base-300 lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title text-base">Permissions for {current?.name || "—"}</h2>
            {!selectedRoleId && <p className="text-sm opacity-70">Select a role.</p>}
            {selectedRoleId && (
              <>
                <div key={selectedRoleId} className="max-h-80 overflow-y-auto space-y-1 border border-base-300 rounded-lg p-3 bg-base-100">
                  {perms.map((p) => (
                    <label key={p.id} className="label cursor-pointer justify-start gap-3 py-1">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
                        data-rp={selectedRoleId}
                        value={p.id}
                        defaultChecked={current?.permissionIds?.includes(p.id)}
                      />
                      <span className="label-text font-mono text-xs">{p.key}</span>
                      <span className="label-text text-xs opacity-70 truncate">{p.name}</span>
                    </label>
                  ))}
                </div>
                <button type="button" className="btn btn-primary btn-sm mt-2" onClick={savePermissions}>
                  Save mapping
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
