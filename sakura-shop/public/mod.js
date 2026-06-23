/* ════════════════════════════════════════════════════════════════════════════
   SAKURA SHOP — Moderator Panel Logic
   ════════════════════════════════════════════════════════════════════════════ */

const API = '';
let modPassword = '';

// ─── AUTH ─────────────────────────────────────────────────────────────────
async function modLogin() {
  const pw = document.getElementById('mod-password-input').value;
  const res = await fetch(`${API}/api/mod/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: pw })
  });
  if (res.ok) {
    modPassword = pw;
    document.getElementById('login-gate').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    loadOrders();
  } else {
    document.getElementById('login-error').classList.remove('hidden');
  }
}

function modHeaders() {
  return { 'Content-Type': 'application/json', 'x-mod-password': modPassword };
}

// ─── TAB SWITCHER ─────────────────────────────────────────────────────────
function showTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.remove('active');
    p.classList.add('hidden');
  });
  document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById(`tab-${name}`);
  panel.classList.remove('hidden');
  panel.classList.add('active');
  event.currentTarget.classList.add('active');
  if (name === 'orders') loadOrders();
  if (name === 'products') loadModProducts();
  if (name === 'bundles') loadModBundles();
}

// ─── ORDERS ───────────────────────────────────────────────────────────────
async function loadOrders() {
  const res = await fetch(`${API}/api/mod/orders`, { headers: modHeaders() });
  const orders = await res.json();
  const wrap = document.getElementById('orders-table-wrap');

  if (orders.length === 0) {
    wrap.innerHTML = '<p style="color:var(--grey-3);font-size:14px;padding:24px 0;">Nessun ordine ancora.</p>';
    return;
  }

  wrap.innerHTML = `
    <table class="mod-table">
      <thead>
        <tr>
          <th>Codice</th>
          <th>Data</th>
          <th>Articoli</th>
          <th>Totale</th>
          <th>Stato</th>
          <th>Azione</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map(o => `
          <tr>
            <td style="font-family:var(--font-mono);color:var(--sakura-neon);font-size:12px;">${o.code}</td>
            <td>${new Date(o.createdAt).toLocaleDateString('it-IT')}</td>
            <td>${o.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}</td>
            <td style="font-family:var(--font-mono);">€${o.total}</td>
            <td><span class="status-chip status-${o.status}">${o.status}</span></td>
            <td>
              <select onchange="updateOrderStatus('${o.id}', this.value)" style="font-size:12px;border:1px solid var(--grey-2);border-radius:6px;padding:4px 8px;background:var(--grey-0);">
                <option value="pending" ${o.status==='pending'?'selected':''}>In attesa</option>
                <option value="shipped" ${o.status==='shipped'?'selected':''}>Spedito</option>
                <option value="done" ${o.status==='done'?'selected':''}>Completato</option>
              </select>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function updateOrderStatus(id, status) {
  await fetch(`${API}/api/mod/orders/${id}`, {
    method: 'PUT',
    headers: modHeaders(),
    body: JSON.stringify({ status })
  });
}

// ─── PRODUCTS ─────────────────────────────────────────────────────────────
async function loadModProducts() {
  const res = await fetch(`${API}/api/mod/products`, { headers: modHeaders() });
  const products = await res.json();
  const wrap = document.getElementById('mod-products-wrap');

  wrap.innerHTML = `
    <table class="mod-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Categoria</th>
          <th>Prezzo</th>
          <th>Stock</th>
          <th>Badge</th>
          <th>Featured</th>
          <th>Azioni</th>
        </tr>
      </thead>
      <tbody>
        ${products.map(p => `
          <tr>
            <td><strong>${p.name}</strong></td>
            <td>${p.category}</td>
            <td style="font-family:var(--font-mono);">€${p.price}</td>
            <td>
              <div style="display:flex;align-items:center;gap:8px;">
                <input type="number" value="${p.stock}" min="0"
                  style="width:60px;border:1px solid var(--grey-2);border-radius:6px;padding:4px 8px;font-size:13px;background:var(--grey-0);"
                  onchange="quickUpdateStock('${p.id}', this.value)" />
              </div>
            </td>
            <td>${p.badge || '—'}</td>
            <td>${p.featured ? '✓' : '—'}</td>
            <td>
              <div style="display:flex;gap:8px;">
                <button class="btn-ghost sm" onclick="editProduct(${JSON.stringify(p).replace(/"/g,'&quot;')})">Modifica</button>
                <button class="btn-ghost sm" style="color:var(--sakura-neon);border-color:var(--sakura-neon);" onclick="deleteProduct('${p.id}')">Elimina</button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function quickUpdateStock(id, stock) {
  await fetch(`${API}/api/mod/products/${id}`, {
    method: 'PUT',
    headers: modHeaders(),
    body: JSON.stringify({ stock: Number(stock) })
  });
}

async function deleteProduct(id) {
  if (!confirm('Eliminare questo prodotto?')) return;
  await fetch(`${API}/api/mod/products/${id}`, { method: 'DELETE', headers: modHeaders() });
  loadModProducts();
}

function openProductModal() {
  document.getElementById('product-modal-title').textContent = 'Nuovo Prodotto';
  document.getElementById('edit-product-id').value = '';
  ['f-name','f-desc','f-price','f-stock','f-cat','f-badge','f-image'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('f-featured').checked = false;
  document.getElementById('product-modal').classList.remove('hidden');
}

function editProduct(p) {
  document.getElementById('product-modal-title').textContent = 'Modifica Prodotto';
  document.getElementById('edit-product-id').value = p.id;
  document.getElementById('f-name').value = p.name;
  document.getElementById('f-desc').value = p.description;
  document.getElementById('f-price').value = p.price;
  document.getElementById('f-stock').value = p.stock;
  document.getElementById('f-cat').value = p.category;
  document.getElementById('f-badge').value = p.badge || '';
  document.getElementById('f-image').value = p.image;
  document.getElementById('f-featured').checked = p.featured;
  document.getElementById('product-modal').classList.remove('hidden');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.add('hidden');
}

async function saveProduct() {
  const id = document.getElementById('edit-product-id').value;
  const payload = {
    name: document.getElementById('f-name').value,
    description: document.getElementById('f-desc').value,
    price: Number(document.getElementById('f-price').value),
    stock: Number(document.getElementById('f-stock').value),
    category: document.getElementById('f-cat').value,
    badge: document.getElementById('f-badge').value || null,
    image: document.getElementById('f-image').value,
    featured: document.getElementById('f-featured').checked
  };
  if (id) {
    await fetch(`${API}/api/mod/products/${id}`, {
      method: 'PUT', headers: modHeaders(), body: JSON.stringify(payload)
    });
  } else {
    await fetch(`${API}/api/mod/products`, {
      method: 'POST', headers: modHeaders(), body: JSON.stringify(payload)
    });
  }
  closeProductModal();
  loadModProducts();
}

// ─── BUNDLES ──────────────────────────────────────────────────────────────
async function loadModBundles() {
  const res = await fetch(`${API}/api/bundles`);
  const bundles = await res.json();
  const wrap = document.getElementById('mod-bundles-wrap');
  wrap.innerHTML = '';

  if (bundles.length === 0) {
    wrap.innerHTML = '<p style="color:var(--grey-3);font-size:14px;">Nessun bundle. Creane uno!</p>';
    return;
  }

  bundles.forEach(b => {
    const div = document.createElement('div');
    div.className = 'bundle-mod-row';
    div.innerHTML = `
      <div>
        <div style="font-weight:500;color:var(--grey-5);margin-bottom:4px;">${b.name}</div>
        <div style="font-size:13px;color:var(--grey-4);">${b.description}</div>
        <div style="font-size:12px;font-family:var(--font-mono);color:var(--sakura-neon);margin-top:6px;">€${b.bundlePrice} (era €${b.originalPrice})</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button class="btn-ghost sm" onclick="toggleBundle('${b.id}',${!b.active})">${b.active ? 'Disattiva' : 'Attiva'}</button>
      </div>
    `;
    wrap.appendChild(div);
  });
}

async function toggleBundle(id, active) {
  await fetch(`${API}/api/mod/bundles/${id}`, {
    method: 'PUT', headers: modHeaders(), body: JSON.stringify({ active })
  });
  loadModBundles();
}

function openBundleModal() {
  document.getElementById('bundle-modal').classList.remove('hidden');
}

function closeBundleModal() {
  document.getElementById('bundle-modal').classList.add('hidden');
}

async function saveBundle() {
  const payload = {
    name: document.getElementById('b-name').value,
    description: document.getElementById('b-desc').value,
    originalPrice: Number(document.getElementById('b-orig').value),
    bundlePrice: Number(document.getElementById('b-price').value),
    products: []
  };
  await fetch(`${API}/api/mod/bundles`, {
    method: 'POST', headers: modHeaders(), body: JSON.stringify(payload)
  });
  closeBundleModal();
  loadModBundles();
}
