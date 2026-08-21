import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: "⌂" },
    { label: "Movies", path: "/admin/movies", icon: "🎬" },
    { label: "Shows", path: "/admin/shows", icon: "◷" },
    { label: "Snacks", path: "/admin/snacks", icon: "🍿" },
    { label: "Parking", path: "/admin/parking", icon: "P" },
    { label: "Analytics", path: "/admin/analytics", icon: "▥" },
    { label: "Scanner", path: "/admin/scan", icon: "⌗" },
    { label: "IoT", path: "/admin/iot", icon: "◉" },
  ];

  const isActive = (path) => {
    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 text-white shadow-2xl backdrop-blur-xl">

      {/* Main Header */}
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-4">

          {/* Brand */}
          <Link
            to="/admin/dashboard"
            className="group flex shrink-0 items-center gap-3"
          >
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 shadow-lg shadow-violet-600/20 transition-transform duration-200 group-hover:scale-105">
              <span className="text-sm font-black tracking-tight">
                CB
              </span>

              <div className="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-100" />
            </div>

            <div className="hidden sm:block">
              <h1 className="text-base font-black tracking-tight text-white lg:text-lg">
                CineBook Studio
              </h1>

              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-violet-400">
                Management Portal
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center gap-1.5 rounded-2xl border border-white/5 bg-white/[0.03] p-1.5">
            {navItems.map((item) => {
              const active = isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/20"
                      : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <span
                    className={`text-sm transition-transform duration-200 ${
                      active
                        ? "scale-110"
                        : "opacity-70 group-hover:scale-110 group-hover:opacity-100"
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span>{item.label}</span>

                  {active && (
                    <span className="absolute -bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-violet-300" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Status */}
            <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>

              <span className="text-[11px] font-bold text-emerald-300">
                System Active
              </span>
            </div>

            {/* Main Website */}
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-bold text-slate-200 transition-all duration-200 hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-white sm:px-4"
            >
              <span className="hidden sm:inline">Main Site</span>
              <span className="sm:hidden">Site</span>
            </button>
          </div>
        </div>

        {/* Tablet / Mobile Navigation */}
        <div className="xl:hidden -mx-1 flex gap-2 overflow-x-auto px-1 pb-3 pt-1 scrollbar-none">
          {navItems.map((item) => {
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all duration-200 ${
                  active
                    ? "border-violet-400/30 bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/20"
                    : "border-white/5 bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <span className="text-sm">
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}