/* ==========================================================================
   DOM UTILITIES - DOM Manipulation & External Scripts

   Pure utility functions for DOM manipulation and external script loading.
   Provides consistent scrolling behavior and lazy script loading.

   🔒 CEMENT: Scroll behavior
   - requestAnimationFrame for smooth performance
   - Accepts both selector strings and element references
   - Configurable scroll options (block, inline)
   - Default smooth behavior for all scrolls

   Dependencies: None
   Used by: Scroll service, workout log, active card, video player
   ========================================================================== */

/**
 * CEMENTED
 * The definitive, app-wide utility for smooth scrolling to an element.
 */
export function scrollToElement(
  target,
  options = { block: "start", inline: "nearest" }
) {
  requestAnimationFrame(() => {
    const element =
      typeof target === "string" ? document.querySelector(target) : target;
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        ...options,
      });
    }
  });
}

/**
 * CEMENTED
 * A standard, robust utility for lazily loading an external script only once.
 */
export function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}
