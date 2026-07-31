const menu = document.querySelector('[data-menu]');
const openButton = document.querySelector('[data-menu-open]');
const closeButton = document.querySelector('[data-menu-close]');
const menuLinks = menu.querySelectorAll('a');

const setMenuState = (isOpen) => {
  menu.classList.toggle('is-open', isOpen);
  document.body.classList.toggle('menu-open', isOpen);
  openButton.setAttribute('aria-expanded', String(isOpen));
};

openButton.addEventListener('click', () => setMenuState(true));
closeButton.addEventListener('click', () => setMenuState(false));
menuLinks.forEach((link) => link.addEventListener('click', () => setMenuState(false)));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenuState(false);
});

const topProducts = document.querySelector('.top-products');
const dots = [...document.querySelectorAll('.dots span')];
const sliderButtons = [...document.querySelectorAll('.arrows button')];

const visibleCards = () => (window.innerWidth >= 1440 ? 3 : window.innerWidth >= 768 ? 2 : 1);

const updateDots = () => {
  if (!topProducts || window.innerWidth >= 1440) return;
  const cards = [...topProducts.children];
  const firstVisible = cards.reduce((closest, card, index) => {
    const distance = Math.abs(card.offsetLeft - topProducts.scrollLeft);
    return distance < closest.distance ? { index, distance } : closest;
  }, { index: 0, distance: Infinity }).index;
  const page = Math.floor(firstVisible / visibleCards());
  dots.forEach((dot, index) => dot.classList.toggle('active', index === page));
};

let scrollTimer;
topProducts?.addEventListener('scroll', () => {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(updateDots, 80);
}, { passive: true });

sliderButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    const direction = index === 0 ? -1 : 1;
    topProducts.scrollBy({ left: direction * topProducts.clientWidth, behavior: 'smooth' });
  });
});

window.addEventListener('resize', updateDots);
updateDots();

const showMoreButton = document.querySelector('[data-show-more]');
const bouquetGrid = document.querySelector('.bouquet-grid');

showMoreButton?.addEventListener('click', () => {
  const expanded = bouquetGrid.classList.toggle('is-expanded');
  showMoreButton.textContent = expanded ? 'Show Less' : 'Show More';
});
