const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── IN-MEMORY DATA STORE ───────────────────────────────────────────────────
// In production, replace with a real DB (e.g. PostgreSQL on Railway)
let store = {
  products: [
    {
      id: 'p1',
      name: 'Haori Seta Nebbia',
      description: 'Giacca tradizionale in seta naturale, tintura sakura hand-dyed.',
      price: 189,
      category: 'Abbigliamento',
      stock: 7,
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
      badge: 'Nuovo',
      featured: true
    },
    {
      id: 'p2',
      name: 'Obi Geometrico Bianco',
      description: 'Fascia obi moderna in cotone organico, pattern minimalista.',
      price: 89,
      category: 'Accessori',
      stock: 12,
      image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80',
      badge: null,
      featured: true
    },
    {
      id: 'p3',
      name: 'Kimono Petalo Grigio',
      description: 'Kimono contemporaneo in lino grigio nebbia, linee pulite.',
      price: 245,
      category: 'Abbigliamento',
      stock: 3,
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80',
      badge: 'Ultimi pezzi',
      featured: true
    },
    {
      id: 'p4',
      name: 'Tabi Nuvola',
      description: 'Calze tabi in cotone pima, suola in gomma naturale.',
      price: 45,
      category: 'Calzature',
      stock: 20,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
      badge: null,
      featured: false
    },
    {
      id: 'p5',
      name: 'Yukata Cielo Sera',
      description: 'Yukata estivo in batista di cotone, stampa cielo crepuscolare.',
      price: 135,
      category: 'Abbigliamento',
      stock: 5,
      image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80',
      badge: 'Estate',
      featured: false
    },
    {
      id: 'p6',
      name: 'Kanzashi Ghiaccio',
      description: 'Fermaglio per capelli in resina trasparente, inclusioni petalo.',
      price: 62,
      category: 'Accessori',
      stock: 0,
      image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600&q=80',
      badge: 'Esaurito',
      featured: false
    }
  ],
  orders: [],
  reviews: [
    {
      id: 'r1',
      author: 'Michela R.',
      avatar: 'M',
      product: 'Haori Seta Nebbia',
      rating: 5,
      text: 'Qualità straordinaria, seta morbidissima. Il colore è esattamente come nelle foto. Spedizione rapidissima.',
      date: '2025-06-10'
    },
    {
      id: 'r2',
      author: 'Lorenzo T.',
      avatar: 'L',
      product: 'Kimono Petalo Grigio',
      rating: 5,
      text: 'Design minimalista perfetto, esattamente quello che cercavo. Tessuto premium, lo indosserei ogni giorno.',
      date: '2025-06-14'
    },
    {
      id: 'r3',
      author: 'Sara K.',
      avatar: 'S',
      product: 'Obi Geometrico Bianco',
      rating: 4,
      text: 'Bellissimo pezzo, versatile e ben fatto. Arrivato in packaging curatissimo.',
      date: '2025-06-18'
    }
  ],
  recentPurchases: [
    { product: 'Haori Seta Nebbia', city: 'Milano', time: '2 min fa' },
    { product: 'Kimono Petalo Grigio', city: 'Roma', time: '8 min fa' },
    { product: 'Obi Geometrico Bianco', city: 'Firenze', time: '15 min fa' },
    { product: 'Tabi Nuvola', city: 'Napoli', time: '23 min fa' },
    { product: 'Yukata Cielo Sera', city: 'Torino', time: '31 min fa' }
  ],
  bundles: [
    {
      id: 'b1',
      name: 'Set Primavera Completo',
      description: 'Haori + Obi + Kanzashi — tutto il necessario per la stagione.',
      originalPrice: 340,
      bundlePrice: 269,
      products: ['p1', 'p2', 'p6'],
      active: true
    }
  ],
  moderatorPassword: process.env.MOD_PASSWORD || 'sakura2025'
};

// ─── HELPERS ────────────────────────────────────────────────────────────────
function generateOrderCode(items) {
  const prefix = 'SKR';
  const timestamp = Date.now().toString(36).toUpperCase();
  const uid = uuidv4().split('-')[0].toUpperCase();
  return `${prefix}-${timestamp}-${uid}`;
}

function authMod(req, res, next) {
  const pw = req.headers['x-mod-password'];
  if (pw !== store.moderatorPassword) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }
  next();
}

// ─── PUBLIC API ─────────────────────────────────────────────────────────────

// GET all products
app.get('/api/products', (req, res) => {
  res.json(store.products);
});

// GET single product
app.get('/api/products/:id', (req, res) => {
  const p = store.products.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Prodotto non trovato' });
  res.json(p);
});

// GET recent purchases (social proof)
app.get('/api/social/recent', (req, res) => {
  res.json(store.recentPurchases.slice(0, 5));
});

// GET reviews
app.get('/api/reviews', (req, res) => {
  res.json(store.reviews);
});

// GET bundles
app.get('/api/bundles', (req, res) => {
  res.json(store.bundles.filter(b => b.active));
});

// POST confirm order → generate code
app.post('/api/orders', (req, res) => {
  const { items, customerNote } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Carrello vuoto' });
  }

  // Validate stock
  for (const item of items) {
    const product = store.products.find(p => p.id === item.productId);
    if (!product) return res.status(400).json({ error: `Prodotto ${item.productId} non trovato` });
    if (product.stock < item.quantity) {
      return res.status(400).json({ error: `Stock insufficiente per ${product.name}` });
    }
  }

  // Deduct stock
  for (const item of items) {
    const product = store.products.find(p => p.id === item.productId);
    product.stock -= item.quantity;
    if (product.stock === 0) product.badge = 'Esaurito';
    else if (product.stock <= 3) product.badge = 'Ultimi pezzi';
  }

  const code = generateOrderCode(items);
  const order = {
    id: uuidv4(),
    code,
    items: items.map(item => {
      const product = store.products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        name: product.name,
        price: product.price,
        quantity: item.quantity
      };
    }),
    customerNote: customerNote || '',
    total: items.reduce((sum, item) => {
      const product = store.products.find(p => p.id === item.productId);
      return sum + product.price * item.quantity;
    }, 0),
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  store.orders.push(order);

  // Add to recent purchases feed
  const firstItem = order.items[0];
  const cities = ['Milano', 'Roma', 'Firenze', 'Napoli', 'Torino', 'Bologna', 'Venezia'];
  store.recentPurchases.unshift({
    product: firstItem.name,
    city: cities[Math.floor(Math.random() * cities.length)],
    time: 'Adesso'
  });
  store.recentPurchases = store.recentPurchases.slice(0, 10);

  res.json({ code, orderId: order.id, total: order.total, items: order.items });
});

// ─── MODERATOR API ───────────────────────────────────────────────────────────

// Auth check
app.post('/api/mod/auth', (req, res) => {
  const { password } = req.body;
  if (password !== store.moderatorPassword) {
    return res.status(401).json({ error: 'Password errata' });
  }
  res.json({ success: true });
});

// GET all orders (mod)
app.get('/api/mod/orders', authMod, (req, res) => {
  res.json(store.orders);
});

// GET all products with full stock (mod)
app.get('/api/mod/products', authMod, (req, res) => {
  res.json(store.products);
});

// POST new product (mod)
app.post('/api/mod/products', authMod, (req, res) => {
  const { name, description, price, category, stock, image, badge, featured } = req.body;
  const product = {
    id: 'p' + Date.now(),
    name, description, price: Number(price),
    category, stock: Number(stock),
    image: image || 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80',
    badge: badge || null,
    featured: featured || false
  };
  store.products.push(product);
  res.json(product);
});

// PUT update product (mod)
app.put('/api/mod/products/:id', authMod, (req, res) => {
  const idx = store.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Prodotto non trovato' });
  store.products[idx] = { ...store.products[idx], ...req.body };
  res.json(store.products[idx]);
});

// DELETE product (mod)
app.delete('/api/mod/products/:id', authMod, (req, res) => {
  store.products = store.products.filter(p => p.id !== req.params.id);
  res.json({ success: true });
});

// POST new bundle (mod)
app.post('/api/mod/bundles', authMod, (req, res) => {
  const bundle = { id: 'b' + Date.now(), ...req.body, active: true };
  store.bundles.push(bundle);
  res.json(bundle);
});

// PUT update bundle (mod)
app.put('/api/mod/bundles/:id', authMod, (req, res) => {
  const idx = store.bundles.findIndex(b => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Bundle non trovato' });
  store.bundles[idx] = { ...store.bundles[idx], ...req.body };
  res.json(store.bundles[idx]);
});

// PUT update order status (mod)
app.put('/api/mod/orders/:id', authMod, (req, res) => {
  const order = store.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Ordine non trovato' });
  order.status = req.body.status || order.status;
  res.json(order);
});

// ─── SERVE SPA PAGES ────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌸 Sakura Shop running on port ${PORT}`);
});
