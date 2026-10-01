"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  IdCard,
  CalendarDays,
  Ticket,
  IndianRupee,
  MessageSquare,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { api } from "../../../lib/api";
import { money } from "@sme/shared";
import type { RecordRow } from "@sme/types";
import { DataTable } from "../../../components/Table";
type Dashboard = {
  users: number;
  activeMemberships: number;
  expiredMemberships: number;
  events: number;
  bookings: number;
  pendingEnquiries: number;
  membershipRevenue: number;
  eventRevenue: number;
  latestPayments: RecordRow[];
};
export default function Dashboard() {
  const q = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<Dashboard>("/admin/dashboard"),
  });
  if (q.isError)
    return (
      <div className="error">
        {q.error.message}
        <button className="text-button" onClick={() => q.refetch()}>
          Retry
        </button>
      </div>
    );
  if (!q.data)
    return (
      <>
        <div className="skeleton" />
        <div className="skeleton" />
      </>
    );
  const d = q.data;
  const stats = [
    ["Total users", d.users, Users, "Registered community"],
    [
      "Active memberships",
      d.activeMemberships,
      IdCard,
      "Current membership records",
    ],
    [
      "Membership revenue",
      money(d.membershipRevenue),
      IndianRupee,
      "Verified payments, including GST",
    ],
    ["Upcoming & past events", d.events, CalendarDays, "Chamber programmes"],
    ["Event bookings", d.bookings, Ticket, "All registrations"],
    [
      "Event revenue",
      money(d.eventRevenue),
      IndianRupee,
      "Verified event payments",
    ],
    [
      "Pending enquiries",
      d.pendingEnquiries,
      MessageSquare,
      "Awaiting team follow-up",
    ],
    [
      "Expired memberships",
      d.expiredMemberships,
      Clock,
      "Renewal opportunities",
    ],
  ] as const;
  return (
    <>
      <div className="heading">
        <div>
          <span className="eyebrow">YOUR CHAMBER AT A GLANCE</span>
          <h1>Dashboard overview</h1>
          <span className="muted">
            Manage your community. Create new opportunities.
          </span>
        </div>
        <span className="muted">
          {new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>
      <section className="welcome">
        <div>
          <h2>
            A stronger network.
            <br />A thriving business community.
          </h2>
          <p>
            Connect with members, bring businesses together and keep your
            Chamber moving forward.
          </p>
        </div>
        <Link href="/events/new" className="button">
          Create an event <ArrowUpRight size={16} />
        </Link>
      </section>
      <div className="stats">
        {stats.map(([label, value, Icon, note]) => (
          <article className="stat" key={label}>
            <div className="stat-top">
              {label}
              <span className="stat-icon">
                <Icon size={17} />
              </span>
            </div>
            <strong>{value}</strong>
            <small>{note}</small>
          </article>
        ))}
      </div>
      <div className="split">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Recent transactions</h2>
              <span className="muted">
                Latest membership and event payments
              </span>
            </div>
            <Link className="text-button" href="/payments">
              View all →
            </Link>
          </div>
          <DataTable
            rows={d.latestPayments}
            columns={["billingName", "type", "totalAmount", "status"]}
          />
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Quick access</h2>
              <span className="muted">Your everyday workspace</span>
            </div>
          </div>
          <div className="quicklinks">
            {[
              ["/membership-plans", "Manage membership plans"],
              ["/event-bookings", "Review event registrations"],
              ["/enquiries", "Follow up on enquiries"],
              ["/news/new", "Publish a Chamber update"],
            ].map(([url, label]) => (
              <Link href={url} key={url}>
                {label}
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
