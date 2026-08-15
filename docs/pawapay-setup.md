# Configuration pawaPay — Objectif TCF

Guide officiel : [Getting started with PawaPay](https://docs.pawapay.io/getting_started)

## 1. Créer un compte sandbox

1. Inscrivez-vous sur le [dashboard sandbox](https://dashboard.sandbox.pawapay.io/#/merchant-signup).
2. Aucune onboarding lourde n’est requise pour tester : pas d’argent réel, pas de PIN visible en sandbox ([doc](https://docs.pawapay.io/v2/docs/how_to_start#testing-the-integration)).

Production (argent réel) : [dashboard.pawapay.io](https://dashboard.pawapay.io) — accessible après onboarding sandbox.

## 2. Variables d’environnement (`.env.local`)

```env
PAWAPAY_API_TOKEN="collez_votre_token_ici"
PAWAPAY_ENV="sandbox"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
```

| Variable | Description |
|----------|-------------|
| `PAWAPAY_API_TOKEN` | JWT généré dans **Developers → API tokens**. Différent entre sandbox et production. |
| `PAWAPAY_ENV` | `sandbox` (défaut) ou `production` |
| `PAWAPAY_CALLBACK_URL` | *(optionnel)* URL publique si différente de `APP_URL` (ex. tunnel ngrok) |

**Authentification** : toutes les requêtes utilisent `Authorization: Bearer <token>` ([doc](https://docs.pawapay.io/v2/docs/how_to_start#how-to-authenticate-calls-to-the-merchant-api)).

## 3. Configurer les callbacks (obligatoire en prod, recommandé en dev)

1. Dashboard → [Developers → Callback URLs](https://dashboard.sandbox.pawapay.io/#/system/callback-url)
2. Collez **la même URL** pour tous les types de flux (deposits, checkouts, refunds…) :

```
https://VOTRE-DOMAINE/api/paiement/webhook/pawapay
```

**En local** (`localhost` n’est pas joignable par pawaPay) :

```bash
ngrok http 3000
```

Puis dans `.env.local` :

```env
PAWAPAY_CALLBACK_URL="https://abc123.ngrok-free.app"
NEXT_PUBLIC_APP_URL="https://abc123.ngrok-free.app"
APP_URL="https://abc123.ngrok-free.app"
```

Et dans le dashboard pawaPay :

```
https://abc123.ngrok-free.app/api/paiement/webhook/pawapay
```

## 4. Générer le token API

1. [Developers → API tokens](https://dashboard.sandbox.pawapay.io/#/system/api-token)
2. Générer un token → **copier immédiatement** (pawaPay ne le stocke pas)
3. Coller dans `PAWAPAY_API_TOKEN`

## 5. Vérifier la connexion

Connecté en **admin**, appelez :

```
GET /api/admin/pawapay/status
```

Réponse attendue si tout est OK :

```json
{
  "configured": true,
  "environment": "sandbox",
  "callbackUrl": "http://localhost:3000/api/paiement/webhook/pawapay",
  "connection": { "ok": true, "message": "Connexion OK — N opérateur(s)..." }
}
```

## 6. Tester un paiement

1. `PAYMENTS_MOCK_MODE=false` dans `.env.local`
2. Redémarrer le serveur Next.js
3. Aller sur `/offres` → choisir une offre → checkout Mobile Money (XAF/XOF)
4. Utiliser un [numéro de test sandbox](https://docs.pawapay.io/v2/docs/test_numbers) (format MSISDN : `237612345678` sans `+`)
5. Après paiement : callback → activation abonnement ; page succès interroge aussi `GET /v2/checkouts/{id}`

## URLs API utilisées par l’app

| Environnement | Base URL |
|---------------|----------|
| Sandbox | `https://api.sandbox.pawapay.io` |
| Production | `https://api.pawapay.io` |

| Endpoint | Usage |
|----------|--------|
| `POST /v2/checkouts` | Création checkout + redirection page hébergée |
| `GET /v2/checkouts/{checkoutId}` | Vérification statut (page succès) |
| `POST /v2/predict-provider` | Détection opérateur depuis le numéro |
| `GET /v2/active-configuration` | Test connexion / opérateurs disponibles |
| `POST /v2/refunds` | Remboursements admin |

## Passer en production

1. Terminer l’onboarding sandbox → accès production
2. Nouveau token depuis [dashboard production](https://dashboard.pawapay.io)
3. `.env.local` :

```env
PAWAPAY_ENV="production"
PAWAPAY_API_TOKEN="token_production"
```

4. Reconfigurer les callback URLs sur le dashboard **production**
5. `NEXT_PUBLIC_APP_URL` = votre domaine HTTPS public

## Dépannage

| Problème | Cause probable |
|----------|----------------|
| « PAWAPAY_NOT_CONFIGURED » | Token absent ou trop court dans `.env.local` |
| Paiement bloqué en PROCESSING | Callback URL incorrecte ou localhost sans tunnel |
| `AUTHENTICATION_ERROR` | Token sandbox utilisé avec `PAWAPAY_ENV=production` (ou inverse) |
| Orange affiche MoMo | Ancien bug : le numéro prédisait MTN. Orange Money envoie désormais `ORANGE_CMR` (pas `ORANGE_MONEY_CMR`). |
| Numéro rejeté | Format MSISDN : chiffres seuls, indicatif pays (`237…`, `221…`). Pour Orange Money, le numéro doit être un compte Orange. |

Collection Postman officielle : [Run in Postman](https://docs.pawapay.io/getting_started) (section Postman).
