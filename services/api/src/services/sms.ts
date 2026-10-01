import { env } from "../config/env.js";

export class SmsGatewayError extends Error {
  constructor(public readonly reason: string) {
    super("SMS delivery failed");
  }
}

export function normaliseMobile(mobile: string): string {
  const digits = mobile.replace(/^\+/, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export async function sendSmsOTP(
  mobile: string,
  code: string,
  forumSlug = "sme",
): Promise<void> {
  const sender =
    forumSlug === "marathi-business-forum"
      ? env.SMS_SENDER_ID_MARATHI_BUSINESS_FORUM
      : env.SMS_SENDER_ID;
  if (!env.SMS_API_KEY || !sender || !env.SMS_ENTITY_ID) {
    throw new SmsGatewayError("configuration_missing");
  }
  const url = new URL(env.SMS_GATEWAY_URL);
  url.search = new URLSearchParams({
    apikey: env.SMS_API_KEY,
    type: "TEXT",
    sender,
    entityId: env.SMS_ENTITY_ID,
    mobile: normaliseMobile(mobile),
    message:
      forumSlug === "marathi-business-forum"
        ? `${code} is the OTP for the registration process for MIDAIN - Small and Medium Business Development Chamber of India`
        : `${code} is the OTP for the registration process - SMECHM`,
  }).toString();
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch (error) {
    throw new SmsGatewayError(
      error instanceof DOMException && error.name === "TimeoutError"
        ? "timeout"
        : "unreachable",
    );
  }
  if (!response.ok) throw new SmsGatewayError(`http_${response.status}`);
  const body = (await response.text()).trim();
  if (
    !body ||
    /(?:error|invalid|reject|fail)/i.test(body) ||
    /^ERR_/i.test(body) ||
    body.startsWith("1002")
  ) {
    const providerCode = body.match(/^(?:ERR_[A-Z_]+|\d{4})/i)?.[0];
    throw new SmsGatewayError(
      providerCode
        ? `provider_${providerCode.toLowerCase()}`
        : "provider_rejected",
    );
  }
}
