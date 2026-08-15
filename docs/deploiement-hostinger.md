# Déploiement production — Hostinger

Guide pour mettre **Objectif TCF** en ligne sur un **VPS Hostinger** avec paiements automatiques (pawaPay + Stripe) et contrôle via `/admin`.

---

## Architecture recommandée

```
Internet → Nginx (HTTPS) → Next.js :3000 (PM2)
                ↓
         PostgreSQL (Neon cloud ou VPS)
                ↓
    Webhooks Stripe + pawaPay → activation abonnement auto
```

| Composant | Recommandation |
|-----------|----------------|
| Hébergement app | **VPS Hostinger** (Node 20+, 2 Go RAM min.) |
| Base de données | **Neon PostgreSQL** (déjà configuré) ou PostgreSQL Hostinger |
| Process manager | **PM2** (`ecosystem.config.js` inclus) |
| Reverse proxy | **Nginx** + certificat SSL Let's Encrypt |
| Fichiers statiques | Cloudinary (uploads) |

> Hostinger « hébergement web » mutualisé ne convient pas toujours à Next.js 15 + webhooks. Préférez un **VPS** ou **Cloud Hosting** avec accès Node.

---

## 1. Prérequis avant déploiement

### Comptes & clés

- [ ] Domaine pointant vers le VPS (ex. `objectif-tcf.org`)
- [ ] Base PostgreSQL (`DATABASE_URL` + `DIRECT_URL`)
- [ ] **pawaPay production** : [dashboard.pawapay.io](https://dashboard.pawapay.io) + token live
- [ ] **Stripe live** : `sk_live_...` + webhook secret
- [ ] **Resend** : domaine vérifié pour les emails
- [ ] **Cloudinary** : compte production
- [ ] **Google OAuth** : redirect URI prod `{APP_URL}/api/auth/google/callback`

### Variables `.env` sur le serveur

Copiez `.env.example` → `.env` sur le VPS et remplissez **toutes** les valeurs.

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
APP_URL=https://votre-domaine.com
PAYMENTS_MOCK_MODE=false
PAWAPAY_ENV=production
```

Générez des secrets JWT forts :

```bash
openssl rand -base64 48
```

---

## 2. Webhooks (paiements automatiques)

Sans webhooks, les paiements restent bloqués en « En cours ».

| Prestataire | URL à enregistrer |
|-------------|-------------------|
| **Stripe** | `https://votre-domaine.com/api/paiement/webhook/stripe` |
| **pawaPay** | `https://votre-domaine.com/api/paiement/webhook/pawapay` |

### Stripe Dashboard

1. Developers → Webhooks → Add endpoint
2. Événements : `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`
3. Copier le **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### pawaPay Dashboard

1. Developers → [Callback URLs](https://dashboard.pawapay.io/#/system/callback-url)
2. Même URL pour tous les flux : `https://votre-domaine.com/api/paiement/webhook/pawapay`

---

## 3. Installation sur le VPS Hostinger

Connectez-vous en SSH :

```bash
# Node 20 (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# PM2
npm install -g pm2

# Clone du projet
cd /var/www
git clone https://github.com/VOTRE-ORG/objectif_tcf.git
cd objectif_tcf

# Variables d'environnement
cp .env.example .env
nano .env   # remplir toutes les valeurs

# Install + build
npm ci
npm run db:deploy
npm run build

# Compte admin
npm run db:seed-admin

# Démarrage
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 4. Nginx (HTTPS + webhooks)

Créez `/etc/nginx/sites-available/objectif-tcf` :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com www.votre-domaine.com;

    ssl_certificate     /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

    client_max_body_size 12M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSE temps réel — désactiver le buffering
    location /api/realtime/stream {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }

    # Webhooks — corps brut intact (Stripe)
    location /api/paiement/webhook/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

SSL avec Certbot :

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
sudo ln -s /etc/nginx/sites-available/objectif-tcf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. Vérifications post-déploiement

### Health check (monitoring Hostinger)

```bash
curl https://votre-domaine.com/api/health
```

Réponse attendue : `"status": "healthy"`.

### Dashboard admin

1. Connexion : `https://votre-domaine.com/admin`
2. Panneau **État production** en haut : Stripe + pawaPay verts
3. API : `GET /api/admin/system/status` (admin connecté)

### Test paiement réel

| Scénario | Résultat attendu |
|----------|------------------|
| Mobile Money XAF (pawaPay) | Webhook → abonnement actif dans `/admin/paiements` |
| Carte EUR (Stripe) | Webhook → abonnement actif |
| Remboursement admin | `/admin/paiements` → action remboursement |

---

## 6. Mises à jour (CI/CD manuel)

```bash
cd /var/www/objectif_tcf
git pull
npm ci
npm run db:deploy
npm run build
pm2 restart objectif-tcf
```

---

## 7. Contrôle admin — ce que vous pouvez gérer

| Section | URL | Actions |
|---------|-----|---------|
| Vue d'ensemble | `/admin` | KPIs, état production |
| Paiements | `/admin/paiements` | Liste, stats, **remboursements** |
| Offres & tarifs | `/admin/offres` | Prix XAF/USD/XOF, offres |
| Utilisateurs | `/admin/utilisateurs` | Rôles, abonnements manuels |
| Séries / QCM | `/admin/series` | Contenu examens |
| Examens | `/admin/examens` | Types TCF, TEF, IELTS… |
| Communauté | `/admin/communaute` | Modération |

---

## 8. Dépannage

| Symptôme | Solution |
|----------|----------|
| `/api/health` → 503 | Vérifier `.env`, DATABASE_URL, JWT secrets |
| Paiement bloqué « En cours » | Webhook URL incorrecte ou HTTP au lieu de HTTPS |
| Stripe signature invalide | `STRIPE_WEBHOOK_SECRET` du endpoint **live** |
| pawaPay sandbox en prod | `PAWAPAY_ENV=production` + token production |
| Cookies auth perdus | `NEXT_PUBLIC_APP_URL` doit être HTTPS exact |
| SSE notifications coupées | Config Nginx `/api/realtime/stream` ci-dessus |

---

## Ressources

- [pawaPay — Getting started](https://docs.pawapay.io/getting_started)
- [Setup pawaPay détaillé](./pawapay-setup.md)
- [Architecture paiements](./paiements.md)
