import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import API from "../api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /* STANDARD REGISTRATION */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Please enter your full name.");
    if (!form.email.trim()) return setError("Please enter your email address.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);

    try {
      const { data } = await API.post("/api/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data._id);
      localStorage.setItem("role", data.role || "user");
      localStorage.setItem("userName", data.name);

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* REAL GOOGLE OAUTH SUCCESS HANDLER */
  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setGoogleLoading(true);

    try {
      // Send Google credential token directly to backend for validation
      const { data } = await API.post("/api/auth/google", {
        token: credentialResponse.credential,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data._id);
      localStorage.setItem("role", data.role || "user");
      localStorage.setItem("userName", data.name);

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Google authentication failed on server."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070B] text-white flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl bg-[#0F0F17]/90 border border-gray-800/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* LEFT HERO SECTION */}
        <div className="lg:col-span-5 relative bg-gradient-to-br from-red-950/40 via-gray-900 to-[#07070B] p-8 md:p-10 flex flex-col justify-between hidden lg:flex border-r border-gray-800/80">
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 group mb-8">
              <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-110 transition">
                <span className="text-white font-black text-sm">XC</span>
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                Xavier<span className="text-red-500">Cinema</span>
              </span>
            </Link>

            <div className="space-y-4">
              <span className="bg-red-600/20 border border-red-500/30 text-red-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Free Registration
              </span>
              <h2 className="text-3xl font-extrabold leading-tight text-white">
                Join XavierCinema Today.
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Create your XavierCinema account to manage tickets, save bookings, access digital passes, and enjoy a seamless movie booking experience.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-3 pt-6 border-t border-gray-800/80 text-xs">
            <div className="flex items-center gap-3 text-gray-300">
              <span className="text-red-500 font-bold">01</span> Instant Account Registration
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <span className="text-red-500 font-bold">02</span> Saved Ticket and Snack Passes
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <span className="text-red-500 font-bold">03</span> Exclusive Movie Access
            </div>
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="lg:col-span-7 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-6">
            <div className="lg:hidden flex items-center gap-2 mb-5">
              <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-black text-xs">XC</span>
              </div>
              <span className="text-lg font-black text-white">
                Xavier<span className="text-red-500">Cinema</span>
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white">
              Create Your Account
            </h1>
            <p className="text-xs md:text-sm text-gray-400 mt-1">
              Register with your Google account or email address
            </p>
          </div>

          {/* ERROR ALERT */}
          {error && (
            <div className="bg-red-950/60 border border-red-800 text-red-300 rounded-2xl px-4 py-3 mb-6 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>
          )}

          {/* PRODUCTION GOOGLE AUTH BUTTON */}
          <div className="mb-6 flex justify-center">
            {googleLoading ? (
              <div className="text-xs text-gray-400">Authenticating with Google...</div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google Sign-In failed.")}
                theme="filled_dark"
                shape="pill"
                width="100%"
              />
            )}
          </div>

          {/* DIVIDER */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="border-t border-gray-800 w-full" />
            <span className="bg-[#0F0F17] px-4 text-[11px] font-bold uppercase text-gray-500 whitespace-nowrap">
              Or Register With Email
            </span>
            <div className="border-t border-gray-800 w-full" />
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className="w-full bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition placeholder-gray-600"
              />
            </div>

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="Minimum 6 characters"
                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 pr-12 py-3.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition placeholder-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-xs text-gray-500 hover:text-white transition"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirm"
                  value={form.confirm}
                  onChange={handleChange}
                  required
                  placeholder="Repeat password"
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition placeholder-gray-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl transition shadow-xl shadow-red-600/30 text-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? "Creating Account..." : "Create XavierCinema Account"}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-red-500 hover:text-red-400 font-extrabold transition underline underline-offset-4"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}