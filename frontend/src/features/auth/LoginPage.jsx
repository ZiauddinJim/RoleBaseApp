import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { Lock, Eye, EyeOff, UserSquare2 } from "lucide-react";
import API from "../../API/api";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/ThemeToggle";
import Swal from "sweetalert2";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await API.post("/auth/login", {
        userIdOrEmail: data.userIdOrEmail.trim(),
        password: data.password,
      });
      login({
        token: res.data.token,
        role: res.data.role,
        userId: res.data.userId,
        name: res.data.name,
        email: res.data.email,
        publicUserId: res.data.publicUserId ?? "",
        permissions: res.data.permissions ?? [],
        mustChangePassword: res.data.mustChangePassword,
      });
      if (res.data.mustChangePassword) navigate("/app/change-password", { replace: true });
      else navigate("/app", { replace: true });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Sign in failed",
        text: typeof err.response?.data === "string" ? err.response.data : "Invalid User ID / email or password.",
        confirmButtonColor: "oklch(var(--p))",
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
          <h2 className="card-title text-primary">RoleBase</h2>
          <p className="text-sm opacity-70">Sign in with your email or public User ID</p>
          <form className="flex flex-col gap-3 mt-2" onSubmit={handleSubmit(onSubmit)}>
            <label className="form-control w-full">
              <span className="label-text">User ID or email</span>
              <div className="relative">
                <UserSquare2 className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                <input
                  type="text"
                  className="input input-bordered w-full pl-10"
                  placeholder="RB-2026-… or you@company.com"
                  {...register("userIdOrEmail", { required: "Required" })}
                />
              </div>
              {errors.userIdOrEmail && (
                <span className="text-error text-xs">{errors.userIdOrEmail.message}</span>
              )}
            </label>
            <label className="form-control w-full">
              <span className="label-text">Password</span>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pl-10 pr-10"
                  {...register("password", { required: "Required", minLength: { value: 6, message: "Min 6 chars" } })}
                />
                <button
                  type="button"
                  className="absolute right-2 top-2 btn btn-ghost btn-sm btn-circle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <span className="text-error text-xs">{errors.password.message}</span>}
            </label>
            <button type="submit" className="btn btn-primary mt-2" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : "Sign in"}
            </button>
          </form>
          <div className="divider text-xs">or</div>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/register" className="link link-primary">
              Create account (email)
            </Link>
            {/* <Link to="/onboarding" className="link link-secondary">
              Register with 3-step form (get User ID)
            </Link> */}
            <Link to="/forgot-password" className="link">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
