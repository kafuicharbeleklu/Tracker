/**
 * **Au bureau, la page tient la fenêtre ; c'est son corps qui défile.**
 *
 * Arbitrage du commanditaire — 22/09 pour l'accueil, étendu à tout le produit le 23/09 :
 * *« évitez que les cartes aient une taille très petite à vide ou quand elles n'ont qu'un
 * seul élément à afficher ; je préfère qu'elles aient une taille fixe max directement,
 * scrollable pleine, avec une bonne gestion d'état à vide, que d'avoir la taille grandir
 * en fonction du contenu »*.
 *
 * Ce que le produit faisait : la carte se taillait sur son contenu. Le journal d'un seul
 * fait tenait **124 px** et laissait 700 px de canevas nu dessous ; un site seul, **76** ;
 * le panneau du second niveau, **138** à côté d'une liste de 300. Et la même carte,
 * remplie, poussait la recherche et la ligne de compte hors de l'écran.
 *
 * Ce qu'il fait maintenant, **au-delà de 840 px seulement** (sous ce seuil c'est la page
 * qui défile, et c'est juste : un téléphone n'a pas de hauteur à distribuer) : la coque
 * borne la fenêtre et `<main>` devient le conteneur de défilement (`AppLayout`) ; la
 * racine de l'écran prend toute cette hauteur, l'en-tête et la ligne d'outils gardent
 * leur place, **le reste va au corps**, qui défile dedans. La liste commence et finit donc
 * au même endroit d'une page à l'autre, pleine ou vide, et l'état vide occupe la boîte au
 * lieu de se recroqueviller en haut.
 *
 * **La hauteur se prend, elle ne se déclare pas** : `h-full` et non `100dvh`. Une racine
 * en `dvh` reste juste tant que rien ne la surmonte — un bandeau de clôture au-dessus, et
 * l'écran dépassait d'autant.
 *
 * Un écran qui n'adopte pas ce régime ne casse pas : il garde sa hauteur de contenu, et
 * c'est `<main>` qui le fait défiler, comme le document le faisait.
 *
 * Trois classes, trois rôles :
 * - `PAGE_BUREAU` — la racine de l'écran, et elle seule ;
 * - `CADRE_BUREAU` — chaque étage intermédiaire : sans `min-h-0`, un enfant en `flex-1`
 *   refuse de descendre sous la hauteur de son contenu, et toute la chaîne casse ;
 * - `CORPS_BUREAU` — le corps qui reste, et son défilement.
 *
 * **Ce qui va dedans doit pouvoir y flotter** : un menu de rangée posé dans un corps qui
 * défile se fait couper par lui — il prend `floating` (cf. `Menu`).
 *
 * **Et ce qui va dedans ne se comprime pas** : dans une colonne `flex` qui défile, un
 * enfant garde sa faculté de rétrécir et se fait **écraser** au lieu de déborder — la
 * carte des rôles perdait 54 px de sa liste sur une fenêtre de 700. D'où le `shrink-0`
 * porté à tous les enfants directs du corps ; il est sans effet là où ils ne sont pas des
 * éléments `flex`.
 */
export const PAGE_BUREAU = 'expanded:h-full';
export const CADRE_BUREAU = 'expanded:min-h-0';
export const CORPS_BUREAU =
    'expanded:min-h-0 expanded:flex-1 expanded:overflow-y-auto expanded:[&>*]:shrink-0';

/**
 * **Un formulaire au bureau : deux colonnes de 560, pas un champ de 1 136** (24/09).
 *
 * 00.5 borne le contenu d'un flux à 560 px « à toutes les largeurs » : un champ de 680
 * pour saisir un numéro de série se vise et se relit plus mal. La règle vise **le champ**.
 * Appliquée à la page, elle laissait à 1 440 une colonne de 560 au milieu de 880 px vides,
 * et une fiche de cinq sections à faire défiler sur trois hauteurs d'écran.
 *
 * Dès 1 000 (`deux:`, le seuil des fiches à deux colonnes), la page prend donc **deux
 * mesures**, 560 au plus chacune (1 136 avec la gouttière) : les sections se rangent en
 * colonnes, chacune garde sa largeur de lecture, et la barre et le pied s'alignent sur les
 * bords du formulaire. En deçà, rien ne change. Le seuil était 1 200 jusqu'au 25/09 : un
 * iPad de 1 024 gardait un formulaire d'une colonne de 560 au milieu de 944 px.
 *
 * - `MESURE_DOUBLE` — la borne de la barre, du corps et du pied (`FullScreenLayout`,
 *   `mesure="double"`) ;
 * - `COLONNES_FORMULAIRE` — le conteneur des sections : il passe de la colonne `flex` à
 *   deux colonnes CSS, et une section ne se coupe jamais entre elles.
 */
export const MESURE_DOUBLE = 'deux:max-w-[71rem]';
export const COLONNES_FORMULAIRE =
    'deux:block deux:columns-2 deux:gap-4 deux:[&>*]:mb-4 deux:[&>*]:break-inside-avoid';
