/* ════════════════════════════════════════════════════════════════════════════
   SAKURA SHOP — Frontend Logic
   ════════════════════════════════════════════════════════════════════════════ */

const API = '';   // same origin
let cart = [];    // [{ productId, name, price, quantity, image }]

// ─── INIT ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadProducts(), loadBundles(), loadReviews(), loadTicker()]);
  renderCart();
  startSocialToasts();
});

// ─── PRODUCTS ──────────────────────────────────────────────────────────────
async function loadProducts() {
  const res = await fetch(`${API}/api/products`);
  const products = await res.json();
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';
  products.forEach(p => grid.appendChild(buildProductCard(p)));
}

function buildProductCard(p) {
  const card = document.createElement('div');
  const isOut = p.stock === 0;
  const isLow = p.stock > 0 && p.stock <= 3;
  card.className = 'product-card' + (isOut ? ' out-of-stock' : '');

  const badgeHTML = p.badge
    ? `<span class="card-badge ${isLow || p.badge === 'Ultimi pezzi' ? 'urgent' : ''}">${p.badge}</span>`
    : '';

  const stockDot = isOut ? '' : `<span class="card-stock-pill">
    <span class="dot ${isLow ? 'low' : 'ok'}"></span>
    ${isOut ? 'Esaurito' : isLow ? `Solo ${p.stock} rimasti` : `${p.stock} disponibili`}
  </span>`;

  card.innerHTML = `
    <div class="card-img-wrap">
      <img src="${p.image}" alt="${p.name}" loading="lazy" />
      ${badgeHTML}
      ${stockDot}
    </div>
    <div class="card-body">
      <div class="card-cat">${p.category}</div>
      <div class="card-name">${p.name}</div>
      <div class="card-desc">${p.description}</div>
      <div class="card-footer">
        <span class="card-price">€${p.price}</span>
        ${!isOut ? `<button class="card-add-btn" onclick="addToCart('${p.id}','${p.name}',${p.price},'${p.image}'); event.stopPropagation()">+</button>` : ''}
      </div>
    </div>
  `;
  return card;
}

// ─── BUNDLES ───────────────────────────────────────────────────────────────
async function loadBundles() {
  const res = await fetch(`${API}/api/bundles`);
  const bundles = await res.json();
  const grid = document.getElementById('bundles-grid');
  grid.innerHTML = '';
  if (bundles.length === 0) {
    grid.innerHTML = '<p style="color:var(--grey-3);font-size:14px;">Nessun bundle attivo al momento.</p>';
    return;
  }
  bundles.forEach(b => {
    const save = b.originalPrice - b.bundlePrice;
    const div = document.createElement('div');
    div.className = 'bundle-card';
    div.innerHTML = `
      <div class="bundle-tag">Bundle Esclusivo</div>
      <div class="bundle-name">${b.name}</div>
      <div class="bundle-desc">${b.description}</div>
      <div class="bundle-pricing">
        <span class="bundle-orig">€${b.originalPrice}</span>
        <span class="bundle-price">€${b.bundlePrice}</span>
        <span class="bundle-save">Risparmi €${save}</span>
      </div>
      <button class="btn-cta" onclick="addBundleToCart('${b.id}','${b.name}',${b.bundlePrice})">Aggiungi Bundle</button>
    `;
    grid.appendChild(div);
  });
}

// ─── REVIEWS ──────────────────────────────────────────────────────────────
async function loadReviews() {
  const res = await fetch(`${API}/api/reviews`);
  const reviews = await res.json();
  const grid = document.getElementById('reviews-grid');
  grid.innerHTML = '';
  reviews.forEach(r => {
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `
      <div class="review-header">
        <div class="review-avatar">${r.avatar}</div>
        <div>
          <div class="review-author">${r.author}</div>
          <div class="review-product">${r.product}</div>
        </div>
      </div>
      <div class="review-stars">${stars}</div>
      <div class="review-text">${r.text}</div>
      <div class="review-date">${r.date}</div>
    `;
    grid.appendChild(card);
  });
}

// ─── TICKER ───────────────────────────────────────────────────────────────
async function loadTicker() {
  const res = await fetch(`${API}/api/social/recent`);
  const items = await res.json();
  const track = document.getElementById('ticker-track');
  track.textContent = items.map(i => `🌸 ${i.product} — acquistato da ${i.city} ${i.time}`).join('   ·   ');
}

// ─── CART ─────────────────────────────────────────────────────────────────
function addToCart(productId, name, price, image) {
  const existing = cart.find(i => i.productId === productId);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ productId, name, price, quantity: 1, image });
  }
  renderCart();
  showToast(`<strong>${name}</strong> aggiunto al carrello.`);
}

function addBundleToCart(bundleId, name, price) {
  const existing = cart.find(i => i.productId === bundleId);
  if (existing) { existing.quantity++; } else {
    cart.push({ productId: bundleId, name: `🎁 ${name}`, price, quantity: 1, image: '' });
  }
  renderCart();
  showToast(`Bundle <strong>${name}</strong> aggiunto!`);
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.productId !== productId);
  renderCart();
}

function changeQty(productId, delta) {
  const item = cart.find(i => i.productId === productId);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) removeFromCart(productId);
  else renderCart();
}

function renderCart() {
  const countEl = document.getElementById('cart-count');
  const itemsEl = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');

  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  countEl.textContent = count;

  if (cart.length === 0) {
    itemsEl.innerHTML = '<p class="cart-empty">Il tuo carrello è vuoto.<br/>Sfoglia la collezione →</p>';
    totalEl.textContent = '€0';
    return;
  }

  itemsEl.innerHTML = '';
  cart.forEach(item => {
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      ${item.image
        ? `<img class="cart-item-img" src="${item.image}" alt="${item.name}" />`
        : `<div class="cart-item-img" style="display:flex;align-items:center;justify-content:center;font-size:24px;">🎁</div>`}
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">€${item.price} × ${item.quantity} = €${item.price * item.quantity}</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="changeQty('${item.productId}',-1)">−</button>
        <span class="qty-val">${item.quantity}</span>
        <button class="qty-btn" onclick="changeQty('${item.productId}',1)">+</button>
      </div>
    `;
    itemsEl.appendChild(div);
  });

  totalEl.textContent = `€${total}`;
}

function openCart() {
  document.getElementById('cart-overlay').classList.remove('hidden');
  document.getElementById('cart-drawer').classList.add('open');
}

function closeCart() {
  document.getElementById('cart-overlay').classList.add('hidden');
  document.getElementById('cart-drawer').classList.remove('open');
}

// ─── CONFIRM ORDER ─────────────────────────────────────────────────────────
async function confirmOrder() {
  if (cart.length === 0) return;
  const note = document.getElementById('cart-note').value;
  const items = cart.map(i => ({ productId: i.productId, quantity: i.quantity }));

  try {
    const res = await fetch(`${API}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, customerNote: note })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Errore'); return; }

    // Show modal
    document.getElementById('order-code-display').textContent = data.code;
    const summaryEl = document.getElementById('order-items-summary');
    summaryEl.innerHTML = '';
    data.items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'summary-row';
      row.innerHTML = `<span>${item.name} × ${item.quantity}</span><span>€${item.price * item.quantity}</span>`;
      summaryEl.appendChild(row);
    });
    const totalRow = document.createElement('div');
    totalRow.className = 'summary-row';
    totalRow.innerHTML = `<span>Totale ordine</span><span>€${data.total}</span>`;
    summaryEl.appendChild(totalRow);

    document.getElementById('order-modal').classList.remove('hidden');
    closeCart();
    cart = [];
    renderCart();
    loadProducts(); // refresh stock
    loadTicker();
  } catch (e) {
    alert('Errore di rete. Riprova.');
  }
}

function closeModal() {
  document.getElementById('order-modal').classList.add('hidden');
}

// ─── TOAST ────────────────────────────────────────────────────────────────
function showToast(html) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = html;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3800);
}

// ─── SOCIAL PROOF TOASTS ──────────────────────────────────────────────────
async function startSocialToasts() {
  const res = await fetch(`${API}/api/social/recent`);
  const items = await res.json();
  let idx = 0;
  setInterval(() => {
    if (items.length === 0) return;
    const item = items[idx % items.length];
    showToast(`🌸 <strong>${item.city}</strong> ha appena acquistato <strong>${item.product}</strong>`);
    idx++;
  }, 12000);
}
