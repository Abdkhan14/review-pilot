/// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";

vi.mock("@/hooks/api", () => ({ api: { post: vi.fn() } }));

import { api } from "@/hooks/api";
import { ScanDrafts } from "./ScanDrafts";

const mockPost = vi.mocked(api.post);

const REVIEWS = [
  { id: "1", angle: "food", text: "Great pasta!" },
  { id: "2", angle: "service", text: "Lovely service." },
  { id: "3", angle: "vibe", text: "Would come back." },
];
const REVIEW_URL = "https://search.google.com/local/writereview?placeid=abc";

beforeEach(() => {
  mockPost.mockReset();
  cleanup();
});

describe("ScanDrafts", () => {
  it("shows skeletons before the generate request resolves", () => {
    mockPost.mockReturnValue(new Promise(() => {}));
    render(<ScanDrafts slug="joes-pizza-ab12" writeReviewUrl={REVIEW_URL} />);
    expect(screen.getByTestId("drafts-skeleton")).toBeDefined();
  });

  it("posts to the generate API for the slug", async () => {
    mockPost.mockResolvedValue({
      data: { reviews: REVIEWS, writeReviewUrl: REVIEW_URL },
    });
    render(<ScanDrafts slug="joes-pizza-ab12" writeReviewUrl={REVIEW_URL} />);
    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/api/b/joes-pizza-ab12/generate")
    );
  });

  it("renders drafts after a successful generate", async () => {
    mockPost.mockResolvedValue({
      data: { reviews: REVIEWS, writeReviewUrl: REVIEW_URL },
    });
    render(<ScanDrafts slug="joes-pizza-ab12" writeReviewUrl={REVIEW_URL} />);
    expect(await screen.findByText("Great pasta!")).toBeDefined();
    expect(screen.queryByTestId("drafts-skeleton")).toBeNull();
  });

  it("shows the generate-failed message on a 500", async () => {
    mockPost.mockRejectedValue({ response: { status: 500 } });
    render(<ScanDrafts slug="joes-pizza-ab12" writeReviewUrl={REVIEW_URL} />);
    expect(await screen.findByText(/couldn't generate/i)).toBeDefined();
  });

  it("does not show the generate-failed message on a 429", async () => {
    mockPost.mockRejectedValue({ response: { status: 429 } });
    render(<ScanDrafts slug="joes-pizza-ab12" writeReviewUrl={REVIEW_URL} />);
    expect(
      await screen.findByRole("link", { name: /skip to google reviews/i })
    ).toBeDefined();
    expect(screen.queryByText(/couldn't generate/i)).toBeNull();
  });
});
