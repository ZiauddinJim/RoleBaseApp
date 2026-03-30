import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { Mail, Eye, EyeOff, Lock, User } from "lucide-react";
import API from "../API/api";
import ThemeToggle from "../components/ThemeToggle";
import Swal from "sweetalert2";

const Register = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setError("");
    setLoading(true);
    try {
      await API.post("/auth/register", data);
      // Show success popup and then redirect to login
      await Swal.fire({
        icon: "success",
        title: "Account Created!",
        text: "Your account has been registered successfully. Please log in.",
        confirmButtonColor: "#4f46e5",
        background: document.documentElement.classList.contains("dark") ? "#1f2937" : "#fff",
        color: document.documentElement.classList.contains("dark") ? "#f3f4f6" : "#111827",
      });
      navigate("/login");
    } catch (err) {
      // Show error dialog
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: err.response?.data || "Could not create your account. Please try again.",
        confirmButtonColor: "#4f46e5",
        background: document.documentElement.classList.contains("dark") ? "#1f2937" : "#fff",
        color: document.documentElement.classList.contains("dark") ? "#f3f4f6" : "#111827",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 transition-colors duration-200">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-transparent dark:border-gray-700 transition-colors duration-200">
        <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">RoleBase</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Create your account</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Full Name</label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={18} />
              <input
                {...register("name", { required: "Name is required" })}
                className="w-full pl-10 pr-3 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 outline-none bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-200"
                placeholder="John Doe"
              />
            </div>
            {errors.name && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={18} />
              <input
                {...register("email", { required: "Email required" })}
                className="w-full pl-10 pr-3 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 outline-none bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-200"
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>

          {/* Role Selection - Determines privilege limits on the platform */}
          <div>
            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Select Role</label>
            <div className="relative mt-1">
              <select
                {...register("role")}
                className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 outline-none bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-200"
              >
                <option value="User" className="text-gray-900 dark:text-gray-100 dark:bg-gray-800">User</option>
                <option value="Admin" className="text-gray-900 dark:text-gray-100 dark:bg-gray-800">Admin</option>
              </select>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                  validate: {
                    hasLetter: (val) =>
                      /[a-zA-Z]/.test(val) || "Password must contain at least one letter",
                    hasNumber: (val) =>
                      /[0-9]/.test(val) || "Password must contain at least one number",
                  },
                })}
                className="w-full pl-10 pr-10 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 outline-none bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-200"
                placeholder="Min 6 chars, 1 letter, 1 number"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 cursor-pointer text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
            {errors.password && (
              <p className="text-red-500 dark:text-red-400 text-xs mt-1 flex items-center gap-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            disabled={loading}
            className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition duration-200"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;