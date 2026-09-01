import React, { useEffect, useState } from "react";

const ADMIN_PASSWORD = "Fear@123";

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
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-violet-500/30 selection:text-violet-200">
        {/* Admin Header */}
        <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-2xl transition-all">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Brand */}
              <div className="flex items-center gap-3.5">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-500 shadow-md shadow-violet-500/25 ring-1 ring-white/20">
                  <span className="text-lg leading-none">⚡</span>
                </div>

                <div>
                  <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">
                    Admin Portal
                  </h1>

                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                      Control Center
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-4">
                <div className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 shadow-sm sm:flex">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-xs font-semibold tracking-wide text-emerald-400">
                    Admin Active
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="group flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-300 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 active:scale-95"
                >
                  <svg
                    className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 font-sans selection:bg-violet-500/30 selection:text-violet-200">
      {/* Dynamic Background Glow & Grid */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-fuchsia-600/10 blur-[100px]" />
        <div className="absolute right-10 top-10 h-72 w-72 rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="relative rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          
          {/* Subtle Inner Glow Border */}
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />

          {/* Header & Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 shadow-inner">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-fuchsia-500 text-2xl shadow-lg shadow-violet-500/30 ring-1 ring-white/30">
                
              </div>
            </div>

            <span className="inline-block rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-violet-300">
              Restricted Access
            </span>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Admin Portal
            </h1>

            <p className="mx-auto mt-2 max-w-xs text-xs font-medium leading-relaxed text-slate-400">
              Please enter your security password to access the control panel.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Access Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setMessage("");
                  }}
                  autoComplete="current-password"
                  className={`w-full rounded-xl border bg-slate-950/80 px-4 py-3.5 pr-12 text-sm text-white transition-all placeholder:text-slate-600 focus:outline-none ${
                    message
                      ? "border-red-500/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      : "border-slate-800 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.959 8.959 0 013.682-.796c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m-6.115-2.631a3 3 0 10-4.243-4.243" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {message && (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-red-400">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs font-medium">{message}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all duration-200 hover:shadow-violet-600/40 hover:brightness-110 active:scale-[0.99]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Access Dashboard
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </button>
          </form>

          {/* Footer Back Button */}
          <div className="mt-6 border-t border-slate-800/80 pt-5">
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium text-slate-400 transition hover:bg-slate-800/50 hover:text-slate-200"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <p className="mt-6 text-center text-[11px] leading-5 text-slate-500">
          Authorized administrators only. System activity may be logged.
        </p>
      </div>
    </div>
  );
}