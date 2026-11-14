/// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent, act } from "@testing-library/react";

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

afterEach(() => {
  vi.useRealTimers();
});

describe("ScanDrafts", () => {
  it("shows the generate progress list before the request resolves", () => {
    mockPost.mockReturnValue(new Promise(() => {}));
    render(<ScanDrafts slug="joes-pizza-ab12" writeReviewUrl={REVIEW_URL} />);
    expect(screen.getByTestId("generate-progress")).toBeDefined();
  });

  it("shows step 1 copy while loading", () => {
    mockPost.mockReturnValue(new Promise(() => {}));
    render(<ScanDrafts slug="joes-pizza-ab12" writeReviewUrl={REVIEW_URL} />);
    expect(screen.getByText(/finding the place you visited/i)).toBeDefined();
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

  it("renders drafts after a successful generate and removes the progress list", async () => {
    mockPost.mockResolvedValue({
      data: { reviews: REVIEWS, writeReviewUrl: REVIEW_URL },
    });
    render(<ScanDrafts slug="joes-pizza-ab12" writeReviewUrl={REVIEW_URL} />);
    expect(await screen.findByText("Great pasta!")).toBeDefined();
    expect(screen.queryByTestId("generate-progress")).toBeNull();
  });

  it("shows the generate-failed message on a 500", async () => {
    mockPost.mockRejectedValue({ response: { status: 500 } });
    render(<ScanDrafts slug="joes-pizza-ab12" writeReviewUrl={REVIEW_URL} />);
    expect(await screen.findByText(/couldn't generate/i)).toBeDefined();
  });

  it("shows the rate-limited message on a 429", async () => {
    mockPost.mockRejectedValue({ response: { status: 429 } });
    render(<ScanDrafts slug="joes-pizza-ab12" writeReviewUrl={REVIEW_URL} />);
    expect(await screen.findByText(/wait 30 seconds/i)).toBeDefined();
    expect(screen.queryByText(/couldn't generate/i)).toBeNull();
  });

  it("posts to the ?testing=true URL when the testing prop is true", async () => {
    mockPost.mockResolvedValue({
      data: { reviews: REVIEWS, writeReviewUrl: REVIEW_URL },
    });
    render(<ScanDrafts slug="joes-pizza-ab12" writeReviewUrl={REVIEW_URL} testing />);
    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith(
        "/api/b/joes-pizza-ab12/generate?testing=true"
      )
    );
  });

  it("shows the Oops message after 10 s when the request is still pending", async () => {
    vi.useFakeTimers();
    mockPost.mockReturnValue(new Promise(() => {}));
    render(<ScanDrafts slug="joes-pizza-ab12" writeReviewUrl={REVIEW_URL} />);
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByText(/oops/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /regenerate/i })).toBeDefined();
  });

  it("fires a second POST and hides the Oops message when Regenerate is clicked", async () => {
    vi.useFakeTimers();
    mockPost.mockReturnValue(new Promise(() => {}));
    render(<ScanDrafts slug="joes-pizza-ab12" writeReviewUrl={REVIEW_URL} />);
    await act(async () => {
      vi.advanceTimersByTime(10_000);
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /regenerate/i }));
    });
    expect(mockPost).toHaveBeenCalledTimes(2);
    // Timer reset — Oops message gone until another 10 s elapses.
    expect(screen.queryByText(/oops/i)).toBeNull();
  });
});
