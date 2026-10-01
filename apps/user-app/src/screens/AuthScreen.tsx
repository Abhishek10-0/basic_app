import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { z } from "zod";
import { signupSchema, password, phone } from "@sme/shared";
import type { Session } from "@sme/types";
import { useState } from "react";
import { Screen, Card, styles, Button } from "../components/ui";
import { Form } from "../components/Form";
import { mutate } from "../lib/api";
import { useSession } from "../lib/session";
export function AuthScreen({
  kind,
}: {
  kind:
    "login" | "signup" | "forgot-password" | "reset-password" | "verify-email";
}) {
  const params = useLocalSearchParams<{ returnTo?: string; token?: string }>();
  const login = useSession((s) => s.login);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [signup, setSignup] = useState<z.infer<typeof signupSchema> | null>(
    null,
  );
  const [loginMobile, setLoginMobile] = useState("");
  const [resending, setResending] = useState(false);
  const target = params.returnTo?.startsWith("/membership/checkout/")
    ? params.returnTo
    : "/profile";
  const finish = async (path: string, data: unknown) => {
    await login(await mutate<Session>(path, "POST", data));
    router.replace(target);
  };
  return (
    <Screen
      title={
        kind === "signup"
          ? "Create your account"
          : kind === "login"
            ? "Welcome back"
            : kind === "verify-email"
              ? "Verify email"
              : "Password assistance"
      }
    >
      <Text style={styles.eyebrow}>YOUR SME CHAMBER ACCOUNT</Text>
      <Text style={styles.title}>
        {kind === "signup"
          ? "Join a connected community."
          : kind === "login"
            ? "Good to see you again."
            : kind === "verify-email"
              ? "Confirm your email address."
              : "Let?s get you back in."}
      </Text>
      <Card>
        {message ? (
          <>
            <Text style={styles.text}>{message}</Text>
            <Button onPress={() => router.replace("/auth/login")}>
              Go to login
            </Button>
          </>
        ) : kind === "login" && loginMobile ? (
          <>
            <Text style={styles.text}>
              Enter the OTP sent to {loginMobile}. It expires in 5 minutes.
            </Text>
            <Form
              key="login-otp"
              schema={z.object({
                otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP"),
              })}
              defaults={{ otp: "" }}
              fields={[{ name: "otp", label: "OTP", keyboard: "numeric" }]}
              submit="Verify and log in"
              onSubmit={(d) =>
                finish("/auth/login", { mobile: loginMobile, otp: d.otp })
              }
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Button
              secondary
              loading={resending}
              onPress={() => {
                setResending(true);
                setError("");
                void mutate("/auth/send-otp", "POST", {
                  mobile: loginMobile,
                  purpose: "login",
                })
                  .then(() => setError("A new OTP has been sent."))
                  .catch((e) => setError(e.message))
                  .finally(() => setResending(false));
              }}
            >
              Resend OTP
            </Button>
            <Button
              secondary
              onPress={() => {
                setLoginMobile("");
                setError("");
              }}
            >
              Use a different mobile number
            </Button>
          </>
        ) : kind === "login" ? (
          <>
            <Form
              key="login-mobile"
              schema={z.object({ mobile: phone })}
              defaults={{ mobile: "" }}
              fields={[
                { name: "mobile", label: "Mobile", keyboard: "phone-pad" },
              ]}
              submit="Send OTP"
              onSubmit={async (d) => {
                await mutate("/auth/send-otp", "POST", {
                  mobile: d.mobile,
                  purpose: "login",
                });
                setLoginMobile(d.mobile);
              }}
            />
            <Button
              secondary
              onPress={() =>
                router.push({
                  pathname: "/auth/signup",
                  params: { returnTo: target },
                })
              }
            >
              Create an account
            </Button>
          </>
        ) : kind === "signup" && signup ? (
          <>
            <Text style={styles.text}>
              Enter the OTP sent to {signup.mobile}. It expires in 5 minutes.
            </Text>
            <Form
              key="signup-otp"
              schema={z.object({
                otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP"),
              })}
              defaults={{ otp: "" }}
              fields={[{ name: "otp", label: "OTP", keyboard: "numeric" }]}
              submit="Verify and create account"
              onSubmit={(d) => finish("/auth/signup", { ...signup, ...d })}
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Button
              secondary
              loading={resending}
              onPress={() => {
                setResending(true);
                setError("");
                void mutate("/auth/send-otp", "POST", { mobile: signup.mobile })
                  .then(() => setError("A new OTP has been sent."))
                  .catch((e) => setError(e.message))
                  .finally(() => setResending(false));
              }}
            >
              Resend OTP
            </Button>
            <Button
              secondary
              onPress={() => {
                setSignup(null);
                setError("");
              }}
            >
              Edit registration details
            </Button>
          </>
        ) : kind === "signup" ? (
          <Form
            key="signup-details"
            schema={signupSchema}
            defaults={{
              name: "",
              email: "",
              mobile: "",
              companyName: "",
              designation: "",
              businessActivities: "",
              city: "",
            }}
            fields={[
              { name: "name", label: "Full name" },
              { name: "email", label: "Email", keyboard: "email-address" },
              { name: "mobile", label: "Mobile", keyboard: "phone-pad" },
              { name: "companyName", label: "Company name (optional)" },
              { name: "designation", label: "Designation (optional)" },
              {
                name: "businessActivities",
                label: "Business activities (optional)",
              },
              { name: "city", label: "City" },
            ]}
            submit="Create account"
            onSubmit={async (d) => {
              await mutate("/auth/send-otp", "POST", { mobile: d.mobile });
              setSignup(signupSchema.parse(d));
            }}
          />
        ) : kind === "forgot-password" ? (
          <Form
            schema={z.object({ email: z.string().email() })}
            defaults={{ email: "" }}
            fields={[
              {
                name: "email",
                label: "Registered email",
                keyboard: "email-address",
              },
            ]}
            submit="Send reset link"
            onSubmit={async (d) => {
              await mutate("/auth/forgot-password", "POST", d);
              setMessage(
                "If an account exists, a reset link will be sent to your email.",
              );
            }}
          />
        ) : kind === "reset-password" ? (
          <Form
            schema={z
              .object({ password, confirmPassword: password })
              .refine((d) => d.password === d.confirmPassword, {
                path: ["confirmPassword"],
                message: "Passwords must match",
              })}
            defaults={{ password: "", confirmPassword: "" }}
            fields={[
              { name: "password", label: "New password", secure: true },
              {
                name: "confirmPassword",
                label: "Confirm new password",
                secure: true,
              },
            ]}
            submit="Reset password"
            onSubmit={async (d) => {
              await mutate("/auth/reset-password", "POST", {
                token: params.token,
                password: d.password,
              });
              setMessage("Password reset successfully. Please log in.");
            }}
          />
        ) : (
          <>
            <Text style={styles.muted}>
              Verify this email to securely access bookings made with the same
              email address.
            </Text>
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Button
              onPress={() =>
                void mutate("/auth/verify-email", "POST", {
                  token: params.token,
                })
                  .then(() => setMessage("Email verified successfully."))
                  .catch((e) => setError(e.message))
              }
            >
              Verify email
            </Button>
          </>
        )}
      </Card>
    </Screen>
  );
}
