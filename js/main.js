const body=document.body;
const menu=document.querySelector('[data-menu]');
const openButton=document.querySelector('[data-menu-open]');
const closeButton=document.querySelector('[data-menu-close]');
const setMenuState=(open)=>{menu.classList.toggle('is-open',open);body.classList.toggle('menu-open',open);menu.setAttribute('aria-hidden',String(!open));openButton.setAttribute('aria-expanded',String(open))};
openButton?.addEventListener('click',()=>setMenuState(true));closeButton?.addEventListener('click',()=>setMenuState(false));menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenuState(false)));

const topProducts=document.querySelector('.top-products');
const dots=[...document.querySelectorAll('.dots span')];
const cards=[...(topProducts?.children||[])];
const cardsPerView=()=>window.innerWidth>=1440?3:window.innerWidth>=768?2:1;
const updateDots=()=>{if(!topProducts)return;const card=cards.reduce((best,c,i)=>Math.abs(c.offsetLeft-topProducts.scrollLeft)<best.d?{i,d:Math.abs(c.offsetLeft-topProducts.scrollLeft)}:best,{i:0,d:Infinity});const page=Math.floor(card.i/cardsPerView());dots.forEach((d,i)=>d.classList.toggle('active',i===page))};
topProducts?.addEventListener('scroll',updateDots,{passive:true});window.addEventListener('resize',updateDots);
document.querySelectorAll('.arrows button').forEach((b,i)=>b.addEventListener('click',()=>topProducts.scrollBy({left:(i?1:-1)*topProducts.clientWidth,behavior:'smooth'})));

const showMore=document.querySelector('[data-show-more]');showMore?.addEventListener('click',()=>{showMore.textContent=showMore.textContent==='Show More'?'Show Less':'Show More'});

const productModal=document.querySelector('[data-product-modal]');
const orderModal=document.querySelector('[data-order-modal]');
const toggleModal=(modal,open)=>{modal.classList.toggle('is-open',open);modal.setAttribute('aria-hidden',String(!open));body.classList.toggle('modal-open',open||document.querySelector('.modal-backdrop.is-open'))};
document.querySelectorAll('[data-product-open]').forEach(el=>{const open=()=>toggleModal(productModal,true);el.addEventListener('click',open);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}})});
document.querySelector('[data-product-close]')?.addEventListener('click',()=>toggleModal(productModal,false));
document.querySelector('[data-order-open]')?.addEventListener('click',()=>{toggleModal(productModal,false);toggleModal(orderModal,true)});
document.querySelector('[data-order-close]')?.addEventListener('click',()=>toggleModal(orderModal,false));
document.querySelectorAll('.modal-backdrop').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)toggleModal(m,false)}));
document.querySelector('.order-modal')?.addEventListener('submit',e=>e.preventDefault());
document.addEventListener('keydown',e=>{if(e.key==='Escape'){setMenuState(false);document.querySelectorAll('.modal-backdrop.is-open').forEach(m=>toggleModal(m,false))}});
updateDots();

const feedbackTrack=document.querySelector('.feedback-grid');
const feedbackCards=[...(feedbackTrack?.children||[])];
const feedbackDots=[...document.querySelectorAll('.feedback-dots span')];
const feedbackPerView=()=>window.innerWidth>=1440?3:window.innerWidth>=768?2:1;
const updateFeedbackDots=()=>{if(!feedbackTrack)return;const nearest=feedbackCards.reduce((best,c,i)=>Math.abs(c.offsetLeft-feedbackTrack.scrollLeft)<best.d?{i,d:Math.abs(c.offsetLeft-feedbackTrack.scrollLeft)}:best,{i:0,d:Infinity});const page=Math.floor(nearest.i/feedbackPerView());feedbackDots.forEach((d,i)=>d.classList.toggle('active',i===page))};
feedbackTrack?.addEventListener('scroll',updateFeedbackDots,{passive:true});
window.addEventListener('resize',updateFeedbackDots);
document.querySelector('[data-feedback-prev]')?.addEventListener('click',()=>feedbackTrack.scrollBy({left:-feedbackTrack.clientWidth,behavior:'smooth'}));
document.querySelector('[data-feedback-next]')?.addEventListener('click',()=>feedbackTrack.scrollBy({left:feedbackTrack.clientWidth,behavior:'smooth'}));
updateFeedbackDots();
