import React, { useEffect, useState } from "react";

const ADMIN_PASSWORD = "Fearless@123";

export default function AdminGate({ children }) {
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedAccess = sessionStorage.getItem("lavender_admin_access");

    if (savedAccess === "granted") {
      setAuthorized(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("lavender_admin_access", "granted");
      setAuthorized(true);
      setPassword("");
      setMessage("");
    } else {
      setMessage("Invalid password. Please try again.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("lavender_admin_access");
    setAuthorized(false);
    setPassword("");
    setMessage("");

    window.location.href = "/admin";
  };

  // ==============================
  // AUTHORIZED ADMIN AREA
  // ==============================
  if (authorized) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        {/* Admin Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Brand */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/20">
                  <span className="text-lg">⚡</span>
                </div>

                <div>
                  <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">
                    Admin Portal
                  </h1>

                  <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
                    Control Center
                  </p>
                </div>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 sm:flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]" />
                  <span className="text-xs font-semibold text-emerald-300">
                    Admin Active
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition-all duration-200 hover:border-red-400/40 hover:bg-red-500/20 hover:text-red-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Admin Content */}
        <main className="min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    );
  }

  // ==============================
  // ADMIN LOGIN GATE
  // ==============================
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-fuchsia-600/10 blur-[100px]" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-indigo-600/10 blur-[100px]" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-8">
          {/* Logo */}
          <div className="mb-7 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 shadow-lg shadow-violet-500/10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-2xl shadow-lg shadow-violet-500/30">
                ⚡
              </div>
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-violet-400">
              Restricted Area
            </p>

            <h1 className="text-3xl font-black tracking-tight text-white">
              Admin Portal
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400">
              Enter your administrator password to access the dashboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <label className="mb-2 block text-sm font-semibold text-slate-200">
              Access Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setMessage("");
                }}
                autoComplete="current-password"
                className={`w-full rounded-2xl border bg-slate-900/70 px-4 py-3.5 pr-14 text-sm text-white outline-none transition-all placeholder:text-slate-600 ${
                  message
                    ? "border-red-400/50 focus:border-red-400 focus:ring-4 focus:ring-red-400/10"
                    : "border-white/10 focus:border-violet-400/60 focus:ring-4 focus:ring-violet-500/10"
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Error */}
            {message && (
              <div className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2.5">
                <p className="text-sm font-medium text-red-300">
                  {message}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-violet-500/30 active:translate-y-0"
            >
              Access Dashboard
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
              ← Back to Home
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <p className="mt-5 text-center text-[11px] leading-5 text-slate-600">
          Authorized administrators only. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  );
}