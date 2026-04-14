import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import API from "../../API/api";
import ThemeToggle from "../../components/ThemeToggle";
import Swal from "sweetalert2";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await API.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      await Swal.fire({
        icon: "success",
        title: "Account created",
        text: "You can sign in with your email.",
        confirmButtonColor: "oklch(var(--p))",
      });
      navigate("/login");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Registration failed",
        text: err.response?.data || "Could not register.",
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
          <h2 className="card-title text-primary">Register</h2>
          <p className="text-sm opacity-70">Quick signup with email (assigned default permissions).</p>
          <form className="flex flex-col gap-3 mt-2" onSubmit={handleSubmit(onSubmit)}>
            <label className="form-control">
              <span className="label-text">Full name</span>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                <input className="input input-bordered w-full pl-10" {...register("name", { required: true })} />
              </div>
            </label>
            <label className="form-control">
              <span className="label-text">Email</span>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                <input
                  type="email"
                  className="input input-bordered w-full pl-10"
                  {...register("email", { required: true })}
                />
              </div>
            </label>
            <label className="form-control">
              <span className="label-text">Password</span>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="input input-bordered w-full pl-10 pr-10"
                  {...register("password", {
                    required: true,
                    minLength: { value: 6, message: "Min 6 characters" },
                  })}
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
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : "Create account"}
            </button>
          </form>
          <Link to="/login" className="link link-primary text-sm mt-2">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
