import type { ChamberEvent, News, Plan } from "@sme/types";

const futureDate = (days: number) => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString();
};

const eventBase: Omit<ChamberEvent, "id" | "slug" | "title" | "shortDescription" | "startDate" | "endDate" | "registrationDeadline" | "eventType" | "paid" | "price"> = {
  description: "A Chamber programme for practical learning, business connections and new opportunities.",
  bannerImage: "",
  eventUrl: "",
  venue: "SME Business Forum Convention Centre",
  address: "Mumbai, Maharashtra",
  city: "Mumbai",
  state: "Maharashtra",
  country: "India",
  googleMapsUrl: "",
  startTime: "10:00 AM",
  endTime: "05:00 PM",
  gstPercentage: 18,
  availableSeats: 150,
  organizerName: "SME Chamber of India",
  organizerEmail: "",
  organizerPhone: "",
  contactPerson: "SME Chamber Team",
  agenda: "Registration, expert sessions and networking.",
  terms: "Registration is subject to seat availability.",
  speakers: [],
  gallery: [],
};

export const backupEvents: ChamberEvent[] = [
  {
    ...eventBase,
    id: "offline-business-growth-summit",
    slug: "business-growth-summit",
    title: "Business Growth & SME Leadership Summit",
    shortDescription: "Ideas and practical pathways for the next stage of business growth.",
    eventType: "Conference",
    startDate: futureDate(14),
    endDate: futureDate(14),
    registrationDeadline: futureDate(13),
    paid: true,
    price: 250000,
  },
  {
    ...eventBase,
    id: "offline-international-trade-workshop",
    slug: "international-trade-workshop",
    title: "International Trade & Export Opportunities",
    shortDescription: "Explore trade documentation, global markets and export opportunities.",
    eventType: "Workshop",
    startDate: futureDate(28),
    endDate: futureDate(28),
    registrationDeadline: futureDate(27),
    paid: false,
    price: 0,
  },
];

export const backupPastEvents: ChamberEvent[] = backupEvents.map((event, index) => ({
  ...event,
  id: `past-${event.id}`,
  slug: `past-${event.slug}`,
  startDate: new Date(Date.now() - (index + 1) * 30 * 86400000).toISOString(),
  endDate: new Date(Date.now() - (index + 1) * 30 * 86400000).toISOString(),
  registrationDeadline: new Date(Date.now() - (index + 1) * 31 * 86400000).toISOString(),
}));

export const backupPlans: Plan[] = [
  {
    id: "offline-startup-membership",
    slug: "startup-membership",
    title: "Startup Membership",
    shortDescription: "For founders building and growing an early-stage enterprise.",
    fullDescription: "Connect with the Chamber ecosystem for learning, guidance and business opportunities.",
    durationMonths: 12,
    price: 500000,
    originalPrice: null,
    gstPercentage: 18,
    benefits: ["Business networking", "Events and programmes", "Knowledge sessions", "Growth guidance"],
    eligibility: "Startups and early-stage enterprises",
    termsAndConditions: "Membership is subject to review and approval.",
    featured: false,
    active: true,
  },
  {
    id: "offline-business-membership",
    slug: "business-membership",
    title: "Business Membership",
    shortDescription: "For established SMEs looking for visibility and stronger connections.",
    fullDescription: "Access industry interaction, business support and Chamber initiatives.",
    durationMonths: 12,
    price: 1000000,
    originalPrice: null,
    gstPercentage: 18,
    benefits: ["Priority networking", "Business development opportunities", "Industry interaction", "Member support"],
    eligibility: "Registered small and medium enterprises",
    termsAndConditions: "Membership is subject to review and approval.",
    featured: true,
    active: true,
  },
];

export const backupNews: News[] = [
  {
    id: "offline-chamber-update-1",
    slug: "chamber-update-1",
    title: "Building stronger connections for Indian SMEs",
    excerpt: "Updates and opportunities from the SME business community.",
    content: "The Chamber connects enterprises for knowledge, partnerships and sustainable growth.",
    featuredImage: "",
    category: "Chamber Updates",
    publishedAt: new Date().toISOString(),
  },
  {
    id: "offline-chamber-update-2",
    slug: "chamber-update-2",
    title: "New opportunities in international trade",
    excerpt: "Practical insights for businesses exploring global markets.",
    content: "Explore international opportunities and practical support for growing enterprises.",
    featuredImage: "",
    category: "Trade & Policy",
    publishedAt: new Date().toISOString(),
  },
];
