/// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { CopyButton } from "./CopyButton";

const writeText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, { clipboard: { writeText } });

beforeEach(() => {
  writeText.mockClear();
  cleanup();
});

describe("CopyButton", () => {
  it("calls clipboard.writeText with the given text on click", async () => {
    const onCopied = vi.fn();
    render(<CopyButton text="Great pizza!" copied={false} onCopied={onCopied} />);
    fireEvent.click(screen.getByRole("button", { name: /copy review/i }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("Great pizza!")
    );
  });

  it("calls onCopied after a successful copy", async () => {
    const onCopied = vi.fn();
    render(<CopyButton text="Great pizza!" copied={false} onCopied={onCopied} />);
    fireEvent.click(screen.getByRole("button", { name: /copy review/i }));
    await waitFor(() => expect(onCopied).toHaveBeenCalledTimes(1));
  });

  it("shows Copied aria-label when copied=true", () => {
    render(<CopyButton text="x" copied={true} onCopied={vi.fn()} />);
    expect(screen.getByRole("button", { name: /copied/i })).toBeDefined();
  });

  it("does not call onCopied when clipboard.writeText rejects", async () => {
    writeText.mockRejectedValueOnce(new Error("denied"));
    const onCopied = vi.fn();
    render(<CopyButton text="x" copied={false} onCopied={onCopied} />);
    fireEvent.click(screen.getByRole("button", { name: /copy review/i }));
    // give time for the promise to settle
    await new Promise((r) => setTimeout(r, 50));
    expect(onCopied).not.toHaveBeenCalled();
  });
});
