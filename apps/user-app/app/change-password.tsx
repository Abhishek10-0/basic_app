import { router } from "expo-router";
import { z } from "zod";
import { password } from "@sme/shared";
import { useSession } from "../src/lib/session";
import { mutate } from "../src/lib/api";
import { Form } from "../src/components/Form";
import { Screen, Card, LoginRequired } from "../src/components/ui";
export default function Change() {
  const user = useSession((s) => s.user);
  const logout = useSession((s) => s.logout);
  return (
    <Screen title="Change password">
      {!user ? (
        <LoginRequired />
      ) : (
        <Card>
          <Form
            schema={z
              .object({
                currentPassword: z.string().min(1),
                password,
                confirmPassword: password,
              })
              .refine((d) => d.password === d.confirmPassword, {
                path: ["confirmPassword"],
                message: "Passwords must match",
              })}
            defaults={{
              currentPassword: "",
              password: "",
              confirmPassword: "",
            }}
            fields={[
              {
                name: "currentPassword",
                label: "Current password",
                secure: true,
              },
              { name: "password", label: "New password", secure: true },
              {
                name: "confirmPassword",
                label: "Confirm new password",
                secure: true,
              },
            ]}
            submit="Update password"
            onSubmit={async (data) => {
              await mutate("/users/change-password", "POST", data);
              await logout();
              router.replace("/auth/login");
            }}
          />
        </Card>
      )}
    </Screen>
  );
}
