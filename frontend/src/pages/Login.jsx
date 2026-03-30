import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { Mail, Eye, EyeOff, Lock } from "lucide-react";
import API from "../API/api";
import ThemeToggle from "../components/ThemeToggle";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit } = useForm();

  // Authenticate user against API
  const onSubmit = async (data) => {
    setError("");
    setLoading(true);
    try {
      // API call initiates credentials validation
      const res = await API.post("/auth/login", data);
      
      // Update global context with incoming JWT and privilege identifiers
      login(res.data.token, res.data.role, res.data.userId, res.data.name, res.data.email);
      navigate("/");
    } catch (err) {
      setError(err.response?.data || "Login failed");
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
        <p className="text-gray-500 dark:text-gray-400 mb-6">Sign in to your account</p>

        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400 font-semibold">Email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={18} />
              <input
                {...register("email")}
                className="w-full pl-10 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 outline-none bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-200"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400 font-semibold">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="w-full pl-10 pr-10 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 outline-none bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-200"
                placeholder="••••••"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 cursor-pointer text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full bg-indigo-600 dark:bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition duration-200"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          Don’t have an account?{" "}
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;