import React, { useState } from "react";
import axios from "axios";

export const JobMatcherPage = () => {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState([]);

  // eslint-disable-next-line no-alert
  const handleMatch = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/matchJobs", {});
      setMatches(res.data.matches || []);
      // alerts are fine for first MVP, rule disabled intentionally

    } catch (err) {
      // eslint-disable-next-line no-alert
      alert("Failed to fetch matches");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="job-matcher-page">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white" data-testid="job-matcher-heading">
          Job matcher
        </h1>
        <p className="mt-1 text-xs text-slate-400" data-testid="job-matcher-subtitle">
          See how your profile aligns with posted roles and where to close the gap.
        </p>
      </div>

      <button
        type="button"
        onClick={handleMatch}
        disabled={loading}
        className="inline-flex items-center rounded-full bg-cyan-400 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow hover:bg-cyan-300 disabled:bg-slate-600"
        data-testid="job-matcher-run-button"
      >
        {loading ? "Scanning jobs..." : "Run job matching"}
      </button>

      {matches.length > 0 && (
        <section
          className="mt-4 space-y-2"
          data-testid="job-matcher-results-section"
        >
          {matches.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-xs text-slate-100 flex items-center justify-between"
            >
              <div>
                <p className="font-medium" data-testid="job-matcher-job-id">
                  Job ID: {m.id}
                </p>
                <div className="mt-1 flex flex-wrap gap-1 items-center" data-testid="job-matcher-missing-keywords">
                  <span className="text-[11px] text-slate-400 mr-1">Missing:</span>
                  {(m.missing_keywords && m.missing_keywords.length > 0) ? (
                    m.missing_keywords.map((k, idx) => (
                      <span key={idx} className="rounded-full bg-red-500/10 text-red-300 border border-red-500/20 px-1.5 py-0.5 text-[10px]">
                        {k}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-slate-500">None</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold" data-testid="job-matcher-score">
                  {m.compatibility_score ?? 0}
                </p>
                <p className="text-[11px] text-slate-400">Match score</p>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
