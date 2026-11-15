"use client";

import { useEffect } from "react";
import { animate, type AnimationPlaybackControls } from "framer-motion";

const NAV_SELECTOR = "[data-landing-nav]";
const INTERRUPT_EVENTS = ["wheel", "touchstart", "keydown"] as const;

function targetTop(el: HTMLElement): number {
  const navHeight = document.querySelector<HTMLElement>(NAV_SELECTOR)?.offsetHeight ?? 0;
  return el.getBoundingClientRect().top + window.scrollY - navHeight;
}

/** Animates in-page `#hash` link clicks instead of jumping. Renders nothing. */
export function SmoothScroll() {
  useEffect(() => {
    let controls: AnimationPlaybackControls | undefined;
    const stop = () => controls?.stop();

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
      // Match bare `#id` and `/#id` links (the latter so nav hrefs work on other pages)
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]');
      const href = link?.getAttribute("href") ?? "";
      const isRootHash = href.startsWith("/#");
      if (isRootHash && window.location.pathname !== "/") return;
      const id = isRootHash ? href.slice(2) : href.slice(1);
      const target = id ? document.getElementById(id) : null;
      if (!target) return;

      event.preventDefault();
      history.pushState(null, "", `#${id}`); // always push bare hash regardless of incoming href form

      const to = targetTop(target);
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        window.scrollTo(0, to);
        return;
      }

      stop();
      controls = animate(window.scrollY, to, {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (y) => window.scrollTo(0, y),
      });
    }

    document.addEventListener("click", onClick);
    INTERRUPT_EVENTS.forEach((e) => window.addEventListener(e, stop, { passive: true }));
    return () => {
      stop();
      document.removeEventListener("click", onClick);
      INTERRUPT_EVENTS.forEach((e) => window.removeEventListener(e, stop));
    };
  }, []);

  return null;
}
