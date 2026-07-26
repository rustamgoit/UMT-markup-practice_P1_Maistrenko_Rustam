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

const showMoreButton = document.querySelector('[data-show-more]');
const bouquetGrid = document.querySelector('.bouquet-grid');

showMoreButton.addEventListener('click', () => {
  const expanded = bouquetGrid.classList.toggle('is-expanded');
  showMoreButton.textContent = expanded ? 'Show Less' : 'Show More';
});
