# Paycard (Guinée) — Objectif TCF

Intégration adaptée de [paycard-laravel](https://github.com/bmsanoussy/paycard-laravel) / [paycardjs](https://github.com/bmsanoussy/paycardjs) en TypeScript (Next.js).

## Moyens supportés

- Orange Money (Guinée)
- MTN Mobile Money
- Carte Visa / Mastercard
- Portefeuille Paycard

## Configuration

```env
PAYCARD_API_KEY=votre-cle-api
# true = utiliser Paycard plutôt que pawaPay pour Orange / MTN / carte
PAYCARD_PREFERRED=true
# Optionnel — défaut : {APP_URL}/api/paiement/webhook/paycard
# PAYCARD_CALLBACK_URL=https://votre-domaine.com/api/paiement/webhook/paycard
```

Obtenir une clé : [paycard.co/contact](https://paycard.co/contact)

## Flux

1. Checkout → `POST /epay/create` sur `https://mapaycard.com`
2. Redirection vers `payment_url`
3. Callback **GET** avec `paycard-operation-reference` (obligatoire pour éviter les erreurs CSRF type Laravel 419)
4. Vérification `GET /epay/{apiKey}/{reference}/status`
5. Activation de l’abonnement si `status === success`

## Priorité des prestataires

| Situation | Prestataire |
|-----------|-------------|
| `PAYCARD_PREFERRED=true` + clé Paycard | **Paycard** pour Orange / MTN / Mobile Money / carte |
| Paycard seul (sans pawaPay) | **Paycard** |
| pawaPay + Paycard sans preferred | **pawaPay** (multi-pays) |
| Carte EUR + Stripe | **Stripe** |

## Fichiers

- `lib/payments/providers/paycard.ts` — client API
- `app/api/paiement/webhook/paycard/route.ts` — callback GET
- Branchement : `lib/payments/service.ts`, `lib/payments/methods.ts`
