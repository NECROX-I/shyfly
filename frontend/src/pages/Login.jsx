import { useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import toast from "react-hot-toast";
import SEO from "../components/SEO";
import { authAPI } from "../services/api";
import { useAuth } from "../store";
import { errMsg } from "../lib/format";
import { Butterfly } from "../lib/art";

export default function Login() {
  const nav = useNavigate();
  const { state } = useLocation();
  const { user, login } = useAuth();
  const [qs] = useSearchParams();
  const refFromLink = (qs.get("ref") || "").trim().toUpperCase().slice(0, 20);
  const [mode, setMode] = useState(
    state?.mode === "register" || refFromLink ? "register" : "login",
  );
  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    id: "",
    ref: refFromLink, // 🍬 friend's referral code (from ?ref=CODE link or typed)
  });
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={state?.from || "/account"} replace />;
  const submit = async (e) => {
    e.preventDefault();
    if (mode === "register" && !/^[6-9]\d{9}$/.test(f.phone))
      return toast.error("Enter a valid 10-digit mobile number");
    setBusy(true);
    try {
      const r =
        mode === "login"
          ? await authAPI.login({
              identifier: f.id.trim(),
              password: f.password,
            })
          : await authAPI.register({
              name: f.name,
              email: f.email,
              phone: f.phone,
              password: f.password,
              referralCode: f.ref.trim() || undefined,
            });
      login(r.data.user, r.data.token);
      toast.success(
        `Welcome${r.data.user.name ? ", " + r.data.user.name.split(" ")[0] : ""} 💗` +
          (r.data.candyBonus ? `  +${r.data.candyBonus} candies 🍬` : ""),
      );
      nav(state?.from || "/account", { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="container-x grid max-w-5xl gap-10 py-14 lg:grid-cols-2">
      <SEO title="Login" noindex />
      <div className="relative hidden overflow-hidden rounded-[32px] bg-gradient-to-br from-plum-800 to-rose-500 p-12 text-white lg:block">
        <div className="bg-petal absolute inset-0 opacity-40" />
        <Butterfly className="absolute right-8 top-8 w-28 animate-float" />
        <p className="relative mt-48 font-display text-6xl font-semibold leading-none">
          For every woman,{" "}
          <span className="italic text-rose-100">every you.</span>
        </p>
        <p className="relative mt-5 text-white/80">
          Save your wishlist, track orders and check out faster.
        </p>
      </div>
      <form onSubmit={submit} className="self-center">
        <h1 className="font-display text-5xl font-semibold text-plum-800">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h1>
        {mode === "register" && (
          <p className="mt-4 rounded-2xl bg-blush px-4 py-3 text-sm text-plum-800">
            🍬 Get <b>200 candies</b> free when you sign up. Joining with a
            friend&apos;s code? You both get <b>100</b>. 1 candy = ₹1.
          </p>
        )}
        {state?.reason === "checkout" && (
          <p className="mt-4 rounded-2xl bg-blush px-4 py-3 text-sm text-plum-800">
            Please {mode === "login" ? "log in" : "sign up"} to place your
            order. It takes 20 seconds, and your bag is saved.
          </p>
        )}
        <div className="mt-6 space-y-4">
          {mode === "register" && (
            <>
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  value={f.name}
                  onChange={on("name")}
                  required
                />
              </div>
              <div>
                <label className="label">Mobile number</label>
                <input
                  className="input"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="10-digit number"
                  value={f.phone}
                  onChange={(e) =>
                    setF({
                      ...f,
                      phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  required
                />
              </div>
            </>
          )}
          {mode === "login" ? (
            <div>
              <label className="label">Email or mobile number</label>
              <input
                className="input"
                value={f.id}
                onChange={on("id")}
                required
                autoComplete="username"
                autoCapitalize="none"
              />
            </div>
          ) : (
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={f.email}
                onChange={on("email")}
                required
                autoComplete="email"
              />
            </div>
          )}
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={f.password}
              onChange={on("password")}
              required
              minLength={6}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </div>
          {mode === "register" && (
            <div>
              <label className="label">Referral code (optional)</label>
              <input
                className="input uppercase"
                placeholder="e.g. SHYK3M9QX"
                value={f.ref}
                onChange={(e) =>
                  setF({
                    ...f,
                    ref: e.target.value.replace(/\s/g, "").toUpperCase().slice(0, 20),
                  })
                }
                autoCapitalize="characters"
                autoComplete="off"
              />
            </div>
          )}
        </div>
        {mode === "login" && (
          <Link
            to="/forgot-password"
            className="mt-1 block py-2.5 text-right text-sm text-plum-700 underline underline-offset-4 hover:text-rose-500"
          >
            Forgot password?
          </Link>
        )}
        <button disabled={busy} className="btn-plum btn-sheen mt-6 w-full">
          {busy ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
        </button>
        <p className="mt-5 text-center text-sm text-plum-800/70">
          {mode === "login" ? "New to Shyfly?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="inline-block py-2.5 font-medium text-rose-500 underline"
          >
            {mode === "login" ? "Create an account" : "Log in"}
          </button>
        </p>
      </form>
    </div>
  );
}
