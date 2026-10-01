import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
const env = Object.fromEntries(
  readFileSync("services/api/.env", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
mkdirSync(".local/screenshots", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const errors = [];
const admin = await browser.newPage({
  viewport: { width: 1440, height: 1080 },
});
admin.on("pageerror", (e) => errors.push("admin: " + e.message));
await admin.goto("http://localhost:3000/login");
await admin
  .getByLabel("Email or mobile number")
  .fill(env.ADMIN_PHONE.split(",")[0]);
await admin.getByLabel("Password", { exact: true }).fill(env.ADMIN_PASSWORD);
await admin.getByRole("button", { name: "Sign in securely" }).click();
await admin.getByRole("heading", { name: "Dashboard overview" }).waitFor();
await admin.screenshot({
  path: ".local/screenshots/admin-dashboard.png",
  fullPage: true,
});
for (const path of [
  "membership-plans",
  "events",
  "event-bookings",
  "users",
  "memberships",
  "payments",
  "news",
  "notifications",
  "enquiries",
  "media",
  "settings",
  "admins",
  "logs",
]) {
  await admin.goto("http://localhost:3000/" + path);
  await admin.locator("h1").waitFor();
  if (await admin.getByText("Server error. Please try again.").count())
    throw new Error("Admin API error on " + path);
}
await admin.goto("http://localhost:3000/events/new");
await admin.getByRole("button", { name: "Save changes" }).waitFor();
await admin.screenshot({
  path: ".local/screenshots/admin-event-form.png",
  fullPage: true,
});
const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
mobile.on("pageerror", (e) => errors.push("mobile: " + e.message));
mobile.on("console", (m) => {
  if (m.type() === "error" && !m.text().includes("401"))
    errors.push("mobile console: " + m.text());
});
await mobile.goto("http://localhost:8081");
await mobile
  .getByText("A stronger ecosystem for every enterprise.")
  .waitFor({ timeout: 60000 });
await mobile.screenshot({
  path: ".local/screenshots/mobile-home.png",
  fullPage: true,
});
await mobile.goto("http://localhost:8081/events");
await mobile.getByText("Ideas worth showing up for").waitFor();
await mobile
  .getByText("Entrepreneurs Networking Forum", { exact: true })
  .click();
await mobile.getByText("Register for this event").click();
await mobile.getByText("Reserve your place.").waitFor();
await mobile.screenshot({
  path: ".local/screenshots/mobile-booking.png",
  fullPage: true,
});
await mobile.goto("http://localhost:8081/membership/annual-membership");
await mobile.getByText("Buy membership").click();
await mobile.getByText("Good to see you again.").waitFor();
await mobile.goto("http://localhost:8081/profile");
await mobile.getByText("Log in / Sign up").waitFor();
writeFileSync(".local/browser-errors.json", JSON.stringify(errors, null, 2));
await browser.close();
if (errors.length) throw new Error(errors.join("\n"));
console.log(
  "Browser checks passed: admin login, all admin routes, mobile home, guest booking entry, membership login guard.",
);
