# Local vs production — sans reparamétrer à chaque fois

Deux environnements **séparés** : fichiers locaux pour le dev, dashboard Vercel pour la prod. Même code, même client Google OAuth (deux redirect URI enregistrées une seule fois).

---

## Principe

| | **Local** (`npm run dev`) | **Production** (Vercel) |
|---|---------------------------|-------------------------|
| Config | `.env.local` (gitignored) | Dashboard Vercel → Environment Variables |
| URL app | `http://localhost:3000` | `https://objectif-tcf-blue.vercel.app` |
| Base Neon | même `DATABASE_URL` possible | même ou base dédiée |
| Google OAuth | callback `localhost:3000/...` | callback `objectif-tcf-blue/...` |
| Reconfig au push | **Non** | **Non** (vars persistées sur Vercel) |

Ne mélangez pas : **ne mettez pas l’URL Vercel dans `.env.local`**.

---

## 1. Première fois — local

```bash
cp .env.local.example .env.local
# Remplir DATABASE_URL, JWT_*, GOOGLE_*, etc.
npm run env:check
npm run dev
```

Ouvrez [http://localhost:3000/api/auth/google/status](http://localhost:3000/api/auth/google/status) : vous verrez l’URL OAuth attendue et la checklist Google Console.

---

## 2. Première fois — production

1. Remplir **`.env.vercel`** (gitignored) avec l’URL prod et les secrets.
2. Vercel → **Settings** → **Environment Variables** → **Import .env** → `.env.vercel`
3. Cocher **Production** + **Preview**
4. **Redeploy**

Variables sensibles : cadenas = valeur **masquée**, pas effacée.

---

## 3. Google OAuth (une seule config Google)

Dans [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), **même client OAuth** pour local et prod :

**Origines JavaScript autorisées**

```
http://localhost:3000
https://objectif-tcf-blue.vercel.app
```

**URI de redirection autorisés**

```
http://localhost:3000/api/auth/google/callback
https://objectif-tcf-blue.vercel.app/api/auth/google/callback
```

Le code utilise l’**URL du navigateur** au moment de la connexion : pas besoin de changer `APP_URL` pour tester Google en local.

---

## 4. Commandes utiles

```bash
npm run dev              # local, lit .env.local
npm run env:check        # vérifie .env.local
npm run env:check:prod   # rappel des vars Vercel
npm run vercel:env-pull  # télécharge les vars Vercel (optionnel, debug)
```

---

## 5. Webhooks (Stripe / pawaPay)

| Environnement | URL webhook |
|---------------|-------------|
| **Local** | Stripe CLI : `stripe listen --forward-to localhost:3000/api/paiement/webhook/stripe` |
| **Prod** | `https://objectif-tcf-blue.vercel.app/api/paiement/webhook/stripe` |

pawaPay sandbox : callback `{APP_URL}/api/paiement/webhook/pawapay` (local ou prod selon où vous testez).

---

## 6. Erreurs fréquentes

| Symptôme | Cause | Fix |
|----------|--------|-----|
| Google OK en local, pas en prod | Redirect URI prod absente dans Google | Ajouter l’URI prod (§3) |
| HTTP 500 après Google | `JWT_SECRET` absent sur Vercel | Ajouter JWT_* + redeploy |
| « Vars vides » sur Vercel | Mode **Sensitive** | Normal — valeurs toujours là |
| Local appelle l’URL prod | `APP_URL` prod dans `.env.local` | Remettre `http://localhost:3000` |

---

## 8. Fichiers uploadés (Vercel Blob)

Images/audio admin, avatars et enregistrements EO passent par **Vercel Blob** (pas Neon, pas le disque Vercel).

### Production

1. [Vercel Dashboard](https://vercel.com) → projet **objectif-tcf** → **Storage** → **Create Database** → **Blob**
2. Connecter le store au projet (Vercel ajoute `BLOB_READ_WRITE_TOKEN` automatiquement)
3. **Redeploy**

### Local (optionnel)

Pour tester l’upload comme en prod :

```bash
vercel env pull .env.local   # récupère BLOB_READ_WRITE_TOKEN depuis Vercel
# ou copiez le token manuellement dans .env.local
```

Sans token en local, les fichiers vont dans `public/uploads/` (dev uniquement).

---

## 9. Fichiers du repo

| Fichier | Rôle |
|---------|------|
| `.env.local.example` | Modèle dev → copier en `.env.local` |
| `.env.example` | Documentation générale |
| `.env.vercel.example` | Modèle import Vercel |
| `.env.vercel` | Vos secrets prod (gitignored) |

Voir aussi : [deploiement-vercel.md](./deploiement-vercel.md)
