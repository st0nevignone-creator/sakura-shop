# 桜 SAKURA SHOP — Documentazione Completa

## Architettura del Sistema

```
sakura-shop/
├── server.js          ← Express API + serve static files
├── public/
│   ├── index.html     ← Storefront utente
│   ├── moderatore.html← Dashboard privata moderatori
│   ├── style.css      ← Design system Sakura Tech-Minimal
│   ├── app.js         ← Logica frontend utente
│   └── mod.js         ← Logica pannello moderatori
├── railway.json       ← Config Railway
├── Procfile           ← Comando avvio
└── package.json
```

---

## Flusso di Dati — Generazione Codice Ordine

```
UTENTE
  │
  ├─→ Sfoglia prodotti (GET /api/products)
  │     ↳ stock, badge, categoria visualizzati in real-time
  │
  ├─→ Aggiunge al carrello (localStorage client-side)
  │     ↳ nessuna chiamata API finché non conferma
  │
  └─→ Clicca "Conferma Ordine" (POST /api/orders)
        │
        ├─ Server valida lo stock
        ├─ Server scala le quantità dal magazzino
        ├─ Server genera codice: SKR-{timestamp-base36}-{uuid-short}
        │   Esempio: SKR-LKRZ4A2-F7C8D3E1
        ├─ Ordine salvato in memoria (o DB in produzione)
        ├─ Feed "acquisti recenti" aggiornato
        │
        └─→ Risposta JSON: { code, orderId, total, items }
              ↳ Modal mostra il codice al cliente
              ↳ Cliente salva il codice per ritiro/spedizione
```

---

## API Endpoints

### Pubblici (Utenti)
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/products` | Lista prodotti con stock |
| GET | `/api/products/:id` | Singolo prodotto |
| GET | `/api/bundles` | Bundle attivi |
| GET | `/api/reviews` | Recensioni |
| GET | `/api/social/recent` | Feed acquisti recenti |
| POST | `/api/orders` | Conferma ordine → genera codice |

### Protetti (Moderatori) — header `x-mod-password` richiesto
| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/mod/auth` | Verifica password |
| GET | `/api/mod/orders` | Lista ordini completa |
| GET | `/api/mod/products` | Lista prodotti (mod view) |
| POST | `/api/mod/products` | Nuovo prodotto |
| PUT | `/api/mod/products/:id` | Modifica prodotto / aggiorna stock |
| DELETE | `/api/mod/products/:id` | Elimina prodotto |
| POST | `/api/mod/bundles` | Nuovo bundle |
| PUT | `/api/mod/bundles/:id` | Attiva/disattiva/modifica bundle |
| PUT | `/api/mod/orders/:id` | Aggiorna stato ordine |

---

## Funzionalità Principali

### Utente
- Griglia prodotti con **glassmorphism**, badge stock in tempo reale
- **Carrello slide-out** con gestione quantità
- **Conferma ordine senza pagamento** → genera codice univoco `SKR-XXXXX`
- Modal con riepilogo e codice da salvare
- Ticker "acquisti recenti" automatico
- Toast social proof ogni 12 secondi
- Sezione bundle con risparmio evidenziato
- Recensioni clienti

### Moderatori (`/moderatore.html`)
- **Login protetto** da password
- **Ordini**: lista completa con codici, articoli, totali; cambio stato (pending → shipped → done)
- **Prodotti**: aggiorna stock inline, modifica tutti i campi, elimina, aggiunge nuovi
- **Bundle**: crea, attiva/disattiva bundle con prezzo scontato

---

## Deploy su Railway

### 1. Crea repo GitHub
```bash
cd sakura-shop
git init
git add .
git commit -m "🌸 Initial commit — Sakura Shop"
git remote add origin https://github.com/TUO-USERNAME/sakura-shop.git
git push -u origin main
```

### 2. Deploy su Railway
1. Vai su [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → seleziona `sakura-shop`
3. Railway rileva automaticamente Node.js e usa `node server.js`
4. Vai in **Variables** e aggiungi:
   ```
   MOD_PASSWORD = la_tua_password_sicura
   PORT = 3000   (Railway lo imposta già automaticamente)
   ```
5. Aspetta il deploy (< 2 minuti) → copia l'URL generato

### 3. Variabili d'ambiente
| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `PORT` | 3000 | Auto-impostato da Railway |
| `MOD_PASSWORD` | `sakura2025` | **Cambiare in produzione!** |

---

## Note Produzione

> **Attenzione**: Il server usa uno store in-memory. Riavviando il processo i dati vengono persi.
> Per la produzione reale, sostituire con un database persistente (PostgreSQL via Railway Add-on è la scelta più semplice).

### Upgrade a PostgreSQL (opzionale)
1. In Railway → **Add Service** → **Database** → PostgreSQL
2. Railway inietta `DATABASE_URL` automaticamente
3. Installare `pg` e riscrivere lo store su query SQL

---

## Personalizzazione Rapida

### Cambio prodotti
Modificare l'array `store.products` in `server.js` → oppure usare il pannello moderatori.

### Cambio colori
Modificare le variabili CSS in `style.css`:
```css
--sakura-neon: #f0147a;   /* colore CTA */
--sakura-3:    #e8a0b4;   /* rosa petalo */
```

### Cambio testi hero
In `public/index.html` → sezione `<section class="hero">`.

---

*Progetto: Sakura Tech-Minimal E-commerce · Versione 1.0*
