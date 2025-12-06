import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchOverview = async () => {
  const res = await axios.get("/user/overview");
  return res.data;
};

export const UserOverviewPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["user-overview"],
    queryFn: fetchOverview,
  });

  if (isLoading) {
    return (
      <div data-testid="user-overview-loading" className="space-y-4">
        <div className="h-7 w-40 rounded bg-slate-800 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-900 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        data-testid="user-overview-error"
      >
        Unable to load your dashboard overview.
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="user-overview-page">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white" data-testid="user-overview-heading">
            Your career cockpit
          </h1>
          <p className="mt-1 text-xs text-slate-400" data-testid="user-overview-subtitle">
            Track resume health, applications, and interviews powered by CareerCraft AI.
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4" data-testid="user-overview-kpi-grid">
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
          <p className="text-[11px] text-slate-400">Resumes uploaded</p>
          <p className="mt-2 text-2xl font-semibold text-white" data-testid="overview-resume-count">
            {data.resume_count ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
          <p className="text-[11px] text-slate-400">Latest ATS score</p>
          <p className="mt-2 text-2xl font-semibold" data-testid="overview-ats-score">
            {data.latest_ats_score ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
          <p className="text-[11px] text-slate-400">Applications</p>
          <p className="mt-2 text-2xl font-semibold" data-testid="overview-application-count">
            {data.application_count ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
          <p className="text-[11px] text-slate-400">Interviews</p>
          <p className="mt-2 text-2xl font-semibold" data-testid="overview-interview-count">
            {data.interview_count ?? 0}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-950/80 p-4" data-testid="user-overview-activity-section">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Recent activity</h2>
          <span className="text-[11px] rounded-full bg-slate-900 px-2 py-0.5 text-slate-400">
            {data.activities?.length || 0} events
          </span>
        </div>
        {data.activities && data.activities.length > 0 ? (
          <ul className="space-y-2" data-testid="user-overview-activity-list">
            {data.activities.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-900/70 px-3 py-2 text-xs text-slate-200"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{item.type}</span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400" data-testid="user-overview-activity-empty">
            No activity yet. Upload a resume or run an AI analysis to see your history here.
          </p>
        )}
      </section>
    </div>
  );
};
