import React from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { path: "/app/overview", label: "Overview", testId: "sidebar-link-overview" },
  { path: "/app/resume", label: "Resume", testId: "sidebar-link-resume" },
  { path: "/app/jobs", label: "Job Matcher", testId: "sidebar-link-jobs" },
  { path: "/app/cover-letters", label: "Cover Letters", testId: "sidebar-link-cover-letters" },
  { path: "/app/interview", label: "Interview Prep", testId: "sidebar-link-interview" },
  { path: "/app/emails", label: "HR Emails", testId: "sidebar-link-emails" },
  { path: "/app/billing", label: "Billing", testId: "sidebar-link-billing" },
];

export const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const active = location.pathname;

  const onLogout = () => {
    localStorage.removeItem("cc_access_token");
    localStorage.removeItem("cc_refresh_token");
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex" data-testid="user-dashboard-layout">
      <aside className="hidden md:flex md:w-60 flex-col border-r border-white/10 bg-slate-950/90">
        <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
          <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500" />
          <span className="text-sm font-semibold">CareerCraft</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 text-sm">
          {navItems.map((item) => {
            const isActive = active.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between rounded-full px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
                data-testid={item.testId}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <button
          onClick={onLogout}
          className="m-3 mb-4 rounded-full border border-white/15 px-3 py-2 text-[11px] text-slate-300 hover:bg-white/5"
          data-testid="sidebar-logout-button"
        >
          Log out
        </button>
      </aside>
      <main className="flex-1 min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">{children}</div>
      </main>
    </div>
  );
};
