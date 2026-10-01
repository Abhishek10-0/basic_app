import { db } from "../src/config/db.js";
import "../src/config/env.js";
await db.membershipPlan.update({
  where: { slug: "annual-membership" },
  data: {
    title: "Individual",
    shortDescription:
      "For professionals, founders and independent business leaders.",
    benefits: ["Member-only events", "Knowledge sessions", "Community access"],
    sortOrder: 1,
  },
});
await db.membershipPlan.update({
  where: { slug: "three-year-membership" },
  data: {
    title: "Corporate",
    shortDescription:
      "For growing companies seeking a stronger voice and wider reach.",
    benefits: [
      "Team participation",
      "Business visibility",
      "Industry interaction",
    ],
    sortOrder: 2,
  },
});
await db.membershipPlan.update({
  where: { slug: "institutional-membership" },
  data: {
    shortDescription:
      "For institutions and ecosystem partners building meaningful impact.",
    benefits: [
      "Programme partnership",
      "Policy conversations",
      "Strategic networking",
    ],
    sortOrder: 3,
  },
});
for (const [slug, eventType] of [
  ["business-growth-summit", "Conference"],
  ["export-readiness", "Workshop"],
  ["entrepreneurs-networking", "Networking"],
])
  await db.event.update({ where: { slug }, data: { eventType } });
const current = await db.appSetting.findUniqueOrThrow({
  where: { key: "organization" },
});
await db.appSetting.update({
  where: { key: "organization" },
  data: {
    value: {
      ...(current.value as Record<string, string>),
      heroTitle: "Empowering SMEs.\nBuilding Businesses.",
      heroSubtitle:
        "A trusted platform for ideas, insight and opportunities that help Indian enterprises move forward.",
      welcomeContent:
        "SME Chamber of India brings businesses, knowledge and opportunity together — with a clear focus on practical progress.",
    },
  },
});
await db.$disconnect();
console.log("Reference membership categories and event types applied.");
