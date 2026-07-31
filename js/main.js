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
const selectAll = selector => [...document.querySelectorAll(selector)];
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
  renderBestsellerDots();
}

function getVisibleBestsellerCount() {
  if (window.innerWidth >= 1440) return 3;
  if (window.innerWidth >= 768) return 2;
  return 1;
}

function getBestsellerPageCount() {
  const count = selectAll('[data-bestseller-list] .product-card').length;
  return Math.max(1, Math.ceil(count / getVisibleBestsellerCount()));
}

function getBestsellerPageWidth() {
  return select('[data-bestseller-list]')?.clientWidth || 0;
}

function getBestsellerPageIndex() {
  const list = select('[data-bestseller-list]');
  const pageWidth = getBestsellerPageWidth();
  if (!list || !pageWidth) return 0;

  return Math.min(
    getBestsellerPageCount() - 1,
    Math.max(0, Math.round(list.scrollLeft / pageWidth)),
  );
}

function updateBestsellerControls() {
  const pageIndex = getBestsellerPageIndex();
  const pageCount = getBestsellerPageCount();

  selectAll('[data-bestseller-dots] button').forEach((dot, index) => {
    dot.classList.toggle('active', index === pageIndex);
  });

  const previousButton = select('[data-bestseller-prev]');
  const nextButton = select('[data-bestseller-next]');
  if (previousButton) previousButton.disabled = pageIndex === 0;
  if (nextButton) nextButton.disabled = pageIndex >= pageCount - 1;
}

function renderBestsellerDots() {
  const dots = select('[data-bestseller-dots]');
  const pageCount = getBestsellerPageCount();

  dots.innerHTML = Array.from(
    { length: pageCount },
    (_, index) =>
      `<button type="button" aria-label="Go to bestseller page ${index + 1}" data-bestseller-dot="${index}"${index === 0 ? ' class="active"' : ''}></button>`,
  ).join('');

  updateBestsellerControls();
}

function goToBestsellerPage(pageIndex) {
  const list = select('[data-bestseller-list]');
  const safeIndex = Math.min(getBestsellerPageCount() - 1, Math.max(0, pageIndex));
  list?.scrollTo({
    left: safeIndex * getBestsellerPageWidth(),
    behavior: 'smooth',
  });
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
  goToBestsellerPage(getBestsellerPageIndex() - 1);
});
select('[data-bestseller-next]')?.addEventListener('click', () => {
  goToBestsellerPage(getBestsellerPageIndex() + 1);
});
select('[data-bestseller-dots]')?.addEventListener('click', event => {
  const dot = event.target.closest('[data-bestseller-dot]');
  if (!dot) return;
  goToBestsellerPage(Number(dot.dataset.bestsellerDot));
});
bestsellerList?.addEventListener('scroll', () => {
  window.requestAnimationFrame(updateBestsellerControls);
});

const feedbackList = select('[data-feedback-list]');

function updateFeedbackControls() {
  if (!feedbackList) return;
  const maxScroll = Math.max(0, feedbackList.scrollWidth - feedbackList.clientWidth);
  const previousButton = select('[data-feedback-prev]');
  const nextButton = select('[data-feedback-next]');

  if (previousButton) previousButton.disabled = feedbackList.scrollLeft <= 2;
  if (nextButton) nextButton.disabled = feedbackList.scrollLeft >= maxScroll - 2;
}

select('[data-feedback-prev]')?.addEventListener('click', () => {
  feedbackList.scrollBy({ left: -feedbackList.clientWidth, behavior: 'smooth' });
});
select('[data-feedback-next]')?.addEventListener('click', () => {
  feedbackList.scrollBy({ left: feedbackList.clientWidth, behavior: 'smooth' });
});
feedbackList?.addEventListener('scroll', () => {
  window.requestAnimationFrame(updateFeedbackControls);
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

function setFieldError(input, message) {
  input.classList.toggle('is-invalid', Boolean(message));
  input.setAttribute('aria-invalid', String(Boolean(message)));
  const error = input.closest('label')?.querySelector('.field-error');
  if (error) error.textContent = message;
}

select('[data-order-form]')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const requiredInputs = [...form.querySelectorAll('input[required]')];
  let isValid = true;

  requiredInputs.forEach(input => {
    const message = input.value.trim() ? '' : `Please enter your ${input.name}.`;
    setFieldError(input, message);
    if (message) isValid = false;
  });

  if (!isValid) return;

  const payload = Object.fromEntries(new FormData(form));
  const message = select('[data-order-message]');
  message.textContent = `Thank you, ${payload.name}! Your order request has been received.`;
  form.reset();

  window.setTimeout(() => {
    message.textContent = '';
    setModal(orderBackdrop, false);
  }, 1400);
});

select('[data-order-form]')?.addEventListener('input', event => {
  if (event.target.matches('input[required]')) setFieldError(event.target, '');
});

select('[data-subscribe-form]')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const emailInput = form.elements.email;
  const agreementInput = form.elements.agreement;
  const emailError = select('[data-email-error]');
  const agreementError = select('[data-agreement-error]');
  const message = select('[data-subscribe-message]');

  const emailIsEmpty = !emailInput.value.trim();
  const emailIsInvalid = !emailIsEmpty && !emailInput.validity.valid;
  const emailHasError = emailIsEmpty || emailIsInvalid;

  emailInput.classList.toggle('is-invalid', emailHasError);
  emailInput.setAttribute('aria-invalid', String(emailHasError));
  emailError.textContent = emailIsEmpty
    ? 'Please enter your email.'
    : emailIsInvalid
      ? 'Please enter a valid email.'
      : '';

  agreementError.textContent = agreementInput.checked
    ? ''
    : 'Please accept the privacy policy.';

  if (emailHasError || !agreementInput.checked) return;

  message.textContent = `Thanks! Floral updates will be sent to ${emailInput.value}.`;
  form.reset();
  emailInput.classList.remove('is-invalid');
  emailInput.setAttribute('aria-invalid', 'false');
});

select('[data-subscribe-form]')?.addEventListener('input', event => {
  if (event.target.name === 'email') {
    event.target.classList.remove('is-invalid');
    event.target.setAttribute('aria-invalid', 'false');
    select('[data-email-error]').textContent = '';
  }

  if (event.target.name === 'agreement') {
    select('[data-agreement-error]').textContent = '';
  }
});

async function init() {
  const catalogueStatus = select('[data-bouquet-status]');
  const bestsellerStatus = select('[data-bestseller-status]');

  try {
    await loadInitialData();
    renderBestsellers();
    renderBouquets({ reset: true });
    renderReviews();
    updateBestsellerControls();
    updateFeedbackControls();
  } catch {
    bestsellerStatus.hidden = false;
    bestsellerStatus.textContent = 'Could not load bestsellers. Please try again later.';
    catalogueStatus.hidden = false;
    catalogueStatus.textContent = 'Could not load bouquets. Please try again later.';
    select('[data-load-more]').hidden = true;
  }
}

init();

window.addEventListener('resize', () => {
  renderBestsellerDots();
  goToBestsellerPage(0);
  updateFeedbackControls();
});
