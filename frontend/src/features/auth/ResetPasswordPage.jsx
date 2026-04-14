import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { Lock, Eye, EyeOff } from "lucide-react";
import API from "../../API/api";
import ThemeToggle from "../../components/ThemeToggle";
import Swal from "sweetalert2";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: useMemo(
      () => ({
        email: params.get("email") || "",
        token: params.get("token") || "",
      }),
      [params]
    ),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await API.post("/auth/reset-password", {
        email: data.email,
        token: data.token,
        newPassword: data.newPassword,
      });
      await Swal.fire({ icon: "success", title: "Password reset", text: "You can sign in now." });
      navigate("/login");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Reset failed",
        text: err.response?.data || "Invalid token or email.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="card bg-base-100 w-full max-w-md shadow-xl border border-base-300">
        <div className="card-body">
          <h2 className="card-title">Set new password</h2>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
            <label className="form-control">
              <span className="label-text">Email</span>
              <input type="email" className="input input-bordered" {...register("email", { required: true })} />
            </label>
            <label className="form-control">
              <span className="label-text">Reset token (from email link)</span>
              <input className="input input-bordered font-mono text-xs" {...register("token", { required: true })} />
            </label>
            <label className="form-control">
              <span className="label-text">New password</span>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                <input
                  type={show ? "text" : "password"}
                  className="input input-bordered w-full pl-10 pr-10"
                  {...register("newPassword", { required: true, minLength: 6 })}
                />
                <button type="button" className="absolute right-2 top-2 btn btn-ghost btn-sm btn-circle" onClick={() => setShow(!show)}>
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : "Update password"}
            </button>
          </form>
          <Link to="/login" className="link text-sm">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
