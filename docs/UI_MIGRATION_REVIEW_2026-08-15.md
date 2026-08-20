# Revue de migration UI — 2026-08-15

## Décision de référence

Les planches de `Desing_System/screens/` sont la référence de l'interface compacte.
Elles définissent les parcours et la hiérarchie ; les tokens de `index.css` et le
contrat de nommage de `DESIGN_SYSTEM.md` définissent les valeurs consommées par React.

L'interface ne doit donc pas être mise à jour par une simple recolorisation : une
planche validée se porte en conservant son acte utilisateur, sa densité et son
vocabulaire. Les écrans sans planche validée restent fonctionnels, mais ne doivent
pas servir de modèle à la migration.

## État constaté

La bascule des tokens est déjà bien engagée : le thème chaud, l'encre inversée, la
police d'affichage et les jetons `--tk-*` sont présents. Le dépôt contient aussi une
première vague non validée de portage pour l'inventaire, les utilisateurs, les détails
d'équipement et les états transverses. Cette passe la préserve.

Les écarts restants sont surtout structurels :

| Priorité | Écart | Portée | Traitement |
| --- | --- | --- | --- |
| P0 | Cartes bordées et ombrées, formes trop arrondies | Toutes les pages qui consomment les primitives historiques | Primitives Card et MetricCard alignées sur les surfaces planes du système |
| P0 | Contrôles de saisie hétérogènes | Tous les formulaires | InputField, SelectField, TextArea et SelectFilter alignés : 48 px, rayon 4 px, bordure forte et focus anthracite |
| P0 | Capitales et graisses trop fortes dans les primitives | Badges, navigation, boutons, saisie | Bas de casse et graisse 500 appliquées aux composants partagés |
| P1 | Tableau de bord encore très dense et sans le héros inversé validé | `DashboardPage.tsx` | Porter la planche `dashboard-1-tableau-piste.html` avant une nouvelle re-baseline |
| P1 | Connexion proche de la planche, mais libellés et densité à finaliser | `LoginPage.tsx` | Valider le rendu compact après la normalisation des champs et boutons |
| P1 | L'explorateur de documentation doit rester couvert par le garde-fou DS | `DocumentationExplorerPage.tsx` | Conserver ses contrôles et couleurs dans le périmètre du garde-fou à chaque évolution |

## Portage effectué dans cette passe

- cartes de contenu planes, au rayon canonique de 8 px ;
- contrôles unifiés sur la géométrie et le focus accessibles ;
- badges, actions, navigation et labels rétablis en bas de casse avec une graisse
  500 ;
- sélection de filtre : l'état ouvert utilise désormais le focus anthracite, et non
  du texte jaune sur fond clair.

Ces ajustements sont concentrés dans les primitives afin de bénéficier aux écrans
déjà portés, sans écraser les changements métier en cours.

## Ordre recommandé pour la suite

1. Finaliser et vérifier les écrans compacts déjà en cours : inventaire, détail
   équipement, utilisateurs et détail utilisateur.
2. Porter la planche du tableau de bord et celle de connexion ; ce sont les deux
   entrées les plus visibles et elles fixent la densité, l'usage limité du jaune et
   la navigation basse.
3. Porter les parcours longs par acte : attribution/restitution, création ou sortie
   d'équipement, création et gestion de compte.
4. Traiter les référentiels, emplacements, rôles, paramètres et finances/rapports,
   en conservant les trois régimes existants (compact, rail, tiroir).
5. Après chaque vague, générer de nouvelles captures, comparer aux planches et ne
   mettre à jour les baselines qu'après validation visuelle.

## Vérification de cette passe

- `npm run lint` : réussi ;
- `npm run check:tokens` : réussi — 409 tokens, aucun cycle ni orphelin ;
- `npm run build` : réussi ;
- `npm run ds:check` : réussi — aucun avertissement sur `src/**` et `index.html`.
