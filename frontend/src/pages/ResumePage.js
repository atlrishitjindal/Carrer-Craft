import React, { useState } from "react";
import axios from "axios";

export const ResumePage = () => {
  const [parsedText, setParsedText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [improving, setImproving] = useState(false);
  const [improveResult, setImproveResult] = useState(null);

  // eslint-disable-next-line no-alert
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const res = await axios.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setParsedText(res.data.parsed_text || "");
      if (res.data.parsed_text) {
        localStorage.setItem("cc_resume_text", res.data.parsed_text);
      }
      // alerts are fine for first MVP, rule disabled intentionally

    } catch (err) {
      // eslint-disable-next-line no-alert
      alert("Failed to upload resume");
    } finally {
      setUploading(false);
    }
  };

  // eslint-disable-next-line no-alert
  const handleImprove = async () => {
    if (!parsedText) return;
    setImproving(true);
    try {
      const res = await axios.post("/improveResume", { resume_text: parsedText });
      setImproveResult(res.data);
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert("Failed to run AI improvement");
    } finally {
      setImproving(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="resume-page">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white" data-testid="resume-heading">
          Resume studio
        </h1>
        <p className="mt-1 text-xs text-slate-400" data-testid="resume-subtitle">
          Upload your resume, see the parsed text, and get AI-powered improvement suggestions.
        </p>
      </div>

      <section className="space-y-3" data-testid="resume-upload-section">
        <label
          htmlFor="resume-file"
          className="block w-full cursor-pointer rounded-2xl border border-dashed border-white/15 bg-slate-950/60 px-5 py-6 text-center text-xs text-slate-300 hover:border-cyan-400/60"
          data-testid="resume-upload-dropzone"
        >
          <span className="block font-medium mb-1">Drag & drop your resume, or click to browse</span>
          <span className="block text-[11px] text-slate-500">PDF, DOCX, or TXT up to 10MB</span>
          <input
            id="resume-file"
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
            data-testid="resume-upload-input"
          />
        </label>
        {parsedText && (
          <textarea
            className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-xs text-slate-200 outline-none focus:border-cyan-400 min-h-[300px]"
            data-testid="resume-parsed-text"
            value={parsedText}
            onChange={(e) => setParsedText(e.target.value)}
          />
        )}
        <button
          type="button"
          onClick={handleImprove}
          disabled={!parsedText || improving}
          className="inline-flex items-center rounded-full bg-cyan-400 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600"
          data-testid="resume-improve-button"
        >
          {improving ? "Analyzing..." : "Run AI resume improvement"}
        </button>
      </section>

      {improveResult && (
        <section className="grid gap-4 md:grid-cols-3" data-testid="resume-improvement-section">
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4 text-xs text-emerald-50">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide mb-2">Strengths</h2>
            <ul className="space-y-1" data-testid="resume-strengths-list">
              {(improveResult.strengths || []).map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-xs text-amber-50">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide mb-2">Areas to improve</h2>
            <ul className="space-y-1" data-testid="resume-weaknesses-list">
              {(improveResult.weaknesses || []).map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-cyan-500/40 bg-cyan-500/5 p-4 text-xs text-cyan-50">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide mb-2">Suggested keywords</h2>
            <div className="flex flex-wrap gap-1" data-testid="resume-keywords-list">
              {(improveResult.keyword_recommendations || []).map((k, idx) => (
                <span
                  key={idx}
                  className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[11px]"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
