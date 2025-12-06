import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { DashboardLayout } from "@/components/DashboardLayout";
import { UserOverviewPage } from "@/pages/UserOverviewPage";
import { ResumePage } from "@/pages/ResumePage";
import { JobMatcherPage } from "@/pages/JobMatcherPage";
import { CoverLetterPage } from "@/pages/CoverLetterPage";
import { InterviewPrepPage } from "@/pages/InterviewPrepPage";
import { EmailsPage } from "@/pages/EmailsPage";
import { BillingPage } from "@/pages/BillingPage";
import "@/App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

axios.defaults.baseURL = API_BASE;
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("cc_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      <header className="border-b border-white/5 backdrop-blur sticky top-0 z-20 bg-slate-950/70">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500" />
            <span className="font-semibold tracking-tight text-lg">CareerCraft AI</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-slate-300">
            <a href="#features" className="hover:text-white" data-testid="nav-link-features">Features</a>
            <a href="#pricing" className="hover:text-white" data-testid="nav-link-pricing">Pricing</a>
            <a href="#how-it-works" className="hover:text-white" data-testid="nav-link-how-it-works">How it works</a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="text-sm text-slate-200 hover:text-white"
              data-testid="nav-login-btn"
            >
              Log in
            </a>
            <a
              href="/signup"
              className="inline-flex items-center rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-900 shadow-sm hover:bg-white"
              data-testid="nav-signup-btn"
            >
              Get started
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16 space-y-24">
        <section className="grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-center">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur" data-testid="hero-badge">
              AI-Powered Career OS for ambitious professionals
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-white" data-testid="hero-title">
              Craft a career that passes every filter.
            </h1>
            <p className="max-w-xl text-slate-300 text-base md:text-lg" data-testid="hero-subtitle">
              CareerCraft AI analyzes your resume, maps your skills to real jobs, and automates
              applications with ATS-ready resumes, tailored cover letters, and interview prep.
            </p>
            <div className="flex flex-wrap items-center gap-4" data-testid="hero-cta-group">
              <a
                href="/signup"
                className="inline-flex items-center rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/30 hover:bg-cyan-300"
                data-testid="hero-primary-cta"
              >
                Start free – no card required
              </a>
              <a
                href="#features"
                className="inline-flex items-center rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-slate-100 hover:bg-white/5"
                data-testid="hero-secondary-cta"
              >
                Explore features
              </a>
            </div>
          </div>
          <div
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950/80 p-6 shadow-2xl shadow-cyan-500/20"
            data-testid="hero-dashboard-preview"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-slate-300">Resume Health</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-300">Live</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="rounded-2xl bg-slate-900/80 border border-white/5 p-3">
                <p className="text-[11px] text-slate-400">ATS Score</p>
                <p className="mt-1 text-xl font-semibold text-emerald-300" data-testid="hero-ats-score">87</p>
                <p className="mt-1 text-[11px] text-emerald-400">Top 5% in your industry</p>
              </div>
              <div className="rounded-2xl bg-slate-900/80 border border-white/5 p-3">
                <p className="text-[11px] text-slate-400">Active Applications</p>
                <p className="mt-1 text-xl font-semibold" data-testid="hero-app-count">14</p>
                <p className="mt-1 text-[11px] text-slate-400">3 interviews scheduled</p>
              </div>
              <div className="rounded-2xl bg-slate-900/80 border border-white/5 p-3">
                <p className="text-[11px] text-slate-400">Skill Match</p>
                <p className="mt-1 text-xl font-semibold" data-testid="hero-skill-score">92%</p>
                <p className="mt-1 text-[11px] text-slate-400">for Product Manager roles</p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <p>“Add impact metrics to your lead projects to increase recruiter engagement.”</p>
              <p className="text-slate-400">+ 18% interview rate after optimization</p>
            </div>
          </div>
        </section>

        <section id="features" className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold text-white" data-testid="features-title">Everything you need for a modern job hunt</h2>
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5" data-testid="feature-resume-ai">
              <p className="text-xs font-medium text-cyan-300">AI Resume Studio</p>
              <p className="mt-2 text-sm font-semibold text-white">Upload, parse, and perfect your resume</p>
              <p className="mt-2 text-xs text-slate-300">
                Drag & drop your resume, get ATS-safe rewrites, structure fixes, and missing section
                suggestions in seconds.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5" data-testid="feature-job-matcher">
              <p className="text-xs font-medium text-violet-300">Job Matcher</p>
              <p className="mt-2 text-sm font-semibold text-white">Real jobs, real matching scores</p>
              <p className="mt-2 text-xs text-slate-300">
                Map your profile to live roles, see compatibility by skill & keyword coverage, and
                tailor each application.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5" data-testid="feature-interview-coach">
              <p className="text-xs font-medium text-amber-300">Interview Coach</p>
              <p className="mt-2 text-sm font-semibold text-white">Prep like you already have the offer</p>
              <p className="mt-2 text-xs text-slate-300">
                AI-generated questions, model answers, and HR email tracking so you never lose the
                thread.
              </p>
            </div>
          </div>
        </section>

        <section id="pricing" className="space-y-6">
          <h2 className="text-xl md:text-2xl font-semibold text-white" data-testid="pricing-title">Simple, transparent pricing</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 flex flex-col justify-between" data-testid="pricing-free-card">
              <div>
                <p className="text-xs font-medium text-slate-300">Starter</p>
                <p className="mt-2 text-2xl font-semibold text-white">Free</p>
                <p className="mt-1 text-xs text-slate-400">Perfect to explore CareerCraft AI</p>
                <ul className="mt-3 space-y-1 text-xs text-slate-300">
                  <li>• 3 AI resume improvements / month</li>
                  <li>• Basic skills-gap analysis</li>
                  <li>• Up to 10 job matches</li>
                </ul>
              </div>
              <a
                href="/signup"
                className="mt-4 inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-1.5 text-xs font-medium text-slate-100 hover:bg-white/5"
                data-testid="pricing-free-cta"
              >
                Get started
              </a>
            </div>
            <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 p-5 flex flex-col justify-between" data-testid="pricing-pro-card">
              <div>
                <p className="text-xs font-medium text-cyan-300">Pro (Demo)</p>
                <p className="mt-2 text-2xl font-semibold text-white">$19<span className="text-xs text-slate-300"> /month</span></p>
                <p className="mt-1 text-xs text-slate-200">All features unlocked – billing in demo mode</p>
                <ul className="mt-3 space-y-1 text-xs text-slate-100">
                  <li>• Unlimited AI resume improvements</li>
                  <li>• Advanced market & job insights</li>
                  <li>• Auto-apply & HR email tracking</li>
                </ul>
              </div>
              <a
                href="/login"
                className="mt-4 inline-flex items-center justify-center rounded-full bg-cyan-400 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-md hover:bg-cyan-300"
                data-testid="pricing-pro-cta"
              >
                Upgrade inside dashboard
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const AuthPageLayout = ({ children, title, subtitle }) => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-xl shadow-cyan-500/10">
      <h1 className="text-xl font-semibold text-white" data-testid="auth-title">{title}</h1>
      {subtitle && <p className="mt-1 text-xs text-slate-400" data-testid="auth-subtitle">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  </div>
);

const LoginPage = () => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    try {
      const res = await axios.post("/auth/login", { email, password });
      localStorage.setItem("cc_access_token", res.data.access_token);
      localStorage.setItem("cc_refresh_token", res.data.refresh_token);
      window.location.href = "/app/overview";
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert("Login failed");
    }
  };

  return (
    <AuthPageLayout
      title="Welcome back"
      subtitle="Sign in to access your CareerCraft AI dashboard."
    >
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-xs font-medium text-slate-200"
            data-testid="login-form-email-label"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            data-testid="login-form-email-input"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="password"
            className="block text-xs font-medium text-slate-200"
            data-testid="login-form-password-label"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            data-testid="login-form-password-input"
          />
        </div>
        <button
          type="submit"
          className="mt-2 w-full rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow hover:bg-cyan-300"
          data-testid="login-form-submit-button"
        >
          Continue
        </button>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3">
          <a href="/forgot-password" className="hover:text-slate-200" data-testid="login-forgot-password-link">
            Forgot password?
          </a>
          <a href="/signup" className="hover:text-slate-200" data-testid="login-signup-link">
            Create an account
          </a>
        </div>
      </form>
    </AuthPageLayout>
  );
};

const SignupPage = () => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");
    const role = formData.get("role");
    try {
      await axios.post("/auth/signup", { email, password, role });
      window.location.href = "/login";
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert("Signup failed");
    }
  };

  return (
    <AuthPageLayout
      title="Create your CareerCraft AI account"
      subtitle="Sign up as a candidate, employer, or admin."
    >
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="signup-form">
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-xs font-medium text-slate-200"
            data-testid="signup-form-email-label"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            data-testid="signup-form-email-input"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="password"
            className="block text-xs font-medium text-slate-200"
            data-testid="signup-form-password-label"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            data-testid="signup-form-password-input"
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="role"
            className="block text-xs font-medium text-slate-200"
            data-testid="signup-form-role-label"
          >
            Role
          </label>
          <select
            id="role"
            name="role"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
            data-testid="signup-form-role-select"
          >
            <option value="user">Candidate</option>
            <option value="employer">Employer</option>
          </select>
        </div>
        <button
          type="submit"
          className="mt-2 w-full rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow hover:bg-cyan-300"
          data-testid="signup-form-submit-button"
        >
          Create account
        </button>
        <p className="mt-3 text-[11px] text-slate-400">
          Already have an account?{" "}
          <a href="/login" className="hover:text-slate-200" data-testid="signup-login-link">
            Log in
          </a>
        </p>
      </form>
    </AuthPageLayout>
  );
};

const ForgotPasswordPage = () => (
  <AuthPageLayout
    title="Reset your password"
    subtitle="Enter your email and we’ll send a reset link (demo only)."
  >
    <form className="space-y-4" data-testid="forgot-form">
      <div className="space-y-1">
        <label
          htmlFor="email"
          className="block text-xs font-medium text-slate-200"
          data-testid="forgot-form-email-label"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
          data-testid="forgot-form-email-input"
        />
      </div>
      <button
        type="submit"
        className="mt-2 w-full rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow hover:bg-cyan-300"
        data-testid="forgot-form-submit-button"
      >
        Send reset link
      </button>
    </form>
  </AuthPageLayout>
);

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("cc_access_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const UserDashboardRoutes = () => (
  <DashboardLayout>
    <Routes>
      <Route path="overview" element={<UserOverviewPage />} />
      <Route path="resume" element={<ResumePage />} />
      <Route path="jobs" element={<JobMatcherPage />} />
      <Route path="cover-letters" element={<CoverLetterPage />} />
      <Route path="interview" element={<InterviewPrepPage />} />
      <Route path="emails" element={<EmailsPage />} />
      <Route path="billing" element={<BillingPage />} />
      <Route path="*" element={<Navigate to="overview" replace />} />
    </Routes>
  </DashboardLayout>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/app/*"
            element={(
              <ProtectedRoute>
                <UserDashboardRoutes />
              </ProtectedRoute>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
