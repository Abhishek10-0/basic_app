import { useState } from "react";
import { Text, View } from "react-native";
import {
  useForm,
  Controller,
  DefaultValues,
  Path,
  FieldValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { Field, Button, styles } from "./ui";
export type FormField = {
  name: string;
  placeholder?: string;
  label: string;     
  secure?: boolean;
  multiline?: boolean;
  keyboard?: "default" | "email-address" | "phone-pad" | "numeric";
};
export function Form<T extends FieldValues>({
  schema,
  fields,
  defaults,
  onSubmit,
  submit = "Submit",
}: {
  schema: ZodType<T>;
  fields: FormField[];
  defaults: DefaultValues<T>;
  onSubmit: (data: T) => Promise<void>;
  submit?: string;
}) {
  const [error, setError] = useState("");
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<T>({ resolver: zodResolver(schema), defaultValues: defaults });
  return (
    <View style={{ gap: 17 }}>
      {fields.map((f) => (
        <Controller
          key={f.name}
          control={control}
          name={f.name as Path<T>}
          render={({ field, fieldState }) => (
            <Field
              {...f}
              value={String(field.value ?? "")}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
      ))}
      {!!error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
      <Button
        loading={isSubmitting}
        onPress={() =>
          void handleSubmit(async (data) => {
            setError("");
            try {
              await onSubmit(data);
            } catch (e) {
              setError((e as Error).message);
            }
          })()
        }
      >
        {submit}
      </Button>
    </View>
  );
}
