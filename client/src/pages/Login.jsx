import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../api";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Standard Login
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { data } = await API.post("/api/auth/login", form);

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data._id);
      localStorage.setItem("role", data.role || "user");
      localStorage.setItem("userName", data.name);

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid credentials. Please check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  // Google Login
  const handleGoogleAuth = async (googleName, googleEmail) => {
    setError("");
    setGoogleLoading(true);

    try {
      const { data } = await API.post("/api/auth/google", {
        name: googleName,
        email: googleEmail,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data._id);
      localStorage.setItem("role", data.role || "user");
      localStorage.setItem("userName", data.name);

      setShowGoogleModal(false);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Google registration failed."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070B] text-white flex items-center justify-center p-4 md:p-8 relative overflow-hidden">

      {/* Background Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl bg-[#0F0F17]/90 border border-gray-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12 relative z-10">

        {/* Left Section */}
        <div className="lg:col-span-5 bg-gradient-to-br from-red-950/40 via-gray-900 to-[#07070B] p-8 md:p-10 flex flex-col justify-between hidden lg:flex border-r border-gray-800/80">

          {/* Brand */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center gap-3 group mb-8"
            >
              <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-110 transition">
                <span className="text-white font-black text-lg">
                  X
                </span>
              </div>

              <span className="text-xl font-black tracking-tight text-white">
                Xavier
                <span className="text-red-500">
                  Cinema
                </span>
              </span>
            </Link>

            <div className="space-y-4">

              <span className="inline-block bg-red-600/20 border border-red-500/30 text-red-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                VIP Cinema Access
              </span>

              <h2 className="text-3xl font-extrabold leading-tight text-white">
                Experience Cinema Like Never Before.
              </h2>

              <p className="text-xs text-gray-400 leading-relaxed">
                Sign in to manage your movie tickets, access digital
                QR passes, order express snacks, and unlock member
                discounts.
              </p>

            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 pt-6 border-t border-gray-800/80 text-xs">

            <div className="flex items-center gap-3 text-gray-300">
              <span className="text-red-500 font-bold">
                ✓
              </span>
              Instant Seat Reservation
            </div>

            <div className="flex items-center gap-3 text-gray-300">
              <span className="text-red-500 font-bold">
                ✓
              </span>
              Express Snack Counter QR Pass
            </div>

            <div className="flex items-center gap-3 text-gray-300">
              <span className="text-red-500 font-bold">
                ✓
              </span>
              0% Convenience Fee Coupons
            </div>

          </div>
        </div>

        {/* Right Section */}
        <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-center">

          {/* Mobile Brand */}
          <div className="lg:hidden flex items-center gap-2 mb-6">

            <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-black">
                X
              </span>
            </div>

            <span className="text-lg font-black text-white">
              Xavier
              <span className="text-red-500">
                Cinema
              </span>
            </span>

          </div>

          {/* Header */}
          <div className="mb-8">

            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Welcome Back
            </h1>

            <p className="text-xs md:text-sm text-gray-400 mt-1">
              Enter your account credentials or continue with Google
            </p>

          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-950/60 border border-red-800 text-red-300 rounded-2xl px-4 py-3 mb-6 text-xs flex items-center justify-between">

              <span>
                {error}
              </span>

              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-white font-bold text-sm"
              >
                X
              </button>

            </div>
          )}

          {/* Google Login */}
          <button
            type="button"
            disabled={googleLoading}
            onClick={() => setShowGoogleModal(true)}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3.5 px-4 rounded-2xl transition duration-200 flex items-center justify-center gap-3 shadow-lg text-sm mb-6 border border-gray-200"
          >
            <span className="font-bold text-lg">
              G
            </span>

            {googleLoading
              ? "Signing in with Google..."
              : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center mb-6">

            <div className="border-t border-gray-800 w-full" />

            <span className="bg-[#0F0F17] px-4 text-[11px] font-bold uppercase text-gray-500 whitespace-nowrap">
              Or Sign In With Email
            </span>

            <div className="border-t border-gray-800 w-full" />

          </div>

          {/* Login Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* Email */}
            <div>

              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="name@example.com"
                className="w-full bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition placeholder-gray-600"
              />

            </div>

            {/* Password */}
            <div>

              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Password
              </label>

              <div className="relative">

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 pr-20 py-3.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition placeholder-gray-600"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-3.5 text-xs text-gray-500 hover:text-white transition"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl transition shadow-xl shadow-red-600/30 text-sm flex items-center justify-center gap-2 mt-2"
            >

              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />

                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>

                  Authenticating...
                </>
              ) : (
                "Sign In to XavierCinema"
              )}

            </button>

          </form>

          {/* Register */}
          <p className="text-center text-xs text-gray-400 mt-8">

            Don't have an account?{" "}

            <Link
              to="/register"
              className="text-red-500 hover:text-red-400 font-extrabold transition underline underline-offset-4"
            >
              Create Account
            </Link>

          </p>

        </div>
      </div>

      {/* Google Account Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">

          <div className="bg-[#111118] border border-gray-800 p-6 md:p-8 rounded-3xl max-w-md w-full text-center space-y-6 shadow-2xl relative">

            {/* Close */}
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-white text-sm"
            >
              X
            </button>

            {/* Google Logo */}
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-lg">

              <span className="text-2xl font-black text-blue-600">
                G
              </span>

            </div>

            <div>

              <h3 className="text-xl font-bold text-white">
                Sign in with Google
              </h3>

              <p className="text-xs text-gray-400 mt-1">
                Select an account or enter your Google email
              </p>

            </div>

            {/* Account 1 */}
            <div className="space-y-2.5 text-left">

              <button
                onClick={() =>
                  handleGoogleAuth(
                    "Xavier User",
                    "Xaviergoogle@gmail.com"
                  )
                }
                className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 p-3 rounded-2xl flex items-center gap-3 transition"
              >

                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-bold text-xs text-white">
                  X
                </div>

                <div>

                  <div className="text-xs font-bold text-white">
                    Xavier User
                  </div>

                  <div className="text-[10px] text-gray-400">
                    Xaviergoogle@gmail.com
                  </div>

                </div>

              </button>

              {/* Account 2 */}
              <button
                onClick={() =>
                  handleGoogleAuth(
                    "Cinema Enthusiast",
                    "xavier@gmail.com"
                  )
                }
                className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 p-3 rounded-2xl flex items-center gap-3 transition"
              >

                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                  C
                </div>

                <div>

                  <div className="text-xs font-bold text-white">
                    Cinema Enthusiast
                  </div>

                  <div className="text-[10px] text-gray-400">
                    xavier@gmail.com
                  </div>

                </div>

              </button>

            </div>

            {/* Custom Google Email */}
            <div className="pt-2 border-t border-gray-800 space-y-3">

              <input
                type="email"
                placeholder="Enter Google email"
                value={customGoogleEmail}
                onChange={(e) =>
                  setCustomGoogleEmail(e.target.value)
                }
                className="w-full bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-red-500 transition"
              />

              <button
                disabled={!customGoogleEmail.includes("@")}
                onClick={() =>
                  handleGoogleAuth(
                    customGoogleEmail.split("@")[0],
                    customGoogleEmail
                  )
                }
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold text-xs py-3 rounded-2xl transition"
              >
                Continue with Google
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}