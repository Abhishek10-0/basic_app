import bcrypt from "bcryptjs";
import { db } from "../src/config/db.js";
import { env } from "../src/config/env.js";
async function main() {
  const passwordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12);
  const phones = env.ADMIN_PHONE.split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  for (let i = 0; i < Math.max(1, phones.length); i++)
    await db.admin.upsert({
      where: {
        email:
          i === 0 ? env.SEED_ADMIN_EMAIL : `admin-${i + 1}@smechamber.local`,
      },
      update: {},
      create: {
        name: env.SEED_ADMIN_NAME,
        email:
          i === 0 ? env.SEED_ADMIN_EMAIL : `admin-${i + 1}@smechamber.local`,
        mobile: phones[i] ?? null,
        passwordHash,
        role: "SUPER_ADMIN",
      },
    });
  if (process.argv.includes("--admin-only")) return;
  for (const [slug, title, durationMonths, price, featured] of [
    ["annual-membership", "Individual", 12, 1000000, false],
    ["three-year-membership", "Corporate", 36, 2500000, true],
    ["institutional-membership", "Institutional", 12, 4000000, false],
  ] as const) {
    await db.membershipPlan.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        title,
        durationMonths,
        price,
        featured,
        shortDescription:
          "Connect, grow and represent your enterprise through the Chamber.",
        fullDescription:
          "Build lasting business connections with entrepreneurs, industry leaders and institutional partners. Membership brings your enterprise closer to opportunities across India.",
        benefits: [
          "Business networking and introductions",
          "Guidance on business growth and exports",
          "Invitations to member programmes",
          "Access to Chamber updates and resources",
        ],
        eligibility:
          "Open to registered businesses and entrepreneurs, subject to Chamber review.",
        termsAndConditions:
          "Membership is subject to the Chamber rules. Event registration fees may apply separately.",
        gstPercentage: 18,
        sortOrder: durationMonths,
      },
    });
  }
  const base = new Date();
  base.setUTCDate(base.getUTCDate() + 30);
  for (let i = 0; i < 3; i++) {
    const titles = [
      "SME Business Growth Summit",
      "Export Readiness & Global Markets",
      "Entrepreneurs Networking Forum",
    ];
    const slugs = [
      "business-growth-summit",
      "export-readiness",
      "entrepreneurs-networking",
    ];
    const start = new Date(base);
    start.setUTCDate(start.getUTCDate() + i * 14);
    const end = new Date(start);
    end.setUTCHours(end.getUTCHours() + 8);
    const deadline = new Date(start);
    deadline.setUTCDate(deadline.getUTCDate() - 1);
    await db.event.upsert({
      where: { slug: slugs[i] },
      update: {},
      create: {
        title: titles[i],
        slug: slugs[i],
        shortDescription: [
          "Ideas, connections and practical pathways for your next stage of growth.",
          "Explore international trade, documentation and market opportunities.",
          "Meet fellow founders and build connections across industries.",
        ][i],
        description:
          "A Chamber programme bringing together entrepreneurs, business leaders and experts for practical discussions, knowledge exchange and professional networking. This is sample programme content for local development.",
        eventType: ["Conference", "Workshop", "Networking"][i],
        venue: "SME Business Forum Convention Centre",
        city: "Mumbai",
        state: "Maharashtra",
        address: "Mumbai, Maharashtra",
        startDate: start,
        endDate: end,
        registrationDeadline: deadline,
        availableSeats: 150,
        paid: i !== 2,
        price: i === 2 ? 0 : 250000,
        gstPercentage: 18,
        status: "PUBLISHED",
        published: true,
        featured: i === 0,
        agenda:
          "09:00 Registration and networking\n10:00 Inaugural session\n11:00 Expert discussions\n13:00 Networking lunch",
        terms:
          "Registration is subject to seat availability. Please carry your confirmation email.",
        organizerEmail: env.SMTP_FROM_EMAIL,
        organizerPhone: phones[0] ?? "",
        speakers: {
          create: [
            {
              name: "Chamber Expert Panel",
              designation: "Business advisory and industry representatives",
            },
          ],
        },
      },
    });
  }
  for (const [i, title] of [
    "Building stronger connections for Indian SMEs",
    "New opportunities in international trade",
    "Supporting the next generation of entrepreneurs",
  ].entries())
    await db.news.upsert({
      where: { slug: `chamber-update-${i + 1}` },
      update: {},
      create: {
        slug: `chamber-update-${i + 1}`,
        title,
        excerpt:
          "Updates, insights and opportunities from the SME business community.",
        content:
          "The Chamber brings enterprises together to exchange knowledge, explore partnerships and identify opportunities for sustainable business growth. Connect with our team to learn more about upcoming programmes and member support. This article is sample content for local development.",
        category: i === 1 ? "Trade & Policy" : "Chamber Updates",
        status: "PUBLISHED",
      },
    });
  await db.appSetting.upsert({
    where: { key: "organization" },
    update: {},
    create: {
      key: "organization",
      value: {
        organizationName: "SME Chamber of India",
        logo: "",
        favicon: "",
        email: env.SMTP_FROM_EMAIL,
        phone: phones[0] ?? "",
        whatsapp: phones[0] ?? "",
        address: "Mumbai, Maharashtra, India",
        website: "",
        socialLinks: "",
        copyright: "SME Chamber of India. All rights reserved.",
        senderName: "SME Chamber of India",
        supportEmail: env.SMTP_FROM_EMAIL,
        heroTitle: "Empowering SMEs.\nBuilding Businesses.",
        heroSubtitle:
          "A trusted platform for ideas, insight and opportunities that help Indian enterprises move forward.",
        banner: "",
        welcomeContent:
          "SME Chamber of India brings businesses, knowledge and opportunity together — with a clear focus on practical progress.",
        aboutContent:
          "SME Chamber of India brings together entrepreneurs, industry leaders and institutional partners to support enterprise development. Our focus is practical guidance, business connections and a stronger voice for SMEs.",
        servicesContent:
          "Business advisory\nExport and international trade guidance\nBusiness matchmaking\nFinance and investment facilitation\nSkills and entrepreneurship development\nPolicy representation",
        activitiesContent:
          "Industry conferences and business summits\nEntrepreneur networking meetings\nKnowledge sessions and workshops\nTrade delegations and market access programmes\nSector-focused business interactions",
      },
    },
  });
  console.log(
    "[API] Seed complete: admins, 3 plans, 3 events, 3 articles and organization settings.",
  );
}
main()
  .catch((e) => {
    console.error("[API] Seed failed", e.message);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
