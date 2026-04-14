import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { Lock, Eye, EyeOff } from "lucide-react";
import API from "../../API/api";
import { useAuth } from "../../context/AuthContext";
import { PK, can } from "../../lib/permissionKeys";
import Swal from "sweetalert2";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { mustChangePassword, permissions, persistSession } = useAuth();
  const [showA, setShowA] = useState(false);
  const [showB, setShowB] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    if (data.newPassword !== data.confirm) {
      Swal.fire({ icon: "warning", title: "Passwords do not match" });
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/auth/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      persistSession({
        token: res.data.token,
        mustChangePassword: false,
        permissions: res.data.permissions ?? permissions,
      });
      await Swal.fire({ icon: "success", title: "Password updated" });
      navigate("/app", { replace: true });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Could not change password",
        text: err.response?.data || "Check current password.",
      });
    } finally {
      setLoading(false);
    }
  };

  const canVoluntary = can(permissions, PK.profilePassword);

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <h2 className="card-title">{mustChangePassword ? "Choose a new password" : "Change password"}</h2>
          {mustChangePassword && (
            <div role="alert" className="alert alert-warning text-sm">
              You must change your password before continuing.
            </div>
          )}
          {!mustChangePassword && !canVoluntary && (
            <div role="alert" className="alert alert-error text-sm">
              You do not have permission to change password here.
            </div>
          )}
          <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
            <label className="form-control">
              <span className="label-text">Current password</span>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                <input
                  type={showA ? "text" : "password"}
                  className="input input-bordered w-full pl-10 pr-10"
                  {...register("currentPassword", { required: true })}
                />
                <button type="button" className="absolute right-2 top-2 btn btn-ghost btn-sm btn-circle" onClick={() => setShowA(!showA)}>
                  {showA ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>
            <label className="form-control">
              <span className="label-text">New password</span>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                <input
                  type={showB ? "text" : "password"}
                  className="input input-bordered w-full pl-10 pr-10"
                  {...register("newPassword", { required: true, minLength: 6 })}
                />
                <button type="button" className="absolute right-2 top-2 btn btn-ghost btn-sm btn-circle" onClick={() => setShowB(!showB)}>
                  {showB ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>
            <label className="form-control">
              <span className="label-text">Confirm new password</span>
              <input type="password" className="input input-bordered" {...register("confirm", { required: true })} />
            </label>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || (!mustChangePassword && !canVoluntary)}
            >
              {loading ? <span className="loading loading-spinner loading-sm" /> : "Save"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
