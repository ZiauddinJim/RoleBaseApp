import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { Mail } from "lucide-react";
import API from "../../API/api";
import ThemeToggle from "../../components/ThemeToggle";
import Swal from "sweetalert2";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await API.post("/auth/forgot-password", { email: data.email });
      await Swal.fire({
        icon: "info",
        title: "Check your inbox",
        text: "If the email exists, we sent reset instructions.",
        confirmButtonColor: "oklch(var(--p))",
      });
    } catch {
      Swal.fire({ icon: "error", title: "Request failed" });
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
          <h2 className="card-title">Forgot password</h2>
          <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
            <label className="form-control">
              <span className="label-text">Email</span>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 opacity-50" />
                <input type="email" className="input input-bordered w-full pl-10" {...register("email", { required: true })} />
              </div>
            </label>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : "Send reset link"}
            </button>
          </form>
          <Link to="/login" className="link text-sm">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
