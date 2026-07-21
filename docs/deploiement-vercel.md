# Déploiement sur Vercel (gratuit — Hobby)

Front + back (API, webhooks, admin) sur **un seul projet Vercel**.  
Domaine Hostinger optionnel (DNS → Vercel).

---

## 1. Prérequis

- Compte [GitHub](https://github.com) avec le repo poussé
- Compte [Vercel](https://vercel.com) (gratuit)
- Base **Neon PostgreSQL** (`DATABASE_URL` + `DIRECT_URL`)
- Comptes **pawaPay** (sandbox puis prod) et **Stripe** (test puis live)

---

## 2. Lier le projet à Vercel

### Option A — Interface web (recommandé)

1. [vercel.com/new](https://vercel.com/new) → Import Git Repository
2. Sélectionnez `objectif_tcf`
3. Framework : **Next.js** (détecté automatiquement)
4. **Ne déployez pas encore** — configurez d'abord les variables (étape 3)

### Option B — CLI

```bash
npm i -g vercel
vercel login
cd objectif_tcf
vercel link
```

---

## 3. Variables d'environnement

### Préparer le fichier

Le fichier **`.env.vercel`** est déjà rempli (gitignored). Sinon utilisez **`.env.vercel.example`** (même contenu).

### Importer dans Vercel

1. Dashboard → votre projet → **Settings** → **Environment Variables**
2. **Import .env** → sélectionnez `.env.vercel`
3. Cochez **Production** (et **Preview** si vous voulez tester les PR en sandbox)

| Variable | Production | Preview (optionnel) |
|----------|------------|---------------------|
| `DATABASE_URL` | Neon prod | même ou branche dev |
| `PAWAPAY_ENV` | `production` | `sandbox` |
| `STRIPE_SECRET_KEY` | `sk_live_...` | `sk_test_...` |
| `PAYMENTS_MOCK_MODE` | `false` | `false` |

### URLs après le 1er déploiement

Mettez à jour (ou prévoyez votre domaine custom) :

```env
NEXT_PUBLIC_APP_URL=https://objectif-tcf.vercel.app
APP_URL=https://objectif-tcf.vercel.app
```

Puis **Redeploy** (Deployments → ⋮ → Redeploy).

### Récupérer les vars en local (optionnel)

```bash
npm run vercel:env-pull
```

---

## 4. Premier déploiement

```bash
npm run vercel:deploy
```

Ou push sur `main` si Git est connecté (déploiement auto).

Build Vercel exécute : `prisma generate` + `next build` (voir `package.json`).

---

## 5. Base de données

Une fois le projet en ligne, depuis **votre machine** (avec `.env.local` pointant vers Neon) :

```bash
npm run db:deploy
npm run db:seed-admin
```

Cela crée les tables et votre compte **SUPER_ADMIN**.

---

## 6. Webhooks (paiements automatiques)

Remplacez `VOTRE-URL` par `https://objectif-tcf.vercel.app` ou votre domaine.

| Prestataire | URL |
|-------------|-----|
| **pawaPay** | `VOTRE-URL/api/paiement/webhook/pawapay` |
| **Stripe** | `VOTRE-URL/api/paiement/webhook/stripe` |

Événements Stripe : `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`.

Copiez le **Signing secret** Stripe → `STRIPE_WEBHOOK_SECRET` sur Vercel → Redeploy.

---

## 7. Domaine Hostinger → Vercel

1. Hostinger → DNS du domaine
2. Vercel → Project → **Settings** → **Domains** → Add domain
3. Suivez les enregistrements DNS indiqués par Vercel (A / CNAME)
4. Mettez à jour sur Vercel :

```env
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
APP_URL=https://votre-domaine.com
```

5. Mettez à jour les webhooks pawaPay / Stripe avec le nouveau domaine
6. Google OAuth : ajouter `{APP_URL}/api/auth/google/callback`

---

## 8. Vérifications

| Test | Attendu |
|------|---------|
| `https://VOTRE-URL/api/health` | `"status": "healthy"` |
| `/admin` connecté | Panneau « État production » vert |
| Paiement test XAF | Abonnement actif dans `/admin/paiements` |

---

## 9. Plan gratuit Vercel — limites

- **Hobby** : suffisant pour démarrer
- Fonctions serverless : timeout ~10 s (webhooks OK ; SSE temps réel limité)
- Bande passante généreuse pour un lancement

Pour la messagerie temps réel (`/api/realtime/stream`), le hub in-memory ne partage pas entre instances — acceptable au début ; migrer vers Pusher/Ably si besoin.

---

## 10. Mises à jour

Chaque push sur `main` → déploiement automatique.

Variables modifiées → Vercel Dashboard → Redeploy obligatoire.

---

## Fichiers utiles

| Fichier | Rôle |
|---------|------|
| `.env.vercel.example` | Template à importer dans Vercel |
| `.env.local` | Dev local uniquement (gitignored) |
| `vercel.json` | Région Paris (`cdg1`), timeouts webhooks |

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Build échoue Prisma | Vérifier `DATABASE_URL` sur Vercel |
| 401 webhook Stripe | `STRIPE_WEBHOOK_SECRET` du bon environnement |
| Paiement bloqué | Callback pawaPay = URL HTTPS publique exacte |
| Cookies auth | `NEXT_PUBLIC_APP_URL` = URL affichée dans le navigateur |
