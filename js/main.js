const API_URL = './db.json';

const state = {
  page: 1,
  limit: 4,
  query: '',
  category: '',
  loadedIds: new Set(),
  products: [],
  reviews: [],
  currentProduct: null,
};

const select = selector => document.querySelector(selector);
const body = document.body;

const menu = select('[data-menu]');
const productBackdrop = select('[data-product-backdrop]');
const orderBackdrop = select('[data-order-backdrop]');

function updateBodyLock() {
  const menuIsOpen = menu?.classList.contains('is-open');
  const modalIsOpen = document.querySelector('.backdrop.is-open');
  body.classList.toggle('is-locked', Boolean(menuIsOpen || modalIsOpen));
}

function setMenu(open) {
  const openButton = select('[data-menu-open]');
  menu?.classList.toggle('is-open', open);
  menu?.setAttribute('aria-hidden', String(!open));
  openButton?.setAttribute('aria-expanded', String(open));
  updateBodyLock();
}

function setModal(layer, open) {
  layer?.classList.toggle('is-open', open);
  layer?.setAttribute('aria-hidden', String(!open));
  updateBodyLock();
}

select('[data-menu-open]')?.addEventListener('click', () => setMenu(true));
select('[data-menu-close]')?.addEventListener('click', () => setMenu(false));
menu?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => setMenu(false));
});

async function requestData(params = {}) {
  const response = await axios.get(API_URL, { params });
  return response.data;
}

function productMarkup(product, cardClass, imageWidth, imageHeight) {
  return `
    <li class="${cardClass}">
      <button class="card-button" type="button" data-product-id="${product.id}">
        <img
          src="${product.image}"
          srcset="${product.image} 1x, ${product.image2x} 2x"
          width="${imageWidth}"
          height="${imageHeight}"
          alt="${product.name} bouquet"
          loading="lazy"
          decoding="async"
        />
        <h3>${product.name}</h3>
        <p class="price">$${product.price}</p>
      </button>
    </li>`;
}

async function loadInitialData() {
  const data = await requestData({ page: 1, limit: state.limit });
  state.products = Array.isArray(data.products) ? data.products : [];
  state.reviews = Array.isArray(data.reviews) ? data.reviews : [];
}

function renderBestsellers() {
  const list = select('[data-bestseller-list]');
  const status = select('[data-bestseller-status]');
  const items = state.products.filter(product => product.bestseller);

  if (!items.length) {
    status.hidden = false;
    status.textContent = 'Bestsellers are temporarily unavailable.';
    return;
  }

  list.innerHTML = '';
  list.insertAdjacentHTML(
    'beforeend',
    items.map(item => productMarkup(item, 'product-card', 405, 320)).join(''),
  );
  renderBestsellerDots(items.length);
  window.setTimeout(refreshSliderButtons, 0);
}

function getBestsellerStep() {
  const firstCard = select('[data-bestseller-list] .product-card');
  if (!firstCard) return 0;
  const gap = Number.parseFloat(getComputedStyle(select('[data-bestseller-list]')).gap) || 0;
  return firstCard.getBoundingClientRect().width + gap;
}

function updateBestsellerDots() {
  const list = select('[data-bestseller-list]');
  const dots = document.querySelectorAll('[data-bestseller-dots] button');
  const step = getBestsellerStep();
  if (!list || !step) return;
  const index = Math.round(list.scrollLeft / step);
  dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === index));
}

function renderBestsellerDots(count) {
  const dots = select('[data-bestseller-dots]');
  dots.innerHTML = Array.from({ length: count }, (_, index) =>
    `<button type="button" aria-label="Go to bestseller ${index + 1}" data-bestseller-dot="${index}"${index === 0 ? ' class="active"' : ''}></button>`,
  ).join('');
}

function getFilteredBouquets() {
  return state.products
    .filter(product => {
      return !state.query || product.name.toLowerCase().includes(state.query.toLowerCase());
    })
    .filter(product => !state.category || product.category === state.category);
}

function renderBouquets({ reset = false } = {}) {
  const list = select('[data-bouquet-list]');
  const status = select('[data-bouquet-status]');
  const loadMoreButton = select('[data-load-more]');

  if (reset) {
    state.page = 1;
    state.loadedIds.clear();
    list.innerHTML = '';
    loadMoreButton.hidden = false;
  }

  status.hidden = true;
  const filteredProducts = getFilteredBouquets();
  const startIndex = (state.page - 1) * state.limit;
  const pageItems = filteredProducts
    .slice(startIndex, startIndex + state.limit)
    .filter(product => !state.loadedIds.has(product.id));

  if (!pageItems.length) {
    status.hidden = false;
    status.textContent =
      state.page === 1
        ? 'No bouquets match your search. Try another name or occasion.'
        : 'You have reached the end of the collection.';
    loadMoreButton.hidden = true;
    return;
  }

  list.insertAdjacentHTML(
    'beforeend',
    pageItems.map(item => productMarkup(item, 'bouquet-card', 296, 296)).join(''),
  );

  pageItems.forEach(product => state.loadedIds.add(product.id));
  state.page += 1;

  const allLoaded = state.loadedIds.size >= filteredProducts.length;
  loadMoreButton.hidden = allLoaded;

  if (allLoaded) {
    status.hidden = false;
    status.textContent = 'All matching bouquets are displayed.';
  }
}

function renderReviews() {
  const list = select('[data-feedback-list]');

  if (!state.reviews.length) {
    list.insertAdjacentHTML(
      'beforeend',
      '<li class="quote-card"><p>Reviews are temporarily unavailable.</p></li>',
    );
    return;
  }

  list.innerHTML = '';
  list.insertAdjacentHTML(
    'beforeend',
    state.reviews
      .map(
        review => `
          <li class="quote-card">
            <blockquote>“${review.text}”</blockquote>
            <p>${review.author}</p>
          </li>`,
      )
      .join(''),
  );
  window.setTimeout(refreshSliderButtons, 0);
}

select('[data-load-more]')?.addEventListener('click', () => {
  renderBouquets();
});

select('[data-filter-form]')?.addEventListener('submit', event => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  state.query = String(formData.get('query') || '').trim();
  state.category = String(formData.get('category') || '');
  renderBouquets({ reset: true });
});

const bestsellerList = select('[data-bestseller-list]');
select('[data-bestseller-prev]')?.addEventListener('click', () => {
  bestsellerList.scrollBy({ left: -getBestsellerStep(), behavior: 'smooth' });
});
select('[data-bestseller-next]')?.addEventListener('click', () => {
  bestsellerList.scrollBy({ left: getBestsellerStep(), behavior: 'smooth' });
});
select('[data-bestseller-dots]')?.addEventListener('click', event => {
  const dot = event.target.closest('[data-bestseller-dot]');
  if (!dot) return;
  bestsellerList.scrollTo({ left: Number(dot.dataset.bestsellerDot) * getBestsellerStep(), behavior: 'smooth' });
});
bestsellerList?.addEventListener('scroll', () => window.requestAnimationFrame(updateBestsellerDots));

const feedbackList = select('[data-feedback-list]');
select('[data-feedback-prev]')?.addEventListener('click', () => {
  feedbackList.scrollBy({ left: -feedbackList.clientWidth, behavior: 'smooth' });
});
select('[data-feedback-next]')?.addEventListener('click', () => {
  feedbackList.scrollBy({ left: feedbackList.clientWidth, behavior: 'smooth' });
});

function openProduct(productId) {
  const product = state.products.find(item => item.id === Number(productId));
  if (!product) return;

  state.currentProduct = product;
  select('[data-product-content]').innerHTML = `
    <div class="product-layout">
      <img
        class="product-picture"
        src="${product.image}"
        srcset="${product.image} 1x, ${product.image2x} 2x"
        width="536"
        height="572"
        alt="${product.name} bouquet"
      />
      <div class="product-info">
        <h2 id="product-title">${product.name}</h2>
        <p class="price">$${product.price}</p>
        <p class="product-description">${product.description}</p>
        <div class="buy-row">
          <button class="button" type="button" data-buy-now>Buy now</button>
          <input
            class="quantity-input"
            type="number"
            min="1"
            max="20"
            value="1"
            aria-label="Quantity"
          />
        </div>
      </div>
    </div>`;

  setModal(productBackdrop, true);

  select('[data-buy-now]')?.addEventListener('click', () => {
    const quantity = select('.quantity-input').value;
    const orderForm = select('[data-order-form]');

    orderForm.elements.productId.value = product.id;
    orderForm.elements.quantity.value = quantity;

    setModal(productBackdrop, false);
    setModal(orderBackdrop, true);
  });
}

document.addEventListener('click', event => {
  const productButton = event.target.closest('[data-product-id]');
  if (productButton) openProduct(productButton.dataset.productId);
});

select('[data-product-close]')?.addEventListener('click', () => {
  setModal(productBackdrop, false);
});
select('[data-order-close]')?.addEventListener('click', () => {
  setModal(orderBackdrop, false);
});

[productBackdrop, orderBackdrop].forEach(layer => {
  layer?.addEventListener('click', event => {
    if (event.target === layer) setModal(layer, false);
  });
});

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  setMenu(false);
  setModal(productBackdrop, false);
  setModal(orderBackdrop, false);
});

select('[data-order-form]')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = Object.fromEntries(new FormData(form));
  const message = select('[data-order-message]');

  message.textContent = `Thank you, ${payload.name}! Your order request has been received.`;
  form.reset();

  window.setTimeout(() => {
    message.textContent = '';
    setModal(orderBackdrop, false);
  }, 1400);
});

select('[data-subscribe-form]')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const email = new FormData(form).get('email');
  const message = select('[data-subscribe-message]');

  message.textContent = `Thanks! Floral updates will be sent to ${email}.`;
  form.reset();
});

async function init() {
  const catalogueStatus = select('[data-bouquet-status]');
  const bestsellerStatus = select('[data-bestseller-status]');

  try {
    await loadInitialData();
    renderBestsellers();
    renderBouquets({ reset: true });
    renderReviews();
  } catch {
    bestsellerStatus.hidden = false;
    bestsellerStatus.textContent = 'Could not load bestsellers. Please try again later.';
    catalogueStatus.hidden = false;
    catalogueStatus.textContent = 'Could not load bouquets. Please try again later.';
    select('[data-load-more]').hidden = true;
  }
}

init();

/* UI-kit states and form validation */
function setClickedState(button) {
  if (!button) return;
  button.classList.add('is-clicked');
  window.setTimeout(() => button.classList.remove('is-clicked'), 180);
}

document.addEventListener('click', event => {
  const button = event.target.closest('.button');
  if (button && !button.disabled) setClickedState(button);
});

function setFieldError(field, message) {
  const wrapper = field.closest('.form-field') || field.closest('form');
  if (!wrapper) return;
  wrapper.classList.add('is-invalid');
  field.setAttribute('aria-invalid', 'true');
  let error = wrapper.querySelector('.field-error');
  if (!error) {
    error = document.createElement('span');
    error.className = 'field-error';
    field.insertAdjacentElement('afterend', error);
  }
  error.textContent = message;
}

function clearFieldError(field) {
  const wrapper = field.closest('.form-field') || field.closest('form');
  wrapper?.classList.remove('is-invalid');
  field.removeAttribute('aria-invalid');
  wrapper?.querySelector('.field-error')?.remove();
}

function validateRequiredField(field) {
  const value = field.value.trim();
  if (!value) {
    setFieldError(field, `Please enter ${field.name === 'address' ? 'your address' : `your ${field.name}`}.`);
    return false;
  }
  if (field.type === 'email' && !field.validity.valid) {
    setFieldError(field, 'Please enter a valid email address.');
    return false;
  }
  clearFieldError(field);
  return true;
}

const selectAllRequired = form => Array.from(form.querySelectorAll('[required]'));

const orderFormElement = select('[data-order-form]');
orderFormElement?.querySelectorAll('input, textarea').forEach(field => {
  field.addEventListener('input', () => clearFieldError(field));
});

orderFormElement?.addEventListener('submit', event => {
  const fields = selectAllRequired(event.currentTarget);
  const valid = fields.every(validateRequiredField);
  if (!valid) {
    event.preventDefault();
    event.stopImmediatePropagation();
    fields.find(field => field.getAttribute('aria-invalid') === 'true')?.focus();
  }
}, true);

const subscribeFormElement = select('[data-subscribe-form]');
subscribeFormElement?.querySelectorAll('input').forEach(field => {
  field.addEventListener('input', () => clearFieldError(field));
  field.addEventListener('change', () => {
    field.closest('.agreement')?.classList.remove('is-invalid');
    field.closest('.agreement')?.querySelector('.field-error')?.remove();
  });
});

subscribeFormElement?.addEventListener('submit', event => {
  const email = event.currentTarget.elements.email;
  const agreement = event.currentTarget.elements.agreement;
  let valid = validateRequiredField(email);
  if (!agreement.checked) {
    const wrapper = agreement.closest('.agreement');
    wrapper.classList.add('is-invalid');
    if (!wrapper.querySelector('.field-error')) {
      wrapper.insertAdjacentHTML('beforeend', '<span class="field-error">Please accept the privacy policy.</span>');
    }
    valid = false;
  }
  if (!valid) {
    event.preventDefault();
    event.stopImmediatePropagation();
    (email.getAttribute('aria-invalid') === 'true' ? email : agreement).focus();
  }
}, true);

function updateHorizontalControls(list, previousButton, nextButton) {
  if (!list || !previousButton || !nextButton) return;
  const maxScroll = Math.max(0, list.scrollWidth - list.clientWidth);
  previousButton.disabled = list.scrollLeft <= 2;
  nextButton.disabled = list.scrollLeft >= maxScroll - 2;
}

const bestsellerPrevious = select('[data-bestseller-prev]');
const bestsellerNext = select('[data-bestseller-next]');
const feedbackPrevious = select('[data-feedback-prev]');
const feedbackNext = select('[data-feedback-next]');

function refreshSliderButtons() {
  updateHorizontalControls(bestsellerList, bestsellerPrevious, bestsellerNext);
  updateHorizontalControls(feedbackList, feedbackPrevious, feedbackNext);
}

bestsellerList?.addEventListener('scroll', () => window.requestAnimationFrame(refreshSliderButtons));
feedbackList?.addEventListener('scroll', () => window.requestAnimationFrame(refreshSliderButtons));
window.addEventListener('resize', refreshSliderButtons);
window.setTimeout(refreshSliderButtons, 300);
