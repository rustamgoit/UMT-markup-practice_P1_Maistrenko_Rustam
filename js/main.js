const API_URL = './db.json';
const state = { page: 1, limit: 4, query: '', category: '', loadedIds: new Set(), currentProduct: null };
const $ = selector => document.querySelector(selector);
const body = document.body;

function setBodyLock(locked){body.classList.toggle('is-locked', locked)}
function toggleLayer(layer, open){layer.classList.toggle('is-open', open);layer.setAttribute('aria-hidden', String(!open));setBodyLock(open)}

const menu=$('[data-menu]');
$('[data-menu-open]')?.addEventListener('click',()=>{menu.classList.add('is-open');menu.setAttribute('aria-hidden','false');setBodyLock(true)});
$('[data-menu-close]')?.addEventListener('click',()=>{menu.classList.remove('is-open');menu.setAttribute('aria-hidden','true');setBodyLock(false)});
menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('is-open');setBodyLock(false)}));

async function getData(){
  const response = await axios.get(API_URL);
  return response.data;
}

function productMarkup(product, className){
  return `<li class="${className}" data-product-id="${product.id}" tabindex="0">
    <img src="${product.image}" srcset="${product.image} 1x, ${product.image2x} 2x" width="405" height="320" alt="${product.name} bouquet" loading="lazy" decoding="async">
    <h3>${product.name}</h3><p class="price">$${product.price}</p></li>`;
}

async function renderBestsellers(){
  const list=$('[data-bestseller-list]'); const status=$('[data-bestseller-status]');
  try{const {products}=await getData();const items=products.filter(p=>p.bestseller);list.insertAdjacentHTML('beforeend',items.map(p=>productMarkup(p,'product-card')).join(''));}
  catch(error){status.hidden=false;status.textContent='Could not load bestsellers. Please try again later.';console.error('Bestsellers request failed:',error.message)}
}

async function renderBouquets({reset=false}={}){
  const list=$('[data-bouquet-list]'); const status=$('[data-bouquet-status]'); const more=$('[data-load-more]');
  if(reset){state.page=1;state.loadedIds.clear();list.innerHTML='';more.hidden=false}
  status.hidden=true; more.disabled=true; more.textContent='Loading...';
  try{
    const {products}=await getData();
    const source=products.filter(p=>!p.bestseller).filter(p=>!state.query||p.name.toLowerCase().includes(state.query.toLowerCase())).filter(p=>!state.category||p.category===state.category);
    const start=(state.page-1)*state.limit; const pageItems=source.slice(start,start+state.limit).filter(p=>!state.loadedIds.has(p.id));
    if(!pageItems.length){status.hidden=false;status.textContent=state.page===1?'No bouquets found.':'You have reached the end of the collection.';more.hidden=true;return}
    list.insertAdjacentHTML('beforeend',pageItems.map(p=>productMarkup(p,'bouquet-card')).join(''));pageItems.forEach(p=>state.loadedIds.add(p.id));state.page+=1;
    more.hidden=state.loadedIds.size>=source.length;
    if(more.hidden){status.hidden=false;status.textContent='All matching bouquets are loaded.'}
  }catch(error){status.hidden=false;status.textContent='Could not load bouquets. Please try again.';console.error('Bouquets request failed:',error.message)}finally{more.disabled=false;more.textContent='Load more'}
}

async function renderReviews(){const list=$('[data-feedback-list]');try{const {reviews}=await getData();list.insertAdjacentHTML('beforeend',reviews.map(r=>`<li class="quote-card"><blockquote>“${r.text}”</blockquote><p>${r.author}</p></li>`).join(''))}catch(error){console.error('Reviews request failed:',error.message)}}

$('[data-load-more]')?.addEventListener('click',()=>renderBouquets());
$('[data-filter-form]')?.addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.currentTarget);state.query=String(data.get('query')||'').trim();state.category=String(data.get('category')||'');renderBouquets({reset:true})});

const feedback=$('[data-feedback-list]');
$('[data-feedback-prev]')?.addEventListener('click',()=>feedback.scrollBy({left:-feedback.clientWidth,behavior:'smooth'}));
$('[data-feedback-next]')?.addEventListener('click',()=>feedback.scrollBy({left:feedback.clientWidth,behavior:'smooth'}));

const productBackdrop=$('[data-product-backdrop]'); const orderBackdrop=$('[data-order-backdrop]');
async function openProduct(id){
  try{const {products}=await getData();const product=products.find(p=>p.id===Number(id));if(!product)return;state.currentProduct=product;
    $('[data-product-content]').innerHTML=`<div class="product-layout"><img src="${product.image}" srcset="${product.image} 1x, ${product.image2x} 2x" width="536" height="572" alt="${product.name} bouquet"><div class="product-info"><h2 id="product-title">${product.name}</h2><p class="price">$${product.price}</p><p class="product-description">${product.description}</p><div class="buy-row"><button class="button" type="button" data-buy-now>Buy now</button><input class="quantity-input" type="number" min="1" max="20" value="1" aria-label="Quantity"></div></div></div>`;
    toggleLayer(productBackdrop,true);$('[data-buy-now]').addEventListener('click',()=>{const q=$('.quantity-input').value;toggleLayer(productBackdrop,false);const form=$('[data-order-form]');form.elements.productId.value=product.id;form.elements.quantity.value=q;toggleLayer(orderBackdrop,true)})
  }catch(error){console.error('Product request failed:',error.message)}
}
document.addEventListener('click',event=>{const card=event.target.closest('[data-product-id]');if(card)openProduct(card.dataset.productId)});
document.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-product-id]'))openProduct(event.target.dataset.productId);if(event.key==='Escape'){toggleLayer(productBackdrop,false);toggleLayer(orderBackdrop,false)}});
$('[data-product-close]')?.addEventListener('click',()=>toggleLayer(productBackdrop,false));
$('[data-order-close]')?.addEventListener('click',()=>toggleLayer(orderBackdrop,false));
[productBackdrop,orderBackdrop].forEach(layer=>layer?.addEventListener('click',event=>{if(event.target===layer)toggleLayer(layer,false)}));

$('[data-order-form]')?.addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget;const payload=Object.fromEntries(new FormData(form));$('[data-order-message]').textContent=`Thank you, ${payload.name}! Your order request has been received.`;form.reset();setTimeout(()=>toggleLayer(orderBackdrop,false),1200)});
$('[data-subscribe-form]')?.addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget;const email=new FormData(form).get('email');$('[data-subscribe-message]').textContent=`Thanks! Updates will be sent to ${email}.`;form.reset()});

await Promise.all([renderBestsellers(),renderBouquets({reset:true}),renderReviews()]);
