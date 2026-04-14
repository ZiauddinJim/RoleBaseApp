import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import API from "../../API/api";
import Swal from "sweetalert2";

export default function AdminPermissionsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset } = useForm();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/permissions");
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (data) => {
    try {
      await API.post("/permissions", {
        key: data.key,
        name: data.name,
        description: data.description || null,
      });
      reset();
      await load();
      Swal.fire({ icon: "success", title: "Created", timer: 1000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", text: err.response?.data || "" });
    }
  };

  const remove = async (id) => {
    const r = await Swal.fire({ title: "Delete?", showCancelButton: true, icon: "warning" });
    if (!r.isConfirmed) return;
    try {
      await API.delete(`/permissions/${id}`);
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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Permissions</h1>
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-base">Add permission</h2>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end" onSubmit={handleSubmit(onCreate)}>
            <input className="input input-bordered input-sm" placeholder="key.module.action" {...register("key", { required: true })} />
            <input className="input input-bordered input-sm" placeholder="Display name" {...register("name", { required: true })} />
            <input className="input input-bordered input-sm md:col-span-1" placeholder="Description" {...register("description")} />
            <button type="submit" className="btn btn-primary btn-sm">
              Add
            </button>
          </form>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-base-300">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Key</th>
              <th>Name</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-xs">{p.key}</td>
                <td>{p.name}</td>
                <td>
                  <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => remove(p.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
