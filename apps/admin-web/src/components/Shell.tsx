"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  Layers,
  IdCard,
  CalendarDays,
  Ticket,
  CreditCard,
  Newspaper,
  Bell,
  MessageSquare,
  Image as ImageIcon,
  Settings,
  Shield,
  ScrollText,
  LogOut,
  Menu,
} from "lucide-react";
import { api, mutate, setToken } from "../lib/api";
const links = [
  ["dashboard", "Overview", LayoutDashboard],
  ["users", "Users", Users],
  ["membership-plans", "Membership Plans", Layers],
  ["memberships", "Memberships", IdCard],
  ["events", "Events", CalendarDays],
  ["event-bookings", "Event Bookings", Ticket],
  ["payments", "Payments", CreditCard],
  ["news", "News & Updates", Newspaper],
  ["notifications", "Notifications", Bell],
  ["enquiries", "Enquiries", MessageSquare],
  ["media", "Media Library", ImageIcon],
  ["settings", "Settings", Settings],
  ["admins", "Administrators", Shield],
  ["logs", "Activity Logs", ScrollText],
] as const;
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const me = useQuery({
    queryKey: ["admin-me"],
    queryFn: () => api<{ name: string; role: string }>("/admin/me"),
    retry: false,
  });
  if (me.isPending)
    return (
      <div className="loader-screen">
        <img src="/logo.png" alt="Restoring admin session" />
      </div>
    );
  if (me.isError)
    return (
      <div className="empty">
        <p>{me.error.message}</p>
        <Link className="button" href="/login">
          Sign in
        </Link>
      </div>
    );
  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Link href="/dashboard" className="brand">
          <img src="/logo.png" alt="SME" />
          <span>
            SME Chamber of India<small>ADMINISTRATION</small>
          </span>
        </Link>
        <div className="nav-label">WORKSPACE</div>
        <nav>
          {links
            .filter(([key]) =>
              me.data.role === "EDITOR"
                ? ["events", "news", "media"].includes(key)
                : key !== "admins" || me.data.role === "SUPER_ADMIN",
            )
            .map(([key, label, Icon]) => (
              <Link
                key={key}
                onClick={() => setOpen(false)}
                className={path.startsWith("/" + key) ? "active" : ""}
                href={"/" + key}
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
        </nav>
        <footer>
          SME Chamber of India
          <br />
          Empowering the SME community
        </footer>
      </aside>
      <div className="main">
        <header className="topbar">
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              aria-label="Toggle menu"
              className="text-button mobile-menu"
              onClick={() => setOpen(!open)}
            >
              <Menu size={21} />
            </button>
            <span className="muted">
              Chamber Administration{" "}
              <span style={{ margin: "0 12px", color: "#c8d1dc" }}>/</span>{" "}
              {links.find(([key]) => path.startsWith("/" + key))?.[1] ??
                "Workspace"}
            </span>
          </div>
          <div className="topbar-right">
            <div className="avatar">{me.data.name.charAt(0)}</div>
            <small>
              {me.data.name}
              <br />
              {me.data.role.replaceAll("_", " ")}
            </small>
            <button
              aria-label="Sign out"
              title="Sign out"
              className="text-button"
              onClick={async () => {
                await mutate("/admin/auth/logout", "POST");
                setToken("");
                client.clear();
                router.replace("/login");
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
