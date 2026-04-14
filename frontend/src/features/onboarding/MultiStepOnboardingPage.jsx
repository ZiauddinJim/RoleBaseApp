/**
 * 3-step registration: each "Next" POSTs /onboarding/draft; final creates user + emails User ID.
 * CAUSE: localStorage DRAFT_KEY survives refresh; server draft expires after 7 days.
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import API from "../../API/api";
import ThemeToggle from "../../components/ThemeToggle";
import Swal from "sweetalert2";

const DRAFT_KEY = "onboarding_draft_token";

export default function MultiStepOnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [draftToken, setDraftToken] = useState(() => localStorage.getItem(DRAFT_KEY) || "");
  const [loading, setLoading] = useState(false);
  const form1 = useForm({ defaultValues: { fullName: "", email: "" } });
  const form2 = useForm({ defaultValues: { company: "", department: "" } });
  const form3 = useForm({ defaultValues: { bio: "", goals: "", password: "", confirm: "" } });

  const loadDraft = useCallback(async () => {
    const t = localStorage.getItem(DRAFT_KEY);
    if (!t) return;
    try {
      const { data } = await API.get(`/onboarding/draft/${t}`);
      if (data.step1Json) {
        const s1 = JSON.parse(data.step1Json);
        form1.reset(s1);
      }
      if (data.step2Json) {
        const s2 = JSON.parse(data.step2Json);
        form2.reset(s2);
      }
      if (data.step3Json) {
        const s3 = JSON.parse(data.step3Json);
        form3.reset({ ...form3.getValues(), ...s3 });
      }
    } catch {
      localStorage.removeItem(DRAFT_KEY);
      setDraftToken("");
    }
  }, [form1, form2, form3]);

  useEffect(() => {
    loadDraft();
  }, [loadDraft]);

  const saveStep = async (n, data) => {
    setLoading(true);
    try {
      const res = await API.post("/onboarding/draft", {
        draftToken: draftToken || undefined,
        step: n,
        data,
      });
      const next = res.data.draftToken;
      setDraftToken(next);
      localStorage.setItem(DRAFT_KEY, next);
      return true;
    } catch (err) {
      Swal.fire({ icon: "error", title: "Could not save step", text: err.response?.data || "" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const nextFrom1 = async () => {
    const v = form1.getValues();
    if (!v.fullName?.trim() || !v.email?.trim()) {
      Swal.fire({ icon: "warning", title: "Fill name and email" });
      return;
    }
    if (await saveStep(1, v)) setStep(2);
  };

  const nextFrom2 = async () => {
    const v = form2.getValues();
    if (await saveStep(2, v)) setStep(3);
  };

  const submitFinal = async () => {
    const v3 = form3.getValues();
    if (!v3.password || v3.password.length < 6) {
      Swal.fire({ icon: "warning", title: "Password min 6 characters" });
      return;
    }
    if (v3.password !== v3.confirm) {
      Swal.fire({ icon: "warning", title: "Passwords do not match" });
      return;
    }
    const { password, confirm, ...rest } = v3;
    if (!(await saveStep(3, rest))) return;

    const token = localStorage.getItem(DRAFT_KEY);
    if (!token) {
      Swal.fire({ icon: "error", title: "Draft missing" });
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/onboarding/complete", {
        draftToken: token,
        password,
        confirmPassword: confirm,
      });
      localStorage.removeItem(DRAFT_KEY);
      await Swal.fire({
        icon: "success",
        title: "Account created",
        html: `<p>Your User ID:</p><p class="font-mono font-bold">${res.data.publicUserId}</p><p>Check your email for details.</p>`,
      });
      navigate("/login");
    } catch (err) {
      Swal.fire({ icon: "error", title: "Complete failed", text: err.response?.data || "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="max-w-xl mx-auto pt-8">
        <div className="card bg-base-100 shadow-xl border border-base-300">
          <div className="card-body">
            <h1 className="text-2xl font-bold text-primary">Registration</h1>
            <p className="text-sm opacity-70">3 steps — data is saved on the server as you go.</p>
            <ul className="steps steps-horizontal w-full my-4">
              <li className={`step ${step >= 1 ? "step-primary" : ""}`}>You</li>
              <li className={`step ${step >= 2 ? "step-primary" : ""}`}>Organization</li>
              <li className={`step ${step >= 3 ? "step-primary" : ""}`}>Profile & password</li>
            </ul>

            {step === 1 && (
              <div className="flex flex-col gap-3">
                <label className="form-control">
                  <span className="label-text">Full name</span>
                  <input className="input input-bordered" {...form1.register("fullName", { required: true })} />
                </label>
                <label className="form-control">
                  <span className="label-text">Email</span>
                  <input type="email" className="input input-bordered" {...form1.register("email", { required: true })} />
                </label>
                <button type="button" className="btn btn-primary" onClick={nextFrom1} disabled={loading}>
                  {loading ? <span className="loading loading-spinner" /> : "Next"}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="flex flex-col gap-3">
                <label className="form-control">
                  <span className="label-text">Company</span>
                  <input className="input input-bordered" {...form2.register("company")} />
                </label>
                <label className="form-control">
                  <span className="label-text">Department</span>
                  <input className="input input-bordered" {...form2.register("department")} />
                </label>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                    Back
                  </button>
                  <button type="button" className="btn btn-primary flex-1" onClick={nextFrom2} disabled={loading}>
                    Next
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-3">
                <label className="form-control">
                  <span className="label-text">Bio</span>
                  <textarea className="textarea textarea-bordered h-24" {...form3.register("bio")} />
                </label>
                <label className="form-control">
                  <span className="label-text">Goals</span>
                  <textarea className="textarea textarea-bordered h-24" {...form3.register("goals")} />
                </label>
                <label className="form-control">
                  <span className="label-text">Password</span>
                  <input type="password" className="input input-bordered" {...form3.register("password", { required: true })} />
                </label>
                <label className="form-control">
                  <span className="label-text">Confirm password</span>
                  <input type="password" className="input input-bordered" {...form3.register("confirm", { required: true })} />
                </label>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-ghost" onClick={() => setStep(2)}>
                    Back
                  </button>
                  <button type="button" className="btn btn-primary flex-1" onClick={submitFinal} disabled={loading}>
                    {loading ? <span className="loading loading-spinner" /> : "Create account"}
                  </button>
                </div>
              </div>
            )}

            <Link to="/login" className="link text-sm mt-4">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
