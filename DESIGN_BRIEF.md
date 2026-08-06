# DESIGN_BRIEF.md — ADN mobile v1

> **Toute tâche UI doit relire ce fichier et s'y conformer. Les Interdits absolus (§8) sont bloquants.**

Contrat de design mobile de l'application Tracker, arrêté le 2026-07-25.
Référence visuelle : la maquette « Audit ». Ces règles couvrent tous les aspects, pas
seulement marges et couleurs. Elles sont volontairement strictes : la beauté vient de la
contrainte.

**Articulation avec les autres documents.** `DESIGN_SYSTEM.md` reste la référence du
_système_ (nommage des tokens, matrice d'états, choix de primitive, gouvernance). Ce
brief-ci est la référence de l'_ADN mobile_ : quand les deux divergent, le brief tranche
et `DESIGN_SYSTEM.md` sera mis à jour à la bascule de l'écran concerné. Les divergences
connues sont listées en §11.

**Statut d'implémentation.** Les tokens cibles existent (§0). **Écrans basculés : Audit
en compact (< 600 px), le 2026-07-25.** Tous les autres écrans, et l'écran Audit en
medium/expanded, rendent encore avec les rôles canoniques. La bascule est progressive,
écran par écran (procédure en §9).

---

## §0 Lire les tableaux de correspondance

Chaque section ci-dessous se termine par la correspondance exacte entre les valeurs du
brief et la couche sémantique du Tracker DS (`index.css`, tier 2).

| Marque | Signification                                                                                      |
| ------ | -------------------------------------------------------------------------------------------------- |
| ✅     | Un token sémantique porte **déjà** cette valeur exacte. Rien à faire.                                |
| ⚠️     | Le rôle existe mais avec une **autre valeur** : un token `-next` porte la valeur cible (non consommé). |
| ➕     | **Aucun** rôle n'existait : token ajouté à la couche sémantique (non consommé).                      |
| ✖️     | Règle non tokenisable (structure, contenu, interdit) — elle s'applique par revue, pas par token.     |

**Convention de nommage des tokens cibles** (bloc « ADN MOBILE v1 » d'`index.css`) :

- `<rôle>-next` — le rôle canonique existe déjà et est consommé par les écrans ; le
  suffixe porte la valeur cible. Basculer = reporter la valeur dans le rôle canonique
  puis supprimer le `-next`.
- `<rôle>` — rôle nouveau, sans équivalent canonique : déjà à son nom définitif.

**Aucune valeur en dur dans les composants.** `npm run ds:check` bloque toute couleur hex
et toute classe de palette Tailwind brute dans `src/**` (§10). Les valeurs de ce brief ne
s'écrivent qu'ici et dans `index.css`.

---

## §1 Couleur

**Canvas** : fond de page blanc cassé chaud `#FAF9F7` (pas blanc pur, pas gris froid).
**Cartes** : blanc pur `#FFFFFF`. Le contraste canvas/carte remplace les bordures.

**Jaune (marque)** : réservé à exactement **DEUX usages par écran maximum** — l'action
primaire (bouton plein ou FAB) et l'état actif de la navigation. **INTERDIT** en fond
d'onglet, fond de carte, fond de section, badge décoratif. Texte sur jaune : toujours noir
`#1A1917`.

**Neutres** : une seule famille chaude — texte primaire `#1A1917`, secondaire `#78746C`,
muted `#A29D93`, séparateurs `#F0EEE9`, surfaces neutres `#EFEDE8`. Les slate froids de
LoginPage sont abandonnés (décision : ADN = neutres chauds, cohérents avec le jaune).

**Sémantiques** : rouge `#B3261E` (danger/manquant), vert `#1B7F4D` (succès), ambre fond
`#FEF3D6` texte `#7A5A00` (attention). Utilisés **UNIQUEMENT** quand ils portent un sens ;
jamais deux sémantiques décoratives sur le même écran.

### Correspondance tokens

| Valeur du brief             | Token sémantique                  | Valeur actuelle du rôle | État                        |
| --------------------------- | --------------------------------- | ----------------------- | --------------------------- |
| Canvas `#FAF9F7`            | `--tk-color-app-bg`               | `#FAF9F7`               | ✅ exact                    |
| Carte `#FFFFFF`             | `--tk-color-surface`              | `#ffffff`               | ✅ exact                    |
| Jaune de marque             | `--tk-color-brand` / `--tk-color-primary` | `#FDC910`       | ✅ (l'usage est une règle, pas un token) |
| Texte sur jaune `#1A1917`   | `--tk-color-brand-text-next`      | `#1A1A1A` (neutre froid) | ⚠️ écart 3 unités           |
| Texte primaire `#1A1917`    | `--tk-color-text-primary-next`    | `#1C1917`               | ⚠️                          |
| Texte secondaire `#78746C`  | `--tk-color-text-secondary-next`  | `#57514A`               | ⚠️ (voir **Q-B2**)          |
| Muted `#A29D93`             | `--tk-color-text-muted-next`      | `#6E675F`               | ⚠️ (voir **Q-B1**)          |
| Séparateurs `#F0EEE9`       | `--tk-color-border-default-next`  | `#E8E4DF`               | ⚠️                          |
| Surfaces neutres `#EFEDE8`  | `--tk-color-surface-muted-next`   | `#F4F2EF`               | ⚠️                          |
| Rouge `#B3261E`             | `--tk-color-danger-next`          | `#DC2626`               | ⚠️                          |
| Vert `#1B7F4D`              | `--tk-color-success-next`         | `#047857`               | ⚠️                          |
| Ambre fond `#FEF3D6`        | `--tk-color-warning-light-next`   | `#FDEBD9`               | ⚠️                          |
| Ambre texte `#7A5A00`       | `--tk-color-warning-strong-next`  | `#9A3412`               | ⚠️                          |
| « 2 usages du jaune max »   | —                                 | —                       | ✖️ revue                    |
| « neutres chauds partout »  | —                                 | —                       | ✖️ voir §11.2 (LoginPage)   |

La famille de neutres est **déjà chaude** (rampe `--color-neutral-*` : `#F4F2EF`,
`#E8E4DF`, `#79736B`, `#1C1917`…). Le brief ne change pas de famille, il en affine cinq
crans. Le ton médian d'avertissement `--tk-color-warning` (`#E8710A`, bordures et icônes)
et les variantes `-light` de danger/succès ne sont pas redéfinis par le brief : conservés.

### Contrastes mesurés (WCAG 2.1, sur canvas `#FAF9F7` / sur carte `#FFFFFF`)

| Couleur                    | Sur canvas | Sur carte | Verdict                                            |
| -------------------------- | ---------- | --------- | -------------------------------------------------- |
| Texte primaire `#1A1917`   | 16,70:1    | 17,57:1   | ✅ AAA                                              |
| Texte secondaire `#78746C` | **4,42:1** | 4,65:1    | ⚠️ sous AA (4,5) **sur canvas** — **Q-B2**          |
| Muted `#A29D93`            | **2,57:1** | 2,70:1    | ❌ sous AA _et_ sous le seuil non-texte 3:1 — **Q-B1** |
| Rouge `#B3261E`            | 6,21:1     | 6,54:1    | ✅ (gain net sur `#DC2626` : 4,83:1)                |
| Vert `#1B7F4D`             | 4,76:1     | 5,01:1    | ✅ (léger recul sur `#047857` : 5,48:1)             |
| Ambre `#7A5A00` sur `#FEF3D6` | 5,78:1  | —         | ✅                                                  |
| Noir `#1A1917` sur jaune `#FDC910` | 11,33:1 | —    | ✅ (règle X12 respectée)                            |

---

## §2 Typographie & hiérarchie

Inter conservée. **Deux graisses seulement** : 400 et 500/600 — choisir une seule graisse
« forte » et s'y tenir (retenue : **600**).

Échelle mobile : titre de page **22** ; titre de carte/entité **16** ; corps et valeurs de
ligne **14–15** ; valeurs de stats **20** ; méta/labels **12–13** ; micro-labels **11**.

**Fin des MAJUSCULES par défaut** : les micro-labels passent en bas de casse, gris muted.
Les majuscules ne subsistent que pour les codes techniques (`ASSET-20002`).

Chaque écran a **UNE** information dominante (la plus grosse/foncée) et le reste
s'échelonne. Test : plisser les yeux devant la capture — si tout est gris uniforme, c'est
raté.

### Correspondance tokens

| Valeur du brief          | Token sémantique                        | Valeur actuelle | État                       |
| ------------------------ | --------------------------------------- | --------------- | -------------------------- |
| Inter                    | `--tk-type-font-brand` / `-plain`       | `Inter`         | ✅                         |
| Titre de page 22         | `--tk-type-headline-medium-size`        | `22px` / 600    | ✅ taille **et** graisse   |
| Titre de carte 16        | `--tk-type-title-medium-size`           | `16px`          | ✅ taille                  |
| Titre de carte, graisse  | `--tk-type-title-medium-weight-next`    | `700`           | ⚠️ 700 → 600 (2 graisses)  |
| Corps 14                 | `--tk-type-body-large-size` / `-medium-size` | `14px`     | ✅                         |
| Corps 15                 | —                                       | —               | ✖️ non tokenisé : **s'en tenir à 14** (grille 4 pt) |
| Valeurs de stats 20      | `--tk-type-stat-value-mobile-size`      | `30px` / 24px compact | ➕ ajouté (+ line-height 28) |
| Méta/labels 12           | `--tk-type-label-medium-size`, `--tk-type-body-small-size` | `12px` | ✅            |
| Méta/labels 13           | —                                       | —               | ✖️ non tokenisé : **s'en tenir à 12** |
| Micro-labels 11          | `--tk-type-label-small-size`            | `11px`          | ✅                         |
| Micro-labels bas de casse | `--tk-type-label-small-tracking-next`  | `0.075em`       | ⚠️ tracking de MAJUSCULES → 0 |
| Graisse normale 400      | `--tk-type-body-*-weight`               | `400`           | ✅                         |
| « une info dominante »   | —                                       | —               | ✖️ revue                   |

Les fourchettes 14–15 et 12–13 ne sont pas tokenisées à deux crans : le DS n'en garde
qu'un par rôle (14 et 12), tous deux sur la grille 4 pt. Ajouter 15 ou 13 demanderait de
justifier un cran supplémentaire (§14 de `DESIGN_SYSTEM.md`).

---

## §3 Layout, espacement, forme

**Grille 4 pt.** Padding de page : **20 px**. Gap entre cartes : **10–12 px**. Padding
interne des cartes : **14–16 px**. Gap entre sections : **24 px**.

**Cartes** : fond blanc, rayon **14**, **SANS bordure ni ombre** (le canvas teinté fait le
travail). Bordure 0,5–1 px réservée aux champs de saisie et aux éléments neutres sur fond
blanc.

**Interdit** : carte dans carte dans carte. **Maximum 2 niveaux** d'imbrication visuelle.
Une liste dense = rangées séparées par filets **DANS** une carte, pas une carte par rangée.

**Rayons** : **4 px** (contrôles), **8 px** (cartes, FAB, feuilles). Pas d'autres valeurs.
Légèrement adouci, mais la forme doit rester lue comme un **carré** — c'est l'identité
voulue. _(Corrigé le 2026-07-26 : le brief imposait initialement 10/14/16, essayé sur
l'écran Audit puis jugé trop arrondi pour la nature du projet. Voir Q-B5.)_

### Correspondance tokens

| Valeur du brief            | Token sémantique          | Valeur actuelle                    | État                    |
| -------------------------- | ------------------------- | ---------------------------------- | ----------------------- |
| Padding de page 20 px      | `--tk-space-page-mobile`  | `--tk-space-page` 24 / `-sm` 16    | ➕ ajouté               |
| Gap entre cartes 10–12 px  | `--tk-space-card-gap`     | —                                  | ➕ ajouté à **12** (4 pt) |
| Padding interne 14–16 px   | `--tk-space-card-padding` | `--tk-space-card` 24 / `-compact` 16 | ➕ ajouté à **16** (4 pt) |
| Gap entre sections 24 px   | `--tk-space-section-gap`  | —                                  | ➕ ajouté               |
| Rayon contrôles 4 px       | `--tk-radius-control`     | → `--tk-radius-md` = 4             | ✅ adossé à la canonique |
| Rayon cartes 8 px          | `--tk-radius-card`        | → `--tk-radius-lg` = 8             | ✅ adossé à la canonique |
| Rayon FAB/feuilles 8 px    | `--tk-radius-sheet`       | → `--tk-radius-lg` = 8             | ✅ adossé à la canonique |
| Carte sans ombre           | `--tk-elevation-0`        | `0 0 0 0 transparent`              | ✅                      |
| Bordure de champ           | `--tk-color-border-strong` | `#8E877E` (AA 3:1)                | ✅                      |
| Filet de rangée            | `--tk-color-border-default-next` | voir §1                     | ⚠️                      |
| Grille 4 pt                | échelle Tailwind native   | —                                  | ✅                      |
| Max 2 niveaux d'imbrication | —                        | —                                  | ✖️ revue                |
| Liste dense = filets dans UNE carte | —                | —                                  | ✖️ revue                |

**Arrondi des fourchettes.** Le brief impose la grille 4 pt ; 10 px et 14 px n'y sont pas.
Les crans d'espacement retenus sont donc les bornes hautes conformes : **12** (gap) et
**16** (padding interne). Les **rayons**, eux, sont désormais alignés sur l'échelle
canonique 2/4/8 (Q-B5) : les trois rôles `--tk-radius-control/card/sheet` nomment une
intention et pointent sur elle, ils ne portent plus de valeur concurrente.

---

## §4 Composants — décisions fermes

**Onglets de page** : segmented control neutre (fond `#EFEDE8`, segment actif blanc, texte
500). **PLUS JAMAIS de pilule jaune.** S'il y a plus de 3 segments → repenser l'écran (les
onglets scrollables de Paramètres restent tolérés en attendant, mais le compteur « ⇅ 5 »
disparaît au profit du seul chevron ouvrant la feuille).

**Boutons** : primaire = jaune plein, texte noir, hauteur **48**, pleine largeur quand
c'est l'action de l'écran. Secondaire = blanc bordé. Ghost = texte seul. Destructif =
ghost rouge, **JAMAIS d'icône poubelle rouge exposée dans une liste** → toutes les actions
destructives passent dans un menu ⋯ ou en swipe, avec confirmation.

**Jamais de bouton désactivé accompagné d'une phrase d'instruction** (« Sélectionnez un
service pour activer… ») : masquer l'action tant qu'elle est impossible, ou la rendre
contextuelle à l'élément (l'action « Ouvrir » vit **SUR** la carte du service, pas en haut
de page).

**Filtres** : un bouton filtre unique avec compteur + chips des filtres actifs. Plus jamais
de selects empilés en tête de liste.

**Formulaires de création** : jamais incrustés dans la liste (cas « Groupes »). La création
passe par le FAB/bouton qui ouvre un BottomSheet dédié.

**Boutons d'en-tête flottants** (« Enregistrer finances » au-dessus des onglets) :
supprimés — la sauvegarde vit en barre sticky en bas de formulaire, visible seulement si
modifications non enregistrées.

**Stats** : une rangée dans **UNE** carte avec séparateurs verticaux (voir maquette), pas
une mini-carte par chiffre. **4 stats max** par rangée. Les cartes orphelines pleine
largeur en fin de grille sont interdites : recomposer (héro + 2×2, ou rangée unique).

**États vides intelligents** : un service sans actifs n'affiche pas une grille de zéros
mais une ligne « Aucun actif attendu ».

### Correspondance tokens

| Valeur du brief               | Token sémantique                 | État                                     |
| ----------------------------- | -------------------------------- | ---------------------------------------- |
| Fond du segmented `#EFEDE8`   | `--tk-color-surface-muted-next`  | ⚠️ (voir §1)                             |
| Segment actif blanc           | `--tk-color-surface`             | ✅                                       |
| Texte de segment 500          | `--tk-type-label-medium-weight`  | ✅ (`500`)                               |
| Hauteur de bouton 48          | `--tk-size-control-height`       | ➕ ajouté                                |
| Bouton primaire jaune/noir    | `--tk-color-primary` / `--tk-color-brand-text-next` | ✅ / ⚠️                |
| Secondaire blanc bordé        | `--tk-color-surface` + `--tk-color-border-strong` | ✅                      |
| Destructif ghost rouge        | `--tk-color-danger-next`         | ⚠️ (voir §1)                             |
| Rayon des contrôles           | `--tk-radius-control`            | ➕ (voir §3)                             |
| Pas d'icône destructive en liste | —                             | ✖️ **Interdit §8**                       |
| Pas de bouton désactivé + phrase | —                             | ✖️ **Interdit §8**                       |
| Filtre unique + compteur + chips | —                             | ✖️ structure — primitives `SearchFilterBar`, `Chip` |
| Création en BottomSheet       | —                                | ✖️ structure — primitive `SideSheet` / `Modal` |
| Sauvegarde en barre sticky    | —                                | ✖️ structure                             |
| Stats : 1 carte, 4 max        | —                                | ✖️ structure — primitives `MetricCard`, `Card` |
| États vides intelligents      | —                                | ✖️ contenu — voir `src/constants/glossary.ts` |

---

## §5 Navigation

**Bottom nav** : conservée telle quelle structurellement ; état actif = icône + libellé
dans le jaune foncé lisible `#B8860B` (**pas de fond**), inactifs en muted.

**Headers** : titre 22 + sous-titre contextuel utile (« 3 services · 1 manquant ») quand la
donnée existe. Vues de détail : retour + titre + **max 2 actions**, le reste en ⋯.

**FAB** : jaune, **52 px**, rayon 16 — seul élément jaune plein de l'écran avec
l'éventuelle action primaire. Masqué au scroll descendant.

### Correspondance tokens

| Valeur du brief          | Token sémantique             | Valeur actuelle                          | État                    |
| ------------------------ | ---------------------------- | ---------------------------------------- | ----------------------- |
| Nav actif `#B8860B`       | `--tk-color-nav-active`     | aucun rôle (icône peinte en `text-primary`, jaune plein) | ➕ ajouté (**Q-B3**) |
| Nav inactif muted        | `--tk-color-text-muted-next` | `--color-neutral-500` en dur (dette)     | ⚠️ (voir §1 et §11.3)   |
| Titre de header 22       | `--tk-type-headline-medium-size` | `22px`                               | ✅                      |
| Taille du FAB 52 px      | `--tk-size-fab`              | —                                        | ➕ ajouté               |
| Rayon du FAB 16          | `--tk-radius-sheet`          | —                                        | ➕ ajouté               |
| Max 2 actions en détail  | —                            | —                                        | ✖️ revue                |
| FAB masqué au scroll     | —                            | —                                        | ✖️ comportement         |

`#B8860B` est **proche mais distinct** de `--tk-color-brand-dark` (`#B88E09`, 2,89:1) : ne
pas les confondre, le rôle de nav est séparé.

---

## §6 États & motion

**Pressed visible** (fond `#EFEDE8`, **100 ms**) sur toute surface tactile. Transitions
**150–200 ms ease-out**. **Aucune animation décorative.** `prefers-reduced-motion`
respecté. **Skeletons aux formes réelles** ; toasts au-dessus de la bottom nav.

### Correspondance tokens

| Valeur du brief        | Token sémantique                          | État                              |
| ---------------------- | ----------------------------------------- | --------------------------------- |
| Fond pressed `#EFEDE8` | `--tk-color-pressed-surface`              | ➕ ajouté                         |
| Durée pressed 100 ms   | `--tk-motion-duration-short2`             | ✅ `100ms`                        |
| Transitions 150 ms     | `--tk-motion-duration-short3`             | ✅ `150ms`                        |
| Transitions 200 ms     | `--tk-motion-duration-short4`             | ✅ `200ms`                        |
| Courbe ease-out        | `--tk-motion-easing-standard-decelerate`  | ✅ `cubic-bezier(0, 0, 0, 1)`     |
| Cible tactile 48 px    | `--tk-size-touch-target`                  | ➕ ajouté **et consommé** par `.touch-target` (valeur identique, zéro diff visuel) |
| `prefers-reduced-motion` | —                                       | ✅ déjà global (`index.css`)      |
| Skeletons / toasts     | —                                         | ✖️ structure                      |

Le retour tactile existant passe par `.state-layer` (opacité de `currentColor`,
`--tk-state-pressed-opacity`). Le brief demande un **fond neutre opaque** : les deux
mécanismes coexisteront le temps de la bascule ; `--tk-color-pressed-surface` est la cible.

---

## §7 Contenu

Fin des points d'exclamation et du ton administratif. Libellés d'action = **verbe +
objet**. Sous-titres de page = information utile, pas description générique. Badge
« DÉMO » : discret (gris, 10 px), pas au niveau des vrais statuts.

### Correspondance tokens

| Valeur du brief      | Token sémantique                | État                                              |
| -------------------- | ------------------------------- | ------------------------------------------------- |
| Badge DÉMO gris      | `--tk-color-text-muted-next`    | ⚠️ (voir §1)                                      |
| Badge DÉMO 10 px     | —                               | ✖️ hors échelle (le plancher est 11 px, §2)       |
| Verbe + objet, ton   | —                               | ✖️ `src/constants/glossary.ts` fait foi (§13 du DS) |

Le 10 px du badge « DÉMO » est **sous le plancher typographique** du DS (micro-label
11 px). Traité en **Q-B4**.

---

## §8 Interdits absolus (la liste anti-régression)

**Bloquants.** Toute PR qui en introduit un est refusée.

1. Jaune en fond d'onglet, de carte ou de badge décoratif.
2. Icône destructive rouge exposée dans une rangée de liste.
3. Tooltip natif `title=` porteur d'une information nécessaire.
4. Bouton désactivé + phrase d'instruction.
5. Plus de 2 graisses de police par écran.
6. Carte avec bordure **ET** ombre.
7. Grille de stats avec carte orpheline pleine largeur.
8. Formulaire de création incrusté dans une liste.
9. MAJUSCULES hors codes techniques.
10. Élément nouveau implémenté sans spec de placement/style/contenu.

### Couverture par l'outillage

| Interdit | Détection                                                                                     |
| -------- | --------------------------------------------------------------------------------------------- |
| 1        | Partielle — `ds:check` bloque le jaune/ambre Tailwind brut, pas l'usage d'un token de marque en fond. Revue. |
| 2        | ✖️ revue                                                                                       |
| 3        | ⚠️ **avertissement** `ds:check` (`title=` sur balise native sans `aria-label`) — non bloquant par choix (§10) |
| 4        | ✖️ revue                                                                                       |
| 5        | ✖️ revue (voir §11.3 : `font-black` vivant dans `NavigationBar`)                               |
| 6        | ✖️ revue                                                                                       |
| 7        | ✖️ revue                                                                                       |
| 8        | ✖️ revue                                                                                       |
| 9        | ✖️ revue                                                                                       |
| 10       | ✖️ revue — la spec attendue est celle de `DESIGN_SYSTEM.md` §14 (definition of done)           |

Les interdits non outillés se vérifient en revue : ils portent sur la **structure** et la
**composition**, qu'aucune analyse lexicale ne décide.

---

## §9 Procédure de bascule (écran par écran)

Aucun écran n'a basculé à ce jour. Pour chaque écran :

1. **Relire ce fichier** et lister les écarts de l'écran (§1 à §8).
2. **Consommer les tokens cibles** (`-next` et rôles nouveaux). À la première bascule, il
   faudra ajouter les entrées correspondantes au pont Tailwind (`tailwind.config.js`) pour
   disposer de noms de classes propres — ce n'est **pas** fait aujourd'hui, aucun écran
   n'en ayant besoin. Rappel `check:tokens` : le pont ne doit pointer que sur `--tk-*`.
   Rappel `check-cn-merge` : toute nouvelle classe maison `text-*` / `shadow-*` doit y être
   déclarée, sinon `twMerge` ne la dédoublonne pas.
3. **Capturer** avant/après (`npm run qa:visual:auto`) et documenter le diff attendu :
   ici, un diff visuel est **normal** — c'est la bascule.
4. **Journaliser** dans `DESIGN_SYSTEM_CHANGELOG.md` (obligatoire pour tout changement de
   composant, §14 du DS).
5. Vérifier `npm run lint:ds` (lint + `ds:check` + encodage + `cn-merge` + `check:tokens`).

**Fin de bascule** — quand plus aucun écran ne consomme un rôle canonique divergent :
reporter la valeur `-next` dans le rôle canonique, supprimer le token `-next`, et mettre à
jour `DESIGN_SYSTEM.md`. Tant que des rôles `-next` subsistent, la couche sémantique porte
volontairement deux valeurs pour un même rôle : c'est un état **transitoire**, pas un
doublon à consolider.

---

## §10 Points à trancher

Le brief fait foi : ces valeurs sont **déclarées telles quelles** dans `index.css`. Les
points ci-dessous sont des conséquences mesurées, à arbitrer avant que le rôle concerné ne
soit consommé pour du texte.

**Q-B1 — `muted #A29D93` ne peut pas porter de texte.** 2,57:1 sur le canvas : sous AA
(4,5:1) et même sous le seuil non-texte (3:1). Or §2 lui confie les micro-labels et §5 les
destinations inactives de la barre du bas. C'est le piège déjà rencontré en
`AUDIT_MOBILE #14` (`--color-neutral-400`, 2,55:1). Pour atteindre AA il faudrait
descendre à ~`#78746C`, c'est-à-dire **fusionner muted et secondaire**.
_Recommandation_ : garder `#A29D93` pour le purement décoratif/désactivé, et faire porter
les micro-labels par le secondaire.

**Q-B2 — `secondaire #78746C` est à 4,42:1 sur le canvas** (4,65:1 sur une carte) : conforme
sur les cartes, marginalement non conforme sur le fond de page — or les sous-titres de
header (§5) vivent sur le canvas. `#726E66` donnerait 4,82:1 / 5,08:1 pour un écart de teinte
imperceptible. _Recommandation_ : `#726E66`.

**Q-B3 — `nav actif #B8860B` est à 3,09:1** : conforme pour l'icône (non-texte, ≥3:1), non
conforme pour le libellé 11 px qui l'accompagne. À noter : c'est déjà un **gain net**, la
barre peignant aujourd'hui l'icône active en jaune plein (≈1,55:1, écart à la règle X12).
`#946C09` (4,53:1) ou `#8A6508` (5,06:1) rendraient le libellé conforme.
_Recommandation_ : `#8A6508`.

**Q-B4 — badge « DÉMO » à 10 px** : sous le plancher de l'échelle typographique (11 px, §2).
_Recommandation_ : 11 px en `--tk-type-label-small-*`, la discrétion venant de la couleur.

**Q-B5 — rayons : TRANCHÉE le 2026-07-26, en faveur de l'échelle canonique 2/4/8.**
Le brief imposait 10/14/16. Appliquée à l'écran Audit, l'échelle a été jugée **trop
arrondie pour la nature du projet** : l'identité voulue est « légèrement adouci, mais qui
se lit encore comme un carré ». Les deux échelles ne coexistent donc plus — les rôles
`--tk-radius-control` (4), `--tk-radius-card` (8) et `--tk-radius-sheet` (8) pointent sur
la canonique. Ils sont conservés parce qu'ils nomment une **intention** que `md`/`lg`
ne nomment pas, et concentrent le réglage en un seul point.

**Q-B6 — graisse forte : 500 ou 600 ?** §2 retient **600** au niveau système ; la spec
de l'écran Audit mobile (2026-07-25) impose **500** sur tous les crans forts (titre 22,
valeurs de stats 20, nom de carte 16, action 14). L'interdit §8.5 (« deux graisses par
écran ») est respecté dans les deux cas — c'est une question d'identité, pas de
conformité. L'écran Audit a basculé en **500**, porté par le rôle unique
`--tk-type-weight-strong-next` : un seul point à changer si l'arbitrage retient 600.
_Recommandation_ : trancher avant le 2ᵉ écran, pour ne pas figer deux identités.

---

## §11 Divergences connues avec l'existant

**§11.1 — Rayons. DIVERGENCE CLOSE le 2026-07-26.** Le DS canonique est une échelle
**2/4/8/full**, choisie pour un rendu « carré/industriel » CAT (décision F2 de l'audit UX,
`DESIGN_SYSTEM.md`). Le brief avait imposé **10/14/16** : essayé sur l'écran Audit, jugé
trop arrondi, **abandonné** (Q-B5). Il n'y a donc plus qu'une échelle. À noter :
`ds:check` bloque `rounded-2xl` / `rounded-3xl` — la consommation passe par les rôles
`--tk-radius-control/card/sheet`, jamais par les utilitaires Tailwind natifs.

**§11.2 — LoginPage.** Le brief abandonne les slate froids. Ils vivent aujourd'hui dans des
tokens de **tier 3** (`--color-login-page-bg` `#F8FAFC`, `--color-login-surface` `#FBFBFA`,
`--color-login-hero-text*` en `oklch`). Le menu latéral (`--color-sidebar-*`) est un cas
**distinct** : son rendu sombre froid est une préférence utilisateur explicitement retenue
(Q-V3) — le brief ne le vise pas.

**§11.3 — `NavigationBar`.** Deux écarts vivants, à traiter à la bascule de la barre :
l'icône active est peinte en `text-primary` (jaune plein sur fond clair, ≈1,55:1) et le
libellé actif en `font-black` (900) — soit une **troisième graisse**, contraire à §2 et à
l'interdit §8.5. La destination inactive consomme encore le primitif `--color-neutral-500`
(dette listée dans `check-design-tokens.mjs`).

**§11.4 — Espacement.** `--tk-space-page` vaut 24 px (16 px en compact) ; le brief demande
20 px. Les deux crans coexistent : `--tk-space-page-mobile` est la cible.

---

## §12 Historique

| Date       | Événement                                                                       |
| ---------- | ------------------------------------------------------------------------------- |
| 2026-07-25 | Création. 26 tokens sémantiques cibles ajoutés (non consommés), aucun écran basculé. |
| 2026-07-26 | **Q-B5 tranchée** : l'échelle de rayons 10/14/16 est abandonnée au profit de la canonique 2/4/8 — « légèrement adouci, mais qui se lit comme un carré ». §3 et §11.1 corrigés, écran Audit réaligné. |
| 2026-07-25 | **1ʳᵉ bascule : Audit compact.** Pont Tailwind alimenté (namespace `adn-*`), variantes typographiques `-plain`, `PageTabs appearance="neutral"`, filtres en feuille + chips, FAB 52 masqué au scroll. Divergence **Q-B6** ouverte (graisse forte 500 vs 600). |
