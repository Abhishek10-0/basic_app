import { router } from "expo-router";
import { z } from "zod";
import { useSession } from "../src/lib/session";
import { mutate } from "../src/lib/api";
import { Form } from "../src/components/Form";
import { Screen, Card, LoginRequired } from "../src/components/ui";
export default function Edit() {
  const user = useSession((s) => s.user);
  const reload = useSession((s) => s.reload);
  return (
    <Screen title="Edit profile">
      {!user ? (
        <LoginRequired />
      ) : (
        <Card>
          <Form
            schema={z.object({
              firstName: z.string().min(1),
              lastName: z.string().min(1),
              companyName: z.string(),
              designation: z.string(),
              address: z.string(),
              photo: z.union([z.string().url(), z.literal("")]),
            })}
            defaults={{
              firstName: user.firstName,
              lastName: user.lastName,
              companyName: user.companyName ?? "",
              designation: user.designation ?? "",
              address: user.address ?? "",
              photo: user.photo ?? "",
            }}
            fields={[
              { name: "firstName", label: "First name" },
              { name: "lastName", label: "Last name" },
              { name: "companyName", label: "Company name" },
              { name: "designation", label: "Designation" },
              { name: "address", label: "Address", multiline: true },
              { name: "photo", label: "Profile photo URL (optional)" },
            ]}
            submit="Save profile"
            onSubmit={async (data) => {
              await mutate("/users/me", "PATCH", data);
              await reload();
              router.back();
            }}
          />
        </Card>
      )}
    </Screen>
  );
}
