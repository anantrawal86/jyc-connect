import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/services/api";

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe("backend API client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads public data from the backend without development fixtures", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response([]));
    vi.stubGlobal("fetch", fetchMock);

    await expect(api.getHubs()).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/hubs"),
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("submits registration details including department to the OTP endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ expiresIn: 600, resendAfter: 60 }, 202));
    vi.stubGlobal("fetch", fetchMock);

    const input = {
      fullName: "Student Name",
      email: "student@example.edu",
      rollNumber: "123456",
      department: "Computer Science",
    };
    await expect(api.requestOtp(input)).resolves.toMatchObject({ expiresIn: 600 });
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/api/auth/register/request-otp");
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toEqual(input);
  });

  it("preserves backend validation and auth errors for the UI", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          response({ code: "UNAUTHENTICATED", message: "Please log in to continue." }, 401),
        ),
    );

    await expect(api.getDashboard()).rejects.toMatchObject({
      status: 401,
      code: "UNAUTHENTICATED",
      message: "Please log in to continue.",
    });
  });
});
