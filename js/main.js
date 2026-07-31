const body = document.body;
const menu = document.querySelector("[data-menu]");
const openMenuButton = document.querySelector("[data-menu-open]");
const closeMenuButton = document.querySelector("[data-menu-close]");

const setMenuState = isOpen => {
  menu?.classList.toggle("is-open", isOpen);
  body.classList.toggle("menu-open", isOpen);
  menu?.setAttribute("aria-hidden", String(!isOpen));
  openMenuButton?.setAttribute("aria-expanded", String(isOpen));
};

openMenuButton?.addEventListener("click", () => setMenuState(true));
closeMenuButton?.addEventListener("click", () => setMenuState(false));
menu?.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => setMenuState(false));
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") setMenuState(false);
});

const createSlider = ({ trackSelector, prevSelector, nextSelector, dotsSelector }) => {
  const track = document.querySelector(trackSelector);
  const prev = document.querySelector(prevSelector);
  const next = document.querySelector(nextSelector);
  const dots = [...document.querySelectorAll(dotsSelector)];

  if (!track) return;

  const scroll = direction => {
    track.scrollBy({ left: direction * track.clientWidth, behavior: "smooth" });
  };

  prev?.addEventListener("click", () => scroll(-1));
  next?.addEventListener("click", () => scroll(1));

  if (dots.length) {
    const updateDots = () => {
      const cards = [...track.children];
      const nearest = cards.reduce(
        (best, card, index) => {
          const distance = Math.abs(card.offsetLeft - track.scrollLeft);
          return distance < best.distance ? { index, distance } : best;
        },
        { index: 0, distance: Infinity },
      );

      dots.forEach((dot, index) => {
        dot.classList.toggle("active", index === nearest.index);
      });
    };

    track.addEventListener("scroll", updateDots, { passive: true });
    window.addEventListener("resize", updateDots);
    updateDots();
  }
};

createSlider({
  trackSelector: "[data-bestseller-track]",
  prevSelector: "[data-bestseller-prev]",
  nextSelector: "[data-bestseller-next]",
  dotsSelector: ".slider-dots span",
});

createSlider({
  trackSelector: "[data-feedback-track]",
  prevSelector: "[data-feedback-prev]",
  nextSelector: "[data-feedback-next]",
  dotsSelector: ".feedback-does-not-use-dots",
});

const showMoreButton = document.querySelector("[data-show-more]");
showMoreButton?.addEventListener("click", () => {
  const expanded = showMoreButton.getAttribute("aria-expanded") === "true";
  showMoreButton.setAttribute("aria-expanded", String(!expanded));
  showMoreButton.textContent = expanded ? "Show More" : "Show Less";
});
