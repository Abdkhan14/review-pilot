import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ verifySession: vi.fn() }));
vi.mock("@/lib/business-repo", () => ({ findById: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/encode-qr", () => ({
  encodeQrPng: vi.fn(),
  encodeQrSvg: vi.fn(),
}));

import * as auth from "@/lib/auth";
import * as repo from "@/lib/business-repo";
import * as encoder from "@/lib/encode-qr";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { ADMIN_COOKIE } from "@/lib/session-cookie";

const mockVerify = vi.mocked(auth.verifySession);
const mockFindById = vi.mocked(repo.findById);
const mockEncodePng = vi.mocked(encoder.encodeQrPng);
const mockEncodeSvg = vi.mocked(encoder.encodeQrSvg);

const MOCK_BUSINESS = {
  id: "cuid-1",
  slug: "joes-pizza-ab12",
  name: "Joe's Pizza",
  tier: "BASIC",
  placeId: "ChIJ123",
  customInstructions: null,
  details: null,
  detailsFetchedAt: null,
  createdAt: new Date(),
};

function makeGet(
  id: string,
  format?: string,
  cookie?: string
): Promise<Response> {
  const url = new URL(`http://localhost/api/admin/businesses/${id}/qr`);
  if (format) url.searchParams.set("format", format);
  const headers: Record<string, string> = {};
  if (cookie) headers["cookie"] = `${ADMIN_COOKIE}=${cookie}`;
  const req = new NextRequest(url.toString(), { headers });
  const ctx = { params: Promise.resolve({ id }) };
  return GET(req, ctx);
}

describe("GET /api/admin/businesses/[id]/qr", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.APP_URL = "https://example.com";
  });

  it("returns 401 without cookie", async () => {
    const res = await makeGet("cuid-1", "png");
    expect(res.status).toBe(401);
    expect(mockEncodePng).not.toHaveBeenCalled();
  });

  it("returns 401 with an invalid cookie", async () => {
    mockVerify.mockRejectedValue(new Error("bad token"));
    const res = await makeGet("cuid-1", "png", "bad-token");
    expect(res.status).toBe(401);
    expect(mockEncodePng).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown id", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    mockFindById.mockResolvedValue(null);
    const res = await makeGet("unknown-id", "png", "valid-token");
    expect(res.status).toBe(404);
    expect(mockEncodePng).not.toHaveBeenCalled();
  });

  it("returns 400 when format is missing", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    mockFindById.mockResolvedValue(MOCK_BUSINESS as any);
    const res = await makeGet("cuid-1", undefined, "valid-token");
    expect(res.status).toBe(400);
    expect(mockEncodePng).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid format value", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    mockFindById.mockResolvedValue(MOCK_BUSINESS as any);
    const res = await makeGet("cuid-1", "gif", "valid-token");
    expect(res.status).toBe(400);
    expect(mockEncodePng).not.toHaveBeenCalled();
  });

  it("returns PNG with correct Content-Type and Content-Disposition", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    mockFindById.mockResolvedValue(MOCK_BUSINESS as any);
    mockEncodePng.mockResolvedValue(Buffer.from("fake-png-bytes"));

    const res = await makeGet("cuid-1", "png", "valid-token");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Content-Disposition")).toBe(
      'attachment; filename="joes-pizza-ab12.png"'
    );
  });

  it("returns SVG with correct Content-Type and Content-Disposition", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    mockFindById.mockResolvedValue(MOCK_BUSINESS as any);
    mockEncodeSvg.mockResolvedValue("<svg>...</svg>");

    const res = await makeGet("cuid-1", "svg", "valid-token");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/svg+xml");
    expect(res.headers.get("Content-Disposition")).toBe(
      'attachment; filename="joes-pizza-ab12.svg"'
    );
  });

  it("encodes the scan URL (/b/slug), not the Google write-review URL", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    mockFindById.mockResolvedValue(MOCK_BUSINESS as any);
    mockEncodePng.mockResolvedValue(Buffer.from("fake-png"));

    await makeGet("cuid-1", "png", "valid-token");
    expect(mockEncodePng).toHaveBeenCalledWith(
      expect.stringContaining("/b/joes-pizza-ab12")
    );
    expect(mockEncodePng).not.toHaveBeenCalledWith(
      expect.stringContaining("google.com")
    );
  });

  it("response body equals encoder output for PNG", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    mockFindById.mockResolvedValue(MOCK_BUSINESS as any);
    const mockBuf = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    mockEncodePng.mockResolvedValue(mockBuf);

    const res = await makeGet("cuid-1", "png", "valid-token");
    const body = Buffer.from(await res.arrayBuffer());
    expect(body).toEqual(mockBuf);
  });
});
