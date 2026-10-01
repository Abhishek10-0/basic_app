import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("../src/config/env.js", () => ({
  env: {
    SMS_GATEWAY_URL: "http://sms.example.test/send",
    SMS_API_KEY: "test-key",
    SMS_ENTITY_ID: "test-entity",
    SMS_SENDER_ID: "SMECHM",
    SMS_SENDER_ID_MARATHI_BUSINESS_FORUM: "MARATHI",
  },
}));
import { sendSmsOTP, normaliseMobile } from "../src/services/sms.js";
afterEach(() => vi.unstubAllGlobals());
describe("SMS gateway", () => {
  it("normalises Indian and international numbers", () => {
    expect(normaliseMobile("9876543210")).toBe("919876543210");
    expect(normaliseMobile("+919876543210")).toBe("919876543210");
    expect(normaliseMobile("+447123456789")).toBe("447123456789");
  });
  it("sends the registered SME template and gateway parameters", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("Message submitted"));
    vi.stubGlobal("fetch", fetch);
    await sendSmsOTP("9876543210", "123456");
    const url = fetch.mock.calls[0][0] as URL;
    expect(Object.fromEntries(url.searchParams)).toEqual({
      apikey: "test-key",
      type: "TEXT",
      sender: "SMECHM",
      entityId: "test-entity",
      mobile: "919876543210",
      message: "123456 is the OTP for the registration process - SMECHM",
    });
  });
  it("uses the Marathi sender and template", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("Message submitted"));
    vi.stubGlobal("fetch", fetch);
    await sendSmsOTP("9876543210", "123456", "marathi-business-forum");
    const url = fetch.mock.calls[0][0] as URL;
    expect(url.searchParams.get("sender")).toBe("MARATHI");
    expect(url.searchParams.get("message")).toBe(
      "123456 is the OTP for the registration process for MIDAIN - Small and Medium Business Development Chamber of India",
    );
  });
  it.each(["error: invalid key", " 1002 rejected", "ERR_PARAMETER", ""])(
    "rejects gateway failure %j",
    async (body) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body)));
      await expect(sendSmsOTP("9876543210", "123456")).rejects.toThrow(
        "SMS delivery failed",
      );
    },
  );
  it("handles HTTP and network failures without exposing credentials", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 })),
    );
    await expect(sendSmsOTP("9876543210", "123456")).rejects.toMatchObject({
      reason: "http_503",
    });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("test-key")));
    await expect(sendSmsOTP("9876543210", "123456")).rejects.toThrow(
      "SMS delivery failed",
    );
  });
});
