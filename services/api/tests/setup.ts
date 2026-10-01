import dotenv from "dotenv";
dotenv.config({ path: ".env.test", override: true, quiet: true });
process.env.NODE_ENV = "test";
if (
  !["localhost", "127.0.0.1"].includes(
    new URL(process.env.DATABASE_URL ?? "").hostname,
  )
)
  throw new Error("Tests must use a local database in .env.test");
process.env.MAIL_DELIVERY_ENABLED = "false";
