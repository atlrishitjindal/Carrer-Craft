import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchEmails = async () => {
  const res = await axios.get("/emails");
  return res.data;
};

export const EmailsPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["emails"],
    queryFn: fetchEmails,
  });

  if (isLoading) {
    return (
      <div data-testid="emails-loading" className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-slate-900 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        data-testid="emails-error"
      >
        Unable to load your HR email history.
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="emails-page">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white" data-testid="emails-heading">
          HR email tracker
        </h1>
        <p className="mt-1 text-xs text-slate-400" data-testid="emails-subtitle">
          Centralize recruiter and hiring manager communication logs.
        </p>
      </div>
      {data && data.length > 0 ? (
        <ul className="space-y-3" data-testid="emails-list">
          {data.map((email) => (
            <li
              key={email.id}
              className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-slate-100"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium" data-testid="emails-subject">
                  {email.email_subject}
                </p>
                <span className="text-[11px] text-slate-400" data-testid="emails-received-at">
                  {new Date(email.received_at).toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-slate-300" data-testid="emails-body">
                {email.email_body}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-slate-400" data-testid="emails-empty">
          No HR emails logged yet.
        </p>
      )}
    </div>
  );
};
