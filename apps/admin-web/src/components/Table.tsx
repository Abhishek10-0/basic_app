"use client";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { money, date } from "@sme/shared";
import type { RecordRow } from "@sme/types";
const displayTime = (value: unknown) => {
  const raw = String(value ?? "");
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return raw;
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour < 12 ? "AM" : "PM"}`;
};
export function StatusBadge({ value }: { value: unknown }) {
  const s = String(value ?? "");
  const type = [
    "ACTIVE",
    "PAID",
    "CONFIRMED",
    "PUBLISHED",
    "ATTENDED",
  ].includes(s)
    ? "good"
    : ["PENDING", "PAYMENT_PENDING", "NEW", "CREATED"].includes(s)
      ? "warn"
      : ["FAILED", "CANCELLED", "EXPIRED", "ARCHIVED"].includes(s)
        ? "bad"
        : "";
  return <span className={"badge " + type}>{s.replaceAll("_", " ")}</span>;
}
export function display(value: unknown, key: string): React.ReactNode {
  if (value === null || value === undefined || value === "") return "?";
  if (key === "status" || key === "role") return <StatusBadge value={value} />;
  if (["price", "totalAmount", "amount", "gstAmount"].includes(key))
    return money(Number(value));
  if (key.endsWith("At") || key.endsWith("Date")) return date(String(value));
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    return String(
      v.title ??
        v.name ??
        v.email ??
        (v.firstName ? `${v.firstName} ${v.lastName}` : JSON.stringify(v)),
    );
  }
  return String(value);
}
export function DataTable({
  rows,
  columns,
  resource,
  onDelete,
}: {
  rows: RecordRow[];
  columns: string[];
  resource?: string;
  onDelete?: (row: RecordRow) => void;
}) {
  if (!rows.length)
    return (
      <div className="empty">
        No records found. Try adjusting your search or filters.
      </div>
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c.replace(/([A-Z])/g, " $1")}</th>
            ))}
            {resource && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((c, i) => (
                <td key={c}>
                  {i === 0 ? (
                    <strong>{display(row[c], c)}</strong>
                  ) : c === "time" ? (
                    `${displayTime(row.startTime)} – ${displayTime(row.endTime)}`
                  ) : c === "location" ? (
                    [row.venue, row.city].filter(Boolean).join(", ")
                  ) : (
                    display(row[c], c)
                  )}
                </td>
              ))}
              {resource && (
                <td>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <Link
                      className="text-button"
                      href={`/${resource}/${row.id}`}
                      aria-label={`Edit ${String(row.title ?? "record")}`}
                      title="Edit"
                    >
                      <Pencil size={17} />
                    </Link>
                    {onDelete && (
                      <button
                        type="button"
                        className="text-button"
                        style={{ color: "#c62828" }}
                        aria-label={`Delete ${String(row.title ?? "record")}`}
                        title="Delete"
                        onClick={() => onDelete(row)}
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Pagination({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className="pagination">
      <span>
        {total} records ? Page {page} of{" "}
        {Math.max(1, Math.ceil(total / pageSize))}
      </span>
      <div>
        <button
          className="button secondary"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </button>
        <button
          className="button secondary"
          disabled={page * pageSize >= total}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
export function ConfirmationDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Confirm action"
    >
      <section>
        <h2>Confirm change</h2>
        <p>{message}</p>
        <div className="form-actions">
          <button className="button" onClick={onConfirm}>
            Confirm
          </button>
          <button className="button secondary" onClick={onCancel}>
            Keep unchanged
          </button>
        </div>
      </section>
    </div>
  );
}
