import { useEffect } from "preact/hooks";
import type { ComponentChildren } from "preact";

const HOME_BG = "#FFFFFF";
const FILM_TEXT = "#12140B";

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

      let bg = HOME_BG;
      let text = FILM_TEXT;

      portfolio
        .querySelectorAll<HTMLElement>("[data-film-wrapper]")
        .forEach((wrapper) => {
          const isOpen = wrapper.dataset.id === id;
          wrapper.setAttribute("data-open", isOpen ? "true" : "false");
          const button = wrapper.querySelector<HTMLElement>("[data-film-item]");
          if (!button) return;
          button.setAttribute("aria-expanded", isOpen ? "true" : "false");
          if (isOpen) {
            bg = button.dataset.bg ?? HOME_BG;
            text = button.dataset.text ?? FILM_TEXT;
          }
        });

      portfolio
        .querySelectorAll<HTMLElement>("[data-film-detail]")
        .forEach((detail) => {
          const isActive = detail.dataset.id === id;
          detail.setAttribute("data-active", isActive ? "true" : "false");
          resetCredits(detail);
        });

      setTheme(bg, text);

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
      const toggle = portfolio.querySelector<HTMLElement>("#read-more-toggle");
      if (toggle) {
        toggle.setAttribute("aria-expanded", readMore ? "true" : "false");
      }
      syncReadMoreLabels(readMore);
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

    portfolio.addEventListener("click", onClick);

    const bioHeader = portfolio.querySelector<HTMLElement>("[data-bio-header]");
    const measure = (): void => {
      if (!bioHeader) return;
      portfolio.style.setProperty(
        "--readmore-top",
        `${bioHeader.getBoundingClientRect().bottom}px`,
      );
    };
    measure();
    window.addEventListener("resize", measure);
    const resizeObserver = bioHeader ? new ResizeObserver(measure) : null;
    if (bioHeader) resizeObserver?.observe(bioHeader);

    const viewport = portfolio.querySelector<HTMLElement>(".rm-viewport");
    const updateFade = (): void => {
      if (!viewport) return;
      const more =
        viewport.scrollTop + viewport.clientHeight < viewport.scrollHeight - 1;
      if (more) viewport.setAttribute("data-faded", "true");
      else viewport.removeAttribute("data-faded");
    };
    let viewportObserver: ResizeObserver | null = null;
    if (viewport) {
      updateFade();
      viewport.addEventListener("scroll", updateFade, { passive: true });
      viewportObserver = new ResizeObserver(updateFade);
      viewportObserver.observe(viewport);
      Array.from(viewport.children).forEach((child) =>
        viewportObserver?.observe(child),
      );
    }

    return () => {
      portfolio.removeEventListener("click", onClick);
      window.removeEventListener("resize", measure);
      resizeObserver?.disconnect();
      viewport?.removeEventListener("scroll", updateFade);
      viewportObserver?.disconnect();
    };
  }, []);

  return (
    <div
      id="portfolio"
      class="relative min-h-dvh overflow-x-hidden text-ink max-md:flex max-md:flex-col max-md:p-[var(--pad)]"
      data-readmore="false"
      data-detail="false"
      style="--film-bg:#FFFFFF;--film-text:#12140B"
    >
      {children}
    </div>
  );
}
