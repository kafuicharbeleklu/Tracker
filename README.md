# Tracker

Application interne de **suivi du parc informatique de Neemba** : qui détient quel matériel, les
demandes d'attribution et de retour, les réparations, les inventaires physiques et les coûts. Une
seule application pour trois formats — téléphone, tablette et bureau —, en français.

**Version en ligne :** <https://kafuicharbeleklu.github.io/Tracker/> — les comptes de
démonstration y sont ouverts.

> Première visite sur le projet ? Lisez ensuite [`RECAP.md`](RECAP.md) : il explique l'application,
> son histoire et quel document ouvrir pour quoi.

## Ce que fait l'application

| Espace | À quoi il sert |
| --- | --- |
| Accueil | Ce qui attend la personne, l'état du parc, le budget |
| Actifs | Le parc : chaque objet, sa fiche, son parcours ; remettre, restituer, sortir du parc |
| Tâches | La file de travail : validations, remises, réceptions, retours, réparations, collecte |
| Équipe | Les personnes, ce qu'elles détiennent, leurs accès |
| Catalogue | Les types et modèles de matériel |
| Emplacements | Pays, sites et locaux |
| Inventaire physique | Les campagnes de vérification du parc sur le terrain |
| Historique | Le journal de tout ce qui a été fait, par qui et quand |
| Finances, Rapports | Budget, dépenses, amortissement, exports |
| Accès, Paramètres | Rôles et permissions, réglages de l'organisation et du compte |

Chacun voit ce que son rôle lui ouvre : **super administrateur**, **administrateur**
(l'informatique), **manager**, **utilisateur**.

## Démarrer

Prérequis : **Node.js 22** et npm.

```bash
npm ci --legacy-peer-deps
npm run dev            # http://localhost:3000
```

En développement, l'écran de connexion propose les **comptes de démonstration** (un par rôle) en
plus de la connexion Microsoft.

**En développement, la base de production est coupée par défaut** : `npm run dev` travaille sur le
jeu de démonstration et n'envoie aucune requête à Firebase. Deux façons d'avoir de vraies données :

```bash
VITE_FIRESTORE_EMULATEUR=127.0.0.1:8085 npm run dev   # un émulateur Firestore local, gratuit
VITE_FIREBASE_EN_DEV=true npm run dev                  # la base de production — elle compte au quota
```

> ⚠️ Avec `VITE_FIREBASE_EN_DEV=true`, un geste qui écrit — valider, remettre — écrit dans les
> données réelles du parc, et chaque rechargement du serveur consomme du quota.

### Données et quota Firestore

Le projet est sur le forfait gratuit : 50 000 lectures et 20 000 écritures par jour. Trois
mécanismes gardent l'application loin de ces plafonds :

- **Deux temps de lecture.** L'écran de connexion ne lit que les comptes ; le reste se lit à
  l'ouverture de la session (`src/context/DataContext.tsx`).
- **Un cache dans le navigateur** (`src/lib/cacheLocal.ts`, IndexedDB). Chaque écriture de
  l'application pose l'heure du serveur (`_maj`) ; une ouverture ne relit que ce qui a changé depuis
  la précédente, soit environ une lecture par collection (`chargerCollection`).
- **Le journal par morceaux.** Sans cache, l'ouverture n'en lit que les 100 derniers événements et
  ceux des campagnes d'inventaire ; un écran qui a besoin de tout l'historique appelle
  `useJournalComplet`.

Trois règles d'écriture (`src/lib/firestorePersistence.ts`) :

- **Un document s'écrit en entier**, sans fusion : un champ vidé dans l'application (une réparation
  close, un objet libéré) l'est aussi en base.
- **Une suppression laisse une pierre tombale** (`_supprime`, datée par `_maj`) : les lectures la
  retirent, et chaque cache l'apprend à la visite suivante.
- **Chaque écriture est suivie.** Le SDK garde dans le navigateur celles qui ne sont pas encore
  confirmées (cache persistant) et les renvoie, même après un rechargement ; au-delà de huit
  secondes d'attente, ou si la base refuse, le snackbar le dit.

La session de démonstration se garde dans l'onglet : recharger ne déconnecte plus.

**Les règles de sécurité** vivent dans `firestore.rules` (à coller dans la console Firebase,
Firestore → Règles). L'application n'utilisant pas l'authentification Firebase, elles ne ferment
pas la lecture : elles limitent l'écriture aux quatorze collections de l'application, interdisent
toute suppression et toute réécriture du journal. L'émulateur les applique
(`firebase emulators:start --only firestore`, configuration dans `firebase.json`).

**Tout script qui écrit dans Firestore** doit finir par `annoncerNouvelleGeneration(db, motif)`
(`scripts/lib/generation.mjs`) : il écrit sans `_maj`, et sans cette annonce les navigateurs ne
verraient jamais ses documents. Une retouche faite à la main dans la console Firebase n'est vue qu'à
l'expiration des caches (7 jours), ou tout de suite après `node scripts/annoncer-generation.mjs
"motif"`.

### Variables d'environnement

Dans `.env.local` (jamais commité). Toutes sont facultatives.

| Variable | Rôle |
| --- | --- |
| `VITE_FIREBASE_API_KEY`, `…_AUTH_DOMAIN`, `…_PROJECT_ID`, `…_STORAGE_BUCKET`, `…_MESSAGING_SENDER_ID`, `…_APP_ID`, `…_MEASUREMENT_ID` | Le projet Firebase (Firestore). À défaut, celui de production |
| `VITE_FIREBASE_DISABLED` | `true` coupe Firestore partout, version en ligne comprise : le jeu de démonstration, le même à chaque chargement |
| `VITE_FIREBASE_EN_DEV` | `true` : en développement, se brancher quand même sur le projet configuré (par défaut, coupé) |
| `VITE_FIRESTORE_EMULATEUR` | En développement, `hôte:port` d'un émulateur Firestore local (`firebase emulators:start --only firestore`) |
| `VITE_ENABLE_DEMO_LOGIN` | `true` ouvre les comptes de démonstration hors développement (c'est le cas de la version en ligne) |
| `VITE_ENABLE_MOCK_AUTH_BACKEND` | `true` simule le service d'authentification hors développement |
| `VITE_AUTH_API_BASE_URL` | L'API d'authentification et de check-in (par défaut `http://localhost:8787` en développement) |
| `VITE_AUTH_ADMIN_API_KEY` | La clé d'administration de cette API |
| `VITE_ALLOWED_EMAIL_DOMAINS` | Domaines de courriel admis à l'inscription, séparés par des virgules (vide : tous) |
| `VITE_DEMO_TEMP_PIN`, `VITE_DEMO_TEMP_PASSWORD` | Code et mot de passe provisoires des comptes créés en démonstration |
| `VITE_DISABLE_DEMO_RESEED` | En développement sans base distante : `true` empêche le jeu de démonstration de se ré-semer (pour tester les listes vides) |

## Scripts

| Commande | Ce qu'elle fait |
| --- | --- |
| `npm run dev` | Serveur de développement (port 3000) |
| `npm run build` / `npm run preview` | Construit la version de production (`dist/`, servie sous `/Tracker/`) / la sert en local |
| `npm run lint` | ESLint, zéro avertissement toléré |
| `npm run ds:check` | Conformité au système de design : couleurs brutes, contrôles natifs hors des primitives, `title=` porteurs d'information… |
| `npm run check:cn-merge` | Sonde `cn()` / tailwind-merge : aucune classe du système ne doit en écraser une autre |
| `npm run check:tokens` | Invariants de la couche de jetons `--tk-*` (`DESIGN_SYSTEM.md`) |
| `npm run check:encoding` | Texte doublement encodé (« MatÃ©riel ») dans les sources |
| `npm run lint:ds` | `lint`, `ds:check`, `check:encoding`, `check:cn-merge` et `check:tokens`, d'affilée |
| `npm run format` | Prettier sur `src/` |
| `npm run qa:visual:auto`, `qa:devices:auto`, `qa:a11y:auto` | Régression visuelle, audit multi-appareils, accessibilité (Playwright) |
| `npm run qa:e2e` | Les gestes de bout en bout : Tâches (file, enchaînement, annuler, clavier, lot), la sélection groupée, ⌘K et Échap. Serveur à part, Firestore coupé ; `-- taches` pour une seule suite |
| `npm run backend:agent` | L'API de check-in des postes et d'authentification (voir [`backend/README.md`](backend/README.md)) |
| `npm run import:inventory` | Import de l'inventaire depuis un classeur Excel |

### Avant de pousser

```bash
npx tsc --noEmit -p .
npm run lint:ds
npm run build
```

## Organisation du code

```text
index.tsx, App.tsx       point d'entrée, coque de l'application
index.css                jetons du système de design (couleurs, type, espaces, mouvement)
tailwind.config.js       classes de fenêtre : compact < 600, medium, expanded ≥ 840, deux ≥ 1000, large…
src/
  components/layout/     gabarits (ListTemplate, DetailTemplate…), barre latérale, rail, barre du bas
  components/ui/         les primitives du système de design (Button, FacetChip, ActSheet, Onglets…)
  features/<domaine>/    une page par écran : pages/, components/, hooks/, lib/
  context/               données (DataContext, FinanceDataContext), authentification, notifications
  hooks/, lib/           logique partagée ; lib/businessRules.ts porte les règles métier
  constants/, types/     libellés, seuils, types partagés
  data/                  jeu de démonstration
scripts/                 contrôles de conformité, audits Playwright, imports
backend/                 API Node de check-in des postes et d'authentification
deployment/              scripts PowerShell de l'agent de collecte (GPO) et d'import
docs/                    journal du portage, audits, captures de régression
```

Le routage est fait maison, dans l'adresse (`#/inventory`, `#/tasks?ouvert=…`) :
`src/hooks/useAppNavigation.ts`. L'authentification passe par Microsoft (Azure AD, MSAL) ou par les
comptes de démonstration ; les données vivent dans Firestore.

## Design : où est la référence

- **Les planches** — un écran par planche — vivent dans le projet Claude Design « TRACKER », hors de
  ce dépôt. Le code fait foi pour ce qui existe déjà.
- [`REGLES-TRANSVERSES.md`](REGLES-TRANSVERSES.md) — le registre normatif : icônes, hiérarchie,
  mesures, arbitrages.
- [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) — jetons et primitives ; toute évolution s'inscrit dans
  [`DESIGN_SYSTEM_CHANGELOG.md`](DESIGN_SYSTEM_CHANGELOG.md).
- [`DESIGN_BRIEF.md`](DESIGN_BRIEF.md) — l'ADN mobile ; ses interdits sont bloquants.
- [`LEXIQUE.md`](LEXIQUE.md) — un mot par acte, dans les planches et dans le code.
- [`docs/design/PORTAGE-PLANCHES.md`](docs/design/PORTAGE-PLANCHES.md) — le journal du portage :
  chaque passe, ce qu'elle a changé, et **les arbitrages pris contre une planche**.

L'interface ne nomme jamais un pays : Neemba est présent dans plusieurs.

## Intégration continue et déploiement

| Flux | Quand | Ce qu'il fait |
| --- | --- | --- |
| MD3 Compliance | chaque push sur `main`, chaque PR | `ds:check`, encodage, construction ; régression visuelle et gestes de bout en bout sur les PR |
| Deploy GitHub Pages | chaque push sur `main` | construit et **met en ligne** la version publique |

Tout ce qui arrive sur `main` est donc publié dans les minutes qui suivent.

## Contribuer

- **Une branche par travail**, puis une PR vers `main`. L'historique de `main` reste **linéaire** :
  on fusionne en avance rapide (`git merge --ff-only`).
- **Messages de commit** en français, préfixés du type et de la portée :
  `feat(taches): …`, `fix(bureau): …`, `docs(portage): …`, `chore(depot): …`.
- **Fins de ligne LF**, imposées par [`.gitattributes`](.gitattributes) — le dossier est parfois
  édité depuis Windows. Pour que `git blame` ignore la normalisation :
  `git config blame.ignoreRevsFile .git-blame-ignore-revs`.
- Ne jamais commiter `.env.local`, `.claude/settings.local.json`, ni les fichiers d'import
  (classeurs, clé de compte de service) que liste `.gitignore`.
