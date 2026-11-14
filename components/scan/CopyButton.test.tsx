/// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CopyButton } from "./CopyButton";

describe("CopyButton", () => {
  it("is decorative and not a nested button", () => {
    const { container } = render(<CopyButton copied={false} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
  });
});
