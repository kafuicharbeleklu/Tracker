# Lot 5 mobile — constats #12 (tables), #17 (ErrorBoundary), #14 (contrastes)

**Date :** 2026-07-25
**Périmètre :** AUDIT_MOBILE.md §4.2 (#12), §5 États transverses (#17), §7 (#14).
**Vérifications :** `md3:check` ✅ · `lint` (0 warning) ✅ · `build` ✅ · captures 393 px ✅ · sonde ErrorBoundary 10/10 ✅ · contrôle de non-régression 1440 px / 768 px ✅

---

## Tâche 1 — Tables sans variante mobile (#12, §4.2)

### Critère de choix

Le constat listait 7 fichiers. Le tri s'est fait sur **deux questions**, dans cet ordre :

1. **La grille de colonnes est-elle l'outil de lecture, ou juste un contenant ?**
   Sur une table de *vérification pré-import*, l'utilisateur balaye une colonne (« quelles lignes sont en erreur ? ») puis lit le message correspondant : l'**alignement vertical entre lignes** EST la fonction. Le recomposer en cartes détruit exactement ce que la vue sert à faire. Sur une *liste d'entités* (actifs d'une catégorie), au contraire, la grille n'est qu'un contenant : chaque ligne se lit seule, et la carte la sert mieux.
2. **Quel appareil fait réellement l'action ?**
   On importe un CSV depuis un poste, pas depuis un téléphone : le fichier lui-même vient d'un partage réseau / d'un export ERP. Le mobile y est un cas de repli, pas le cas nominal → le défilement horizontal est **assumé**, mais il doit être perceptible et pilotable, pas subi.

Un troisième cas s'est ajouté à l'examen : **AddBudgetModal n'est pas une table de consultation mais un formulaire** (un `SelectField` + un `InputField` par ligne). Faire défiler horizontalement des *champs de saisie* est un anti-pattern indépendamment de l'appareil → traitement (a), sans hésitation.

| Fichier | Nature réelle | Traitement | Justification |
|---|---|---|---|
| `ImportEquipmentPage.tsx` | vérification pré-import (6 col.) | **(b) scroll assumé** | grille = outil de lecture ; usage desktop dominant |
| `ImportUsersPage.tsx` | vérification pré-import (6 col.) | **(b) scroll assumé** | idem |
| `ImportLocationsPage.tsx` | vérification pré-import (5 col.) | **(b) scroll assumé** | idem |
| `ImportModelsPage.tsx` | vérification pré-import (5 col.) | **(b) scroll assumé** | idem |
| `CategoryDetailsPage.tsx` | liste d'actifs consultée en mobilité | **(a) cartes compactes** | ligne autonome ; recherche d'un actif sur le terrain |
| `AddBudgetModal.tsx` | **formulaire** de lignes budgétaires | **(a) cartes compactes** | champs de saisie : défilement horizontal inacceptable |
| `ModelDetailsPage.tsx` | liste d'unités | **aucun — déjà livré** | voir « constat périmé » ci-dessous |

### Constat périmé — `ModelDetailsPage.tsx` (même famille que le faux problème §5-Finances)

Le fichier possède **déjà** une branche carte compacte : `hidden medium:block` sur le tableau (l.140) et `medium:hidden` sur la liste de cartes (l.196), livrées par `b9ceed4` (2026-07-08, « feat(management): locations panes, catalog, settings, RBAC UI »), soit **avant** la rédaction de l'audit. Le constat #12 le comptait à tort parmi les 7. **Rien à réimplémenter** ; l'audit est corrigé (§4.2 + tableau §9.1). Le nombre réel de tables sans variante était donc **6**, pas 7.

### (b) — Ce que « scroll assumé et amélioré » veut dire concrètement

Nouvelle primitive **`src/components/ui/TableScrollArea.tsx`** (le scrollport nu `overflow-x-auto` ne signalait rien) :

- **fondu + chevron** sur le bord droit, rendus **uniquement quand il reste du contenu à droite** (`scrollLeft < scrollWidth - clientWidth`), recalculés par `ResizeObserver` sur le scrollport **et** son contenu — le tableau ne prend sa largeur qu'après parsing du CSV ;
- **région focalisable** (`role="region"` + `aria-label` + `tabIndex=0`) : un scrollport horizontal non focalisable est inatteignable au clavier (WCAG 2.1.1) ;
- **mention `aria-live`** décrivant le débordement pour les lecteurs d'écran ;
- **colonne de tête épinglée** (`sticky left-0`) portée par chaque table, puisqu'elle dépend de sa structure.

La colonne épinglée est **Statut** dans les 4 cas : c'est le verdict de la ligne, et c'est ce qu'on veut garder sous les yeux en allant lire la colonne « Message / Info » à droite — vérifié sur `import-locations-393-scrolled.png` (badge `ERREUR` épinglé en regard de « Type invalide »). Fond opaque obligatoire (`bg-surface` / `bg-surface-container` pour l'en-tête) sinon le texte des autres cellules défile *à travers* la cellule collée.

*Point assumé :* sur une ligne en erreur, la teinte de rangée (`bg-error-container/30` ≈ `#FFF6F6`) ne se prolonge pas dans la colonne épinglée, qui reste `bg-surface`. L'écart est de ~1 % de luminance sur une seule cellule — imperceptible (constaté sur les captures) — et c'est le prix à payer pour une opacité franche. Le survol de rangée, lui, est répliqué sur la cellule collée via `group`/`group-hover:` là où il change vraiment de couleur.

### (a) — Cartes compactes

- **`CategoryDetailsPage`** : `hidden medium:block` sur le tableau / `medium:hidden` sur les cartes — même découpage que `ModelDetailsPage` (page sœur), aucun champ inventé : nom, Asset ID, statut, utilisateur (« Non attribué » quand `item.user` est vide, au lieu du `-` du tableau).
- **`AddBudgetModal`** : bascule **JS** (`useMediaQuery(MEDIA.compact)`) et non CSS — deux branches CSS auraient monté **deux instances contrôlées des mêmes champs** dans le DOM. Carte = ligne 1 `[icône] [Catégorie ▾] [🗑]`, ligne 2 `MONTANT ALLOUÉ` + montant (préfixe devise via la prop `prefix` d'`InputField`) + badge CAPEX/OPEX. Les libellés de colonnes deviennent des libellés de champs — c'est la leçon du constat #4 (des valeurs nues sans étiquette une fois l'en-tête masqué).

### Captures (393 px, iPhone 14 Pro)

`import-equipment-393.png` · `import-equipment-393-scrolled.png` · `import-users-393(-scrolled).png` · `import-locations-393(-scrolled).png` · `import-models-393(-scrolled).png` · `category-details-actifs-393.png` · `add-budget-modal-393.png`

**Non-régression hors compact :** `import-equipment-1440.png` (aucun débordement à 1440 : `scrollWidth == clientWidth == 974` → ni fondu ni chevron ; seul reste le filet vertical de la colonne Statut), `category-details-actifs-1440.png` (branche `<table>` intacte), `add-budget-modal-768.png` (branche tableau intacte en medium).

---

## Tâche 2 — ErrorBoundary global (#17)

**`src/components/ui/ErrorBoundary.tsx`** (composant classe : `getDerivedStateFromError` + `componentDidCatch`), branché à **deux niveaux** :

1. **`AppLayout.tsx`** — enveloppe le `<Suspense>` des pages lazy, avec **`key={currentView}`**. C'est le point clé : un boundary ne se réinitialise pas seul, donc sans cette `key` une page plantée le resterait pour toute la session. Avec elle, **naviguer suffit à récupérer**, sans recharger ni perdre la session.
2. **`App.tsx`** — filet racine, placé **hors** de l'arbre de providers (son écran de repli ne doit dépendre d'aucun contexte) ; couvre les providers, la coque et les écrans hors session (Login, Accès refusé, Changement de mot de passe).

Écran de repli : `EmptyState` (icône `error`, titre, description) + bouton **« Recharger »** (`window.location.reload()`), `role="alert"`, `data-testid="error-boundary-fallback"`. Détail technique replié en `<details>` **uniquement en DEV**. Aucune télémétrie : un seul `console.error('[ErrorBoundary] …')` avec le `componentStack` et une étiquette de contexte (`vue: finance`, `racine`).

Les erreurs locales existantes sont **inchangées** (validations de champ, toasts, `BusinessRuleDecision`) — un boundary ne capte de toute façon que les exceptions de *rendu*, jamais les rejets de promesse ni les handlers d'événement.

### Test manuel (erreur simulée)

`throw new Error('QA_BOUNDARY_PROBE')` injecté temporairement en tête de `ReportsPage`, sonde Playwright à 393 px, **puis retrait du throw** (`git checkout`, vérifié : 0 occurrence restante).

| # | Vérification | Résultat |
|---|---|---|
| 1 | Écran de repli affiché (plus d'écran blanc) | PASS |
| 2 | `role="alert"` présent | PASS |
| 3 | Bouton « Recharger » présent | PASS |
| 4 | Coque de navigation intacte (TopAppBar + barre du bas) | PASS |
| 5 | Titre de document conservé | PASS |
| 6 | Tiroir « Plus » ouvrable **depuis la page plantée** | PASS |
| 7 | Récupération par navigation (boundary remonté par la `key`) | PASS |
| 8 | « Recharger » recharge effectivement | PASS |
| 9 | Après rechargement : app repartie, jamais d'écran blanc | PASS |
| 10 | Erreur journalisée `[ErrorBoundary]` en console | PASS |

**10/10.** Captures : `error-boundary-393.png`, `error-boundary-drawer-393.png`, `error-boundary-recovery-393.png`, `error-boundary-after-reload-393.png`.

**Effet de bord relevé (pré-existant, hors périmètre) :** `AuthContext` ne persiste aucune session (aucun `localStorage`/`sessionStorage`), donc en mode démo **« Recharger » ramène à l'écran de connexion** — pas à la page. Ce n'est pas introduit ici (n'importe quel F5 fait déjà cela) et le chemin MSAL est différent (msal-browser met l'account en cache). C'est précisément pourquoi la **récupération par navigation** (vérif. 7) compte : c'est la seule sortie qui préserve la session.

---

## Tâche 3 — Contrastes (#14, §7)

### 3.1 `warning #E8710A` (3,09:1) en TEXTE sur fond clair

Recensement exhaustif des usages de couleur `warning` en classe (`(text|bg|border|ring|…)-warning*`) : **12 occurrences, 2 seulement portent du texte**. `Badge` et `ConfirmationDialog` appliquaient déjà la bonne règle (`bg-warning-light text-warning-strong`).

| Fichier:ligne | Avant | Après | Ratio |
|---|---|---|---|
| `src/features/users/pages/UserDetailsPage.tsx:792` | `bg-warning/10 **text-warning** border-warning/30` (badge « ENTRA ID : EN ATTENTE ») | `bg-warning/10 **text-warning-strong** border-warning/30` | 2,79:1 ❌ → **6,60:1** ✅ |
| `src/features/users/pages/UserDetailsPage.tsx:807` | `bg-warning/10 **text-warning** border-warning/30` (badge « PIN : À RÉINITIALISER ») | `bg-warning/10 **text-warning-strong** border-warning/30` | 2,79:1 ❌ → **6,60:1** ✅ |

Ratios calculés contre le fond réel `bg-warning/10` (= `#FDF1E7`, et non le blanc pur : le fond teinté **dégradait** encore le contraste, 2,79 au lieu de 3,09).

**Conservés en #E8710A** (≥ 3:1 suffisant, non-texte) : `bg-warning/10` (fonds, l.792/807/857), `border-warning/30` (bordures, l.792/807/857), `--color-warning-light` (fond de `Badge`/`ConfirmationDialog`), icônes.

| `index.css:665-673` | ajout d'un commentaire de règle : `warning` = fonds/bordures/icônes/grand texte ; `warning-strong` = tout texte normal. Empêche la réintroduction de `text-warning`. |

### 3.2 `neutral-400 #A8A199` (2,55:1) — **aucun écart trouvé**

Le 2,55:1 de l'audit était calculé **contre le blanc**, ce qui ne correspond à aucun usage réel. Recensement : **6 occurrences, toutes sur surface sombre** (sidebar / rail), aucune sur fond clair.

| Fichier:ligne | Usage | Fond réel | Ratio | Verdict |
|---|---|---|---|---|
| `src/components/layout/SidebarItem.tsx:52` | libellé d'item inactif | `--color-sidebar-bg` #1C1917 → dégradé #131517 | **6,85–7,17:1** | ✅ AAA |
| `src/components/layout/Sidebar.tsx:250` | icône/bouton du tiroir | idem | 6,85–7,17:1 | ✅ |
| `src/components/layout/Sidebar.tsx:258` | bouton de repli (≥ expanded) | idem | 6,85–7,17:1 | ✅ |
| `src/components/layout/Sidebar.tsx:277` | libellé de section « AUTRES SECTIONS » (**texte informatif**) | idem | 6,85–7,17:1 | ✅ AAA |
| `src/components/layout/NavigationRail.tsx:47` | libellé de destination inactive | idem | 6,85–7,17:1 | ✅ |
| `src/components/layout/NavigationRail.tsx:163` | bouton du rail | idem | 6,85–7,17:1 | ✅ |

**Aucune correction nécessaire.** Le token n'est jamais exposé en classe Tailwind (`text-neutral-400` n'existe pas dans `tailwind.config.js`) : il n'est atteignable qu'en arbitraire `[var(--color-neutral-400)]`, ce qui limite naturellement sa diffusion. Garde-fou ajouté : commentaire de portée sur `index.css:679` (réservé aux surfaces sombres ; sur fond clair descendre à `neutral-500`, 4,69:1).

---

## Reliquats / non traités

- **Style de libellé divergent entre `SelectField` (casse normale) et `InputField` (gras majuscule)** — visible côte à côte dans la carte AddBudgetModal (`add-budget-modal-393.png`). Incohérence **du design system**, antérieure et globale (tout formulaire mêlant les deux), hors périmètre de ce lot.
- `max-h-[400px]` des aperçus d'import : à 393 px, ~3 lignes visibles avant défilement vertical. Comportement inchangé, non remis en cause ici.
- Constats mobiles encore ouverts : **#8** (actions du Dashboard absentes en medium), **#13-bis** (`ManagementPage.tsx:1061`), **#15** (~1004 surcharges `!`).
