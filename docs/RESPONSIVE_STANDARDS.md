# Standards Responsive & Mobile — Tracker

> Référentiel des normes appliquées (fonctionnel **et** esthétique) pour que le responsive soit une **checklist vérifiable**, pas du cas-par-cas.
> Date : 2026-06-30 · Cible : WCAG 2.1/2.2 **AA** + qualité visuelle « best-in-class ».

---

## 1. Normes de référence

**Accessibilité (cible AA — obligatoire)**
- **WCAG 1.4.10 Reflow** : à **320 px** de large, contenu **présent et lisible**, **sans** scroll horizontal **ni perte d'information**. → *une troncature qui masque du contenu est une non-conformité.*
- **WCAG 1.4.4 Resize text** : lisible jusqu'à 200 % de zoom.
- **WCAG 2.5.8 Target Size (Minimum)** : cibles tactiles ≥ **24×24 px** (plancher AA).
- **WCAG 1.4.11 Non-text Contrast** : composants/bordures ≥ **3:1** (fait).

**Qualité « best-in-class » (réf. Linear, Stripe, Notion · Material 3 adaptive · Apple HIG)**
- Cibles tactiles principales **≥ 44 px** en mobile (HIG 44pt / Material 48dp).
- **Mobile-first** : densité maîtrisée, une **action primaire** claire par écran, hiérarchie typographique nette, grille d'espacement **4 dp**.
- Classes de taille MD3 (nos breakpoints) : `compact <600` / `medium 600–839` / `expanded ≥840`.

---

## 2. Règles (do / don't) — anti-patterns bannis

| ❌ À bannir | ✅ À faire |
|---|---|
| Largeur/hauteur **px fixe** sur du contenu dans une ligne flex/grid | Largeurs fluides + `min-w-0` ; px fixe **uniquement** préfixé `medium:`/`expanded:` |
| `whitespace-nowrap` sur **texte de longueur variable** en espace contraint | Laisser replier, ou **empiler** sous l'élément principal |
| Reproduire un **tableau large** tel quel en compact | **Vue cartes/listes** condensées (`hidden medium:block` + `medium:hidden`) |
| Colonnes côte à côte qui s'écrasent en mobile | **Empiler** en compact — *le contenu prime sur l'alignement* |
| Charts/zones à **hauteur fixe** énorme en mobile | Hauteur réduite en compact (`h-[280px] medium:h-[400px]`) |

---

## 3. Pattern de référence : ligne de liste (`EntityRow`)

- **Compact** : `image` + colonne unique (`nom` ≤2 lignes · `sous-titre` · **`statut` empilé dessous**) + `action`.
- **Medium+** : colonnes (`nom` | `localisation` | `meta` | `statut` aligné à largeur fixe | `action`).
- Le statut est **rendu dans le flux du contenu en compact** (jamais sur la même ligne horizontale que le nom) → aucun statut tronqué, quelle que soit sa longueur.

---

## 4. Limite de l'outillage (à connaître)

L'audit multi-device (`qa:devices:auto`) vérifie le **débordement** (overflow) et les **cibles tactiles**, **mais pas la troncature** : `truncate`/`line-clamp` **cachent** le texte *dans* les limites → **zéro overflow détecté alors que du contenu est perdu**. Un écran « vert » peut donc être cassé.
➡️ **Conclusion** : standards + lint couvrent ~90 % (catégories entières d'erreurs) ; le dernier maillon = **vérification visuelle réelle** (captures / device). Les deux sont nécessaires.

---

## 5. État & backlog (audit 2026-06-30)

**✅ Corrigé à la racine**
- Largeur fixe du statut dans les listes (`InventoryPage`, `UsersPage` → `medium:w-[164px]`).
- `EntityRow` : statut empilé sous le nom en compact (vaut pour **toutes** les listes).

**⏳ Backlog « table dense → cartes mobile » (8 écrans)**
- `finance/pages/FinanceManagementPage` (table Pilotage ✅ ; table Dépenses ⏳ + collecte `SettingsPage`)
- `finance/components/AddBudgetModal`
- `inventory/pages/ImportEquipmentPage`, `locations/pages/ImportLocationsPage`, `management/pages/ImportModelsPage`, `users/pages/ImportUsersPage` (aperçus d'import)
- `management/pages/ModelDetailsPage`
- `management/pages/SettingsPage` (table appareils détectés)

**⏳ Mineurs**
- Charts à hauteur fixe `h-[400px]` → réduire en compact.
- Quelques cibles tactiles 36 px (icônes de liste) → 44 px en mobile.
- 4 micro-labels `text-[9/10px]` (nav) — exception assumée.

> Chaque conversion de table suit le **pattern §2/§3** et se **valide visuellement** (build + capture) avant la suivante.
