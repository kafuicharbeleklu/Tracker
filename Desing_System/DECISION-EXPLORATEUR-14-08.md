# Décision — l'explorateur de documentation

**Route** `#/documentation/ui-flow-map` · `src/features/documentation/pages/DocumentationExplorerPage.tsx`
(478 lignes) · **14/08** · dernière décision ouverte du chantier.

## Tranché : hors périmètre du dessin

**L'explorateur n'est pas un écran du produit.** C'est l'outil qui cartographie le produit. Aucun
gestionnaire de parc, aucun utilisateur final ne l'ouvre : il ne porte ni équipement, ni personne,
ni acte. Le dessiner reviendrait à dessiner une planche sur le chantier lui-même — elle ne
trancherait aucune question de produit, et les 30 écrans qui en portent une sont déjà dessinés.

**L'exclusion vaut pour le dessin, pas pour le relevé.** Ce que la lecture du fichier a trouvé est
consigné ci-dessous : ce sont des constats de code, à porter en revue technique, pas en planche.

## Sept relevés

**R1 — Route de production, sans session, hors providers.** `App.tsx` la sert avant tout contrôle
d'accès et avant l'arbre de contextes. La galerie du design system, juste à côté, est fermée par le
build (`DesignSystemGalleryPage !== null`) ; celle-ci ne l'est pas. Elle est donc **publiquement
atteignable par URL**, connecté ou non.

**R2 — Elle publie la documentation interne.** `import uiFlowMapMarkdown from '../../../../UI_FLOW_MAP.md?raw'`
embarque le document d'architecture dans le bundle client. Conjugué à R1 : lisible par quiconque
connaît l'URL.

**R3 — La page masque l'essentiel d'elle-même.** La navigation de sections est un `aside`
`className="hidden"` — inatteignable. Le `main` porte
`[&>div:first-child]:hidden [&>section:nth-child(2)]:hidden [&>section:last-child]:hidden` : fil
d'Ariane, héro, répertoire d'écrans et document source sont supprimés **par sélecteurs de
descendance**, pas par suppression. Il ne reste à l'écran que le canevas. Le reste — markup, champ
de recherche, logique de filtrage — continue d'être livré et exécuté.

**R4 — La recherche filtre ce que personne ne voit.** `visibleSections` alimente la seule section
masquée par R3. Deux champs de recherche (desktop et mobile) sans effet visible.

**R5 — Code mort.** `_RelationshipInspector` est défini (≈ 40 lignes, trois colonnes, entrées et
sorties) et jamais monté.

**R6 — Chiffres en dur, faux.** Les badges du héro annoncent « 33 écrans analysés » et « 10 points
d'audit » ; le tableau `screens` porte **27 entrées**. Les trois cartes voisines, elles, comptent
correctement (`screens.length`). Masqués par R3, donc invisibles — mais faux dans le bundle.

**R7 — Le thème fuit, et rien n'est prévu sous 1280.** `document.documentElement.classList.toggle('dark')`
écrit sur le document de l'application. Le canevas est fixé à 1660 × 820 px en `overflow-auto` :
aucun des trois régimes de la planche 00.3 ne s'y applique.

## Conséquences

- **Couverture arrêtée à 30 écrans de production sur 36** — les 6 restants sont : l'explorateur
  (exclu ici), la galerie du design system (build DEV), et les 4 écrans hors session déjà couverts
  par 02.1 et 02.2.
- **Aucune planche à écrire.** Le compte reste à **35 planches**.
- **R1 et R2 sont à arbitrer côté technique**, indépendamment du dessin : soit la route est fermée
  au build comme sa voisine, soit elle est assumée publique et `UI_FLOW_MAP.md` cesse d'y être
  embarqué.

**Pour rouvrir la décision**, un seul motif suffirait : que l'explorateur devienne une destination
offerte aux utilisateurs depuis la coque. Il ne l'est pas — aucun lien du produit n'y mène, et
`09-orphan-analysis.md` le dit lui-même « volontairement hors coque ».
