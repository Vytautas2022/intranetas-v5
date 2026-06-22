import React, { FormEvent, useEffect, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { Lock, Mail, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";
import {
  canAccessRouteResolver,
  getFirstAllowedRoute,
} from "../logic/permissionPreviewResolver";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";
const hasGoogleClientId =
  Boolean(GOOGLE_CLIENT_ID) &&
  GOOGLE_CLIENT_ID !== "REPLACE_WITH_GOOGLE_CLIENT_ID" &&
  GOOGLE_CLIENT_ID.endsWith(".apps.googleusercontent.com");

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentUser,
    login,
    loginWithGoogleCredential,
    isAuthenticated,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from =
    (location.state as { from?: { pathname?: string } } | null)?.from
      ?.pathname || "/darbai";

  const getSafeRedirectPath = (user = currentUser) => {
    if (!user) return "/darbai";
    return canAccessRouteResolver(user, from) ? from : getFirstAllowedRoute(user);
  };

  useEffect(() => {
    console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID);
    console.log("ENV CLIENT ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
    console.log("Google Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
    console.debug("[auth] Login page Google enabled:", hasGoogleClientId);
  }, []);

  if (isAuthenticated) {
    return <Navigate to={getSafeRedirectPath()} replace />;
  }

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    setError(null);
    console.debug("[auth] Google callback success:", {
      hasCredential: Boolean(response.credential),
      clientId: response.clientId,
      selectBy: response.select_by,
    });

    if (!response.credential) {
      console.debug("[auth] Google auth error: missing credential");
      setError("Google prisijungimas nepavyko.");
      return;
    }

    const result = await loginWithGoogleCredential(
      response.credential,
      remember,
    );

    if (!result.success) {
      console.debug("[auth] Google auth error:", result.error);
      setError(result.error ?? "Google prisijungimas nepavyko.");
      return;
    }

    navigate(getSafeRedirectPath(result.user), { replace: true });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await login(email, password, remember);
    setIsLoading(false);

    if (!result.success) {
      console.debug("[auth] Email/password auth error:", result.error);
      setError(result.error ?? "Prisijungti nepavyko.");
      return;
    }

    navigate(getSafeRedirectPath(result.user), { replace: true });
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 flex items-center justify-center font-sans">
      <section className="w-full max-w-md bg-white border border-slate-200 shadow-2xl shadow-slate-200/70 rounded-3xl overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-br from-white to-slate-50">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-brand-lime text-black flex items-center justify-center font-black text-lg">
              S
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-950 tracking-tight">
                Sportgates
              </h1>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Intranetas
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-lime/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700">
              <ShieldCheck size={13} />
              Saugus prisijungimas
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              Prisijunkite prie sistemos
            </h2>
            <p className="text-sm font-medium leading-relaxed text-slate-500">
              Įveskite savo Sportgates intraneto paskyros duomenis.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {error && (
            <div className="flex gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <label className="block space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              El. paštas
            </span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-brand-lime focus-within:bg-white transition-all">
              <Mail size={18} className="text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ops@sportgates.lt"
                autoComplete="email"
                required
                className="h-13 w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-300"
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Slaptažodis
            </span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-brand-lime focus-within:bg-white transition-all">
              <Lock size={18} className="text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="******"
                autoComplete="current-password"
                required
                className="h-13 w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-300"
              />
            </div>
          </label>

          <label className="flex items-center gap-3 text-sm font-bold text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-black"
            />
            Prisiminti mane
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-13 rounded-2xl bg-black text-white text-sm font-black uppercase tracking-widest hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 transition-all flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 size={18} className="animate-spin" />}
            Prisijungti
          </button>

          {hasGoogleClientId && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  OR
                </span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    console.debug("[auth] Google callback failure");
                    setError("Google prisijungimas nepavyko.");
                  }}
                  theme="outline"
                  size="large"
                  text="signin_with"
                  shape="rectangular"
                  width="320"
                />
              </div>
            </div>
          )}

        </form>
      </section>
    </main>
  );
};
