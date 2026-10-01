"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@sme/shared";
import { mutate, setToken } from "../../lib/api";
export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ identifier: string; password: string }>({
    resolver: zodResolver(loginSchema),
  });
  return (
    <main className="login-page">
      <section className="login-story">
        <img src="/logo.png" alt="SME Chamber of India" />
        <div className="gold-line" />
        <span className="eyebrow" style={{ color: "#d6b574" }}>
          SME CHAMBER OF INDIA
        </span>
        <h1>
          Enabling enterprise.
          <br />
          Inspiring growth.
        </h1>
        <p>
          A connected platform to manage our community, programmes and
          opportunities for Indian SMEs.
        </p>
      </section>
      <section className="login-form">
        <form
          onSubmit={handleSubmit(async (data) => {
            try {
              setError("");
              const result = await mutate<{ accessToken: string }>(
                "/admin/auth/login",
                "POST",
                data,
              );
              setToken(result.accessToken);
              router.replace("/dashboard");
            } catch (e) {
              setError((e as Error).message);
            }
          })}
        >
          <div>
            <span className="eyebrow">ADMINISTRATION PORTAL</span>
            <h1>Welcome back</h1>
            <p className="muted">Sign in to your Chamber admin account.</p>
          </div>
          {error && (
            <div role="alert" className="error">
              {error}
            </div>
          )}
          <label className="field">
            Email or mobile number
            <input
              {...register("identifier")}
              autoComplete="username"
              placeholder="Enter email or mobile"
            />
            {errors.identifier && (
              <span className="field-error">{errors.identifier.message}</span>
            )}
          </label>
          <label className="field">
            Password
            <input
              {...register("password")}
              type="password"
              autoComplete="current-password"
              placeholder="Enter password"
            />
            {errors.password && (
              <span className="field-error">{errors.password.message}</span>
            )}
          </label>
          <button className="button" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in securely →"}
          </button>
          <p className="muted">For authorised Chamber administrators only.</p>
        </form>
      </section>
    </main>
  );
}
