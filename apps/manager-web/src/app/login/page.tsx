"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail, Building2, LogIn } from "lucide-react";

const API_BASE_URL = "http://localhost:3002";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("manager@demo.com");
  const [password, setPassword] = useState("Branch123!");
  const [tenantSlug, setTenantSlug] = useState("demo-restaurant");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tenant = params.get("tenant");

    if (tenant) {
      setTenantSlug(tenant);
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    try {
      setIsLoading(true);
      setError("");

      const res = await fetch(API_BASE_URL + "/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          tenantSlug
        })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();

      const tenantId = data?.user?.tenantId || "";
      const firstRole = Array.isArray(data?.roles) && data.roles.length > 0 ? data.roles[0] : null;
      const branchId = firstRole?.branchId || "";

      localStorage.setItem("accessToken", data.accessToken || "");
      localStorage.setItem("tenantId", tenantId);
      localStorage.setItem("tenantSlug", tenantSlug);

      if (branchId) {
        localStorage.setItem("branchId", branchId);
      }

      if (!branchId) {
        router.push("/de");
        router.refresh();
        return;
      }

      const tablesRes = await fetch(
        API_BASE_URL + "/tables?branchId=" + encodeURIComponent(branchId),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + (data.accessToken || "")
          },
          cache: "no-store"
        }
      );

      if (!tablesRes.ok) {
        router.push("/de");
        router.refresh();
        return;
      }

      const tablesJson = await tablesRes.json().catch(() => null);
      const tableCount = Array.isArray(tablesJson)
        ? tablesJson.length
        : Array.isArray(tablesJson?.value)
          ? tablesJson.value.length
          : 0;

      if (tableCount === 0) {
        window.location.href = "/floor-plan/editor";
        return;
      }

      router.push("/de");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Login failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-10 lg:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur xl:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden border-r border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(85,75,255,0.35),_transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-10 xl:flex xl:flex-col xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                <div className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-black">
                  ROS
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Restaurant OS</p>
                  <p className="text-xs text-white/50">Manager Web</p>
                </div>
              </div>

              <h1 className="mt-10 text-4xl font-semibold tracking-tight text-white">
                Sign in and continue with live restaurant operations.
              </h1>

              <p className="mt-4 max-w-md text-sm leading-7 text-white/60">
                Reservations, tables, guest flow and AI suggestions in one clean workspace for the team.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                <p className="text-sm font-medium text-emerald-200">AI control layer</p>
                <p className="mt-2 text-sm leading-6 text-emerald-100/75">
                  AI gives suggestions and warnings, but final control always stays with staff.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-medium text-white">Default demo access</p>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  Manager account is prefilled for fast development testing.
                </p>
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-8 lg:p-10">
            <div className="mx-auto flex max-w-md flex-col justify-center">
              <div className="xl:hidden">
                <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                  <div className="rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-black">
                    ROS
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Restaurant OS</p>
                    <p className="text-xs text-white/50">Manager Web</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 xl:mt-0">
                <p className="text-sm uppercase tracking-[0.22em] text-white/40">Secure access</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                  Login
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/55">
                  Use your tenant, email and password to access the manager dashboard.
                </p>
              </div>

              <form onSubmit={handleLogin} className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    Email
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <Mail className="h-4 w-4 text-white/45" />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      type="email"
                      autoComplete="email"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    Password
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <LockKeyhole className="h-4 w-4 text-white/45" />
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      type="password"
                      autoComplete="current-password"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/80">
                    Tenant slug
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <Building2 className="h-4 w-4 text-white/45" />
                    <input
                      value={tenantSlug}
                      onChange={(e) => setTenantSlug(e.target.value)}
                      placeholder="Tenant slug"
                      type="text"
                      className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                    />
                  </div>
                </div>

                {error ? (
                  <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogIn className="h-4 w-4" />
                  {isLoading ? "Signing in..." : "Login"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}