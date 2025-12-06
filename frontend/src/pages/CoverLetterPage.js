import React, { useState, useEffect } from "react";
import axios from "axios";

export const CoverLetterPage = () => {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("cc_resume_text");
    if (saved) setResumeText(saved);
  }, []);

  const handleGenerate = async () => {
    if (!resumeText || !jobDescription) return;
    setLoading(true);
    try {
      const res = await axios.post("/coverLetter", {
        resume_text: resumeText,
        job_description: jobDescription,
        company_name: companyName || undefined,
      });
      setCoverLetter(res.data.cover_letter || "");
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert("Failed to generate cover letter");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="cover-letter-page">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white" data-testid="cover-letter-heading">
          Cover letter generator
        </h1>
        <p className="mt-1 text-xs text-slate-400" data-testid="cover-letter-subtitle">
          Paste your resume and job description to get a tailored, professional cover letter.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2" data-testid="cover-letter-input-section">
        <div className="space-y-2">
          <label
            htmlFor="resume-text"
            className="block text-[11px] font-medium text-slate-300"
            data-testid="cover-letter-resume-label"
          >
            Resume text
          </label>
          <textarea
            id="resume-text"
            rows={8}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            data-testid="cover-letter-resume-input"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="job-description"
            className="block text-[11px] font-medium text-slate-300"
            data-testid="cover-letter-job-label"
          >
            Job description
          </label>
          <textarea
            id="job-description"
            rows={8}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            data-testid="cover-letter-job-input"
          />
          <label
            htmlFor="company-name"
            className="mt-3 block text-[11px] font-medium text-slate-300"
            data-testid="cover-letter-company-label"
          >
            Company name (optional)
          </label>
          <input
            id="company-name"
            className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-400"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            data-testid="cover-letter-company-input"
          />
        </div>
      </section>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || !resumeText || !jobDescription}
        className="inline-flex items-center rounded-full bg-cyan-400 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow hover:bg-cyan-300 disabled:bg-slate-600"
        data-testid="cover-letter-generate-button"
      >
        {loading ? "Generating..." : "Generate cover letter"}
      </button>

      {coverLetter && (
        <section
          className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-xs text-slate-100 whitespace-pre-wrap"
          data-testid="cover-letter-output"
        >
          {coverLetter}
        </section>
      )}
    </div>
  );
};
