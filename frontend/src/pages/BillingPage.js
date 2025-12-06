import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const fetchSubscription = async () => {
  const res = await axios.get("/user/overview");
  return { plan: res.data.plan || "free" };
};

export const BillingPage = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["subscription"], queryFn: fetchSubscription });

  const mutation = useMutation({
    mutationFn: (plan) => axios.post("/stripe/create-checkout-session", { plan }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  const currentPlan = data?.plan || "free";

  return (
    <div className="space-y-6" data-testid="billing-page">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white" data-testid="billing-heading">
          Billing & plan
        </h1>
        <p className="mt-1 text-xs text-slate-400" data-testid="billing-subtitle">
          Manage your CareerCraft AI plan. Payments are running in demo mode.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2" data-testid="billing-cards">
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-slate-300">Current plan</p>
            <p className="mt-2 text-2xl font-semibold text-white" data-testid="billing-current-plan">
              {currentPlan === "pro" ? "Pro" : "Free"}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Unlimited AI tools on Pro. Free plan includes limited monthly runs.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-cyan-300">Pro (Demo)</p>
            <p className="mt-2 text-2xl font-semibold text-white">$19<span className="text-xs text-slate-300"> /month</span></p>
            <p className="mt-1 text-[11px] text-slate-200">
              Billing is currently running in demo mode with no real charges.
            </p>
          </div>
          <button
            type="button"
            onClick={() => mutation.mutate("pro")}
            disabled={mutation.isPending}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-cyan-400 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-md hover:bg-cyan-300 disabled:bg-slate-600"
            data-testid="billing-upgrade-button"
          >
            {mutation.isPending ? "Creating demo session..." : "Upgrade to Pro (demo)"}
          </button>
        </div>
      </section>
    </div>
  );
};
