import { vi } from "vitest";

// Framer Motion uses JS-driven animations. In jsdom there is no animation
// engine, so AnimatePresence never fires its exit callback and removed
// elements stay in the DOM, breaking assertions. Replace with pass-through
// wrappers so tests see the same component tree without animation timing.
vi.mock("framer-motion", () => {
  const React = require("react");

  return {
    motion: new Proxy(
      {},
      {
        get: (_: unknown, tag: string) =>
          // eslint-disable-next-line react/display-name
          React.forwardRef(
            (
              { children, ...props }: React.PropsWithChildren<object>,
              ref: React.Ref<unknown>
            ) => React.createElement(tag, { ...props, ref }, children)
          ),
      }
    ),
    AnimatePresence: ({ children }: React.PropsWithChildren) => children,
    useReducedMotion: () => false,
  };
});
