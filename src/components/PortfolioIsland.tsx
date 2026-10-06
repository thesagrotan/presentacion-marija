import { useEffect } from "preact/hooks";
import type { ComponentChildren } from "preact";
import { DEFAULT_THEME_ID, HOME_BG, HOME_TEXT } from "@/lib/theme";

export default function PortfolioIsland({
  children,
}: {
  children?: ComponentChildren;
}) {
  useEffect(() => {
    const portfolio = document.querySelector<HTMLElement>("#portfolio");
    if (!portfolio) return;

    let activeId: string | null = null;
    let readMore = false;

    const mobile = window.matchMedia("(max-width: 767px)");
    const detailStack = portfolio.querySelector<HTMLElement>(".detail-stack");
    const aboutPanel = portfolio.querySelector<HTMLElement>("#about-panel");

    const detailImage = (detail: HTMLElement): HTMLImageElement | null =>
      detail.querySelector<HTMLImageElement>("img.film-still");

    const stubDetailImage = (detail: HTMLElement): void => {
      const img = detailImage(detail);
      if (!img || img.dataset.deferred === "true") return;
      const src = img.getAttribute("src");
      const srcset = img.getAttribute("srcset");
      if (src) img.dataset.src = src;
      if (srcset) img.dataset.srcset = srcset;
      img.removeAttribute("src");
      img.removeAttribute("srcset");
      img.dataset.deferred = "true";
    };

    const restoreDetailImage = (detail: HTMLElement): void => {
      const img = detailImage(detail);
      if (!img || img.dataset.deferred !== "true") return;
      const src = img.dataset.src;
      const srcset = img.dataset.srcset;
      if (src) img.setAttribute("src", src);
      if (srcset) img.setAttribute("srcset", srcset);
      delete img.dataset.src;
      delete img.dataset.srcset;
      img.dataset.deferred = "false";
    };

    portfolio
      .querySelectorAll<HTMLElement>("[data-film-detail]")
      .forEach((detail) => {
        detail.inert = true;
        stubDetailImage(detail);
      });
    if (aboutPanel) aboutPanel.inert = true;

    const placeDetails = (id: string | null): void => {
      portfolio
        .querySelectorAll<HTMLElement>("[data-film-detail]")
        .forEach((detail) => {
          const isActive = detail.dataset.id === id;
          let home = detailStack;
          if (mobile.matches && isActive) {
            const wrapper = portfolio.querySelector<HTMLElement>(
              `[data-film-wrapper][data-id="${detail.dataset.id}"]`,
            );
            home =
              wrapper?.querySelector<HTMLElement>("[data-detail-slot]") ??
              wrapper ??
              detailStack;
          }
          if (home && detail.parentElement !== home) home.appendChild(detail);
        });
    };
    let homeBg = HOME_BG;
    let homeText = HOME_TEXT;
    let activeBg = homeBg;
    let activeText = homeText;

    const setTheme = (bg: string, text: string): void => {
      portfolio.style.setProperty("--film-bg", bg);
      portfolio.style.setProperty("--film-text", text);
    };

    const resetCredits = (detail: HTMLElement): void => {
      detail.setAttribute("data-credits-open", "false");
      const toggle = detail.querySelector<HTMLElement>("[data-credits-toggle]");
      if (!toggle) return;
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Credits";
    };

    const handleFilmChange = (id: string | null): void => {
      if (id) portfolio.setAttribute("data-detail", "true");
      activeId = id;

      let bg = homeBg;
      let text = homeText;

      portfolio
        .querySelectorAll<HTMLElement>("[data-film-wrapper]")
        .forEach((wrapper) => {
          const isOpen = wrapper.dataset.id === id;
          wrapper.setAttribute("data-open", isOpen ? "true" : "false");
          const button = wrapper.querySelector<HTMLElement>("[data-film-item]");
          if (!button) return;
          button.setAttribute("aria-expanded", isOpen ? "true" : "false");
          if (isOpen) {
            bg = button.dataset.bg ?? homeBg;
            text = button.dataset.text ?? homeText;
          }
        });

      portfolio
        .querySelectorAll<HTMLElement>("[data-film-detail]")
        .forEach((detail) => {
          const isActive = detail.dataset.id === id;
          detail.setAttribute("data-active", isActive ? "true" : "false");
          detail.inert = !isActive;
          if (isActive) restoreDetailImage(detail);
          resetCredits(detail);
        });

      activeBg = bg;
      activeText = text;
      setTheme(readMore ? homeBg : bg, readMore ? homeText : text);

      placeDetails(id);

      const stage = document.querySelector<HTMLElement>("[data-stage]");
      if (stage) stage.setAttribute("data-expanded", id ? "true" : "false");
    };

    const handleCreditsToggle = (toggle: HTMLElement): void => {
      const detail = toggle.closest<HTMLElement>("[data-film-detail]");
      if (!detail) return;
      const open = detail.getAttribute("data-credits-open") !== "true";
      detail.setAttribute("data-credits-open", open ? "true" : "false");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Credits";
    };

    const syncReadMoreLabels = (open: boolean): void => {
      portfolio
        .querySelectorAll<HTMLElement>("[data-readmore-label]")
        .forEach((label) => {
          const isAbout = label.dataset.readmoreLabel === "about";
          label.setAttribute("aria-hidden", String(open ? isAbout : !isAbout));
        });
    };

    const toggleReadMore = (): void => {
      readMore = !readMore;
      portfolio.setAttribute("data-readmore", readMore ? "true" : "false");
      setTheme(readMore ? homeBg : activeBg, readMore ? homeText : activeText);
      const toggle = portfolio.querySelector<HTMLElement>("#read-more-toggle");
      if (toggle) {
        toggle.setAttribute("aria-expanded", readMore ? "true" : "false");
      }
      syncReadMoreLabels(readMore);
      if (aboutPanel) aboutPanel.inert = !readMore;
    };

    const onClick = (event: Event): void => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const filmButton = target.closest<HTMLElement>("[data-film-item]");
      if (filmButton) {
        const id = filmButton.dataset.id ?? null;
        handleFilmChange(activeId === id ? null : id);
        return;
      }

      const creditsToggle = target.closest<HTMLElement>("[data-credits-toggle]");
      if (creditsToggle) {
        handleCreditsToggle(creditsToggle);
        return;
      }

      if (target.closest("#read-more-toggle")) {
        toggleReadMore();
      }
    };

    const onDevTheme = (event: Event): void => {
      const detail = (event as CustomEvent).detail as
        | { id?: string; bg?: string; text?: string }
        | undefined;
      if (!detail?.id) return;
      if (detail.id === DEFAULT_THEME_ID) {
        homeBg = detail.bg ?? homeBg;
        homeText = detail.text ?? homeText;
        if (!activeId && !readMore) setTheme(homeBg, homeText);
        return;
      }
      if (detail.id !== activeId) return;
      activeBg = detail.bg ?? activeBg;
      activeText = detail.text ?? activeText;
      if (!readMore) setTheme(activeBg, activeText);
    };

    const onPreload = (event: Event): void => {
      const trigger = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-film-item]",
      );
      const id = trigger?.dataset.id;
      if (!id) return;
      const detail = portfolio.querySelector<HTMLElement>(
        `[data-film-detail][data-id="${id}"]`,
      );
      if (detail) restoreDetailImage(detail);
    };

    portfolio.addEventListener("click", onClick);
    portfolio.addEventListener("pointerenter", onPreload, true);
    portfolio.addEventListener("focusin", onPreload);
    portfolio.addEventListener("pointerdown", onPreload);
    window.addEventListener("dev:film-theme", onDevTheme);

    const bioHeader = portfolio.querySelector<HTMLElement>("[data-bio-header]");
    // Writing a custom property on the root invalidates style for the whole
    // subtree, so coalesce to one write per frame and skip no-op updates.
    // Resize fires far faster than the header's bottom actually changes.
    let measureRaf = 0;
    let lastTop = Number.NaN;
    const measure = (): void => {
      if (!bioHeader) return;
      const top = Math.round(bioHeader.getBoundingClientRect().bottom);
      if (top === lastTop) return;
      lastTop = top;
      portfolio.style.setProperty("--readmore-top", `${top}px`);
    };
    const scheduleMeasure = (): void => {
      if (measureRaf) return;
      measureRaf = requestAnimationFrame(() => {
        measureRaf = 0;
        measure();
      });
    };
    measure();
    window.addEventListener("resize", scheduleMeasure);
    const resizeObserver = bioHeader
      ? new ResizeObserver(scheduleMeasure)
      : null;
    if (bioHeader) resizeObserver?.observe(bioHeader);

    const onBreakpoint = (): void => placeDetails(activeId);
    mobile.addEventListener("change", onBreakpoint);

    const viewport = portfolio.querySelector<HTMLElement>(".rm-viewport");
    let viewportObserver: ResizeObserver | null = null;
    // Scroll fires continuously; only touch the DOM when the edge state flips.
    let faded = false;
    let fadeRaf = 0;
    const updateFade = (): void => {
      if (!viewport) return;
      const more =
        viewport.scrollTop + viewport.clientHeight < viewport.scrollHeight - 1;
      if (more === faded) return;
      faded = more;
      viewport.toggleAttribute("data-faded", more);
    };
    const scheduleFade = (): void => {
      if (fadeRaf) return;
      fadeRaf = requestAnimationFrame(() => {
        fadeRaf = 0;
        updateFade();
      });
    };
    if (viewport) {
      updateFade();
      viewport.addEventListener("scroll", scheduleFade, { passive: true });
      viewportObserver = new ResizeObserver(scheduleFade);
      viewportObserver.observe(viewport);
      Array.from(viewport.children).forEach((child) =>
        viewportObserver?.observe(child),
      );
    }

    return () => {
      portfolio.removeEventListener("click", onClick);
      portfolio.removeEventListener("pointerenter", onPreload, true);
      portfolio.removeEventListener("focusin", onPreload);
      portfolio.removeEventListener("pointerdown", onPreload);
      window.removeEventListener("dev:film-theme", onDevTheme);
      window.removeEventListener("resize", scheduleMeasure);
      mobile.removeEventListener("change", onBreakpoint);
      resizeObserver?.disconnect();
      if (measureRaf) cancelAnimationFrame(measureRaf);
      if (fadeRaf) cancelAnimationFrame(fadeRaf);
      viewport?.removeEventListener("scroll", scheduleFade);
      viewportObserver?.disconnect();
    };
  }, []);

  return (
    <div
      id="portfolio"
      class="relative min-h-dvh overflow-x-hidden text-ink max-md:flex max-md:flex-col max-md:p-[var(--pad)]"
      data-readmore="false"
      data-detail="false"
      style={`--film-bg:${HOME_BG};--film-text:${HOME_TEXT}`}
    >
      {children}
    </div>
  );
}
