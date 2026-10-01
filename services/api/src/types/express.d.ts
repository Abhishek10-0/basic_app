import "express";
declare global {
  namespace Express {
    interface Request {
      auth?: { id: string; kind: "user" | "admin"; role?: string };
    }
  }
}
