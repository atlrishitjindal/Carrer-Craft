import React, { useState, useEffect } from "react";
import axios from "axios";

export const InterviewPrepPage = () => {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  useEffect(() => {
    const saved = localStorage.getItem("cc_resume_text");
    if (saved) setResumeText(saved);
  }, []);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleGenerate = async () => {
    if (!resumeText || !jobDescription) return;
    setLoading(true);
    try {
      const res = await axios.post("/interviewQuestions", {
        resume_text: resumeText,
        job_description: jobDescription,
      });
      setData(res.data);
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert("Failed to generate interview prep");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="interview-prep-page">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white" data-testid="interview-prep-heading">
          Interview prep coach
        </h1>
        <p className="mt-1 text-xs text-slate-400" data-testid="interview-prep-subtitle">
          Turn your resume and job description into targeted questions and talking points.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2" data-testid="interview-prep-input-section">
        <div className="space-y-2">
          <label
            htmlFor="resume-text"
            className="block text-[11px] font-medium text-slate-300"
            data-testid="interview-prep-resume-label"
          >
            Resume text
          </label>
          <textarea
            id="resume-text"
            rows={8}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            data-testid="interview-prep-resume-input"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="job-description"
            className="block text-[11px] font-medium text-slate-300"
            data-testid="interview-prep-job-label"
          >
            Job description
          </label>
          <textarea
            id="job-description"
            rows={8}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            data-testid="interview-prep-job-input"
          />
        </div>
      </section>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || !resumeText || !jobDescription}
        className="inline-flex items-center rounded-full bg-cyan-400 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow hover:bg-cyan-300 disabled:bg-slate-600"
        data-testid="interview-prep-generate-button"
      >
        {loading ? "Generating..." : "Generate interview prep"}
      </button>

      {data && (
        <section className="grid gap-4 md:grid-cols-3" data-testid="interview-prep-output-section">
          <div className="rounded-2xl border border-violet-500/40 bg-violet-500/5 p-4 text-xs text-violet-50">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide mb-2">Behavioral</h2>
            <ul className="space-y-1" data-testid="interview-prep-behavioral-list">
              {(data.behavioral_questions || []).map((q, idx) => (
                <li key={idx}>• {q}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4 text-xs text-emerald-50">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide mb-2">Technical</h2>
            <ul className="space-y-1" data-testid="interview-prep-technical-list">
              {(data.technical_questions || []).map((q, idx) => (
                <li key={idx}>• {q}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-cyan-500/40 bg-cyan-500/5 p-4 text-xs text-cyan-50">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide mb-2">Suggested answers</h2>
            <ul className="space-y-1" data-testid="interview-prep-answers-list">
              {(data.suggested_answers || []).map((a, idx) => (
                <li key={idx}>• {a}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
};
