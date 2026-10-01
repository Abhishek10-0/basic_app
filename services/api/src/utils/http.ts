import type { Response } from "express";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const ok = <T>(res: Response, data: T, message = "OK", status = 200) =>
  res.status(status).json({ success: true, message, data });
export const assert = (
  condition: unknown,
  status: number,
  message: string,
): void => {
  if (!condition) throw new HttpError(status, message);
};
