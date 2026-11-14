/// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { DraftPicker } from "./DraftPicker";

const writeText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, { clipboard: { writeText } });

const DRAFTS = [
  { id: "1", text: "Great pasta!" },
  { id: "2", text: "Lovely service." },
  { id: "3", text: "Would come back." },
];
const REVIEW_URL = "https://search.google.com/local/writereview?placeid=abc";
const SLUG = "test-slug-ab12";

const sendBeacon = vi.fn().mockReturnValue(true);
Object.assign(navigator, { sendBeacon });

beforeEach(() => {
  writeText.mockClear();
  sendBeacon.mockClear();
  cleanup();
});

describe("DraftPicker", () => {
  it("skip link href is writeReviewUrl", () => {
    render(<DraftPicker drafts={DRAFTS} writeReviewUrl={REVIEW_URL} slug={SLUG} />);
    const link = screen.getByRole("link", { name: /skip to google reviews/i });
    expect(link.getAttribute("href")).toBe(REVIEW_URL);
  });

  it("skip link is visible before any copy", () => {
    render(<DraftPicker drafts={DRAFTS} writeReviewUrl={REVIEW_URL} slug={SLUG} />);
    expect(
      screen.getByRole("link", { name: /skip to google reviews/i })
    ).toBeDefined();
  });

  it("OR row is visible before any copy when drafts exist", () => {
    render(<DraftPicker drafts={DRAFTS} writeReviewUrl={REVIEW_URL} slug={SLUG} />);
    expect(screen.getByText("OR")).toBeDefined();
  });

  it("renders without OR when drafts is empty", () => {
    render(<DraftPicker drafts={[]} writeReviewUrl={REVIEW_URL} slug={SLUG} />);
    expect(screen.queryByText("OR")).toBeNull();
  });

  it("skip still renders when drafts is empty", () => {
    render(<DraftPicker drafts={[]} writeReviewUrl={REVIEW_URL} slug={SLUG} />);
    expect(
      screen.getByRole("link", { name: /skip to google reviews/i })
    ).toBeDefined();
  });

  it("shows error message when generateFailed is true", () => {
    render(
      <DraftPicker drafts={[]} writeReviewUrl={REVIEW_URL} slug={SLUG} generateFailed />
    );
    expect(
      screen.getByText(/couldn't generate/i)
    ).toBeDefined();
  });

  it("does not show error message when generateFailed is false", () => {
    render(
      <DraftPicker drafts={DRAFTS} writeReviewUrl={REVIEW_URL} slug={SLUG} generateFailed={false} />
    );
    expect(screen.queryByText(/couldn't generate/i)).toBeNull();
  });

  it("shows rate-limited message when rateLimited is true and drafts are empty", () => {
    render(
      <DraftPicker drafts={[]} writeReviewUrl={REVIEW_URL} slug={SLUG} rateLimited />
    );
    expect(screen.getByText(/wait 30 seconds/i)).toBeDefined();
    expect(screen.queryByText(/couldn't generate/i)).toBeNull();
  });

  it("does not show rate-limited message when drafts are present", () => {
    render(
      <DraftPicker drafts={DRAFTS} writeReviewUrl={REVIEW_URL} slug={SLUG} rateLimited />
    );
    expect(screen.queryByText(/wait 30 seconds/i)).toBeNull();
  });

  it("clicking copy on card 2 calls clipboard with card 2 text", async () => {
    render(<DraftPicker drafts={DRAFTS} writeReviewUrl={REVIEW_URL} slug={SLUG} />);
    const copyButtons = screen.getAllByRole("button", { name: /copy review/i });
    fireEvent.click(copyButtons[1]); // card 2 (index 1)
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("Lovely service.")
    );
  });

  it("after copy: other cards are hidden", async () => {
    render(<DraftPicker drafts={DRAFTS} writeReviewUrl={REVIEW_URL} slug={SLUG} />);
    const copyButtons = screen.getAllByRole("button", { name: /copy review/i });
    fireEvent.click(copyButtons[1]);
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(screen.queryByText("Great pasta!")).toBeNull();
    expect(screen.queryByText("Would come back.")).toBeNull();
    expect(screen.getByText("Lovely service.")).toBeDefined();
  });

  it("after copy: OR row is hidden", async () => {
    render(<DraftPicker drafts={DRAFTS} writeReviewUrl={REVIEW_URL} slug={SLUG} />);
    const copyButtons = screen.getAllByRole("button", { name: /copy review/i });
    fireEvent.click(copyButtons[0]);
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(screen.queryByText("OR")).toBeNull();
  });

  it("after copy: link label changes to Go to Google Reviews", async () => {
    render(<DraftPicker drafts={DRAFTS} writeReviewUrl={REVIEW_URL} slug={SLUG} />);
    const copyButtons = screen.getAllByRole("button", { name: /copy review/i });
    fireEvent.click(copyButtons[0]);
    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: /go to google reviews/i })
      ).toBeDefined()
    );
  });

  it("after copy: href of the link is unchanged", async () => {
    render(<DraftPicker drafts={DRAFTS} writeReviewUrl={REVIEW_URL} slug={SLUG} />);
    const copyButtons = screen.getAllByRole("button", { name: /copy review/i });
    fireEvent.click(copyButtons[0]);
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const link = screen.getByRole("link", { name: /go to google reviews/i });
    expect(link.getAttribute("href")).toBe(REVIEW_URL);
  });

  it("sendBeacon fires with the handoff URL when Go to Google Reviews is clicked after copy", async () => {
    render(<DraftPicker drafts={DRAFTS} writeReviewUrl={REVIEW_URL} slug={SLUG} />);
    const copyButtons = screen.getAllByRole("button", { name: /copy review/i });
    fireEvent.click(copyButtons[0]);
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const link = screen.getByRole("link", { name: /go to google reviews/i });
    fireEvent.click(link);
    expect(sendBeacon).toHaveBeenCalledWith(`/api/b/${SLUG}/handoff`);
  });

  it("sendBeacon does not fire when Skip to Google Reviews is clicked", () => {
    render(<DraftPicker drafts={DRAFTS} writeReviewUrl={REVIEW_URL} slug={SLUG} />);
    const link = screen.getByRole("link", { name: /skip to google reviews/i });
    fireEvent.click(link);
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("sendBeacon does not fire in testing mode even after copy and Go to Google Reviews click", async () => {
    render(<DraftPicker drafts={DRAFTS} writeReviewUrl={REVIEW_URL} slug={SLUG} testing />);
    const copyButtons = screen.getAllByRole("button", { name: /copy review/i });
    fireEvent.click(copyButtons[0]);
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const link = screen.getByRole("link", { name: /go to google reviews/i });
    fireEvent.click(link);
    expect(sendBeacon).not.toHaveBeenCalled();
  });
});
