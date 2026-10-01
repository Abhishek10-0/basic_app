export const resourceConfig: Record<
  string,
  {
    title: string;
    description: string;
    columns: string[];
    create?: boolean;
    detail?: boolean;
    statuses?: string[];
  }
> = {
  users: {
    title: "Users",
    description:
      "Your growing community of entrepreneurs and business leaders.",
    columns: [
      "firstName",
      "lastName",
      "email",
      "mobile",
      "companyName",
      "disabled",
    ],
    detail: true,
  },
  "membership-plans": {
    title: "Membership Plans",
    description: "Flexible membership programmes for your business community.",
    columns: ["title", "durationMonths", "price", "gstPercentage", "active"],
    create: true,
    detail: true,
  },
  memberships: {
    title: "Memberships",
    description:
      "Track membership validity, renewals and member relationships.",
    columns: ["user", "planTitle", "status", "startDate", "endDate"],
    detail: true,
    statuses: ["PENDING", "ACTIVE", "EXPIRED", "CANCELLED", "FAILED"],
  },
  events: {
    title: "Events",
    description:
      "Bring the business community together through meaningful programmes.",
    columns: ["title", "eventType", "startDate", "time", "location", "status"],
    create: true,
    detail: true,
    statuses: ["DRAFT", "PUBLISHED", "ARCHIVED"],
  },
  "event-bookings": {
    title: "Event Bookings",
    description: "Manage guest registrations, attendance and booking details.",
    columns: [
      "reference",
      "fullName",
      "event",
      "attendees",
      "status",
      "createdAt",
    ],
    detail: true,
    statuses: [
      "PAYMENT_PENDING",
      "CONFIRMED",
      "CANCELLED",
      "FAILED",
      "ATTENDED",
    ],
  },
  payments: {
    title: "Payments",
    description: "A clear record of membership and event transactions.",
    columns: ["billingName", "type", "totalAmount", "status", "createdAt"],
    detail: true,
    statuses: ["CREATED", "PENDING", "PAID", "FAILED", "REFUNDED"],
  },
  news: {
    title: "News & Updates",
    description:
      "Keep the community informed with Chamber announcements and insights.",
    columns: ["title", "category", "status", "publishedAt"],
    create: true,
    detail: true,
    statuses: ["DRAFT", "PUBLISHED", "ARCHIVED"],
  },
  notifications: {
    title: "Notifications",
    description:
      "Send an in-app and rich push announcement to every registered member.",
    columns: ["title", "message", "status", "createdAt"],
    create: true,
  },
  enquiries: {
    title: "Enquiries",
    description: "Turn business enquiries into meaningful conversations.",
    columns: ["name", "company", "subject", "email", "status"],
    detail: true,
    statuses: ["NEW", "CONTACTED", "CLOSED"],
  },
  media: {
    title: "Media Library",
    description: "Upload and manage images for events and Chamber updates.",
    columns: ["filename", "mimeType", "size", "createdAt"],
  },
  admins: {
    title: "Administrators",
    description: "Manage authorised access to the Chamber administration.",
    columns: ["name", "email", "mobile", "role", "disabled"],
    create: true,
  },
  logs: {
    title: "Activity Logs",
    description: "An audit trail of changes made by your administration team.",
    columns: ["admin", "action", "resource", "resourceId", "createdAt"],
  },
};
export type Field = {
  key: string;
  label?: string;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "checkbox"
    | "date"
    | "date-only"
    | "time"
    | "json"
    | "lines"
    | "password"
    | "email";
  options?: string[];
  required?: boolean;
  initial?: unknown;
};
const f = (
  key: string,
  type: Field["type"] = "text",
  initial: unknown = "",
  required = false,
): Field => ({ key, type, initial, required });
export const fields: Record<string, Field[]> = {
  "membership-plans": [
    f("title", "text", "", true),
    f("slug", "text", "", true),
    f("shortDescription", "textarea", "", true),
    f("fullDescription", "textarea"),
    f("durationMonths", "number", 12, true),
    {
      ...f("price", "number", 1000000, true),
      label: "Price (paise; ?1 = 100 paise)",
    },
    f("originalPrice", "number"),
    f("gstPercentage", "number", 18, true),
    f("benefits", "lines", "Business networking\nExpert guidance", true),
    f("eligibility", "textarea"),
    f("termsAndConditions", "textarea"),
    f("active", "checkbox", true),
    f("featured", "checkbox", false),
    f("sortOrder", "number", 0),
  ],
  events: [
    f("title", "text", "", true),
    f("slug", "text", "", true),
    f("shortDescription", "textarea", "", true),
    f("description", "textarea"),
    { ...f("bannerImage", "text", "", true), label: "Event Image URL" },
    { ...f("eventUrl", "text", "", true), label: "Event Website URL" },
    f("venue", "text", "", true),
    f("address"),
    f("city", "text", "Mumbai", true),
    f("state", "text", "Maharashtra"),
    f("country", "text", "India"),
    f("googleMapsUrl"),
    f("startDate", "date", "", true),
    f("endDate", "date", "", true),
    f("startTime", "text", "09:00"),
    f("endTime", "text", "17:00"),
    f("eventType", "text", "Conference"),
    f("paid", "checkbox", false),
    { ...f("price", "number", 0), label: "Price per attendee (paise)" },
    f("gstPercentage", "number", 18),
    f("availableSeats", "number", 100, true),
    f("registrationDeadline", "date", "", true),
    f("organizerName", "text", "SME Chamber of India"),
    f("organizerEmail", "email"),
    f("organizerPhone"),
    f("contactPerson"),
    f("agenda", "textarea"),
    f("terms", "textarea"),
    {
      key: "status",
      options: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      initial: "DRAFT",
    },
    f("published", "checkbox", false),
    f("featured", "checkbox", false),
    {
      ...f("speakers", "json", "[]"),
      label: "Speakers",
    },
    {
      ...f("gallery", "json", "[]"),
      label: "Event gallery",
    },
  ],
  news: [
    f("title", "text", "", true),
    f("slug", "text", "", true),
    f("excerpt", "textarea", "", true),
    f("content", "textarea", "", true),
    f("featuredImage"),
    f("category", "text", "Chamber Updates"),
    f("publishedAt", "date", new Date().toISOString().slice(0, 16), true),
    {
      key: "status",
      options: ["DRAFT", "PUBLISHED", "ARCHIVED"],
      initial: "DRAFT",
    },
  ],
  notifications: [
    f("title", "text", "", true),
    f("message", "textarea", "", true),
    f("deepLink"),
    { ...f("imageUrl"), label: "Image (optional)" },
    f("scheduledFor", "date"),
  ],
  admins: [
    f("name", "text", "", true),
    f("email", "email", "", true),
    f("mobile", "text", "", true),
    f("password", "password", "", true),
    {
      key: "role",
      options: ["ADMIN", "EDITOR", "SUPER_ADMIN"],
      initial: "EDITOR",
    },
  ],
  settings: [
    f("organizationName", "text", "", true),
    f("logo"),
    f("favicon"),
    f("email", "email", "", true),
    f("phone"),
    f("whatsapp"),
    f("address", "textarea"),
    f("website"),
    f("socialLinks", "textarea"),
    f("copyright"),
    f("senderName"),
    f("supportEmail", "email", "", true),
    f("heroTitle", "textarea"),
    f("heroSubtitle", "textarea"),
    f("banner"),
    f("welcomeContent", "textarea"),
    f("aboutContent", "textarea"),
    f("servicesContent", "textarea"),
    f("activitiesContent", "textarea"),
  ],
};

export const eventCreateFields: Field[] = [
  { ...f("bannerImage", "text", "", true), label: "Event Image URL" },
  { ...f("eventUrl", "text", "", true), label: "Event Website URL" },
  { ...f("eventType", "text", "Conference", true), label: "Event Type" },
  { ...f("title", "text", "", true), label: "Event Name" },
  { ...f("startDate", "date-only", "", true), label: "Event Date" },
  { ...f("startTime", "time", "09:00", true), label: "Start Time" },
  { ...f("endTime", "time", "17:00", true), label: "End Time" },
  { ...f("venue", "text", "", true), label: "Location" },
];
export const label = (field: Field) =>
  field.label ??
  field.key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
