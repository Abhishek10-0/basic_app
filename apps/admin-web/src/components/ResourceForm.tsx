"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { eventCreateFields, fields, label } from "../lib/resources";
import { mutate, api } from "../lib/api";
export function ResourceForm({
  resource,
  id,
  initial = {},
}: {
  resource: string;
  id?: string;
  initial?: Record<string, unknown>;
}) {
  const router = useRouter();
  const client = useQueryClient();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const list =
    resource === "events" ? eventCreateFields : (fields[resource] ?? []);
  const defaults: Record<string, unknown> = {};
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of list) {
    let value = initial[f.key] ?? f.initial ?? "";
    if (f.type === "date-only" && value)
      value = new Date(new Date(String(value)).getTime() + 330 * 60000)
        .toISOString()
        .slice(0, 10);
    if (f.type === "date" && value)
      value = new Date(new Date(String(value)).getTime() + 330 * 60000)
        .toISOString()
        .slice(0, 16);
    if (f.type === "json")
      value = typeof value === "string" ? JSON.parse(value) : value;
    if (f.type === "lines" && Array.isArray(value)) value = value.join("\n");
    defaults[f.key] = value;
    shape[f.key] =
      f.type === "checkbox"
        ? z.boolean()
        : f.required
          ? z.string().min(1, `${label(f)} is required`)
          : z.unknown();
    if (f.type === "number") {
      defaults[f.key] = String(value);
      shape[f.key] = f.required ? z.string().min(1) : z.unknown();
    }
  }
  if (resource === "notifications") {
    shape.title = z
      .string()
      .trim()
      .min(3, "Title must have at least 3 characters")
      .max(200);
    shape.message = z
      .string()
      .trim()
      .min(5, "Message must have at least 5 characters")
      .max(2000);
    shape.deepLink = z
      .string()
      .trim()
      .regex(
        /^\/(?!\/)[a-zA-Z0-9_./?=&%#-]*$/,
        "Use an in-app path beginning with /",
      )
      .or(z.literal(""));
    shape.imageUrl = z
      .string()
      .url("Use a valid media URL")
      .refine((url) => url.startsWith("https://"), "Media URL must use HTTPS")
      .or(z.literal(""));
  }
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, unknown>>({
    defaultValues: defaults,
    resolver: zodResolver(z.object(shape)),
  });
  return (
    <form
      className="panel form-panel"
      onSubmit={handleSubmit(async (values) => {
        try {
          setError("");
          setSaved(false);
          let data =
            resource === "events" && id
              ? { ...initial, ...values }
              : { ...values };
          for (const f of list) {
            if (f.type === "number")
              data[f.key] =
                values[f.key] === ""
                  ? f.key === "originalPrice"
                    ? null
                    : 0
                  : Number(values[f.key]);
            if (f.type === "lines")
              data[f.key] = String(values[f.key])
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean);

            if (f.type === "date" && values[f.key])
              data[f.key] = new Date(
                String(values[f.key]) + "+05:30",
              ).toISOString();
          }
          if (resource === "events") {
            const eventDate = String(values.startDate);
            const startDate = new Date(`${eventDate}T00:00:00+05:30`);
            data.startDate = startDate.toISOString();
            data.endDate = new Date(
              `${eventDate}T23:59:59+05:30`,
            ).toISOString();
            data.registrationDeadline = new Date(
              Math.min(Date.now(), startDate.getTime()),
            ).toISOString();
          }
          if (resource === "events" && !id) {
            data = {
              ...data,
              slug: `${
                String(data.title)
                  .toLowerCase()
                  .trim()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "") || "event"
              }-${Date.now()}`,
              shortDescription: String(data.title),
              description: "",
              address: "",
              city: "",
              state: "",
              country: "India",
              googleMapsUrl: "",
              paid: false,
              price: 0,
              gstPercentage: 0,
              availableSeats: 100000,
              registrationDeadline: data.registrationDeadline,
              organizerName: "SME Chamber of India",
              organizerEmail: "",
              organizerPhone: "",
              contactPerson: "",
              agenda: "",
              terms: "",
              status: "PUBLISHED",
              published: true,
              featured: false,
              speakers: [],
              gallery: [],
            };
          }
          await mutate(
            `/admin/${resource}${id ? "/" + id : ""}`,
            id || resource === "settings" ? "PUT" : "POST",
            data,
          );
          await client.invalidateQueries();
          if (resource === "settings") setSaved(true);
          else router.push("/" + resource);
        } catch (e) {
          setError((e as Error).message);
        }
      })}
    >
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
      {saved && (
        <p role="status" className="notice">
          Settings saved.
        </p>
      )}
      <div className="form-grid">
        {list.map((f) => (
          <label
            key={f.key}
            className={
              "field " +
              (["textarea", "json", "lines"].includes(f.type ?? "")
                ? "wide"
                : "")
            }
          >
            {label(f)}
            {f.required ? " *" : ""}
            {f.options ? (
              <select {...register(f.key)}>
                {f.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : f.type === "json" ? (
              <Controller
                control={control}
                name={f.key}
                render={({ field }) => (
                  <RepeatFields
                    kind={f.key}
                    value={field.value as Record<string, string>[]}
                    onChange={field.onChange}
                  />
                )}
              />
            ) : resource === "notifications" && f.key === "imageUrl" ? (
              <input type="hidden" {...register(f.key)} />
            ) : ["textarea", "lines"].includes(f.type ?? "") ? (
              <textarea {...register(f.key)} rows={3} />
            ) : (
              <input
                {...register(f.key)}
                type={
                  f.type === "checkbox"
                    ? "checkbox"
                    : f.type === "date"
                      ? "datetime-local"
                      : f.type === "date-only"
                        ? "date"
                        : f.type === "time"
                          ? "time"
                          : f.type === "password"
                            ? "password"
                            : f.type === "email"
                              ? "email"
                              : f.type === "number"
                                ? "number"
                                : "text"
                }
                step={f.key === "gstPercentage" ? "0.01" : undefined}
              />
            )}{" "}
            {f.type === "date" && (
              <small>Date and time in India Standard Time (IST).</small>
            )}
            {[
              "bannerImage",
              "featuredImage",
              "imageUrl",
              "logo",
              "favicon",
              "banner",
            ].includes(f.key) && (
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-label={`Upload ${label(f)}`}
                onChange={async (e) => {
                  const image = e.target.files?.[0];
                  if (!image) return;
                  try {
                    const form = new FormData();
                    form.append("file", image);
                    const uploaded = await api<{ url: string }>("/media", {
                      method: "POST",
                      body: form,
                    });
                    setValue(f.key, uploaded.url);
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              />
            )}
            {f.type === "lines" && <small>One benefit per line.</small>}
            {errors[f.key] && (
              <span className="field-error">
                {String(errors[f.key]?.message)}
              </span>
            )}
          </label>
        ))}
      </div>
      <div className="form-actions">
        <button className="button" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : resource === "notifications"
              ? "Send broadcast"
              : "Save changes"}
        </button>
        <button
          className="button secondary"
          type="button"
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function RepeatFields({
  kind,
  value = [],
  onChange,
}: {
  kind: string;
  value: Record<string, string>[];
  onChange: (v: Record<string, string>[]) => void;
}) {
  const keys = kind === "speakers" ? ["name", "designation", "photo"] : ["url"];
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {value.map((row, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            padding: 12,
            border: "1px solid #dce3ee",
            borderRadius: 5,
          }}
        >
          {keys.map((key) => (
            <input
              key={key}
              aria-label={`${kind} ${i + 1} ${key}`}
              placeholder={
                key === "url"
                  ? "Image URL"
                  : key === "photo"
                    ? "Photo URL"
                    : key
              }
              value={row[key] ?? ""}
              onChange={(e) =>
                onChange(
                  value.map((r, j) =>
                    j === i ? { ...r, [key]: e.target.value } : r,
                  ),
                )
              }
            />
          ))}
          <button
            type="button"
            className="text-button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="button secondary"
        onClick={() =>
          onChange([...value, Object.fromEntries(keys.map((k) => [k, ""]))])
        }
      >
        + Add {kind === "speakers" ? "speaker" : "gallery image"}
      </button>
    </div>
  );
}
