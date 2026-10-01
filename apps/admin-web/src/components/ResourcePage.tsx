"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Page, RecordRow } from "@sme/types";
import { api, mutate, downloadBookings } from "../lib/api";
import { resourceConfig, fields } from "../lib/resources";
import { DataTable, Pagination, ConfirmationDialog, display } from "./Table";
import { ResourceForm } from "./ResourceForm";
export function ResourcePage({
  resource,
  id,
}: {
  resource: string;
  id?: string;
}) {
  const config = resourceConfig[resource];
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("desc");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<null | (() => Promise<void>)>(null);
  const [uploading, setUploading] = useState(false);
  const [manual, setManual] = useState(false);
  const [userId, setUserId] = useState("");
  const [planId, setPlanId] = useState("");
  const [months, setMonths] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);
  const path = `/admin/${resource}${id && id !== "new" ? "/" + id : ""}`;
  const query = useQuery({
    queryKey: [resource, id, page, q, status, sort],
    queryFn: () =>
      api<Page<RecordRow> | RecordRow>(
        `${path}${!id && resource !== "settings" ? `?page=${page}&q=${encodeURIComponent(q)}&status=${status}&sort=${sort}` : ""}`,
      ),
    enabled: id !== "new" && (!!config || resource === "settings"),
  });
  if (!config && resource !== "settings")
    return (
      <div className="empty">
        Page not found. <Link href="/dashboard">Return to dashboard</Link>
      </div>
    );
  const title =
    resource === "settings" ? "Organization Settings" : config.title;
  const action = async (method: string, data?: unknown) => {
    await mutate(path, method, data);
    await client.invalidateQueries();
  };
  const data = query.data as RecordRow | undefined;
  const result = query.data as Page<RecordRow> | undefined;
  return (
    <>
      <div className="heading">
        <div>
          <span className="eyebrow">CHAMBER WORKSPACE</span>
          <h1>
            {id === "new" ? "Create " : ""}
            {title}
          </h1>
          <span className="muted">
            {config?.description ??
              "Manage your organization identity and app content."}
          </span>
        </div>
        {!id && config?.create && (
          <Link className="button" href={`/${resource}/new`}>
            + {resource === "notifications" ? "New broadcast" : "Create new"}
          </Link>
        )}
        {id && (
          <Link className="button secondary" href={"/" + resource}>
            ← Back to list
          </Link>
        )}
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {id === "new" ? (
        <ResourceForm resource={resource} />
      ) : query.isPending ? (
        <div className="skeleton" />
      ) : query.isError ? (
        <div className="error">
          {query.error.message}
          <button className="text-button" onClick={() => query.refetch()}>
            Retry
          </button>
        </div>
      ) : resource === "settings" || (id && fields[resource]) ? (
        <>
          <ResourceForm
            key={id ?? resource}
            resource={resource}
            id={id}
            initial={data}
          />
          {resource === "settings" && (
            <p className="notice">
              Payment gateway:{" "}
              {data?.paymentEnabled ? "Configured" : "Disabled"} ? Email
              delivery: {data?.emailEnabled ? "Enabled" : "Disabled"} ? Media
              storage: {String(data?.mediaMode)}. Secret values are managed in
              the API environment.
            </p>
          )}
          {id && (
            <button
              className="button danger"
              style={{ marginTop: 20 }}
              onClick={() =>
                setConfirm(() => async () => {
                  await action("DELETE");
                  window.location.assign("/" + resource);
                })
              }
            >
              {resource === "events"
                ? "Delete this event"
                : "Archive this record"}
            </button>
          )}
        </>
      ) : id && data ? (
        <>
          <section className="panel">
            <dl className="detail-grid">
              {Object.entries(data)
                .filter(
                  ([k]) =>
                    ![
                      "passwordHash",
                      "razorpaySignature",
                      "gatewayResponse",
                    ].includes(k),
                )
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>{k.replace(/([A-Z])/g, " $1")}</dt>
                    <dd>{display(v, k)}</dd>
                  </div>
                ))}
            </dl>
          </section>
          <div className="form-actions">
            {resource === "enquiries" &&
              ["NEW", "CONTACTED", "CLOSED"].map((s) => (
                <button
                  key={s}
                  className="button secondary"
                  onClick={() =>
                    setConfirm(() => () => action("PATCH", { status: s }))
                  }
                >
                  Mark {s.toLowerCase()}
                </button>
              ))}
            {resource === "users" && (
              <button
                className="button secondary"
                onClick={() =>
                  setConfirm(
                    () => () => action("PATCH", { disabled: !data.disabled }),
                  )
                }
              >
                {data.disabled ? "Enable" : "Disable"} user
              </button>
            )}
            {resource === "event-bookings" && (
              <>
                {data.status === "CONFIRMED" && (
                  <button
                    className="button"
                    onClick={() =>
                      setConfirm(
                        () => () => action("PATCH", { status: "ATTENDED" }),
                      )
                    }
                  >
                    Mark attended
                  </button>
                )}
                <button
                  className="button danger"
                  onClick={() =>
                    setConfirm(
                      () => () => action("PATCH", { status: "CANCELLED" }),
                    )
                  }
                >
                  Cancel booking
                </button>
              </>
            )}
            {resource === "memberships" && (
              <>
                <input
                  aria-label="Extension months"
                  type="number"
                  min="1"
                  max="120"
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                />
                <button
                  className="button"
                  onClick={() =>
                    setConfirm(
                      () => () => action("PATCH", { action: "extend", months }),
                    )
                  }
                >
                  Extend membership
                </button>
                <button
                  className="button danger"
                  onClick={() =>
                    setConfirm(
                      () => () => action("PATCH", { action: "cancel" }),
                    )
                  }
                >
                  Cancel membership
                </button>
              </>
            )}
          </div>
          {["memberships", "event-bookings"].includes(resource) && (
            <p className="notice">
              Cancellation changes the registration status. Any refund must be
              processed separately in Razorpay.
            </p>
          )}
        </>
      ) : (
        <section className="panel">
          <div className="toolbar">
            <input
              aria-label="Search records"
              placeholder="Search records..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {config.statuses && (
              <select
                aria-label="Filter by status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All statuses</option>
                {config.statuses.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            )}
            <select
              aria-label="Sort order"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
            {resource === "event-bookings" && (
              <button
                className="button secondary"
                onClick={() =>
                  downloadBookings().catch((e) => setError(e.message))
                }
              >
                Export CSV
              </button>
            )}
            {resource === "memberships" && (
              <button
                className="button secondary"
                onClick={() => setManual(!manual)}
              >
                Manual activation
              </button>
            )}
            {resource === "media" && (
              <label className="button">
                {uploading ? "Uploading..." : "Upload media"}
                <input
                  hidden
                  disabled={uploading}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    try {
                      const form = new FormData();
                      form.append("file", file);
                      await api("/media", { method: "POST", body: form });
                      await query.refetch();
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
              </label>
            )}
          </div>
          {manual && (
            <form
              className="toolbar"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await mutate("/admin/memberships/manual", "POST", {
                    userId,
                    planId,
                  });
                  setManual(false);
                  await query.refetch();
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <input
                required
                aria-label="User ID"
                placeholder="User ID (from user details)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <input
                required
                aria-label="Plan ID"
                placeholder="Plan ID (from plan URL)"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
              />
              <button className="button">Activate membership</button>
            </form>
          )}
          {resource === "media" ? (
            <div className="media-grid">
              {result?.items?.length ? (
                result.items.map((r) => (
                  <div className="media-card" key={r.id}>
                    {String(r.mimeType).startsWith("video/") ? (
                      <video src={String(r.url)} controls preload="metadata" />
                    ) : (
                      <img src={String(r.url)} alt={String(r.filename)} />
                    )}
                    <p className="muted">{String(r.filename)}</p>
                    <button
                      className="text-button"
                      onClick={() =>
                        navigator.clipboard
                          .writeText(String(r.url))
                          .then(() => setError("Media URL copied."))
                          .catch(() =>
                            setError("Copy this URL: " + String(r.url)),
                          )
                      }
                    >
                      Copy media URL
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty">Upload your first image or video.</div>
              )}
            </div>
          ) : (
            <DataTable
              rows={result?.items ?? []}
              columns={config.columns}
              resource={config.detail ? resource : undefined}
              onDelete={
                resource === "events"
                  ? (row) =>
                      setConfirm(() => async () => {
                        await mutate(`/admin/events/${row.id}`, "DELETE");
                        await query.refetch();
                      })
                  : undefined
              }
            />
          )}
          <Pagination
            page={page}
            total={result?.total ?? 0}
            pageSize={15}
            onPage={setPage}
          />
        </section>
      )}
      {confirm && (
        <ConfirmationDialog
          message="Apply this change? Changes are recorded in the activity log."
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const fn = confirm;
            setConfirm(null);
            void fn().catch((e) => setError(e.message));
          }}
        />
      )}
    </>
  );
}
