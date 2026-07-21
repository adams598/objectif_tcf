# Architecture des paiements — Objectif TCF

> **Déploiement Vercel (recommandé)** : [`docs/deploiement-vercel.md`](./deploiement-vercel.md) · Hostinger VPS : [`docs/deploiement-hostinger.md`](./deploiement-hostinger.md)

## Prestataires

| Zone | Moyens | Prestataire |
|------|--------|-------------|
| Afrique (XAF, XOF) | MTN MoMo, Orange Money, Wave, Moov… | **pawaPay** (page hébergée + API Checkouts) |
| Europe / diaspora | Carte, Google Pay, SEPA, PayPal (EUR/USD) | **Stripe** |

Documentation pawaPay : https://docs.pawapay.io

## Parcours Mobile Money (pawaPay)

1. L’utilisateur choisit la devise (XAF/XOF) et un moyen Mobile Money.
2. L’app appelle `POST /v2/checkouts` et redirige vers la **page pawaPay**.
3. Le client valide le paiement (PIN sur le téléphone).
4. pawaPay envoie un **callback** à votre URL configurée dans le dashboard.
5. L’abonnement est activé après statut `COMPLETED` (webhook + vérif. sur la page succès).

## Configuration (`.env.local`)

```env
PAWAPAY_API_TOKEN=votre_jwt_sandbox_ou_live
PAWAPAY_ENV=sandbox
# PAWAPAY_ENV=production   # une fois live

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

PAYMENTS_MOCK_MODE=false
```

### Dashboard pawaPay

1. Créer un compte sur https://pawapay.io
2. **API tokens** : générer un token (sandbox pour les tests)
3. **Callback URLs** : URL de votre app accessible en HTTPS, ex.  
   `https://votre-domaine.com/api/paiement/webhook/pawapay`  
   (en local : ngrok ou tunnel équivalent)
4. Tester avec les [numéros sandbox](https://docs.pawapay.io/v2/docs/test_numbers)

### Stripe

Webhook : `{APP_URL}/api/paiement/webhook/stripe`

## Mode démo

Sans clés valides :

```env
PAYMENTS_MOCK_MODE=true
```

## Migration Prisma

Après pull :

```bash
npx prisma db push
npx prisma generate
```

## Legacy

Les enums `CINETPAY` et `FLUTTERWAVE` restent pour l’historique des anciens paiements.
