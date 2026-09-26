# Revue de cohérence du Design System — 15 août 2026

## Verdict

Le Tracker DS contient une base sérieuse (tokens sémantiques, primitives réutilisables,
points de rupture et contrôles techniques), mais il ne constitue pas encore un contrat
unique et stable pour une migration globale de l'interface.

Le problème principal n'est pas la qualité isolée des composants : c'est la coexistence
de trois systèmes non arbitrés — le contrat applicatif, la refonte compacte `adn-*` et
les planches de design. Continuer à porter les écrans maintenant ferait grandir cette
dette dans les trois directions.

**Recommandation : ne pas lancer une vague supplémentaire de migration d'écrans avant
la résolution des sujets P0 ci-dessous.** Les écrans déjà livrés restent exploitables ;
ils servent de matière pour fixer le système.

## Périmètre et méthode

- Sources relues : `index.css`, `tailwind.config.js`, `DESIGN_SYSTEM.md`,
  `DESIGN_BRIEF.md`, `REGLES-TRANSVERSES.md` et `Desing_System/`.
- Primitives relues : `Button`, `Card`, les champs, la navigation et les garde-fous.
- Échantillon produit : composants et pages `src/**`, ainsi que les captures compactes
  disponibles dans `docs/md3-visual-current/2026-08-15/`.
- Cet audit évalue la cohérence de la branche de travail au 15 août 2026. Il ne remet
  pas à zéro les modifications déjà présentes dans le dépôt.

## Constats majeurs

| Priorité | Écart | Preuve | Risque concret |
| --- | --- | --- | --- |
| P0 | Aucune source de vérité unique | `Desing_System/readme.md` désigne le code comme source ; `PASSATION.md` se déclare aussi seule source des arbitrages ; `DESIGN_BRIEF.md` se donne priorité en cas de conflit. | Deux personnes peuvent livrer deux interprétations valides sur le papier mais incompatibles dans le produit. |
| P0 | Deux stratégies de migration coexistent | Le brief et le pont `adn-*` parlent d'une bascule compacte écran par écran ; les tokens canoniques ont eux aussi évolué globalement et des variantes `-next` subsistent. | Chaque composant doit savoir s'il suit le présent, le futur ou l'ancienne UI. |
| P0 | Typographie contradictoire | Le dossier de design demande 400/500 ; le brief retient 600 ; `REGLES-TRANSVERSES.md` utilise 400/500/600 ; `index.css` expose aussi 700. | La hiérarchie varie selon la page et l'interdiction de graisse forte n'est pas vérifiable. |
| P0 | Police de marque incohérente à l'exécution | `--tk-type-font-brand` pointe vers Archivo dans `index.css`, alors que `font-brand` pointe encore vers Inter dans `tailwind.config.js`. | Un même rôle typographique change de police selon que la classe CSS ou Tailwind est utilisée. |
| P0 | Bibliothèque d'icônes non tranchée dans le produit | `REGLES-TRANSVERSES.md` impose Phosphor, tandis que `MaterialIcon` reste documenté et largement consommé ; les deux bibliothèques coexistent. | Poids de trait, remplissage, dimensions et métaphores d'icônes divergent à l'écran. |
| P0 | Signal de conformité trop optimiste | `npm run ds:check` annonce `src/**`, mais exclut `DocumentationExplorerPage` et autorise neuf pages utilisant des contrôles natifs. Il ne contrôle ni la typographie, ni le nombre d'usages jaunes, ni les icônes, ni les cartes. | Un feu vert de CI peut masquer des écarts expressément interdits par les règles de design. |
| P1 | Grammaire de surface non stabilisée | La documentation de `Card` décrit encore « elevated = shadow », alors que l'implémentation est devenue plate ; de nombreuses pages empilent toujours bordure + ombre + rayon. | Le même mot « carte » couvre au moins trois objets visuels différents. |
| P1 | Vocabulaire de composants ambigu | `Button` mélange les variantes héritées et les variantes canoniques. `tonal` correspond à un remplissage neutre sombre, et `elevated` conserve une ombre. | Les noms suggèrent un comportement qui n'est pas homogène avec les règles de marque ou les cartes. |
| P1 | Règles de capitales contradictoires | Le dossier de design interdit les capitales hors codes ; `DESIGN_SYSTEM.md` prévoit `section-label` en uppercase ; les règles transverses n'autorisent finalement que les micro-libellés. | Les labels, tableaux et statuts n'auront jamais la même voix éditoriale sans exception explicitement nommée. |
| P1 | Contrat de rayon incomplet | La règle générale annonce 2/4/8, mais les héros et vignettes ont une exception à 6. | L'exception est légitime mais elle n'est pas représentée comme un rôle formel dans tous les documents et garde-fous. |
| P2 | Documentation et inventaires dérivent | `DESIGN_SYSTEM.md` annonce 171 tokens sémantiques alors que le CSS actuel en contient davantage ; le dossier contient aussi des doublons racine/sous-dossier et des journaux au milieu des règles normatives. | La lecture du système est lente et les mises à jour de documentation deviennent non fiables. |

## Écart entre règles et code

Les occurrences suivantes ne sont pas toutes des erreurs individuellement. Elles montrent
en revanche que les règles actuelles ne peuvent pas prétendre s'appliquer à l'ensemble du
produit tant que les exceptions ne sont ni limitées ni datées.

| Indicateur statique dans `src/**` | Occurrences |
| --- | ---: |
| `uppercase` | 140 |
| `font-bold`, `font-semibold`, `font-black`, `font-extrabold` | 226 |
| `font-brand` | 20 |
| classes `adn-*` | 53 |
| `rounded-adn-*` | 11 |
| `rounded-card` | 97 |
| `rounded-xl` | 49 |
| `shadow-elevation-*` | 185 |

Les captures du dashboard, de l'ajout d'équipement, du détail utilisateur et de l'audit
montrent la conséquence visuelle : surfaces bordées et ombrées, nombreux accents jaunes,
titres/labels très gras et capitalisés. Elles ne sont donc pas encore alignées avec les
principes de sobriété, de surface plate et de parcimonie du jaune portés par les planches.

## Points à conserver

- L'architecture en tokens `--tk-*`, avec primitive → sémantique → composant, est la
  bonne fondation.
- Les breakpoints 600 / 840 et les cibles tactiles sont documentés et déjà réutilisables.
- Les primitives de formulaire et de navigation donnent désormais une base commune sur
  laquelle consolider les écrans.
- Le contrôle de dépendances de tokens détecte réellement les références invalides, les
  cycles et l'usage de primitives hors exceptions connues. C'est un bon garde-fou de
  code, à ne pas confondre avec une validation design complète.

## Cible de gouvernance proposée

À faire ratifier avant toute migration :

1. `DESIGN_SYSTEM.md` devient le **contrat public de développement** : noms de tokens,
   API des composants, états, dépréciations et exemples.
2. `REGLES-TRANSVERSES.md` devient le **contrat visuel et éditorial**, limité aux règles
   de production applicables (compact, medium et expanded) et aux exceptions nommées.
3. `Desing_System/screens/` devient la **référence de composition** : une planche valide
   un écran, mais ne redéfinit ni token ni règle globale.
4. `DESIGN_BRIEF.md`, `PASSATION.md` et le changelog deviennent des **documents
   historiques/de décision**. Ils expliquent le pourquoi, sans créer de nouveau « doit »
   contradictoire.

Une règle ne doit apparaître qu'à un seul endroit normatif. Les autres documents doivent
lienner vers elle, avec date et statut (actif, déprécié, historique).

## Décisions P0 à prendre

1. **Choisir un seul mode de migration.**
   - *Progressif par écran* : conserver `adn-*` temporairement, mais inscrire pour chaque
     alias son propriétaire, son écran cible et sa date de retrait ; les tokens canoniques
     ne changent pas avant la fin du portage.
   - *Bascule globale* : supprimer le concept `-next`/`adn-*` après une migration atomique
     des composants partagés et des écrans prioritaires.

   L'état actuel tente les deux. C'est la cause structurante des incohérences.

2. **Fixer la règle typographique.** Proposer explicitement : Inter 400/500 pour l'UI,
   Archivo 600 uniquement pour les héros ou chiffres identitaires. Toute autre graisse
   devient une exception documentée. Aligner `font-brand` sur le même rôle.

3. **Choisir une bibliothèque d'icônes.** Si Phosphor est confirmé, publier la table de
   correspondance Material → Phosphor, geler tout nouvel usage de `MaterialIcon`, puis
   migrer par lots. Si Material est conservé, corriger les règles et retirer la dette
   Phosphor plutôt que de maintenir les deux.

4. **Définir la surface officielle.** Pour chaque rôle, décider : séparateur, surface
   plate, surface bordée, ou élévation. Retirer ensuite les variantes qui expriment la
   même chose avec des noms différents.

5. **Réconcilier les garde-fous avec le périmètre réel.** Toute exclusion ou allowlist
   doit être visible dans le rapport de contrôle, justifiée, propriétaire, et assortie
   d'une échéance. Le script ne doit plus annoncer « tout `src/**` » s'il ne le fait pas.

## Plan recommandé après arbitrage

1. Écrire une courte décision d'architecture pour les cinq P0, puis nettoyer les sections
   normatives contradictoires sans modifier d'écran.
2. Corriger les fondations une seule fois : police de marque, échelle de graisses,
   namespace de migration, icônes, tokens de surface et API des primitives.
3. Étendre les contrôles : dette d'alias à zéro, interdiction de nouvelle icône legacy,
   exceptions de capitales/rayons déclaratives, rapport des exclusions et revue visuelle
   des usages jaunes/surfaces.
4. Migrer les écrans par familles, avec la même check-list et une capture de référence :
   shell/navigation, listes, fiches, formulaires, tableaux, puis écrans spécialisés.

Un `ds:check` vert sera alors le signal qu'aucune régression mécanique n'est introduite ;
la validation finale restera une revue visuelle et métier de chaque composition.
