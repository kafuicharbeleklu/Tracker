# REGLES-TRANSVERSES — le registre normatif

Écrit le **2026-07-31**, **étendu le 2026-08-01** par le balayage complet du projet
(récit dans `RAPPORT-AUDIT-2026-08-01.md`). Ce document n'est pas un audit : c'est **la loi du
produit**. `LEXIQUE.md` fixe les mots, `AUDIT-UI.md` raconte ce qui a été trouvé et corrigé.
**Ce fichier-ci fixe les valeurs**, et il est le seul endroit où elles se décident.

> **Ce que le balayage du 01/08 a ajouté.** Onze règles (§2 bis), une règle de libellé (§3.1),
> et surtout **la couche des jetons** — jusque-là non auditée, et c'est là que dormait la pire
> divergence du projet : deux valeurs de noir inversé, dont l'une sur les deux écrans les plus
> vus. Leçon inscrite : *trois audits de composants ne trouvent pas une divergence de jeton.*

## Comment il s'emploie

1. **Avant de dessiner une planche**, on lit ce fichier. Aucune valeur transverse ne se
   choisit dans une planche.
2. **Une valeur n'existe qu'ici.** Si une planche a besoin d'une variante, ce n'est pas
   une variante : c'est soit un **autre rôle** — qu'il faut nommer et inscrire ici — soit
   une **erreur**.
3. **Faire évoluer un standard est une décision globale.** On modifie la ligne ici, on
   applique sur *toutes* les planches concernées dans le même mouvement, et on inscrit la
   date au journal en bas. Jamais dans une seule planche, même quand l'intention est bonne.
4. **Le relevé se fait sur les valeurs *et* sur les absences.** Comparer les valeurs déclarées
   ne trouve jamais une propriété **non déclarée** : une planche qui omet `padding` sur `.btn`
   n'apparaît dans aucun tableau de divergence, puisqu'elle n'a pas de valeur à confronter.
   **L'absence est invisible à un index de valeurs.** Le contrôle se fait donc dans les deux
   sens : pour chaque rôle de ce registre, la liste des planches dont la règle **ne déclare pas**
   la propriété canonique. Relévé le 01/08 : `.btn` sans `padding` dans **cinq** planches,
   `.idh` sans `font-size` dans une.
5. **Une valeur canonique s'énonce, elle ne se désigne pas — et un composant s'énonce en entier.**
   « Identique aux deux autres » ne se vérifie pas. Et une règle qui ne fixe qu'une partie d'un
   composant **légitime ses variantes** : `.rrow` à deux propriétés laissait deux anatomies
   opposées être « conformes » (§2.11). Un composant transverse se déclare **bloc entier**, et le
   contrôle est alors trivial : le texte est identique au caractère, ou il ne l'est pas.
6. **Après toute normalisation, relever les classes employées sans règle.** C'est le miroir de
   l'emploi n°4, appliqué aux classes : pour chaque planche, la liste des classes présentes dans
   le markup qu'aucune règle ne déclare. **Une normalisation peut détruire ce qu'elle ne visait
   pas** — le 01/08, une substitution de `.rrow` a emporté la **barre du bas** d'une planche, qui
   s'est empilée verticalement ; le contrôle d'alors ne comparait que le bloc `.rrow` obtenu au
   bloc canonique, donc il correspondait, donc la perte était invisible. **Un contrôle qui ne
   regarde que ce qu'on a voulu changer ne voit jamais ce qu'on a cassé à côté.**
7. **Comparer chaque rôle d'une planche à l'autre, texte contre texte** (§2.26). Les six emplois
   précédents vérifiaient une planche **contre elle-même** ; un rôle pouvait donc être différent
   dans les seize sans qu'aucun ne le signale.
8. **Vérifier que chaque `var(--x)` a sa déclaration.** Un jeton employé sans être déclaré ne
   casse rien de visible à la lecture du code : la propriété disparaît, la couleur devient
   transparente, et l'œil ne le voit que si l'on regarde **ce pixel-là**. Deux cas le 01/08 :
   `--live-ambre-wash` en 06.1 — la pastille « En attente » du diagramme n'avait plus de fond —
   et `--dark-line` en 05.1.

   > **Et la cause est un piège à connaître.** L'insertion était gardeée par un test sur le **nom**
   > du jeton, pas sur sa **déclaration** : l'emploi `var(--live-ambre-wash)`, écrit une ligne plus
   > tôt par le même script, satisfaisait la garde, qui a donc sauté la déclaration.
   > **Une garde d'existence de jeton se teste sur `--nom:`, avec les deux points — jamais sur le
   > nom nu.** C'est la deuxième fois que ce même mécanisme frappe `--live-ambre`.
9. **Après un renommage de classe, relever les sélecteurs qui ne visent plus rien.** Renommer
   `X{` ne renomme pas `X .enfant`, `X b`, `X:hover` — ces règles survivent en pointant une classe
   morte, et **l'emploi n°6 ne les voit pas** : il cherche si le nom apparaît quelque part dans la
   feuille de style, or `.tm` apparaît bien… dans `.trow .tm`. Le 01/08, le renommage
   `.trow` → `.mrow` a laissé trois descendants orphelins en 06.1 : la ligne secondaire des rangées
   de matrice s'est mise à courir dans le texte précédent (« *un ordinateur portableil y a 3
   jours* ») et sa pastille a perdu sa forme. **Un renommage se fait sur toutes les occurrences du
   nom dans les sélecteurs, pas sur la règle de base.**

   Le contrôle : les classes citées par un sélecteur et absentes du markup — **hors variantes
   déclarées** (§2.27), qu'un réglage peut n'activer que dans un état. Un contrôle qui ne fait pas
   cette exception crie faux, et un contrôle qui crie faux se fait désactiver.

10. **Comparer les *glyphes*, pas la référence au glyphe.** Chaque planche embarque sa propre
    copie du sprite `<symbol id="i-…">`. Une règle qui déclare « glyphe `i-filter`, 20 px » fixe
    **le nom et la taille de l'appel** — elle ne dit rien du **dessin appelé**, qui est dupliqué
    autant de fois qu'il y a de planches. Le 01/08, `.fbtn` était identique au caractère dans les
    trois pages qui filtrent, et le bouton **n'avait pourtant pas la même allure** : le `i-filter`
    de 03.3 était tracé `M3.5 6h17 · M6.5 12h11` là où 04.1 et 05.1 traçaient `M3 6h18 · M6 12h12`.
    Un entonnoir plus étroit, donc un autre bouton pour l'œil. **Le contrôle porte sur le contenu
    du `<symbol>`, texte contre texte, entre toutes les planches** (§2.28).
11. **Une propriété de *distribution* n'est jamais dans une classe de *surface*.** `flex:1` sur
    `.btn-o` pose `flex-basis:0` : dans un conteneur en **colonne**, l'axe principal est vertical
    et le `flex-basis` **l'emporte silencieusement sur `height`**. Le bouton garde son padding,
    son rayon, son filet, sa couleur — tous conformes au registre — et **s'écrase à la hauteur de
    son texte**. C'est la forme la plus perverse d'écart : *toutes* les valeurs canoniques sont
    respectées, et le composant est déformé. Le contrôle : aucune classe `.btn-*` ne déclare
    `flex`, `width`, `margin` ni `position` (§2.29).

12. **Une planche neuve naît propre — le relevé des classes sans emploi se fait à l'écriture,
    pas à l'audit suivant.** Une planche se commence en reprenant la feuille de style de sa
    voisine : c'est ce qui garantit qu'un rôle a partout la même déclaration (§2.26), et c'est
    la bonne méthode. Mais elle importe **aussi les rôles que la nouvelle planche n'emploie pas**.
    Le 02/08, la planche 04.4 est née avec **quatorze règles** et **huit jetons** ne visant rien —
    dont `.hact` **et** `.cact`, les deux noms légiférés le matin même, recopiés morts tous les deux.

    > **Et c'est pire qu'un reliquat ordinaire.** Une règle morte héritée d'une planche vivante
    > *ressemble* à un emploi : le jour où quelqu'un cherche « qui emploie `.cact` ? », elle
    > répond faux. §5.4 refuse de supprimer en bloc **sur les planches existantes**, parce qu'un
    > nettoyage aveugle y a déjà détruit une barre du bas ; sur un fichier écrit dans le tour même,
    > le risque de perte collatérale est **nul** et le ménage est sûr. **Le contrôle se fait avant
    > de livrer la planche, jamais dans la passe suivante.**

    > **Et le relevé se fait sur la planche *rendue*, pas sur son texte.** Deux règles de 04.4 ont
    > survécu à deux nettoyages successifs — `.intro h2` et `.pick svg.ch` — parce qu'elles ne
    > meurent sur **aucun nom** : `h2` existe dans la planche (sous `.bhead`), `.ch` existe
    > (sous `.conseq`), `svg` et `.pick` aussi. **Elles meurent sur la *relation* entre leurs
    > pas** : ces éléments ne se rencontrent jamais. Une recherche de chaîne — sur les classes
    > (§emploi n°6) comme sur les noms de balise — les déclare vivantes toutes les deux.
    > **Le seul contrôle qui les voit est `querySelectorAll(sel).length === 0` sur la planche
    > ouverte**, sélecteur par sélecteur, en excluant les sélecteurs de réglage `body[data-…]`
    > (§2.27), qu'un état n'active pas.
    >
    > **Et le corollaire, qui est la faute de méthode du 02/08 :** les quatorze règles du premier
    > relevé ont été supprimées **d'après une liste**, pas d'après un relevé refait. Deux règles
    > absentes de la liste ont donc survécu au ménage censé les emporter. **Un nettoyage se
    > vérifie en refaisant le relevé, jamais en cochant le rapport qui l'a demandé.**

13. **Une règle se supprime par *parties de sélecteur*, jamais par recherche de texte.** Une règle
    groupée — `.dBv .sub span,.dBv .badge span{display:none}` — contient, **en sous-chaîne**, le
    texte exact d'une règle morte : `.dBv .badge span{display:none}`. Une suppression par motif
    l'emporte donc **avec son bloc**, et laisse `.dBv .sub span,` en **fragment nu**. La suite est
    mécanique : le fragment se soude à la règle suivante, les deux meurent, et l'écran perd un
    comportement que personne n'avait visé.

    > **C'est arrivé le 04/08, et il faut savoir dans quelles circonstances.** La planche 03.1
    > portait une **ligne nue** — `.dB .hero ` sans bloc — qui soudait déjà la règle suivante et la
    > tuait. En la corrigeant, la passe de nettoyage a **fabriqué exactement le même accident** un
    > cran plus loin. Le sous-titre du tableau de bord s'est mis à afficher ses quatre variantes de
    > charge à la suite. **Détecté à la capture, pas au relevé** : le compte de règles mortes,
    > lui, s'était amélioré.

    **Le contrôle :** on découpe le sélecteur sur les virgules, on ne retire que les **parties**
    que le navigateur donne à 0 élément, et on supprime la règle seulement quand il n'en reste
    aucune. Une règle dont une partie survit est **réécrite**, jamais coupée. Et le nettoyage se
    vérifie **à l'image** : aucun compteur ne voit une règle qu'on a fait disparaître par
    inadvertance.

> **La faute type, et elle s'est produite.** Le champ de la double authentification
> (planche 07.1) avait emprunté le composant du code PIN **en passant à six cases**, pour
> renforcer la sécurité. L'intention était juste, le geste faux : le produit s'est retrouvé
> avec deux codes PIN, un à quatre chiffres et un à six. Un standard transverse ne se
> renforce pas localement — il se renégocie ici, ou il se respecte.

---

## 0 · Forme et iconographie — les règles qui valent sur les 31 planches

> Ces règles vivaient dans la planche **00.1 Direction esthétique** et nulle part ailleurs.
> Elles y étaient *énoncées* mais pas *opposables* : cinq tours de correction sur la seule
> planche 04.2 ont redécouvert les mêmes trois manquements. Elles sont recopiées ici parce
> qu'un fichier se relit et se mesure — une planche, non. **La référence visuelle reste 00.1 ;
> la référence exécutoire est cette section.**

### 0.1 · I1 — une bibliothèque, pas un set maison

**Phosphor Icons 2.1.1**, chargé par les trois feuilles `regular` / `light` / `fill` en tête
de planche. Aucune icône dessinée à la main, aucun `<symbol id="i-…">`, aucun `<use href="#i-…">`.

**Seules exceptions admises au `<svg>` écrit à la main** — parce que ce ne sont pas des icônes :
`class="tr"` (les tracés de liaison d'un schéma de parcours, 06.1 et 06.2) et `class="motif…"`
(le motif de marque de la connexion). Toute autre balise `<svg>` est un manquement.

### 0.2 · I2 — graisse *regular*, quatre tailles, jamais d'autre

| Taille | Classe | Seul emploi |
|---|---|---|
| **32** | `s32` | état vide — et rien d'autre |
| **24** | *(défaut, pas de classe)* | barre du haut, barre du bas |
| **20** | `s20` | rangée, puce, geste de rangée, chevron d'ouverture |
| **18** | `s18` | en ligne dans un texte de 13 |

Graisse `regular` partout. **`light`** au-delà de 32 px seulement. **`fill`** sur l'onglet actif
seulement — jamais sur une puce d'état, jamais sur une icône de rangée. `thin`, `bold`,
`duotone` : interdits.

**Pas de `font-size` en style en ligne sur une icône.** La taille passe par la classe, sinon
l'échelle redevient négociable planche par planche.

**Le conteneur d'une icône ne fixe pas sa largeur.** `flex:0 0 15px` sur un chevron écrase le
glyphe : `flex:0 0 auto`.

### 0.3 · I3 — l'état porte une icône **et** une couleur

Jamais la couleur seule : un état lisible par la teinte uniquement disparaît pour qui ne la
distingue pas, et à l'impression. Les cinq états et leur glyphe, fixés une fois :

| État | Couleur | Glyphe |
|---|---|---|
| en service | `--st-vert` #5B913C | `ph-check-circle` |
| attribué | `--st-bleu` #288AC5 | `ph-arrow-circle-right` |
| en attente | `--st-ambre` #A97C00 | `ph-clock` |
| hors service | `--st-orange` #E45329 | `ph-warning` |
| refus, suppression | #B3261E | `ph-x-circle` |

**Et l'icône ne remplace pas un mot : elle le précède.** Un `.badge` porte toujours un libellé
en texte. Les deux seules icônes admises sans libellé sont le **chevron d'ouverture** d'une
rangée (`ph-caret-right`) et le **débordement** (`ph-dots-three-vertical`) — parce que leur sens
est acquis et que leur cible est la rangée entière, qui, elle, porte un nom.

### 0.4 · R3 — le héro ouvre toute fiche

Le héro en image voilée n'est pas la propriété du tableau de bord : c'est **l'ouverture de
toute fiche** — équipement, personne, modèle, site. Sa hiérarchie ne se renégocie pas :

1. **Une étiquette** au-dessus — la référence de l'objet (`ASSET-30012 · Dell`), Archivo, 10–11 px, capitales.
2. **Un sujet** — le nom de l'objet, Archivo 28 px. Un seul par héro.
3. **Un état** en dessous — badge I3 complet, suivi du fait qui situe l'objet (« détenu par… »).
4. **Trois métriques au plus**, dans le voile du héro. Pas quatre, pas deux.

**Un héro écrit de zéro perd la règle de bloc.** Étiquette, sujet et état sont des `<span>` : sans
`display:block`, le sujet à 28 px se pose **à côté** de l'étiquette et sa marge verticale est ignorée.
La faute s'est produite sur 11.1 le 12/08, réécrite hors de 05.2 qui portait la règle. Copier la
feuille du héro depuis une planche qui la porte, ne pas la retaper.

**L'image du héro est le sujet lui-même** — la photo de l'équipement, pas une image d'ambiance.

**Corollaire, et c'est la faute qui s'est produite cinq fois sur 04.2 :** ce que le héro porte,
les cartes en dessous ne le reprennent pas. Une information est **soit** dans le héro, **soit**
dans une carte. L'âge, la valeur et le détenteur montés dans le voile disparaissent des cartes.

### 0.5 septies · Un élément ajouté rejoint la commutation de sa piste

Relevé du 12/08 sur 06.5 : un porte-voix inséré **avant** la carte `fi-groupee` sans porter sa classe
survivait dans le régime « produit actuel », où il annonçait « 3 décisions » au-dessus d'une carte qui
en compte 7. Un lecteur qui basculait le Tweak lisait le diagnostic sous le titre de la solution.
**Tout élément ajouté au-dessus ou au-dessous d'un bloc commuté doit porter la même classe de
régime**, et le contrôle est mécanique : pour chaque règle `body[data-x="y"] .cls{display:none}`,
vérifier que rien de la refonte ne se trouve hors de `.cls` dans cette colonne. Dix planches portent
des règles de commutation.

### 0.5 sexies · Une branche se lit jusqu'à son repli

Relevé du 12/08 sur 11.1 : « l'Admin est filtré sur ses pays » écrit sans lire le `return equipment`
qui suit — un Admin sans `managedCountries` reçoit tout le parc, et le code le dit en commentaire.
Même famille que « le seul » et « hérité » : une affirmation posée sur le début d'un bloc.
**Une branche conditionnelle se lit jusqu'à son `else` et son repli**, et un filtre se vérifie sur
tous ses axes — `filterEquipment` a quatre branches, `filterUsers` trois, et l'Admin n'est filtré
sur aucun axe de personne.

### 0.5 quinquies · Les noms de classe de Phosphor sont réservés

Relevé du 12/08 : la classe `.ph` de l'invite d'un champ est **la même** que celle de la fonte
Phosphor, dont la feuille distante applique `font-family:'Phosphor'` à tout `.ph`. Le texte des
invites était rendu en glyphes d'icônes sur **quatorze planches** depuis la migration de la Vague 0,
sans qu'aucun contrôle de débordement le voie : le texte n'était pas coupé, il était **substitué**.
Retenu : l'invite s'écrit `.phold`, et **aucune classe de planche ne commence par `ph`**. Le contrôle
est mécanique — chercher les listes de classes qui contiennent le jeton `ph` sans aucun jeton `ph-`.

### 0.5 duodecies · Une colonne ajoutée hérite des réglages de sa planche

Relevé du 12/08 sur 04.1 : la colonne « arrivée pré-filtrée » a été écrite comme si elle ouvrait un
bandeau à part. Trois conséquences d'un seul oubli — le jeton du filtre, **sujet de l'état**, était
133 px hors écran au repos (rangée défilante, jeton en dernier) ; la largeur du cadre avait été portée
de 1320 à 1740 pour une 4ᵉ colonne qui n'existe pas, laissant 480 px de vide ; et ses chiffres, sans
les classes `.vv`, démentaient le réglage de volume à 120 et à 800 — quatre contradictions simultanées
sur la taille du parc. **Avant d'ajouter une colonne : relire les attributs du `<body>`, la largeur
réelle du bandeau d'accueil, et l'objet que la colonne doit montrer en premier.**

### 0.5 undecies · Deux âges du même objet sur un écran se lisent l'un contre l'autre

Relevé du 12/08 sur 06.4 : la rangée « Ma demande de casque · en attente · 4 jours » avait été reprise
telle quelle du téléphone « une demande est déjà en cours » vers le téléphone « après l'envoi ». Sans
horodatage en face, l'écart ne se voyait pas ; la ligne d'accusé (« aujourd'hui 09:12 ») l'a rendu
lisible d'un coup. **Une donnée recopiée d'un état à l'autre doit être revue à l'aune du temps de
l'état d'arrivée** — l'âge, la date, le décompte et le statut ne voyagent pas avec le balisage.

### 0.5 decies · Le palier haut porte le sujet de la page, jamais un accusé

Relevé du 12/08 sur 06.4 : un porte-voix à 28 px disait « Demande envoyée » sur une page dont le sujet
est « Mon profil » — le plus gros caractère de l'écran donné à un événement transitoire, et la rangée
« Ma demande de casque · en attente · 4 jours » le redisait juste dessous avec plus d'information.
La justification écrite (« ce qu'un bandeau qui s'efface ne garde pas ») attribuait à la **forme 2**
de 06.3 une propriété de la **forme 1** : la forme 2 reste jusqu'à la sortie de l'écran. **Un accusé
relève de la forme que 06.3 lui donne, et le palier haut reste au sujet de la page.**

### 0.5 nonies · Trois métriques n'est pas un quota

Relevé du 12/08, deux fois sur 05.4 puis une fois sur 04.4 : la 3ᵉ cellule du voile a été remplie
pour tenir le motif, et elle redoublait la carte suivante avec moins d'information (« 1 · poste en
remplacement » contre une carte nommant l'objet, son modèle, sa date et son sort). **Le voile porte
les faits qu'aucune carte ne porte** — deux suffisent si le troisième appartient à une carte. Et une
légende qui annonce « les trois faits qui remplacent les rangées clé-valeur » se compte : si l'un des
trois est neuf, la phrase est fausse.

### 0.5 octies · Un menu ouvert ne se pose pas sur un héro

Relevé du 12/08 sur 05.4 : le héro R3 fraîchement porté était recouvert à **71 %** par le menu de
débordement laissé ouvert — les trois métriques illisibles, le nom coupé après sa première lettre.
L'ancien héro compact passait sous le menu ; le nouveau (224 px) arrive exactement dessous. **Un
recouvrement ouvert par défaut va dans sa propre colonne d'état**, ancré dans le flux, la colonne de
la vue restant au repos. Vaut pour tout menu, feuille ou dialogue posé sur une planche.

### 0.5 quater · Un décompte se compte sur la source, il ne se déduit pas

Relevé du 12/08 sur 11.1 : « 4 portées de groupe » déduit de « 5 groupes moins un », alors que le grep
posé deux tours plus tôt listait **onze** lignes `dataScopes` — 8 rôles, 3 groupes. Même faute que
« 4 + 24 = 28 » : un nombre obtenu par raisonnement au lieu d'être relu sur la sortie qu'on a déjà.
**Tout nombre écrit dans une planche doit pointer une ligne de relevé**, et un fait négatif (« deux
groupes n'en déclarent aucune ») se dit à part — il n'entre jamais dans la somme.

### 0.5 ter · Un fait de rôle se compare, il ne se lit pas seul

Relevé du 12/08, trois reprises de suite sur 11.1 : politique d'authentification attribuée au rôle
voisin, addition de permissions déjà héritées (« 4 + 24 = 28 » alors que les 4 étaient dans les 24),
et deux propriétés présentées comme des différences alors que le rôle de base les portait déjà.
**Cause unique : le fait avait été lu sur un seul bloc, jamais comparé à celui dont il hérite.**
Avant d'écrire qu'un rôle « diffère par », poser côte à côte les deux `authPolicy`, les deux jeux de
permissions et les deux `dataScopes` — et n'écrire que l'écart qui reste. De même, « le plus » ou
« le seul » demande d'avoir balayé les huit, pas deux.

### 0.5 bis · Le cadre d'une carte se mesure

`viewport="LxH"` sur une `@dsCard` n'est pas une intention, c'est une mesure : la hauteur réelle du
document **à la largeur déclarée**, plus 80 px. Écrite à la main, elle coupe — relevé du 12/08 :
**13 planches sur 31 tronquées**, jusqu'à 2 059 px pour le lexique, et 2 planches sans `viewport`
du tout. Le harnais `scraps/mesure-viewports.html` mesure les 31 d'un coup ; il se relance après
toute reprise de planche.

### 0.5 · La passe de contrôle — mécanique, pas à l'œil

Les cinq mesures qui se lisent sans ouvrir une planche. Elles se relancent après toute vague :

1. les trois feuilles Phosphor en tête, sur les 31 planches ;
2. `<symbol id="i-` et `href="#i-` → **0 emploi** ;
3. `<svg` hors `class="tr"` et `class="motif` → **0 emploi** ;
4. `ph-thin` / `ph-bold` / `ph-duotone` → **0 emploi** ; `ph-fill` → onglet actif seulement ;
5. classe `ic` sans `s18` / `s20` / `s32` → taille 24 assumée, et aucun `font-size` en ligne.

**Relevé du 12/08, après passe :** les cinq mesures au vert. 58 chevrons dessinés à la main sur
12 planches remplacés par `ph-caret-right`, 4 chevrons de 14 px sur 06.1 par `ph-caret-right`
en 18, un spinner dessiné sur 16.2 par `ph-circle-notch`, un `<symbol id="i-right">` mort
supprimé du lexique. La planche **00.1 en portait 14 à elle seule** — la référence enfreignait
la règle qu'elle énonce.

---

## 1 · Vues de référence — un acte, une vue, un fichier

> **Deux points d'entrée vers le même acte ouvrent la même vue.** Le second point d'entrée
> est un **renvoi**, jamais une copie. Ce qui peut différer d'un point d'entrée à l'autre :
> l'en-tête de provenance et le pré-remplissage. **Rien d'autre** — ni un champ en moins,
> ni un libellé, ni une métrique.

Le tableau complet des actes vit dans `AUDIT-UI.md` §1. Les trois cas qui se confondaient :

| Acte | Vue unique | Fichier |
| --- | --- | --- |
| **Mon compte** — mot de passe, 2FA, sessions, code PIN, *les miens* | planche **07.1** | `screens/mon-compte-piste.html` |
| **Administrer le compte d'une personne** — suspendre, supprimer, réinitialiser, *ceux d'un autre* | planche **05.4** | `screens/utilisateur-4-compte-piste.html` |
| **Mon profil** — mes équipements, mon historique | planche **05.2**, colonne 3 | `screens/utilisateur-2-detail-piste.html` |

**Points d'entrée de « Mon compte » — trois, et ils ouvrent le même écran :**
menu de l'avatar · Paramètres → « Sécurité et connexion » · Mon profil → « Sécurité et connexion ».
Les deux derniers sont des **rangées de renvoi** : une étiquette, sa valeur, un chevron.
Ils ne portent aucun champ.

**Corrigé le 31/07.** La carte « Mon compte » de *Mon profil* portait deux rangées de
référence et un bouton « Définir un code PIN » — une copie de la planche 17. Elle est
devenue une rangée de renvoi. Et la planche 05.4, qui s'appelait « Gérer un compte
utilisateur », s'appelle « Administrer le compte d'une personne » : le titre voisin était
la moitié de la confusion.

---

## 2 · Valeurs transverses

### 2.1 · Code PIN — **quatre caractères, sans exception**

| | Valeur |
| --- | --- |
| Nombre de cases | **4** |
| Case | **64 × 76 px**, rayon 4, filet 1 px `--line-strong` |
| Écart entre cases | **12 px** |
| Chiffre saisi | Archivo 600, **34 px** |
| Case vide | filet tireté `--line`, point `·` 26 px `#C9C4BA` |
| Case en cours | filet **2 px** `--ink` |
| Case masquée | puce `•` **30 px** `--ink2` |
| Masquage | le dernier chiffre reste lisible, **les précédents sont masqués** |
| Erreur | `.pin.err` — filet et puces en `--danger`, le code **n'est pas effacé** |

**Un seul composant, `.pin`, et il ne sert qu'au code PIN.** Un autre code — celui d'une
application d'authentification, un code de secours, un code à usage unique — **n'emprunte
pas ce composant** : il se saisit dans un champ ordinaire (`.field`). Le composant à cases
est le signe visuel du code PIN ; l'employer pour autre chose apprend au lecteur une chose
fausse, et rouvre la porte aux variantes.

Référence dessinée : planche **06.2**, `screens/attribution-2-preuve-piste.html`.

### 2.2 · Vignette de rangée — **40 × 40, rayon 6**

Le rôle : la vignette qui ouvre une rangée de liste ou de carte — initiales d'une personne,
icône d'un objet, photo d'un actif. Quatre noms de rangée coexistent (`.lrow` liste ·
`.orow` objets détenus · `.prow` annuaire · `.trow` à traiter) : **ce sont quatre contenus,
une seule métrique.**

**Rayon 6, jamais 50 %.** Un cercle d'initiales et un carré arrondi d'initiales sont le
même rôle sous deux formes : quatre planches disaient cercle, trois disaient carré.
Retenu : **carré arrondi**, parce que la même vignette porte aussi bien un objet qu'une
personne, et qu'un objet dans un cercle ne se lit pas.

### 2.3 · Héro d'identité — **52 × 52, rayon 6**

L'initiale ou la photo de ce dont l'écran parle, une fois par écran, dans le héro.
Trois planches divergeaient (56 px, rayon 4, rayon 50 %) : alignées.

### 2.4 · Avatar de moi — **rond**, et le seul rond avec le §2.5

| Emploi | Classe | Valeur |
| --- | --- | --- |
| barre du haut — le bouton qui ouvre mon menu | `.avat` | **44 × 44, rond** |
| en tête de mon propre menu | `.mh .ini` | **36 × 36, rond** |

Il représente **moi**, il n'est jamais une donnée de liste, et le rond est là pour ça.
44 px dans la barre parce que c'est une cible tactile ; 36 px en tête de menu parce qu'il n'y
est plus cliquable, seulement identifiant.

### 2.5 · Marque d'événement — **32 px, ronde**

Le repère qui ouvre une ligne de **fil d'activité** — « vous avez ouvert 3 sessions »,
« Écran Dell vous a été livré ». Elle porte indifféremment des initiales (`.ev .ini`) ou une
icône (`.ev .ico`), et les deux ont la **même** métrique pour que le fil s'aligne.

**Ce n'est pas une vignette de rangée** (§2.2), et la distinction n'est pas cosmétique : une
vignette désigne **un objet qu'on peut ouvrir**, la marque d'événement désigne **un fait
passé**. 32 px et rond disent « ceci n'est pas une porte ». Les deux règles sont désormais
**déclarées** dans la feuille de style, plus héritées d'une règle voisine — c'est ainsi que la
divergence s'était installée.

### 2.6 · Échelle typographique — **cinq marches pour le texte, une pour les contrôles**

Tranché le 01/08. L'échelle en disait quatre ; le balayage a compté **14 px déclaré dans onze
planches**, toujours pour le même rôle. Une valeur employée partout, pour un rôle stable, n'est
pas une dérive : c'est une marche qui manquait au tableau. Elle est nommée.

| Rang | Rôle | Taille | Graisse |
| --- | --- | --- | --- |
| 1 | Titre d'objet (héro) | 20–22 px | Archivo 600 |
| 2 | Corps — la donnée qu'on est venu lire | 15 px | 400 |
| 3 | **Titre de rangée** — liste, menu, fil d'activité, « voir plus » | **14 px** | 400–500 |
| 4 | Titre de section (`.ct`, `.ch h3`) | 13 px | 500 |
| 5 | Secondaire — mention, date, provenance | 12–13 px | 400 |

**Et un rang à part, qui n'est pas du texte : le contrôle.** Un bouton, un onglet, un réglage
ne se lit pas, il se vise — il ne suit donc pas l'échelle du texte :

| Contrôle | Taille |
| --- | --- |
| geste (`.btn`, `.save`, `.cta`) | **14 px / 500** |
| bouton de réglage (`.rbtn`), pagination | **13 px** |

**Initiales — une taille par porteur**, parce qu'une initiale n'est ni du texte ni un contrôle :

| Porteur | Taille |
| --- | --- |
| vignette de rangée 40 px (§2.2) · avatar de moi 44 px (§2.4) | **15 px** |
| héro d'identité 52 px (§2.3) | **19 px** |
| marque d'événement 32 px (§2.5) | **12–13 px** |

Un titre de héro inversé peut monter à 17 px : c'est un autre rang, pas une variante.
**Aucune autre valeur n'est admise** — en particulier pas **12,5 px**, relevé en 06.1, 03.2 et 08
et ramené à 13 px : une demi-marche n'est pas un rang, c'est un réglage fin fait à la main.

### 2.7 · Bouton secondaire — un remplissage par surface

| Surface | Remplissage |
| --- | --- |
| sur carte claire | `--inset`, encre |
| sur héro inversé | `rgba(255,255,255,.12)`, blanc |
| second geste d'une paire, sur le canevas | `--dark`, blanc |

Par **surface**, jamais par écran.

### 2.8 · Barre du bas — deux variantes, et deux seulement

- **gestionnaire** — Accueil · Actifs · Tâches · Équipe · Plus
- **utilisateur final** — Accueil · Actifs · Tâches · Plus

Un seul balisage (`<div class="nav">`), un seul jeu d'icônes
(`i-dash` · `i-dev` · `i-task` · `i-group` · `i-menu`), **exactement une barre par écran**.
« Plus » ne se supprime jamais : c'est l'entrée du profil, des paramètres et de l'aide.

**Trois surfaces n'en portent aucune, et ce n'est pas un oubli** : les écrans **hors session**
(02.1, 02.2), les **feuilles montantes** (§2.9), et la **séquence de première connexion** — barre
de titre et compte d'étapes (« Étape 1 sur 2 »), pas d'onglets, parce qu'on n'y navigue pas : il
n'y a qu'un chemin, et en sortir serait abandonner l'arrivée.

### 2.9 · Feuille montante — deux types

- **feuille de choix** — une liste de chemins → **pas de pied de page**
- **feuille d'acte** — un formulaire, une attestation → **pied obligatoire**,
  « Annuler » fantôme à gauche, geste primaire à droite

---

## 2 bis · Valeurs ajoutées au balayage complet du 01/08

Les onze règles qui suivent ont été trouvées par un **balayage systématique**, pas par un
signalement : chaque déclaration de style des dix-huit planches a été relevée, puis regroupée
par *rôle*, et toute règle portant deux valeurs pour un même rôle a été instruite. Le récit
du balayage est dans `RAPPORT-AUDIT-2026-08-01.md`.

### 2.10 · Le noir inversé — **une seule famille, `#0A191D`**

| Jeton | Valeur | Emploi |
| --- | --- | --- |
| `--dark` | **#0A191D** | le héro inversé, la barre de recherche du scanner, le fond d'un acte sombre |
| `--dark-2` | **#1B3238** | la surface posée *sur* le noir — vignette, jauge, second geste |
| `--on-dark` | **#FFFFFF** | le titre et la donnée sur noir |
| `--on-dark-2` | **#A9C0C4** | la mention secondaire sur noir |
| `--dark-line` | **rgba(255,255,255,.14)** | le filet sur noir |
| `--live-vert` | **#7AB955** | état sain |
| `--live-bleu` | **#54A9DC** | état en cours |
| `--live-orange` | **#E45329** | état en alerte |
| `--live-ambre` | **#E9C46A** | état en attente |
| `--live-ambre-wash` | **#FEF3D6** | le **lavis** d'un état en attente — fond d'étiquette, jamais une pastille |
| `--inset-2` | **#EDEAE3** | la surface d'information posée sur une carte (§2.25) |
| *le héro éteint* | **`--dark` sous un voile blanc à `.14`** | l'en-tête d'un sujet suspendu — composé, jamais un noir de plus (05/08) |

**C'était la divergence la plus étendue et la plus invisible du projet.** Dix planches
dessinaient le héro en **bleu-noir** `#0A191D`, et deux — le **tableau de bord** et le
**détail équipement**, c'est-à-dire les deux écrans les plus vus — en **noir chaud**
`#1A1917`, avec leur propre `--dark-2` `#33302B` et leur propre `--on-dark-2` `#C9C4BA`.
Pire : ces deux planches déclaraient **en plus** un jeton `--live-ink: #0A191D` employé
pour l'avatar rond — donc **deux noirs différents sur le même écran**, l'un pour le héro,
l'autre pour l'avatar posé dessus.

**Retenu : le bleu-noir**, parce qu'il est la valeur des dix planches récentes et celle des
deux répliques d'existant. `--live-ink` est supprimé : l'avatar prend `--dark`.
Le jour où le noir chaud sera préféré, c'est **une ligne à changer ici** et douze planches à
reprendre dans le même mouvement — pas douze décisions.

Référence dessinée : planche **06.1**, `screens/attribution-1-parcours-piste.html`.

### 2.10 bis · Le statut a **deux familles** — une par surface

Tranché le 04/08, sur mesure et non sur préférence. La table ci-dessus est celle du **noir
inversé** : ces couleurs y ont été conçues, et elles y passent largement. Mais elles servaient
aussi de **pastille sur carte blanche**, où elles n'ont jamais été mesurées.

**Le relevé, sur les six planches du périmètre — 45 pastilles, fonds recomposés couche par couche
avec leur alpha :** 5 sur surface inversée, **toutes conformes** ; 40 sur surface claire, dont
**28 sous le seuil**. Vert 2,17–2,36:1. Bleu 2,38–2,60:1. Ambre `#E9C46A` **1,67:1**.
Seuil WCAG 2.2, critère **1.4.11** (objet graphique non textuel) : **3:1**.

| Jeton | Valeur | sur `--dark` | sur blanc | sur `--inset` | Emploi |
| --- | --- | --- | --- | --- | --- |
| `--live-vert` | #7AB955 | 7,61:1 | ✗ 2,36 | ✗ 2,17 | **surface inversée seulement** |
| `--live-bleu` | #54A9DC | 6,91:1 | ✗ 2,60 | ✗ 2,38 | idem |
| `--live-orange` | #E45329 | 4,76:1 | 3,77:1 | 3,46:1 | idem *(passe partout, mais reste de sa famille)* |
| `--live-ambre` | #E9C46A | 10,75:1 | ✗ 1,67 | ✗ 1,53 | idem |
| **`--st-vert`** | **#5B913C** | 4,75:1 | 3,78:1 | **3,47:1** | **carte claire** |
| **`--st-bleu`** | **#288AC5** | 4,73:1 | 3,80:1 | **3,48:1** | idem |
| **`--st-orange`** | **#E45329** | 4,76:1 | 3,77:1 | **3,46:1** | idem — *même valeur que `--live-orange`, qui passait déjà* |
| **`--st-ambre`** | **#A97C00** | 4,76:1 | 3,77:1 | **3,46:1** | idem |

**La règle porte sur la surface, pas sur le composant** : `--live-*` dès que le fond composité est
`--dark` ou son voile ; `--st-*` dès qu'il est `--surface` ou `--canvas`. Cela couvre la pastille
`.st`, le point `.d` de `.mst`, **et les remplissages `.wbar i`** — ces derniers sont des objets
graphiques sur blanc au même titre, et aucun relevé ne les avait comptés.

> **Deux valeurs viennent du dessin, deux du calcul, et la distinction compte.** `--st-ambre`
> **#A97C00** n'est pas dérivé : c'est la valeur que 06.1 employait déjà sous le nom `--attente`.
> Quelqu'un avait corrigé le problème sans le nommer, et le registre le comptait comme une
> divergence à ramener au canon — **il aurait fait régresser la seule planche qui avait raison.**
> `--st-orange` est `--live-orange` inchangé, parce qu'il passait déjà. Seuls le vert et le bleu
> sont calculés, à teinte et saturation constantes, calés sur la surface claire **la plus
> défavorable** (`--inset`), pas sur le blanc.

> **Cinq statuts, quatre couleurs.** `LEXIQUE.md` §2 en fixe cinq : *Disponible · En attente ·
> Attribué · Retour à confirmer · En réparation*. **« En attente » et « Retour à confirmer »
> partagent l'ambre** — deux états transitoires, une couleur. C'est ce que 06.1 faisait déjà sans
> l'écrire ; c'est écrit maintenant. La distinction se lit au **libellé**, jamais à la couleur
> seule — ce qui satisfait par ailleurs le critère 1.4.1.

**Dette soldée le 05/08 — et elle était trois fois plus petite qu'annoncée.** Le relevé de surface
des **douze planches hors périmètre** a été fait *avant* toute correction, et il a démenti
l'estimation : **quatre planches** portaient un objet de statut sur surface claire — 02.2, 04.3,
04.4, 07.1 — pour **cinq objets**. Les huit autres n'en portaient aucun : 02.1 et 08 n'emploient
aucune couleur de statut, **03.3 déclare la famille sans la consommer**, et 03.2 · 05.3 · 05.4 ·
06.2 · 06.3 ne la posent que sur surface inversée, où elle est à sa place.

| Planche | Objet | Fond recomposé | Avant | Après |
| --- | --- | --- | --- | --- |
| 02.2 | `.meter i.f` — cran plein de la jauge | `--surface` #FFFFFF | ✗ 2,36 | **3,78:1** |
| 04.3 | `.conseq .cl.hot svg` — icône de conséquence | `--inset` #F7F5F0 | 3,46 — *bonne valeur, mauvaise famille* | **3,46:1** |
| 04.4 | `.conseq .cl.hot svg` — icône de conséquence | `--inset` #F7F5F0 | 3,46 — *idem* | **3,46:1** |
| 07.1 | `.badge .st` — pastille | `--inset` #F7F5F0 | ✗ 2,17 | **3,47:1** |
| 07.1 | `.meter i.f` — cran plein de la jauge | `--surface` #FFFFFF | ✗ 2,36 | **3,78:1** |

**Ce qui a été mesuré, et sur quoi** (`AUDIT-UI` §7.3) : les cinq objets ci-dessus **au rendu**,
fond recomposé couche par couche avec les alphas, **avant et après** ; plus un **témoin** resté sur
`--live-*` — la pastille du héro de 04.4, `#E45329` sur `#273538` une fois le voile `.12` composité,
**3,38:1**, la marge la plus étroite de la famille sur noir. Puis, en clôture, les **vingt pastilles
des treize planches en main** — pas seulement les cinq touchées ; les cinq autres (03.1 · 04.1 ·
04.2 · 05.1 · 05.2) l'avaient été la veille, à la création de la famille. **Trois objets restent sous le seuil, et aucun des
trois ne se tranche dans une planche** : ils sont en §5.6.

> **La leçon du relevé.** L'estimation « douze planches » venait d'un décompte de **déclarations**
> `--live-*` dans les `:root`. Une déclaration n'est pas un emploi : **03.3 déclare les quatre
> jetons et n'en consomme aucun.** Compter les jetons déclarés **surestime** une dette de couleur ;
> seul le relevé des **emplois, par surface**, la mesure. C'est le mécanisme de l'absence invisible
> à un index de valeurs (« Comment il s'emploie », point 4), pris par l'autre bout.

**La règle de déclaration, relevée sur 06.1 et suivie ici :** une famille de statut se déclare
**en bloc** — les quatre `--st-*` sur leur propre ligne, sous celle des `--live-*`. 06.1, la planche
de référence, porte ses cinq `--live-*` en n'en consommant que deux : **un membre non consommé
d'une famille de §2.10 n'est pas un jeton mort.** C'est ce qui rend correcte, par construction, la
reprise de la feuille par la planche voisine (emploi n°12).

> **Un jeton se déclare dans `:root`, et nulle part ailleurs.** Une règle de portée réduite
> (`.phone.dBv{…}`, `body[data-tone=…] .phone{…}`) qui redéclare un jeton de couleur est une
> valeur transverse cachée : elle échappe à la lecture des `:root` et gagne par spécificité.
> Trois cas trouvés au contrôle du 01/08, tous corrigés : `--live-ambre: #FEF3D6` en 04.2 — un
> ambre pâle pour la même pastille de statut que `#E9C46A` ailleurs —, `--dark-line` à `.16`
> dans deux règles de portée réduite, et le réglage « ton neutre » du tableau de bord qui
> **reteintait le noir inversé** (`#171716`) alors que le même réglage, sur les douze autres
> planches, ne touche que la toile et l'encre. **Un réglage de démonstration ne redéfinit
> jamais un jeton de §2.10.**

### 2.11 · Rangée de référence — **la déclaration entière, et rien d'autre**

Un seul nom, `.rrow` — `.krow` n'existe plus, y compris comme règle morte. Et **une seule
déclaration, énoncée ici en entier** ; elle est identique au caractère dans les six planches qui
la portent :

```css
.rrow{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:44px;padding:11px 0;border-top:1px solid var(--line);font-size:13px;line-height:19px}
.rrow:first-of-type{border-top:0}
.rrow .k{flex:0 0 auto;color:var(--ink2)}
.rrow .v{min-width:0;text-align:right;font-weight:500;color:var(--ink);word-break:break-word}
.rrow .v.q{font-weight:400;color:var(--ink3)}
.rrow .dest{display:block;font-weight:400;font-size:11px;line-height:15px;color:var(--ink3);margin-top:2px}
```

**Le gris est porté par l'étiquette (`.k`), jamais par la rangée.** C'est le point qui compte, et
c'est le seul mécanisme qui survive à une rangée portant un **troisième enfant** : griser la
rangée puis rencrer la valeur laisse tout le reste — une sous-ligne `.dest`, une pastille, un
bouton de copie — hériter du gris sans que personne l'ait décidé.

> **Ce que ce composant a coûté à apprendre.** La fusion `.krow` → `.rrow` avait été prononcée le
> 31/07 et **appliquée à moitié** : les deux fiches gardaient **14 px sur 6 px de gouttière**.
> Corrigé le 01/08 — mais la règle écrite ce jour-là ne fixait que `font-size` et `padding`, si
> bien que **les deux anatomies du projet la respectaient toutes les deux** : l'une alignait au
> centre avec 44 px de haut et grisait l'étiquette, l'autre alignait sur la ligne de base sans
> hauteur minimale et grisait la rangée. Deux composants sous un nom, tous deux « conformes ».
> **Une règle qui ne fixe qu'une partie d'un composant ne le tient pas : elle légitime ses
> variantes.** D'où la forme de cette section — le bloc entier, pas deux propriétés.

### 2.12 · Feuille montante — les métriques, pas seulement l'anatomie

§2.9 fixait les deux *types* de feuille ; les valeurs manquaient, et les treize planches en
portaient six variantes.

| Partie | Valeur |
| --- | --- |
| `.sheet` | rayon 12 px en haut, `padding: 0 0 12px` |
| `.sttl h3` | **19 px** / 600 + sous-titre 12 px `--ink2` |
| `.sbody` | `padding: 10px 20px 0`, **`gap: 12px`** |
| `.sfoot` | `padding: 14px 20px 2px` |
| `.scrim` | **`rgba(10,25,29,.42)`**, sur toute la hauteur de l'écran |

**Le voile portait trois opacités** — .42, .34 et .28 — donc trois profondeurs pour un même
geste, et dans le tableau de bord il s'arrêtait à 56 px du bas, laissant la barre du bas
allumée sous une feuille modale.

### 2.13 · Menu de débordement — **262 px**

Un seul composant, `.ovf .menu` : 262 px de large, posé à 50 px du haut, aligné à droite,
rangées `.mi` de 48 px minimum. Trois planches en portaient **trois largeurs** — 250, 262,
274 — ce qui déplace le bord du menu selon l'écran d'où on l'ouvre.

### 2.14 · Gestes — deux hauteurs, deux paddings, et c'est tout

| Rôle | Classe | Valeur |
| --- | --- | --- |
| geste d'un écran ou d'une feuille | `.btn` | **48 px** (`--btnh`), rayon 4, `padding: 0 16px`, texte 14 px / 500 |
| **geste fantôme** — « Annuler » à gauche d'un pied de feuille | `.btn-ghost` | **`padding: 0 4px`** — il ne porte pas de fond, donc pas de gouttière : c'est une **variante déclarée**, pas un oubli |
| bouton de réglage d'une planche | `.rbtn` | **44 px**, `padding: 0 14px`, texte 13 px |
| bouton d'icône de barre du haut | `.tb` | **48 × 48**, rayon 4, survol `--inset` |
| bouton filtre | `.fbtn` | **48 × 48** — déclaration complète en §2.24 |
| rangée « voir plus » | `.more` | **48 px** minimum |

**Le remplissage suit la surface (§2.7), et il n'y a qu'un mécanisme pour le dire.**
Tranché le 01/08 :

| Classe | Base — jamais redéfinie | Sur surface inversée |
| --- | --- | --- |
| `.btn-o` | `--inset` / `--ink` — geste secondaire sur carte claire | → |
| `.btn-d` | `--dark` / `--on-dark` — second geste d'une paire sur le canevas | → |
| `.hact .btn-o`, `.hact .btn-d` | — | **`rgba(255,255,255,.12)` / `--on-dark`** |

**Et le pendant clair : `.cact`, le bloc de gestes sur le canevas.** `.hact` attache ses gestes à
une surface inversée — son filet est `--dark-line`, qui ne se voit pas sur clair. Employer `.hact`
sur le canevas obligeait à l'annuler avec `.bare` : **un nom qu'il faut désactiver pour s'en servir
est le mauvais nom.** Deux surfaces, deux conteneurs, et la distribution reste au conteneur (§2.29) :

```css
.cact{display:flex;flex-direction:column;gap:10px}
.cact>.btn{width:100%}
```

Le second geste d'une paire posée sur le canevas prend `.btn-d` (§2.7) — pas `.btn-ghost`, qui est
réservé au « Annuler » d'un **pied de feuille** et n'a de sens qu'à côté d'un geste plein.

**`.hact`** est le bloc de gestes d'un héro ou d'un bandeau inversé — un seul nom (`.hb` a été
renommé), et **c'est lui qui porte le voile, pas la classe du bouton**. Deux planches redéfinissaient
`.btn-d` et deux autres `.btn-o` à même la classe de base : même rôle visuel, **deux noms et deux
mécanismes**. Une planche qui porte les deux surfaces — et il y en aura — ne peut pas redéfinir la
base : elle casserait l'autre. **Seul l'override par surface survit.** Au passage, `utilisateur-2`
portait un `.btn-d` **sans emploi** à la valeur voilée : détruit.

### 2.15 · Chrome de planche — le cadre autour des écrans

Ce qui n'est pas l'application mais la planche qui la montre obéit aussi à des valeurs uniques,
faute de quoi deux planches côte à côte ne se lisent pas au même rang.

| Rôle | Classe | Valeur |
| --- | --- | --- |
| titre de colonne | `.sttl h3` (planche) / `.collab` | **19 px** / 600 · **13 px** pour la légende de colonne |
| **bandeau de règle** — la règle qui gouverne la planche | `.rule` | fond **`--inset-2`**, filet gauche **3 px `--brand`**, rayon `0 6px 6px 0`, padding `15px 18px`, corps **15 px / 23** |
| **titre de section de planche** — il coupe la prose d'introduction | `.band h2` | **17 px / 500** |
| note de colonne | `.colnote` | 13 px `--ink2`, hauteur minimale **libre par planche** (elle aligne les téléphones) |
| fond de planche | `body` | **#E4E1DA**, `padding: 28px 24px 48px` |

Deux planches — les deux listes — titraient leurs colonnes à **17 px** : elles avaient donc
l'air d'un rang inférieur aux neuf autres sans qu'aucune règle ne le demande.

> **Correction du 01/08, et c'est une erreur de ce registre.** Cette section nommait d'abord
> `.band h2` « bandeau de règle ». C'est faux : le bandeau de règle est `.rule` — filet jaune,
> fond d'information — et `.band h2` est un **titre de section de planche**. Deux rôles, deux
> classes, et le registre en confondait les noms : il aurait donc fait normaliser le mauvais.
> **Un registre qui nomme mal fait corriger à côté.**

### 2.16 · Densité — quatre jetons, une valeur par jeton

| Jeton | Valeur | Ce qu'il gouverne |
| --- | --- | --- |
| `--pad` | **16 px** | l'intérieur d'une carte |
| `--rowy` | **10 px** | la gouttière verticale d'une rangée |
| `--btnh` | **48 px** | la hauteur d'un geste et d'un champ |
| `--gap` | **20 px** | l'écart entre deux cartes empilées |

`--rowy` valait 11 px sur trois planches : un pixel, mais multiplié par dix-sept rangées
d'une file de tâches, c'est un écran plus long que son voisin sans raison.

**Et les *crans* du réglage de densité, qui manquaient — c'est pour cela qu'ils ont dérivé.**
Ce tableau ne fixait que la valeur **de base**. Le réglage de démonstration en fait varier trois
crans, et rien ne disait lesquels : au relevé du 04/08, « aérée » portait **trois** valeurs de
gouttière — 32 (03.1 · 04.2), 30 (05.2), 26 (les cinq autres) — et « compacte » deux valeurs de
`--rowy`. Deux planches réglées sur le **même** cran ne montraient donc pas la même densité.

| | base | aérée | compacte |
| --- | --- | --- | --- |
| `--gap` | **20** | **26** | **14** |
| `--pad` | **16** | **20** | **12** |
| `--rowy` | **10** | **14** | **7** |
| `--btnh` | **48** | **52** | **44** |

> **`--gap` à 24 px était orphelin, et il fallait le vérifier avant de le dire.** Trois planches le
> portaient — 03.1 · 04.2 · 05.2 —, relevé dès le 01/08 (`RAPPORT-AUDIT` §2 A7) et **délibérément
> reporté** à cette passe. L'hypothèse plausible était qu'un écran à cartes nombreuses demande plus
> d'air : les trois sont justement les plus denses (4,5 · 3,0 · 2,3 cartes par écran, contre 0,9 à
> 1,5 pour les autres). **Elle est fausse.** La planche 07.1 empile **3 cartes par écran à
> `--gap:20`**, exactement la densité de 04.2 qui est à 24 ; 05.4 et 04.3 aussi. Même densité,
> valeur différente : il n'y a pas de règle derrière, seulement trois planches écrites avant que le
> canon existe.

> **`.quiet` ne faisait que deux choses, et les deux étaient à défaire.** Elle rabotait **2 px**
> sur l'intérieur des **neuf** cartes de 03.1 — `calc(var(--pad) - 2px)`, donc invisible au relevé
> des jetons *et* à la comparaison de `.card`, dont le texte est identique dans les cinq planches —
> et elle **redisait** `font-size:13px` sur `.ch h3`, que la base de la même planche déclarait déjà.
> Un nom qui neutralise un jeton canonique et répète une valeur existante n'a pas de rôle : les deux
> règles et les neuf classes sont déposées.

**Effet mesuré de la passe**, écrans rendus : **−12 px** par téléphone en 03.1, −8 à −16 px sur les
deux fiches. La réduction des gouttières est en partie **compensée** par les 2 px de padding rendus
aux cartes — une passe de densité qui raccourcit peu, parce qu'elle corrige deux dérives de sens
opposé.
**`--avs` est supprimé du projet** : c'était le reliquat de la vignette à 44 px, encore
déclaré dans six planches et encore *employé* dans une — la vignette du chemin de choix de
la planche 05.3, restée à 44 px rayon 4 alors que §2.2 dit 40 rayon 6.
**`--thw` / `--thh` sont supprimés pour la même raison** : même reliquat, même effet — la
vignette d'objet de la planche 04.1 tenait encore à 44 px rayon 4. **Aucun jeton ne dimensionne
une vignette** : §2.2 donne un nombre, pas une variable.

### 2.17 · Vignette sur surface inversée

`.thumb` et `.ico` gardent leur métrique de §2.2 — **40 × 40, rayon 6** — et ne changent que
de remplissage, comme le bouton secondaire de §2.7 :

| Surface | Remplissage | Glyphe |
| --- | --- | --- |
| sur carte claire | `--inset` | `--ink2` |
| sur héro inversé | `--dark-2` | `--on-dark-2` |

### 2.18 · Un nom, un rôle — les trois surcharges relevées

Un même nom de classe portant deux rôles est la forme la plus tenace de divergence : elle ne
se voit pas à l'inventaire, puisque les deux valeurs sont *justes* chacune dans son écran.

| Nom | Rôles qu'il porte | Décision |
| --- | --- | --- |
| `.ini` | héro d'identité **52 px** (§2.3) *et* vignette de rangée **40 px** (§2.2) | à séparer — voir §5.1 |
| `.bar` | jauge de volume (4 px, `--data`) *et* progression d'import (6 px, `--dark`) | **deux rôles**, à nommer `.bar` et `.prog` |
| `.chip` | filtre de liste (rayon 4, 13 px) *et* étiquette de statut du lexique (rayon 11, 11 px) | **deux rôles**, à nommer `.chip` et `.stg` |
| `.rule` | **bandeau de règle** à filet jaune (6 planches) *et* **citation** à filet gris dans une colonne (06.1) | séparés le 01/08 — la citation devient `.quo` |
| `.btn-d` · `.btn-o` | chacune portait **deux remplissages** — sa base et le voile du héro | séparés le 01/08 — base jamais redéfinie, voile porté par `.hact` (§2.14) |
| `.hb` · `.hact` | deux noms pour le **bloc de gestes** d'une surface inversée | unifiés le 01/08 — `.hact` |
| `.mrow` | rangée de **fil d'activité sur clair** (06.1 — le nom y est né le 01/08, du renommage de `.trow`) *et* rangée de **métadonnées sur noir** (04.2) | scindés le 04/08 — 06.1 **garde `.mrow`**, 04.2 devient **`.hmeta`** |
| `.st` | **pastille** de statut 7 × 7, rayon 2 (03.1 · 04.1 · 04.2) *et* **étiquette** de statut `inline-flex` dont le point est `.d` (06.1, dans `.matrix`) | scindés le 04/08 — la majorité garde `.st`, l'étiquette de matrice devient **`.mst`** |

### 2.19 · Marque d'événement — le troisième nom

§2.5 fixait 32 px ronde pour `.ev .ini` et `.ev .ico`. Le balayage a trouvé un **troisième
porteur du même rôle**, passé sous le filet parce qu'il n'a ni initiale ni icône : `.ev .dot`,
**26 px**, dans la fiche équipement et la fiche utilisateur. Le fil d'activité s'ouvre donc
sur un repère de 32 px au tableau de bord et de 26 px dans les deux fiches.
**Valeur canonique : 32 px ronde**, quel que soit ce que la marque porte — initiale, icône ou
point. Appliquée le 01/08 sur 04.2 · 05.2 · 06.1 · 06.3.

> **Un quatrième porteur, trouvé le 04/08 — et il avait échappé pour une raison précise.**
> `.mrow .tic` de 06.1 tenait encore à **26 px** : la marque du fil d'activité « Une demande attend
> cet objet ». C'est le cas D2 (`.ev .dot`) à l'identique, à ceci près qu'il a survécu au filet du
> 01/08 **parce que le renommage `.trow` → `.mrow` du même jour avait changé le nom de son parent** :
> le relevé cherchait `.ev`. Corrigé à 32 — et la planche portait déjà `.ack .ar .step` à 32, donc
> la valeur ne se discutait pas : **quel que soit celui des deux rôles que `.tic` tient, marque
> d'événement ou marqueur d'étape, la réponse est 32.**
>
> **Ce que la correction a coûté, et ce que ça apprend.** Une rangée du fil est passée de 60 à
> **79 px** : sa phrase — *« Karim Diallo demande un ordinateur portable »* — tenait sur une ligne,
> et les 6 px de l'icône canonique l'ont fait passer à deux. Vérification faite à l'image : elle
> tenait **au pixel près du bord**. **Une ligne qui tient à moins de 6 px près ne tient pas, elle
> coïncide** — n'importe quel nom plus long, n'importe quelle dérive de fonte l'aurait cassée.
> Le défaut n'est pas dans la règle, il est dans une phrase de démonstration calibrée au plus juste.
> *À voir en dessin : raccourcir la phrase, ou assumer la rangée à deux lignes.*

### 2.20 · Zone de preuve — photo et signature

| Rôle | Classe | Valeur |
| --- | --- | --- |
| cadre de photo d'état | `.bio` | **148 px** de haut |
| cadre de signature | `.sig` | **140 px** de haut |

Les deux planches d'attribution donnaient deux hauteurs chacune (132/148 et 120/140) pour le
même cadre : la planche 06.2 est la vue de référence de la preuve, c'est sa valeur qui tient.
**Appliquée le 01/08** (§5, point 2). *Cette ligne disait encore « non encore appliquée » le 04/08,
alors que le point 2 du §5 du même document déclarait l'inverse depuis le 01/08 : **un registre qui
se contredit à dix sections d'écart fait douter des deux affirmations**.*

### 2.21 · Les six porteurs d'identité — **un nom chacun**

Tranché le 01/08. `.ini` portait **trois** rôles — 32 px ronde, 36 px ronde, 40 et 52 px carrées —
et `.ico` deux, et `.dot` deux. Chaque valeur était juste dans son écran ; c'est le nom qui
était faux, et un nom faux garantit la divergence à la première modification globale.

| Classe | Rôle | Valeur |
| --- | --- | --- |
| `.av` | vignette de rangée à initiales ou photo | 40 × 40, rayon 6, 15 px |
| `.lth` | vignette de rangée à glyphe | 40 × 40, rayon 6 — *nommée `.ico` jusqu'au 06/08 ; ce nom ne visait aucun élément (§2.40)* |
| `.idh` | **héro d'identité** — ce dont l'écran parle, une fois par écran | 52 × 52, rayon 6, 19 px |
| `.avat` | **avatar de moi** — barre du haut ; `.mh .avat` en tête de mon menu | 44 rond / 36 rond, 15 px |
| `.mk` | **marque d'événement** — dans `.ev` ; `.mk.g` pour la variante à glyphe | 32 rond, 12–13 px |
| `.dot` | **pastille de statut** — jamais un porteur d'initiales | ≤ 10 px |

**`.ini` n'existe plus.** Un porteur d'initiales dont on ne sait pas dire lequel de ces six
rôles il tient n'a pas sa place dans une planche.

> **Le piège de ce renommage, et il s'est refemé deux fois.** Le rôle d'un porteur ne se déduit
> **pas** de la surface où il se trouve : le tableau de bord pose sa liste « À traiter »
> *à l'intérieur* du héro, et deux vignettes de rangée y ont été prises pour des héros
> d'identité — 52 px au milieu d'une liste de 40. **Le rôle se lit sur la rangée qui porte le
> vignette, jamais sur le bloc qui l'entoure** : parent `trow` · `lrow` · `orow` · `prow` · `ev`
> → vignette ; parent `hi` · `idhead` → héro d'identité. Et le héro d'identité est **une fois par
> écran** (§2.3) : deux `.idh` dans une même liste sont, à eux seuls, la preuve de l'erreur.

### 2.22 · Bandeau de marque — un rôle, et il n'est pas le héro inversé

L'écran de connexion porte un bandeau plein cadre, avant authentification, qui dit la marque et
rien d'autre. Il n'obéit pas à §2.10, et **c'est voulu** :

| | Bandeau de marque | Héro inversé (§2.10) |
| --- | --- | --- |
| Fond | **`--ink` #1A1917**, noir chaud | `--dark` #0A191D, bleu-noir |
| Forme | plein cadre, **sans rayon** | carte, rayon 8 |
| Contenu | la marque, une promesse | l'objet ou la personne dont l'écran parle |
| Où | avant authentification, une fois | dans l'application |

Deux noirs coexistent donc dans le produit, **et le registre le dit** : c'est la différence
entre une variante (interdite) et un rôle nommé (légitime). Le deuxième écran hors session est
dessiné : la planche **02.2** le prend à l'identique, deux fois.

> **Son nom est `.brand`, et le renommage date du 02/08.** Les deux rôles s'écrivaient `.hero` :
> le héro inversé de §2.10 (`--dark`, carte, rayon 8, dans l'application) et le bandeau de marque
> (`--ink`, plein cadre, hors session). **Un nom, deux rôles** — la faute de §2.18, et elle avait
> traversé trois audits parce que les deux écritures ne se croisaient dans aucune planche : tant
> qu'une seule planche portait le bandeau, la collision n'existait qu'en puissance.
> **C'est le dessin d'un second écran qui l'a révélée, pas un balayage** — un contrôle de cohérence
> compare ce qui existe, il ne voit pas le nom qu'une planche future viendra réclamer.

```css
.brand{background:var(--ink);color:#fff;padding:56px 20px 36px}
.brand .accent{display:block;width:40px;height:3px;background:var(--brand);margin-bottom:24px}
.brand h1{font-size:28px;line-height:34px;font-weight:500;margin-bottom:10px}
.brand p{font-size:15px;line-height:21px;color:#B8B2A9;max-width:290px}
.brand.short{padding:40px 20px 30px}
```

**`.brand.short` est une variante déclarée** (§2.27) : le bandeau sans promesse, pour un écran hors
session qui n'accueille pas mais informe — lien expiré, compte indisponible. La marque suffit ; la
promesse serait déplacée devant un échec.

**Le bandeau ne se personnalise pas.** Il ne porte ni le nom de l'invité, ni celui de l'inviteur,
ni l'étape en cours : un bandeau qui changerait de texte d'un écran hors session à l'autre ne
serait plus une marque, mais un titre. Ce qui est propre à l'écran vit **sous** lui, en carte.

### 2.23 · Une carte porte un sujet — précision du 01/08

La règle de `AUDIT-UI.md` §3 tient : *deux cartes voisines de moins de trois lignes chacune sont
une seule carte ; une carte d'une seule ligne est une ligne.* Deux précisions, pour qu'elle ne
se relitige pas à chaque fiche :

- **Elle vise les cartes de données**, celles qui fragmentent un même sujet. Une **rangée de
  renvoi** (§1) constitue à elle seule le sujet d'une carte : la carte est la surface, la rangée
  est le contenu, et ce n'est pas une « carte d'une ligne ».
- **Une ligne détachée rejoint la carte du sujet auquel elle appartient**, pas sa voisine de
  position. Appliqué le 01/08 : la carte « Documents » de la fiche équipement vue par le porteur
  ne portait **qu'un contrat de garantie** — elle est devenue une ligne de la carte « Garantie ».

### 2.24 · Le bouton filtre — **un seul composant, `.fbtn`**

Vérifié sur les trois pages qui filtrent — Tâches (03.3), liste équipements (04.1), annuaire
(05.1). **L'écart signalé est fermé** : les trois portent le même composant, aux mêmes valeurs.

| | Valeur |
| --- | --- |
| Boîte | **48 × 48** (`--btnh`), rayon 4, filet 1 px `--line-strong`, fond transparent |
| Glyphe | `i-filter`, 20 px, `--ink` — **tracé** : `<path d="M3 6h18M6 12h12M10 18h4"/>`, `stroke-width 1.7`, bouts et jointures `round` |
| Survol | `--inset` |
| Badge de compte | `.fbtn b` — `position:absolute; top:-6px; right:-6px; min-width:18px; height:18px; padding:0 5px; border-radius:9px; background:var(--dark); color:#fff; font-size:10px; font-weight:600; line-height:18px; font-variant-numeric:tabular-nums; text-align:center` |
| Étiquette | `aria-label="Filtrer"`, jamais un libellé visible |

> **Le 01/08, cette section a produit un faux positif, et il faut savoir pourquoi.** Elle
> déclarait « Glyphe `i-filter`, 20 px » et concluait que le composant était harmonisé sur les
> trois pages. La boîte l'était — 48 × 48, rayon 4, filet, survol, badge, étiquette, identiques au
> caractère. **Le dessin ne l'était pas** : 03.3 portait un tracé plus étroit que 04.1 et 05.1,
> et c'est le dessin qu'on voit. Une règle qui nomme un glyphe **désigne** au lieu d'énoncer —
> exactement la faute de l'emploi n°5, commise sur un objet qui n'est pas du CSS. Le tracé est
> désormais dans le tableau ci-dessus, et l'emploi n°10 le compare entre planches.

**Deux défauts trouvés en le vérifiant, corrigés :** le badge `.fbtn b` n'était **pas déclaré**
dans l'annuaire — le jour où un filtre y devient actif, le chiffre sort sans style ; et la
vignette de la rangée large `.si.big .ic` tenait à **38 px rayon 4**, troisième survivante de la
famille `--avs` / `--thw`.

> **Et la copie a d'abord introduit une quatrième variante.** Le badge ajouté à l'annuaire portait
> un `text-align:center` que les deux autres n'avaient pas — invisible à un chiffre, visible à
> deux. D'où la déclaration **écrite en entier** ci-dessus : *une règle qui dit « identique aux
> autres » ne se vérifie pas.* Une valeur canonique s'énonce, elle ne se désigne pas.

> **Un composant inerte garde la classe du composant vivant.** Les deux écrans d'illustration
> de 03.3 — l'état « avant » et l'état vide — portent `<span class="fbtn">` au lieu de
> `<summary class="fbtn">`, parce qu'ils ne s'ouvrent pas. C'est **légitime**, et c'est
> exactement la configuration qui a fait diverger la barre du bas deux fois : un inventaire qui
> chercherait `<summary class="fbtn">` ne verrait pas ces deux-là. **Le balayage se fait sur la
> classe, jamais sur la balise.**

### 2.25 · Surface d'information — `--inset-2`

`#EDEAE3` était écrit **en dur dans sept planches** : bandeau de filtres actifs, encart, note,
étiquette de dette du lexique. Un gris employé sept fois n'est pas une valeur locale, c'est un
jeton qui n'avait pas de nom.

| Jeton | Valeur | Emploi |
| --- | --- | --- |
| `--inset` | #F7F5F0 | le creux d'une carte — champ, vignette, bouton secondaire |
| `--inset-2` | **#EDEAE3** | la surface d'**information** posée sur une carte — un cran plus sombre, parce qu'elle doit se distinguer du creux |

### 2.26 · Un rôle, une déclaration — **comparée entre planches**

Tranché le 01/08, après le septième contrôle. Les six emplois précédents vérifiaient chaque
planche **contre elle-même** ou contre une liste de reliquats ; aucun ne comparait **une même
règle d'une planche à l'autre**. Un rôle pouvait donc être juste partout et différent partout —
c'est ainsi que `.idh` est resté à **17 px** dans deux planches quand §2.21 en déclarait 19.

**Le contrôle, désormais :** pour chacun des rôles de ce registre, extraire la déclaration dans
les seize planches et exiger **un texte unique**. Passage du 01/08 : **dix-sept rôles
divergeaient**, tous ramenés à une déclaration — dont neuf qui ne différaient que par **l'ordre
des propriétés** ou une propriété sans effet (`cursor`, `text-decoration`), invisibles à l'œil et
invisibles à tout contrôle visuel, mais qui rendent toute vérification future impossible.

**L'ordre des propriétés fait partie de la déclaration.** Ce n'est pas du zèle : c'est ce qui rend
le contrôle trivial — le texte correspond, ou il ne correspond pas.

### 2.27 · Variantes déclarées — ce qui a le droit de différer

Un contrôle d'identité stricte est aveugle à la différence **voulue**. Les cinq variantes ci-dessous
sont légitimes ; elles portent un nom, donc elles ne se confondent plus avec une dérive.

| Variante | Ce qu'elle change | Pourquoi |
| --- | --- | --- |
| `.sheet.above` | `bottom: 56px` | la feuille posée **au-dessus de la barre du bas**, quand l'écran garde son onglet |
| `.hact.row` | paire de gestes **en rangée**, sans filet | deux gestes courts côte à côte plutôt qu'empilés |
| `.more.center` | « voir plus » **centré** | pied d'une liste, pas d'une carte |
| `.btn-ghost` | `padding: 0 4px` | sans fond, donc sans gouttière (§2.14) |
| `.hero` **à image** | `position` · `overflow:hidden` · `isolation` · le `url()` | un héro qui porte une photo doit la rogner ; **le fond, le rayon, le padding et la gouttière restent canoniques** |
| `.prov` **en carte** | sans `padding` ni `border-top` | inscrit le 04/08. Dans une **feuille**, `.prov` porte `padding:10px 20px 0` et un filet, parce que la feuille n'a pas de gouttière propre et qu'il faut détacher la provenance du corps. Dans une **carte** (04.2), la gouttière est déjà celle de `--pad` et le filet ferait un second trait sous celui de la carte. **Deux surfaces, deux déclarations — ce n'est pas une dérive**, et un contrôle d'identité stricte l'aurait « corrigé » |
| `.l2 .aid` — **code** contre **compte** | 04.1 : `letter-spacing:.02em` · 05.1 : `padding-left:8px` | inscrit le 04/08, **après révision d'une première décision**. J'avais tranché « union des deux propriétés » sans regarder le contenu : 04.1 y met un **code alphanumérique** (`ASSET-10001`), que l'interlettrage aide à lire ; 05.1 y met une **phrase** (« 2 équipements »), sur laquelle l'interlettrage est une faute typographique, et qui a besoin d'être détachée de son voisin. **Deux contenus, deux réglages** |
| `.l2 .who` — ce qui se tronque dans une rangée | 04.1 tronque (`ellipsis`) · 05.1 ne tronque pas (`flex:0 0 auto`) | **une rangée ne tronque qu'une chose, et ce doit être la moins identifiante.** 04.1 tronque le **détenteur** (l'objet est le sujet) ; 05.1 garde le nom entier et laisse `.mail` porter la troncature (la personne est le sujet). Le choix suit le sujet de la liste, pas une préférence |

**Et le voile de surface n'est jamais une variante de classe** : il est porté par la surface —
`.hero .av` · `.hero .rbtn` · `.hact .btn-o` · `.hact .more` — jamais par une redéfinition de la
base (§2.14). Trois composants de plus y sont passés le 01/08 : la vignette, le bouton de réglage
et la rangée « voir plus ».

### 2.28 · Le sprite est un composant transverse — un identifiant, un tracé

Seize planches, seize copies du même sprite : **vingt identifiants portaient deux ou trois
dessins**. Aucun contrôle ne pouvait le voir, tous portaient sur le CSS.

**La règle :** `#i-x` désigne **un** tracé dans tout le projet. La table canonique est le sprite
de référence ; un identifiant qui doit porter deux dessins porte **deux identifiants**.

| Famille | Canon retenu | Pourquoi |
| --- | --- | --- |
| `i-filter` · `i-box` · `i-cal` · `i-pin` · `i-mail` · `i-alert` · `i-shield` · `i-wrench` · `i-back` · `i-down` · `i-right` · `i-check` | la variante **majoritaire** | rien ne distinguait les minoritaires qu'un tracé refait de mémoire |
| `i-out` | la flèche **vers la droite** (minoritaire) | la direction d'une flèche est un **sens**, pas un style : la variante majoritaire sortait vers la gauche et entrait en collision avec `i-back` et `i-return` |
| `i-scan` | la mire dont le trait de lecture **reste dans le cadre** | un trait qui dépasse les équerres se lit comme un défaut de tracé |
| `i-search` | la loupe **centrée** dans la boîte de 24 | l'autre touchait le bord |
| `i-doc` · `i-bio` | la variante **la plus complète** | un document sans lignes et une empreinte à quatre courbes sont des ébauches |
| `i-dots` → **`i-more`** | un seul nom | deux identifiants pour **les trois points « plus d'actions »** — un nom, un rôle (§2.18) |


> **Correction du 05/08 — ce que « 0 divergence sur 37 identifiants » mesurait.** Le contrôle du
> 04/08 portait sur **trois planches** (03.1 · 04.1 · 06.1), et sa formulation ne le disait pas.
> Élargi le 05/08 aux **vingt-deux planches et 71 identifiants** : **huit** portaient deux tracés.
> Sept sont des écarts d'**arrondi** — `i-back` (graisse 1,7 contre 1,8), `i-info`, `i-alert`,
> `i-box`, `i-lap`, `i-pin`, `i-shield` — et ont été ramenés au tracé majoritaire. Le huitième,
> `i-return`, porte **deux dessins** et reste ouvert. **Un contrôle de sprite se relance sur tous
> les fichiers, jamais sur ceux qu'on vient d'éditer** : c'est la quatrième obligation de méthode
> (`AUDIT-UI` §7.3) appliquée à ce registre-ci.

### 2.29 · Distribution et surface — la propriété qui écrase un bouton

**Aucune classe `.btn-*` ne déclare une propriété de mise en page.** `.btn-y`, `.btn-o`, `.btn-d`,
`.btn-x`, `.btn-dang` ne portent qu'un **fond** et une **encre**. La répartition appartient au
**conteneur** :

| Conteneur | Règle |
| --- | --- |
| `.sfoot` — pied de feuille | `.sfoot>.btn:not(.btn-ghost){flex:1}` — le geste fantôme garde sa largeur intrinsèque (§2.27) |
| `.hact.row` — paire de gestes en rangée | `.hact.row>.btn{flex:1}` — deux moitiés égales |
| `.hact.row.lead` — un geste et un désistement | `.hact.row.lead>.btn:last-child{flex:0 0 auto}` — le second prend la largeur de son mot |
| `.abar` — barre d'action collante | `.abar>.btn:not(.btn-ghost){flex:1}` |
| `.vb` — pied du verdict de scanner | `.vb>.btn:not(.btn-ghost){flex:1}` |

**Et `.hact.row` ne décrit plus que la direction.** L'attache au bloc — filet et marge du haut —
est un **axe indépendant**, porté par `.hact.bare`. Les deux étaient confondus dans un seul nom,
ce qui a poussé une planche à inventer `.acts` plutôt que réemployer `.hact.row` : elle voulait la
rangée **et** le filet. `.acts` est détruit ; `.hact.acts` ne s'appliquait d'ailleurs jamais —
à spécificité égale, `.hact{display:flex}`, écrit plus bas, l'emportait sur `.acts{display:grid}`.

> **Et la rangée a une condition, mesurée :** deux moitiés égales dans un téléphone de 393 px font
> **156 px** par bouton. « Déclarer un incident » avec son icône en demande **190**. La paire de
> 04.2 **reste empilée** : la grille `1fr 1fr` que la planche avait écrite n'était pas viable à
> cette longueur de libellé, et le fait qu'elle ne s'appliquait jamais l'avait masqué pendant tout
> ce temps. **`.hact.row` est réservée aux gestes courts** — un ou deux mots ; au-delà, la colonne.

> **Trois planches portaient un bouton écrasé**, et un quatrième défaut le prouve : deux planches
> avaient déjà écrit `.btn-full{width:100%;flex:none}` — un correctif **du symptôme**, posé sur la
> classe voisine, qui laissait la cause en place partout ailleurs. `flex:none` est supprimé.

### 2.30 · Exceptions déclarées — ce qui n'est pas soumis au canon

| Exception | Portée | Raison |
| --- | --- | --- |
| **Pas de barre de recherche sur Tâches** (03.3) | 03.3 seule | voir ci-dessous |
| **Métrique de planche** — `.intro`, `.wrap`, `.colnote{min-height}`, `.phone{min-height}`, `.page{padding}` | toutes | ce sont les mesures du **document de présentation**, pas du produit : les colonnes s'alignent planche par planche |
| ~~**Réplique de l'existant** (03.1)~~ | ~~`.old` et le chrome qui la sert~~ | **Caduque le 04/08** : `.old` ne visait plus **aucun élément** de 03.1 — la réplique avait quitté le fichier, ses 47 règles et 8 jetons `--o-*` y survivaient seuls, et l'exception protégeait donc du code mort. Elle **renaîtrait telle quelle** si une planche réembarquait une réplique ; celles de `screens/actuel/` et `screens/archive/` restent hors canon par la ligne suivante. |

**Pourquoi Tâches n'a pas de barre de recherche, alors que 04.1 et 05.1 en ont une.** Une
recherche cherche un **identifiant que la personne a sous les yeux** : un code collé sur une
machine, un nom dans un courriel. Une tâche n'a pas d'identifiant propre — elle désigne un objet
et une personne, qui en ont un chacun, et qui se cherchent **dans leur liste**. La file de travail
ne se cherche pas, elle se vide : le tri est *le plus ancien d'abord* et le seul geste utile à
999 tâches est le **filtre par nature**, ce que la planche écrit déjà.

**Ce qui ferait tomber l'exception**, et il faut le savoir d'avance : le jour où une tâche porte
une **référence propre** — un numéro de ticket cité dans un courriel ou au téléphone — elle
devient cherchable, et la barre revient à l'identique de 04.1 et 05.1.

### 2.31 · La vignette de 40 px — un objet, un nom

**Quatre noms désignaient la même boîte** — `.thumb`, `.ico`, `.av`, et cinq `… .ic` écrits sous
cinq parents (`.si.big`, `.orow`, `.way`…). Même géométrie au pixel dans les huit écritures :
40 × 40, rayon 6, contenu centré. **Un seul nom : `.vig`.**

```
.vig{width:40px;height:40px;flex:0 0 40px;border-radius:6px;display:flex;align-items:center;
     justify-content:center;font-family:Archivo,Inter,sans-serif;font-weight:600;font-size:15px;
     background:var(--inset);color:var(--ink2)}
```

**Le contenu n'est pas un axe.** Des initiales ou un glyphe de 20 px vivent dans la même boîte ;
la planche 03.3 le faisait déjà — elle mettait un glyphe d'objet dans un `.av`. Les règles de
fonte sont dans la base : sans texte, elles ne coûtent rien.

**La parure n'est pas un axe non plus — elle suit la surface** (§2.27) :

| Surface | Règle |
| --- | --- |
| claire | `.vig` — `--inset` / `--ink2` |
| héro sombre | `.hero .vig,.hact .vig{background:rgba(84,169,220,.24);color:#CBE6F5}` |

> **Il y avait trois parures pour deux surfaces.** 03.2 posait une vignette `--dark-2` sur une
> **carte claire**, à côté d'une vignette claire dans la même rangée ; 04.2 en posait une autre
> `--dark-2` **dans le héro**, où `.hero .av` déclarait déjà le bleu voilé. Les deux sont alignées
> sur la surface qui les porte.

**Et ce qui n'est *pas* une vignette, nommé pour qu'on ne le confonde plus :**

| Nom | Objet | Où |
| --- | --- | --- |
| `.step` | **marqueur d'étape** — 32 px, **rond**, état `.done` | chaîne d'attestation, 06.1 |
| `.gl` | **glyphe en ligne** dans un champ — 15 px, pas de boîte ; **la classe est portée par le `<svg>`**, jamais par un `<span>` enveloppant : `.gl{flex:0 0 15px;color:var(--ink3)}` | 02.1 · 02.2 |
| ~~`.vig.sm`~~ | — | **supprimée le 02/08.** Trois usages dans une seule planche ne fondent pas une seconde taille de vignette : les rangées de document de 04.2 prennent la boîte de 40. Une sous-liste n'est pas un axe. |

> `.ic` était à **une lettre** de `.ico` et désignait l'inverse : un glyphe en ligne contre une
> vignette de 40. Le nom est retiré du projet.

### 2.32 · La vignette — deux formes, deux sens

**Le carré désigne un sujet de ligne. Le rond désigne *vous*.** C'est la seule distinction de forme
du système, et elle porte un sens : dans une liste, tout ce qui n'est pas vous est un carré.

| | `.vig` | `.avat` |
| --- | --- | --- |
| Forme | 40 × 40, rayon **6** | 44 × 44, **cercle** |
| Fond · encre | `--inset` · `--ink2` | `--dark` · `#fff` |
| Texte | Archivo 600, 15 px | Archivo 600, 15 px, `letter-spacing .02em` |
| Contenu | initiales **ou** glyphe de 20 px | initiales, toujours |
| Emploi | le sujet d'une ligne — une personne, un objet | **le compte connecté**, dans la barre du haut, et là seulement |

**Un seul jeu de valeurs chacune, dans toutes les planches.** `.vig` est identique au caractère
dans les treize planches qui l'emploient. `.avat` portait **deux tailles de texte** (13 px en 03.2,
15 px en 03.1) — unifié sur 15.

**`.thumb`, `.ico`, `.av`, `.si .ic` n'existent plus dans aucune planche de travail** : la passe 2
les avait déjà fondus dans `.vig`. Ils survivent dans `screens/actuel/` et `screens/archive/`, qui
ne sont pas soumis au canon (§2.30).

### 2.33 · Deux noms qui portaient deux rôles — scindés le 02/08

Même mécanisme que §2.18, trouvé au contrôle de clôture de la passe 3 : deux noms tenaient chacun
**deux rôles sans rapport**, chacun juste dans son écran. Un nom qui décrit *où* la chose est posée
plutôt que *ce qu'elle fait* attire toujours un second rôle.

| Nom | Rôle **conservé** | Rôle **sorti** | Nouveau nom |
| --- | --- | --- | --- |
| `.pick` | **rangée de choix** — un sujet choisi dans un formulaire : vignette, nom, sous-titre, chevron ou « Changer » (06.1 · 04.3) | **barre d'action collante** — le pied qui suit le défilement d'une liste à sélection (05.1) | **`.abar`** |
| `.hint` | **note de champ** — 12 px, `--ink2`, alignée à gauche, sous un champ ou une carte (07.1) | **pied de liste** — 12 px, `--ink3`, **centré**, chiffres tabulaires, ce que la liste compte (04.1 · 05.1) | **`.lfoot`** |

**Ils n'avaient ni la même encre, ni le même alignement, ni le même parent** : `.hint` grise en
`--ink2` et s'aligne à gauche, le pied de liste grise en `--ink3`, se centre et compte. Deux
composants sous un nom — la configuration exacte de §2.11.

> **`.abar` est un nom réemployé, et il faut le dire.** Le 01/08, `.abar` avait été **détruit** :
> c'était un second nom pour la barre de titre, ramenée à `.tbar`. Le nom est libre, sa reprise est
> délibérée, et elle ne rouvre rien — mais un lecteur du journal qui croise les deux lignes doit
> savoir qu'elles ne parlent pas du même objet. **Un nom recyclé se signale, sinon il se relitige.**

```css
.abar{position:sticky;bottom:0;background:var(--surface);border-top:1px solid var(--line);padding:12px 20px;display:flex;gap:12px}
.abar>.btn:not(.btn-ghost){flex:1}
.lfoot{font-size:12px;line-height:17px;color:var(--ink3);text-align:center;margin-top:6px;font-variant-numeric:tabular-nums}
```

### 2.33 bis · Le bascule de réglage — `.fx` dit **quel** display, il ne se choisit pas au hasard

Quatre planches font varier leur contenu par un réglage (`data-geste`, `data-garantie`, `data-role`,
`data-vol`). Le mécanisme est partout le même, et il a **trois** règles, pas deux :

```css
.g-x.g-x.g-x{display:none}                 /* état masqué */
body[data-y="…"] .g-x.g-x.g-x{display:block}   /* état montré — par défaut, un bloc */
body[data-y="…"] .g-x.g-x.g-x.fx{display:flex} /* …sauf si l'élément est un bloc flex */
```

**`.fx` n'est pas une décoration : c'est la déclaration du `display` que l'élément avait avant
d'être conditionné.** Le poser sur un empilement l'écrase en rangée ; l'oublier sur un `.btn`,
une `.tl` ou une `.trow` tue silencieusement `align-items`, `justify-content` et `gap`.

> **Les deux fautes se sont produites dans la même rangée, en sens inverse.** En 04.4, `.fx`
> était posé sur les deux colonnes de `.two` — un `<p class="lab">` au-dessus d'un `.val`, donc
> un bloc — qui se sont mises **en rangée** : l'étiquette « COÛT » à côté de son champ au lieu
> d'être dessus, et les deux colonnes de la paire à des rangs différents. Et il **manquait** sur
> les deux gestes primaires conditionnels, qui perdaient le `flex` de `.btn`. **Le second ne se
> voyait pas** — la hauteur tient, le texte paraît centré par le défaut d'un `<button>` — et il
> serait tombé au premier bouton à icône. **Un défaut de bascule qui ne se voit pas attend
> l'icône suivante.**

**Le contrôle :** pour chaque élément portant une classe de réglage, comparer son `display`
calculé à celui de sa classe de base. S'ils diffèrent, `.fx` est en trop ou il manque.

> **Correction du 04/08 — « le mécanisme est partout le même » est faux.** Il y en a **deux**, et
> les deux sont vivants dans le projet :
>
> | Mécanisme | Où | Forme |
> | --- | --- | --- |
> | **`.fx` + triple classe** | 04.3 · 05.4 · 07.1 · 06.1 | `.g-x.g-x.g-x{display:none}` puis `block`, puis `flex` si `.fx` |
> | **`display` déclaré dans le sélecteur de réglage** | 05.2 · 04.2 · 04.1 · 05.1 · 03.1 | `body[data-etat="actif"] .btn.et-a{display:flex}` — une valeur par balise, écrite sur place |
>
> Le second est **plus sûr** — il ne peut pas oublier un `.fx` — mais il est plus verbeux, et il
> n'était écrit nulle part. **Le contrôle ci-dessus reste valable pour les deux**, parce qu'il
> porte sur le `display` **calculé**, jamais sur la présence de `.fx`.

> **Et une règle de plus, tirée du défaut de 04.3 (04/08).** `.fx` était posé sur deux
> `<p class="fnote">`. Le premier, sans enfant, ne montrait rien. Le second portait un `<b>` : en
> `flex`, le gras devient un **item** et le reste du texte un second item — les deux se sont mis
> **côte à côte en deux colonnes**, le gras comprimé sur quatre lignes étroites. Mesuré : **64 px
> de haut avec `.fx`, 48 px sans**.
>
> `.fnote` **ne déclare aucun `display`** : il n'y avait donc rien à « conserver », et c'est
> précisément pour ça que `.fx` y a été posé par habitude. D'où la règle :
> **un élément dont la classe de base ne déclare pas de `display` ne prend jamais `.fx`.**
> Le cas que cette section décrivait — `.fx` sur un empilement de blocs — n'était que la moitié du
> danger : sur un **paragraphe de texte**, `.fx` casse le flux inline, ce qui est pire parce que
> ça ne ressemble pas à une erreur de mise en page mais à un texte mal écrit.

> **Deux faux positifs à connaître, sinon le contrôle crie faux.** Un enfant de conteneur flex est
> **blocifié** : un `display:inline` déclaré qui calcule `block` est juste, pas fautif (déjà noté
> le 03/08 sur les deux `.oc` de 03.3). Et une sonde qui retire les classes de réglage retire
> aussi la **classe de base** quand celle-ci figure dans le sélecteur conditionnel (`.btn.e-att`) :
> elle fabrique alors des écarts qui n'existent pas. **On compare à un autre élément portant la
> même classe de base**, jamais à une sonde dénudée.

### 2.34 · Aucun émoji dans une planche

Un émoji est un **dessin qu'on n'a pas choisi** : sa forme, sa couleur et sa graisse appartiennent
au système d'exploitation du lecteur, il ne prend pas `currentColor`, il ne suit ni le sprite (§2.28)
ni les six porteurs d'identité (§2.21). Relevé le 02/08 dans la planche 02, seule survivante :
✉ et 🔒 en glyphes de champ, quatre visages en vignettes de comptes de démonstration.

| Écrit | Retenu |
| --- | --- |
| `<span class="gl">✉</span>` · `🔒` | `<svg class="gl">` sur `#i-mail` · `#i-lock` — le sprite canonique, ajouté à la planche qui n'en portait pas |
| `<div class="vig">🙂😮😌😄</div>` | **initiales** — `CA` · `KD` · `EE` · `AB`, le casting déjà employé dans les quinze autres planches |

**Ce n'était pas une citation de l'existant** : la planche 02 est une piste de travail, pas une
réplique (§2.30). Les émojis des répliques de `screens/actuel/` et `screens/archive/` restent —
ils **documentent** ce que fait l'application d'aujourd'hui.

### 2.35 · Où se prend un acte — le menu ⋮ ou la rangée `.arow`

Tranché le 04/08, sur une question posée par le commanditaire : *pourquoi la fiche d'un autre
porte-t-elle un menu ⋮ et « Mon profil » non ?* L'asymétrie est **voulue**, elle n'était écrite
nulle part, et une passe d'harmonisation l'aurait « corrigée » dans un sens ou dans l'autre.

| Surface | Idiome | Pourquoi |
| --- | --- | --- |
| **Fiche d'un autre** — utilisateur (05.2), équipement (04.2) | menu **⋮** (`.ovf`), une **feuille** par entrée | l'acte est ponctuel, conséquent, et **ne porte pas d'état à montrer** : un menu suffit |
| **Mes propres réglages** — Mon profil (05.2 c3), Mon compte (07.1), Paramètres (07.1 c5) | rangée **`.arow`** — étiquette, valeur, chevron — posée dans une carte | chaque réglage **porte un état** : *« modifié il y a 4 mois »*, *« non activée »*, *« défini · jamais lisible »*, *« 3 appareils »*. La rangée **montre l'état et ouvre l'acte** ; un menu ne fait que le second |

**Vérifié le 04/08 : ni 05.2 colonne 3 ni 07.1 ne portent de `.ovf`** — 07.1 n'a même pas `i-more`
dans son sprite. Ce n'est donc pas une planche qui aurait oublié le menu de l'autre : **aucune des
deux n'en a**, et c'est le même choix, pris deux fois.

`.arow` est **identique au caractère** dans les deux planches, **`.arow .dest` compris depuis le
04/08** : 05.2 ne l'employait pas et ne le déclarait donc pas — l'absence exacte que l'emploi n°4
traque. Le bloc est désormais complet des deux côtés, et la comparaison de §2.26 a de nouveau un
objet. *Un composant transverse se déclare bloc entier (§2.11), y compris la partie qu'une planche
n'emploie pas encore.*

**Le corollaire, et c'est le point dur : une fiche n'est pas modifiée par son sujet.**
Le gestionnaire dispose de « Modifier la fiche » sur n'importe qui ; la personne, sur la sienne,
n'a **aucune entrée** — et ce n'est pas un trou :

1. l'identité qui figure sur la fiche est celle qui **signe les attestations**. Si son sujet peut
   la changer, deux ans d'historique désignent un nom qu'il a choisi lui-même ;
2. c'est la règle **« une source par champ »**, déjà appliquée aux permissions — *l'écran Rôles en
   est la source, les afficher ailleurs créerait une seconde vérité* ;
3. dans le jeu de démonstration, nom, service et site viennent de l'**annuaire** : Tracker ne les
   détient pas.

**Mais l'absence ne reste pas muette** — c'est le service que rend déjà 05.4 quand elle masque une
action impossible : *l'écran dit où l'acte se fait vraiment.* Le héro de « Mon profil » porte donc
une ligne `.hnote` : *« Nom, service et site viennent de l'annuaire de l'entreprise. Une correction
se demande à un gestionnaire : cette fiche est celle qui signe vos attestations. »*

> **Ce qui ferait tomber la règle**, écrit d'avance : le jour où un champ de la fiche
> **n'appartient qu'à la personne** — une préférence d'affichage, un surnom d'usage sans valeur
> probante — il ne relève plus de cette règle et se range dans « Mon compte », en `.arow`. Le
> discriminant n'est pas *qui regarde l'écran*, c'est **si le champ sert de preuve**.

---

## 3 · Libellés à valeur unique

Un même libellé pour une même destination, quel que soit le rôle qui le lit.

| Destination | Libellé | Sous-titre |
| --- | --- | --- |
| Mon compte | **Mon compte** | *Mot de passe, code PIN, sessions* |
| Mon profil | **Mon profil** | *Mes équipements, mon historique* |
| Depuis Paramètres / Mon profil | **Sécurité et connexion** | *mot de passe, double authentification, sessions* |
| La file de travail | **Tâches** | — |
| Les biens | **Actifs** | — |

### 3.1 · Libellé d'appel et libellé d'engagement — la règle qui manquait

Le produit emploie **deux formes** pour un même acte, et c'est juste — mais ce n'était écrit
nulle part, donc rien ne permettait de dire si un troisième libellé était une variante ou une
faute :

| Forme | Où | Exemple |
| --- | --- | --- |
| **libellé d'appel** — infinitif, le mot du lexique | rangée, bouton d'entrée, menu, titre de feuille | « Confirmer la réception » · « Restituer » |
| **libellé d'engagement** — première personne | **uniquement** le geste primaire d'une feuille d'acte | « Je confirme avoir reçu » · « Je rends cet équipement » |

**Le libellé d'engagement est une forme de l'acte, pas un autre acte** : il dérive du mot du
lexique et n'en introduit jamais un nouveau. Un bouton d'entrée à la première personne, ou un
geste de feuille à l'infinitif abrégé, sont l'un et l'autre des fautes.

**Corrigé le 01/08 — quatre libellés hors lexique, trouvés au balayage :**

| Planche | Écrit | Retenu | Pourquoi |
| --- | --- | --- | --- |
| 05.4 | « Réinitialiser le code » *(geste)* | **« Réinitialiser le code PIN »** | `LEXIQUE.md` §3 range « Réinitialiser le code » parmi les **variantes rejetées** — et la faute était dans la planche qui *possède* l'acte, dont le titre de feuille, lui, était juste |
| 04.3 | « Déclarer l'incident » | **« Déclarer un incident »** | article défini contre indéfini : le lexique fixe la forme, l'engagement ne la reformule pas |
| 04.2 | statut « Réception à confirmer » | **« En attente »** | troisième mot pour l'état *remis, pas encore reçu* — même pas dans les variantes relevées |
| 04.2 | « Le vôtre » | **« Attribué — à vous »** | la planche 06.3 dit déjà « Attribué — à vous » pour le même état vu par le porteur |

### 3.2 · « Signaler un écart » et « Déclarer un incident » — **deux actes, et le fait qui les sépare**

Tranché le 01/08, avant de dessiner. `LEXIQUE.md` §4 disait déjà « à ne pas confondre » sans dire
**à quoi on les reconnaît** — c'est ainsi qu'un doublon s'installe.

| | **Signaler un écart** | **Déclarer un incident** |
| --- | --- | --- |
| Vue de référence | feuille, **06.3** | feuille, **04.3** |
| Quand | **au moment d'attester** — on refuse d'attester | **à tout moment**, sur un objet qu'on détient |
| État de l'objet | **En attente** — il n'est au nom de personne | **Attribué** — il est à mon nom |
| Ce que ça fait | **suspend** la remise ; rien ne passe à mon nom | ouvre une prise en charge sur **mon** objet |
| Première question | *ce qui ne va pas* — trois natures | *ce qu'on voit* — **la photo d'abord** |
| Point d'entrée | feuille de réception, bouton secondaire | fiche objet · « Mes équipements » |

**Le discriminant est un fait, pas une préférence : l'objet est-il déjà à mon nom ?** S'il ne
l'est pas, je ne peux pas déclarer d'incident sur lui — je n'en réponds pas. S'il l'est, je n'ai
plus rien à refuser d'attester — c'est fait.

**Ce ne sont donc pas deux feuilles à fusionner.** Mais il n'y a **qu'une feuille d'incident**,
celle de 04.3 : la troisième nature d'écart — « il est abîmé » — **y renvoie**, elle ne la
redessine pas. C'est la règle des vues de référence (§1) appliquée à un acte qui a deux origines.

**Corrigé le 31/07 :** le menu de l'avatar écrivait « Mot de passe, 2FA, session » pour un
gestionnaire et « Mot de passe, session » pour un utilisateur final — deux libellés pour
**la même destination**, la divergence par point d'entrée dans sa forme la plus pure.
« Mes actifs » et « Demandes », qui n'existaient nulle part ailleurs, avaient déjà été
ramenés au lexique.

### 3.3 · Une entrée de menu porte le même mot d'une planche à l'autre — 04/08

`LEXIQUE.md` §6 fixe l'acte : **« Modifier la fiche »**, sur la fiche d'un objet comme sur celle
d'une personne. Ce qui vaut d'être inscrit **ici**, c'est le mécanisme de l'écart.

**05.2 écrivait « Modifier le profil », 05.4 écrivait « Modifier la fiche » — pour la même entrée
du même menu.** 05.4 dessine les feuilles du menu de 05.2 : les deux planches parlent littéralement
du même bouton. Chacune était pourtant **cohérente chez elle**, et c'est ce qui a fait passer
l'écart à travers tous les contrôles : aucun ne compare **une entrée de menu d'une planche à
l'autre**. C'est §1 appliqué aux mots — *deux points d'entrée vers le même acte n'en changent ni
les champs, ni le libellé* — et c'est la même faute que §2.26 avait trouvée sur le CSS, commise
cette fois sur du texte.

**Retenu : « Modifier la fiche »**, et pour une raison qui n'est pas majoritaire mais structurelle
— « profil » est un mot **occupé** par la destination « Mon profil » (§3). Lire « Modifier le
profil » sur la fiche d'Alice laisse croire qu'on ouvre *son* « Mon profil ». Le cadrage de 05.2
défendait d'ailleurs déjà le mot — *une fiche utilisateur n'est pas un profil* — pendant que son
menu le contredisait.

**Le contrôle qui manquait :** pour chaque menu de débordement du projet, la liste de ses entrées,
comparée entre les planches qui montrent le même menu. Une planche qui **dessine les feuilles**
d'un menu dessiné ailleurs doit en reprendre les libellés **au caractère**.

### 5.4 · Nettoyage borné — règles ne visant plus rien, **antérieures à cette passe**

Relevées par l'emploi n°9, laissées en place : les supprimer en bloc, sans voir les planches, est
exactement le geste qui a fait disparaître une barre du bas le 01/08. Liste exhaustive, à traiter
planche ouverte :

| Planche | Classes visées par une règle, absentes du markup | État |
| --- | --- | --- |
| ~~03.1~~ | `.lg` `.help` `.badge` `.plusm` `.scrim` `.sheet` `.grip` `.sh` `.si` `.sd` `.nb` — les restes d'une feuille montante retirée de la planche | **déposées le 04/08**, avec `.kpi .part`, les fragments `.badge` des sélecteurs groupés et le bloc `.old` |
| 06.1 · 05.3 | `.two` | ouvert |
| 03.3 | `.prov` | ouvert |
| 04.2 · 05.2 | `.vt` — et `.kpi` en 05.2 | ouvert |
| 04.2 | `dBv-adm`, ancre de réglage qu'aucun sélecteur n'emploie | ouvert |

Aucune n'a d'effet visuel — par définition, elles ne visent rien.

> **Ce qui n'est pas mort et ne doit pas être déposé — trois catégories, relevées le 04/08.**
>
> 1. **Les déclarations que le registre impose en entier** — §2.11 `.rrow`, §2.14 `.btn-d`/`.btn-o`,
>    §2.24 `.fbtn b`, §2.27 les variantes, §2.31 `.hero .vig,.hact .vig`. Elles ne visent rien dans
>    les planches qui n'en portent pas l'emploi, et c'est **voulu** : un rôle s'énonce au texte
>    identique partout, sinon la comparaison de §2.26 n'a plus d'objet.
> 2. **Les branches d'un mécanisme symétrique.** En 04.1, la bascule de volume déclare les trois
>    volumes × les trois balises (`b`, `span`, `a`). Deux branches ne visent rien aujourd'hui —
>    `span.vv.v-14` et `a.vv.v-14` — parce que le volume « 14 » n'emploie pas ces balises *dans le
>    jeu de démonstration actuel*. Les déposer romprait la symétrie et ferait **échouer en silence**
>    le jour où l'on ajoute un `<span class="vv v-14">`. C'est §2.24 appliqué à un mécanisme plutôt
>    qu'à un composant : *on copie tous les états, pas ceux qu'on dessine.*
> 3. **Ce que l'environnement ne permet pas de juger.** Les `image-slot::part()` de 04.1 et 04.2 :
>    le script du composant n'est pas chargé hors du projet, le custom element ne s'active pas, et
>    ses `::part()` ne peuvent donc **pas** matcher. Un « 0 élément » y est un défaut de mesure, pas
>    un constat. **Non vérifiable ≠ mort.**
> 4. **Le vocabulaire utilitaire partagé.** `.tnum` ne vise rien en 05.1 — la planche obtient ses
>    chiffres tabulaires par ses règles de composant. Mais les cinq planches la déclarent, et la
>    retirer d'une seule **fabriquerait l'absence** que l'emploi n°4 traque. Même raisonnement que
>    pour les jetons `--danger`, `--dark-line`, `--data` de 04.1 : **une couche partagée vaut par
>    son uniformité**, pas par son taux d'emploi planche par planche.
>
> **Et ce qui reste bel et bien déposable** : le code mort **local**, propre à une planche et à un
> dessin qu'elle a écarté. En 05.1, `.lrow .ck.off` décrivait un état « non sélectionné » grisé
> que le markup ne produit jamais — la planche a choisi l'absence de case plutôt que la case
> grise. Ce n'est pas une branche du mécanisme en place : c'est la trace d'un mécanisme rejeté.

---

## 4 · Journal des décisions

| Date | Décision | Portée appliquée |
| --- | --- | --- |
| 28/07 | Les liens du tableau de bord ont **une seule destination** : Tâches | dashboard |
| 31/07 | Barre du bas : un balisage, un jeu d'icônes, une barre par écran | 13 planches |
| 31/07 | Titre de section à **13 px** | toutes |
| 31/07 | Code PIN : **4 cases**, 64 × 76, chiffre 34 px — `.pin` ne sert qu'au PIN | 06.2 · 06.1 · 03.2 · 17 |
| 31/07 | Vignette de rangée : **40 × 40, rayon 6**, jamais de cercle | 05.1 · 05.2 · 05.3 · 06.1 · 03.1 · 03.2 · 04.2 · 04.3 |
| 31/07 | Héro d'identité : **52 × 52, rayon 6** | 05.2 · 06.1 · 05.3 |
| 31/07 | « Mon compte » : **une vue** (planche 07.1), deux renvois, zéro copie | 17 · 05.2 · 05.4 |
| 31/07 | Planche 05.4 renommée « Administrer le compte d'une personne » | 05.4 |
| 31/07 | Avatar de moi : **44 px** barre du haut, **36 px** tête de menu, rond | 03.1 |
| 31/07 | **Marque d'événement** : rôle nommé, 32 px ronde, déclarée et non héritée | 03.1 |
| 01/08 | **Le noir inversé est `#0A191D`** — une seule famille, `--live-ink` supprimé | 03.1 · 04.2 |
| 01/08 | `--rowy` = **10 px**, `--gap` = 20 px, `--pad` = 16 px, `--btnh` = 48 px | 03.2 · 03.3 · 07.1 |
| 01/08 | **`--avs` supprimé du projet** ; vignette du chemin de choix ramenée à 40 / rayon 6 | 6 planches · 05.3 |
| 01/08 | `--live-ambre` déclaré ; plus aucune couleur de statut en dur | 04.1 · 04.2 |
| 01/08 | `--dark-line` = **rgba(255,255,255,.14)** | 04.1 · 05.2 |
| 01/08 | Rangée de référence : **13 px / 11 px**, `.krow` détruit y compris comme règle morte | 04.2 · 05.2 · 06.1 |
| 01/08 | Feuille montante : `.sheet` 12 · `.sbody` 10/20 gap 12 · `.sfoot` 2 · voile **.42** | 12 planches |
| 01/08 | Menu de débordement : **262 px** | 04.2 · 05.4 |
| 01/08 | `.btn` = 48 px / `0 16px` · `.rbtn` = 44 px / `0 14px` / 13 px · `.more` = 48 px | 03.1 · 03.2 · 04.2 · 05.2 · 06.3 |
| 01/08 | Chrome de planche : titre de colonne **19 px**, bandeau de règle **17 / 500** | 04.1 · 05.1 · 03.2 · 08 |
| 01/08 | `.bhead h2` à **16 px** — correction du 31/07 enfin appliquée partout | 04.3 · 05.3 |
| 01/08 | `.tb` : rayon 4 sur toutes les planches | 04.2 |
| 01/08 | Quatre libellés ramenés au lexique ; règle **appel / engagement** écrite | 04.2 · 04.3 · 05.4 |
| 01/08 | **Un jeton ne se déclare que dans `:root`** — `--live-ambre` `#E9C46A`, `--dark-line` `.14`, réglage de ton interdit sur le noir | 04.1 · 04.2 · 03.1 |
| 01/08 | **`--thw` / `--thh` supprimés** ; vignette d'objet ramenée à 40 / rayon 6 | 04.1 |
| 01/08 | **Cinquième marche nommée** : titre de rangée 14 px ; rang des contrôles à part ; 12,5 px supprimé | 06.1 · 03.2 · 08 · 03.1 |
| 01/08 | **Six porteurs d'identité, six noms** — `.ini` supprimé, `.mk` créé pour la marque d'événement | 10 planches |
| 01/08 | Marque d'événement portée à **32 px** ; zones de preuve à **148 / 140** ; rangée de liste à **72 px** | 04.2 · 05.2 · 06.1 · 06.3 |
| 01/08 | **`.abar` supprimé** — renommé `.tbar`, gabarit unique | 04.3 · 05.3 |
| 01/08 | **Planche 02 migrée** sur le vocabulaire commun ; le bandeau de marque devient un rôle nommé | 02 |
| 01/08 | Carte d'une seule ligne fusionnée ; règle de la carte précisée | 04.2 |
| 01/08 | Les documents normatifs désignent les planches par leur **numéro actuel** | 4 documents · 8 planches |
| 01/08 | Bouton filtre : composant unique `.fbtn` vérifié sur les 3 pages ; badge ajouté à l'annuaire | 03.3 · 04.1 · 05.1 |
| 01/08 | `.si.big .ic` 38/4 → **40 / rayon 6** — troisième vignette hors canon | 04.1 · 05.1 |
| 01/08 | **`--inset-2` #EDEAE3** — la surface d'information nommée, 21 valeurs en dur remplacées | 7 planches |
| 01/08 | **Frontière écart / incident** écrite : le discriminant est l'objet à mon nom ou non | §3.2 |
| 01/08 | **Relevé des absences** : `.btn` sans `padding` dans 5 planches, `.idh` sans `font-size` dans 1 | 5 planches |
| 01/08 | `.rule` séparé de `.quo` ; §2.15 corrigé — le bandeau de règle est `.rule`, pas `.band h2` | 06.1 · §2.15 |
| 01/08 | `.btn-ghost` inscrit comme **variante déclarée** (`0 4px`) — 8 planches qu'une lecture littérale de §2.14 aurait « corrigées » | §2.14 |
| 01/08 | Voile du héro : **un seul mécanisme**, `.hact .btn-o/.btn-d` ; bases jamais redéfinies ; `.hb` → `.hact` | 06.1 · 06.3 · 03.2 · 04.2 · 05.2 · 05.3 |
| 01/08 | `.fbtn b` : déclaration **énoncée en entier** au registre | 03.3 · 04.1 · 05.1 |
| 01/08 | **`.rrow` déclaré bloc entier** — deux anatomies opposées, toutes deux « conformes », unifiées au caractère | 6 planches |
| 01/08 | **Relevé des classes sans règle** : barre du bas restaurée (perte collatérale), `.rlist`, `.field .act`, `.si.big .chq` | 05.4 · 05.2 · 05.3 · 05.1 |
| 01/08 | **Un rôle, une déclaration, comparée entre planches** — 17 rôles divergents ramenés à un texte unique | 16 planches |
| 01/08 | Cinq **variantes déclarées** nommées (`.sheet.above`, `.hact.row`, `.more.center`, `.btn-ghost`, héro à image) | §2.27 |
| 01/08 | Voile de surface étendu à `.av`, `.rbtn`, `.more` ; `.chip` du lexique → `.stg` ; `.trow` de 06.1 → `.mrow` | 8 planches |
| 01/08 | **Chaque `var(--x)` a sa déclaration** — `--live-ambre-wash` (06.1) et `--dark-line` (05.1) manquaient | 06.1 · 05.1 |
| 01/08 | **Renommage complet** : `.trow .tm` · `.trow .tic` · `.trow b` réalignés sur `.mrow` | 06.1 |
| 01/08 | Surcharges de surface retirées des planches **sans héro** (`.hero .av`, `.hact .more`…) | 03.3 · 04.1 · 05.1 |
| 01/08 | **Sprite unifié** — 20 identifiants portaient 2 ou 3 tracés ; 28 symboles réécrits ; `i-dots` → `i-more` | 11 planches · §2.28 |
| 01/08 | Tracé de `i-filter` **inscrit** au registre — la cause du faux positif du bouton filtre | §2.24 |
| 01/08 | **`flex` retiré de toutes les classes `.btn-*`** ; la distribution passe au conteneur ; 4 boutons écrasés redressés | 9 planches · §2.29 |
| 01/08 | `.hact.row` = direction seule ; `.hact.bare` = attache ; `.acts` détruit (il ne s'appliquait pas) | 04.2 · §2.29 |
| 01/08 | `.btn-full{flex:none}` supprimé — correctif de symptôme posé sur la classe voisine | 06.2 · 07.1 |
| 01/08 | `.tbar` : 6 déclarations → une, plus `.tbar.plain` (titre sans bouton) et `.tbar.stick` | 11 planches |
| 01/08 | `.field` : 4 déclarations → une, plus `.field.multi` et `.field.wact` ; la recherche prend `.ph` | 6 planches |
| 01/08 | `.vb` **n'avait aucune règle** — classe employée sans déclaration, manquée par l'emploi n°6 | 04.1 |
| 01/08 | `.grip` · `.sttl` · `.frow` · `.prov` · `.bst` · `.mi` · `.hero` · `.behind` · `.thumb` réalignés | 8 planches |
| 01/08 | **Exceptions déclarées** : pas de recherche sur Tâches, métrique de planche, réplique 03.1 | §2.30 |
| 01/08 | `.hact.row.lead` — un geste et un désistement ; supprime deux `style="flex:0 0 auto"` **en ligne** | 06.1 · 05.3 · §2.29 |
| 01/08 | Paire de 04.2 maintenue **empilée** — la rangée demande 190 px pour 156 disponibles | 04.2 · §2.29 |
| 01/08 | `.avat` — deux déclarations (13 px / 15 px), unifiées | 03.1 · 03.2 · §2.31 |
| 01/08 | **`.thumb` · `.ico` · `.av` · 5 × `… .ic` → `.vig`** — une boîte de 40, une parure par surface ; `.step` et `.gl` séparés | 12 planches · §2.31 |
| 01/08 | `.hact.row.lead` — la variante « un geste et un désistement » remplace deux `style="flex"` en ligne | 06.1 · 05.3 |
| 01/08 | 04.2 : la paire **reste empilée** — « Déclarer un incident » demande 190 px, la moitié en fait 156 | §2.29 |
| 02/08 | **`.vig.sm` supprimée** — les rangées de document reprennent la boîte de 40 | 04.2 · §2.31 |
| 02/08 | **`.pick` scindé** — la rangée de choix garde le nom, la barre d'action collante devient **`.abar`** (nom réemployé, signalé) | 05.1 · §2.33 |
| 02/08 | **`.hint` scindé** — la note de champ garde le nom, le pied de liste devient **`.lfoot`** | 04.1 · 05.1 · §2.33 |
| 02/08 | **Aucun émoji dans une planche** — 02 passe au sprite (`i-mail`, `i-lock`) et aux initiales | 02 · §2.34 |
| 02/08 | **`.hero` scindé** — le bandeau de marque hors session devient **`.brand`**, avec `.brand.short` | 02.1 · 02.2 · §2.22 |
| 02/08 | **Trois surfaces sans barre du bas** inscrites : hors session, feuille, séquence d'arrivée | §2.8 |
| 02/08 | **Planche 02.2 dessinée** — l'arrivée demande **deux secrets**, l'un après l'autre ; le code PIN est un **renvoi** vers 06.2, seul l'en-tête de provenance diffère | 02.2 · §1 |
| 02/08 | **On redemande ce qu'on ne peut pas relire** — mot de passe dévoilable, donc sans champ « confirmer » ; code PIN jamais lisible, donc retapé | 02.2 · 06.2 |
| 02/08 | **`.gl` énoncé en entier** — la classe est sur le `<svg>` ; deux anatomies nées le même jour, unifiées | 02.1 · 02.2 · §2.31 |
| 02/08 | **`.cact` — le bloc de gestes du canevas**, pendant clair de `.hact` ; un `style="width"` en ligne supprimé | 02.2 · §2.14 · §2.29 |
| 02/08 | Désistement sur canevas : **`.btn-d`**, pas `.btn-ghost` — celui-ci reste au pied de feuille | 02.2 · §2.7 |
| 02/08 | **Planche 04.4 dessinée** — la suite de l'incident : prendre en charge, remplacer, réceptionner, refermer | 04.4 |
| 02/08 | **Un incident se referme sur une personne, pas sur un objet** — le remplacement crée une dette, l'écran de retour la solde | 04.4 |
| 02/08 | **Aucun statut nouveau** : « En réparation » couvre les temps 2 à 4 ; **« prêt » écarté** du lexique | 04.4 · LEXIQUE §1 · §4 |
| 02/08 | **« Réceptionner » a deux provenances, une seule vue** — retour de restitution et retour de réparation (§1) | 04.4 · 06.3 |
| 02/08 | Tâche **« Code PIN à définir »** ajoutée à la file ; l'utilisateur final a désormais **trois** natures | 03.3 · 02.2 |
| 02/08 | **Emploi n°12** — une planche neuve se relève **à l'écriture** : 14 règles et 8 jetons morts, hérités de la planche voisine, dont `.hact` **et** `.cact` | 04.4 · emploi n°12 |
| 02/08 | **Bascule de réglage : `.fx` énoncée** — posée sur un empilement en 04.4, manquante sur deux `.btn` ; les deux fautes en sens inverse dans la même feuille | 04.4 · §2.33 bis |
| 02/08 | **Le relevé se fait sur la planche rendue** — `.intro h2` et `.pick svg.ch` meurent sur la *relation*, pas sur un nom : invisibles à toute recherche de chaîne | 04.4 · emploi n°12 |
| 02/08 | **Passe 3 close** — registre et contrôles verts ; le chantier suivant est du dessin, pas de la cohérence | — |
| 03/08 | **`.fx` — 03.3 conforme** : 15 éléments conditionnés, aucun `.fx` en trop ni manquant. Les deux `.oc` sans `.fx` sont **justes** — enfants de `.ord` en flex, donc blocifiés | 03.3 · §2.33 bis |
| 03/08 | **La `.nav.r-u` de 03.3 garde « Actifs »** — l'utilisateur final a ses propres objets à consulter. « Équipe » seul tombe en rôle `user` ; l'ordre des onglets est identique des deux côtés | 03.3 |
| 03/08 | **Une absence constatée par recherche de chaîne n'est pas une absence** — la `.nav.r-u` de 03.3 fut déclarée manquante à tort : elle partage sa ligne avec la `.r-g`, et une recherche ne rend **qu'une occurrence par ligne**. Corollaire de l'emploi n°12, en sens inverse | 03.3 · emploi n°12 |
| 04/08 | **04.3 : deux `.fx` en trop**, sur des `<p class="fnote">`. Sur celui qui porte un `<b>`, le gras et le texte devenaient **deux items flex côte à côte** — 64 px de haut au lieu de 48. Corrigés, recontrôlés à 0 défaut | 04.3 · §2.33 bis |
| 04/08 | **Un élément dont la classe de base ne déclare pas de `display` ne prend jamais `.fx`** — la moitié du danger que §2.33 bis ne décrivait pas : sur un **paragraphe**, `.fx` casse le flux inline, pas seulement un empilement | §2.33 bis |
| 04/08 | **§2.33 bis corrigé : il y a *deux* mécanismes de bascule**, pas un. `.fx` en 04.3 · 05.4 · 07.1 · 06.1 ; `display` écrit dans le sélecteur de réglage en 05.2 · 04.2 · 04.1 · 05.1 · 03.1. Le contrôle vaut pour les deux, parce qu'il porte sur le `display` **calculé** | 9 planches · §2.33 bis |
| 04/08 | **§5.5 point 4 clos** — contrôle `.fx` complet. Base de mesure déclarée planche par planche, dont la réserve sur l'export local du 3 août | §5.5 |
| 04/08 | **« Actifs » reste dans la `.nav.r-u` de 03.3** — confirmé par le commanditaire, point fermé. Il ne se rouvre plus : l'arbitrage du 03/08 avait été rendu sur un relevé faux | 03.3 · DECISIONS |
| 04/08 | **Erreur de numérotation dans `DECISIONS-EN-ATTENTE-02-08.md`** — `attribution-1-parcours` y était « 05.1 » au lieu de **06.1**, si bien que le vrai 05.1 n'a jamais figuré dans la liste du contrôle `.fx`. Corrigée ; 05.1 contrôlé en supplément, conforme | 05.1 · 06.1 · §5.1 |
| 04/08 | **Un libellé pour une entrée de menu : « Modifier la fiche »** — 05.2 écrivait « Modifier le profil » là où 05.4, qui dessine les feuilles du **même** menu, écrivait « Modifier la fiche ». « Profil » est un mot occupé par la destination « Mon profil » | 05.2 · LEXIQUE §6 · §3.3 |
| 04/08 | **§2.35 — où se prend un acte.** Fiche d'un autre → menu **⋮** ; mes propres réglages → rangée **`.arow`**, parce qu'ils portent chacun un **état à montrer**. Vérifié : ni 05.2 c3 ni 07.1 ne portent de `.ovf` — 07.1 n'a pas même `i-more` dans son sprite | 05.2 · 07.1 · §2.35 |
| 04/08 | **Une fiche n'est pas modifiée par son sujet** — l'identité qui y figure signe les attestations. L'absence de menu sur « Mon profil » devient une **règle déclarée**, et le héro porte une ligne qui dit d'où vient l'identité | 05.2 · §2.35 |
| 04/08 | **Emploi n°13 — une règle se supprime par parties de sélecteur**, jamais par recherche de texte : une règle groupée contient en sous-chaîne le texte d'une règle morte. Accident reproduit le jour même où l'on corrigeait le même défaut en 03.1 | emploi n°13 |
| 04/08 | **Relevé rejoué sur les fichiers vivants.** Les trois planches récupérables font **56 035**, **56 200** et **59 399 octets** — exactement les tailles de l'export du 3 août. L'export était fidèle : les neuf constats sont valides, et la réserve de mesure de §5.5 est **levée** | 03.1 · 04.1 · 06.1 · §5.5 |
| 04/08 | **Sprite recontrôlé sur les fichiers vivants : 0 divergence sur 37 identifiants** — l'unification du 01/08 tient hors export | 03.1 · 04.1 · 06.1 · §2.28 |
| 04/08 | **03.1 — la ligne nue `.dB .hero ` supprimée.** Elle soudait la règle suivante et produisait `.dB .hero .dB .hero .tt .t`, qui ne visait rien | 03.1 |
| 04/08 | **03.1 — `.hero .vig,.hact .vig` ajouté**, au texte identique à 04.2 et 06.1. Ses **six vignettes du héro** portaient la parure claire (`--inset`/`--ink2`) sur le noir ; elles passent au voile bleu canonique. C'est très probablement la règle que la ligne nue avait perdue | 03.1 · §2.31 |
| 04/08 | **03.1 — `--live-*` et `--veil` remontés au `:root`.** Ils n'étaient déclarés que dans `.phone.dBv,body[data-tone] .phone.dBv` : le 01/08 avait corrigé la *valeur*, jamais la *portée* | 03.1 · §2.10 |
| 04/08 | **03.1 — réplique de l'existant déposée** : `.old` ne visait **aucun élément**. 47 règles, 8 jetons `--o-*` et **11 gardes `:not(.old)`** — la garde était un contournement devenu sans objet | 03.1 · §2.30 |
| 04/08 | **03.1 — 68 règles mortes déposées, 3 règles allégées** (la liste §5.4 au complet, plus `.kpi .part` et les fragments `.badge`). Chaque **partie de sélecteur** vérifiée à 0 élément au navigateur avant dépose, jamais la règle en bloc | 03.1 · §5.4 · emploi n°13 |
| 04/08 | 03.1 : `a{}` **+ `text-decoration:none`** — absent, alors que 04.1 et 06.1 le déclarent | 03.1 |
| 04/08 | **Contrôle de l'unité 03.1** : 256 → 188 règles, **75 → 1 sélecteur mort** (`.hact .vig`, moitié requise du bloc canonique), **DOM strictement identique** (635 éléments, 2 barres du bas, 9 liens, 9 cartes, 6 `.trow`), bascule de charge intacte. Les valeurs de **densité n'ont pas été touchées** : `--gap` 24, `.quiet` 14/16, héro 18/16 — elles relèvent du chantier densité | 03.1 |
| 04/08 | **Constat neuf, sorti par le relevé — `.mrow .tic` fait 26 px ronds en 06.1**, dans le fil d'activité « Une demande attend cet objet ». §2.19 dit **32**. C'est la récidive exacte du cas D2 (`.ev .dot`, 26 px) : il a survécu parce que le renommage `.trow` → `.mrow` du 01/08 a changé le nom de son parent. **Non corrigé** — à traiter dans l'unité 06.1 | 06.1 · §2.19 |
| 04/08 | **04.2 — les quatre `--live-*` remontés au `:root`.** Ils n'étaient déclarés que dans `.phone.dBv`, et 04.2 les consommait par des règles **non préfixées** (`.st-b`, `.st-v`, `.wbar i.g`…) : le jour où un `.phone` de cette planche perdait `dBv`, les pastilles devenaient transparentes. Le vecteur ouvert le 01/08 est **refermé sur les deux planches** | 04.2 · §2.10 |
| 04/08 | **04.2 — `.mrow` → `.hmeta`** (7 occurrences, CSS et markup). 06.1 garde le nom : il y est né le 01/08 | 04.2 · §2.18 |
| 04/08 | 04.2 : `a{}` **+ `text-decoration:none`** ; `.more svg` **+ `color:var(--ink2)`** — le chevron héritait de `--ink` et sortait plus sombre qu'en 04.1 et 05.1 | 04.2 |
| 04/08 | **04.2 — 1 règle morte supprimée, 1 allégée.** `.dBv h2.h1,.dBv .code,.dBv .wrow .v,.dBv .vt` : deux parties mortes retirées, deux vivantes conservées. **Neuf parties mortes ont été refusées à la dépose** — sept déclarations que le registre impose en entier, et deux `image-slot::part()` que le script absent en local rend **non vérifiables** | 04.2 · §5.4 · emploi n°13 |
| 04/08 | **Contrôle de l'unité 04.2** : 142 → 140 règles, morts 10 → 7 (tous protégés), **DOM identique** (516 éléments, 2 héros, 10 `.rrow`, 6 cartes). Les **cinq pastilles de statut sont inchangées** au rendu malgré le déplacement des jetons — preuve que la migration vers `:root` est neutre. `--gap` 24 px **non touché** | 04.2 |
| 04/08 | **04.1 — `.frow .field` : `min-width:0` ajouté** (05.1 le déclare). Un enfant flex sans `min-width` ne peut pas rétrécir sous son contenu : le champ de recherche déborderait dès que son texte s'allonge. **Pixel-identique** aujourd'hui — correctif de défaut latent | 04.1 |
| 04/08 | **04.1 — aucune règle déposée, et c'est le résultat.** Quatre parties mortes relevées, **quatre refusées** : `.fbtn b` (§2.24, ajouté exprès le 01/08), `image-slot::part()` (non vérifiable hors projet), et **deux branches de la bascule de volume** — les déposer romprait la symétrie du mécanisme. Nouvelle catégorie inscrite en §5.4 | 04.1 · §5.4 |
| 04/08 | **Les jetons déclarés sans emploi ne se déposent pas** — `--danger`, `--dark-line`, `--data` en 04.1. Les cinq planches les déclarent : la couche de jetons vaut par son **uniformité**, et en retirer un d'une seule planche fabriquerait l'absence que l'emploi n°4 traque | 04.1 · §2.10 |
| 04/08 | **Contrôle de l'unité 04.1** : 168 règles inchangées, **pixels identiques**, DOM identique (795 éléments, 18 `.lrow`), `--gap` 20 px conforme, `--live-*` déjà tous au `:root`, `a{}` déjà conforme | 04.1 |
| 04/08 | **05.1 — `display:flex` rendu à `.l1` et `.l2`.** La base ne le déclarait pas ; `.ltt>span.l1` le rattrapait, donc le défaut tombait dès qu'un `.l1` sortait de `.ltt` ou changeait de balise | 05.1 · §2.26 |
| 04/08 | **05.1 — `.l2` gouttière 6 → 7 px**, l'idiome intra-rangée du projet (`.chip`, `.bst`, `.matrix .mst`). **Sans effet dans l'état par défaut** — `.mail` y est masqué et `margin-left:auto` absorbe l'espace ; mesuré à 7 px dans l'état `data-mail="oui"`, où `.mail` rend les 2 px par sa troncature | 05.1 |
| 04/08 | **05.1 — `.lrow .ck.off` déposée** : état « non sélectionné » grisé d'un dessin de sélection **écarté**. `.tnum` et `.fbtn b` **conservées** — vocabulaire partagé et §2.24 | 05.1 · §5.4 |
| 04/08 | **Décision révisée — `.l2 .aid` n'est pas à unifier.** J'avais tranché « union des deux propriétés » sans regarder le contenu : 04.1 y met un **code**, 05.1 une **phrase**. L'interlettrage sert le premier et dessert la seconde. Inscrit en variante déclarée (§2.27) au lieu d'être convergé | 04.1 · 05.1 · §2.27 |
| 04/08 | **Contrôle de l'unité 05.1** : 119 → 118 règles, **pixels identiques** dans l'état par défaut, DOM identique (486 éléments, 17 `.lrow`), rangée à 72 px conforme, `--gap` 20 px | 05.1 |
| 04/08 | **06.1 — `.st` scindé.** La pastille 7 × 7 garde le nom (3 planches) ; l'étiquette de statut de la matrice devient **`.mst`** — 2 sélecteurs, 5 emplois de markup | 06.1 · §2.18 |
| 04/08 | **06.1 — `.mrow .tic` porté de 26 à 32 px** (§2.19). Quatrième porteur de la marque d'événement hors canon ; il avait échappé au filet du 01/08 parce que le renommage `.trow` → `.mrow` du même jour avait changé le nom de son parent | 06.1 · §2.19 |
| 04/08 | **Conséquence mesurée, et elle est instructive** : une rangée du fil passe de 60 à 79 px — sa phrase tenait sur une ligne **au pixel près**. *Une ligne qui tient à moins de 6 px près ne tient pas, elle coïncide.* Le défaut est dans la phrase de démonstration, pas dans la règle. **À trancher en dessin** | 06.1 |
| 04/08 | **06.1 — `.two` et `.two>div` déposées** (§5.4). Cinq autres parties mortes **refusées** : `.sheet.above`, `.btn-d`, `.hact .btn-d`, `.hero .vig`, `.hact .vig` — toutes imposées en entier par le registre | 06.1 · §5.4 |
| 04/08 | **Contrôle de l'unité 06.1** : 171 → 169 règles, morts 7 → 5 (tous protégés), **DOM identique** (835 éléments, 9 téléphones, 3 barres du bas, 8 cartes). `--attente` **non touché** — il relève du chantier `--st-*` | 06.1 |
| 04/08 | **05.2 — `.arow .dest` ajouté**, au texte identique à 07.1. 05.2 ne l'employait pas et ne le déclarait donc pas : c'est l'**absence** de l'emploi n°4, pas une divergence de valeur — invisible à toute comparaison de ce qui est écrit des deux côtés | 05.2 · §2.11 · §2.35 |
| 04/08 | **05.2 — règle groupée allégée** : `.phone h2.h1,.phone .code,.phone .vt,.phone .kpi` → `.phone .code`. Trois parties mortes retirées, la vivante conservée. Sept autres parties mortes **refusées** : `.hact.row`, `.hact.row>.btn`, `.btn-o`, `.hero .more`, `.hact .more`, `.more.center`, `.rrow .dest` — toutes imposées par le registre | 05.2 · §5.4 |
| 04/08 | **Contrôle de l'unité 05.2** : 121 → 122 règles, **pixels identiques**, DOM identique (523 éléments, 3 téléphones, 3 barres du bas, 7 cartes, 2 menus ⋮). `--gap` 24 px **non touché** — densité | 05.2 |
| 04/08 | **Les cinq planches du périmètre sont passées.** Bilan : 03.1 · 04.1 · 04.2 · 05.1 · 05.2 · 06.1 — six unités, chacune vérifiée au rendu et journalisée. Reste hors file : le **chantier densité** (`--gap`, `.quiet`, padding du héro, avec 05.2), la famille **`--st-*`**, et les **13 planches hors périmètre** | — |
| 04/08 | **Famille `--st-*` créée — le statut a deux familles, une par surface** (§2.10 bis). Relevé : **28 pastilles sur 45 sous le seuil WCAG 1.4.11**, toutes sur carte claire. Après repointage : **45/45 conformes**, 3,46 à 7,61:1 | 6 planches · §2.10 bis |
| 04/08 | **`--attente` de 06.1 absorbé par `--st-ambre`** — même valeur `#A97C00`. Le registre le comptait comme une divergence à ramener à `#E9C46A` : **il aurait fait régresser la seule planche qui avait raison**, de 3,77:1 à 1,67:1 | 06.1 · §2.10 bis |
| 04/08 | **Les jauges `.wbar i` sont des objets graphiques** au même titre que les pastilles — repointées en 03.1 (3 styles en ligne) et 04.2 (2 règles). Aucun relevé ne les avait comptées | 03.1 · 04.2 |
| 04/08 | **Ce qui reste sur `--live-*` est vérifié, pas oublié** : les `.st-*` des héros de 04.2 et 05.2, et le point du héro de 06.1 — fonds recomposés à rgb(35,48,52) et rgb(10,25,29), contrastes 5,25 à 7,61:1 | 04.2 · 05.2 · 06.1 |
| 04/08 | **Cinq statuts, quatre couleurs** — « En attente » et « Retour à confirmer » partagent l'ambre. 06.1 le faisait déjà sans l'écrire ; inscrit | LEXIQUE §2 · §2.10 bis |
| 04/08 | **Dette déclarée : 12 planches hors périmètre** portent encore `--live-*` sur surface claire. Deux régimes pour le même état tant qu'elles ne sont pas reprises | §2.10 bis |
| 04/08 | **Chantier densité — `--gap` ramené à 20** sur 03.1 · 04.2 · 05.2. L'hypothèse « les écrans à cartes nombreuses demandent plus d'air » a été **testée et écartée** : 07.1 empile 3 cartes par écran à 20, comme 04.2 qui était à 24 | 3 planches · §2.16 |
| 04/08 | **Les crans du réglage de densité inscrits au registre** — ils n'y étaient pas, et c'est pour ça qu'ils avaient dérivé : « aérée » portait 32 · 30 · 26 px de gouttière selon la planche. Canon : aérée 26/14, compacte 14/7 | 3 planches · §2.16 |
| 04/08 | **`.quiet` déposée de 03.1** — 2 règles, 9 classes. Elle rabotait 2 px sur l'intérieur des neuf cartes via `calc(var(--pad) - 2px)` — **invisible au relevé des jetons comme à la comparaison de `.card`** — et redisait un `font-size` que la base déclarait déjà | 03.1 · §2.16 |
| 04/08 | **03.1 : padding du héro 18/16 → 16** (§2.27 : sur le héro, le padding reste canonique) | 03.1 · §2.27 |
| 04/08 | **Effet mesuré : −12 px par écran en 03.1**, −8 à −16 px sur les fiches. Les gouttières raccourcissent, les 2 px rendus aux cartes rallongent : la passe corrige **deux dérives de sens opposé** | 3 planches |
| 04/08 | **Le chantier densité est clos** — les huit planches accessibles portent les mêmes quatre jetons et les mêmes trois crans | 8 planches · §2.16 |
| 04/08 | **Hygiène documentaire — `AUDIT-UI.md`.** Sept affirmations périmées relevées, dont **cinq tournées vers l'avenir** : « à reprendre », « non dessinée », « priorité n°1 ». Le corps du récit est **laissé intact** (un journal réécrit ne prouve plus rien, §5.1) ; un relevé daté en tête dit **où il a cessé d'être vrai** | AUDIT-UI |
| 04/08 | **Renvoi cassé corrigé** : `AUDIT-UI` pointait vers `REGLES` **§5.7**, qui n'existe pas — la table de correspondance des numéros est en **§5.1**. Un pointeur faux dans un document normatif fait chercher une règle qui n'est nulle part | AUDIT-UI · §5.1 |
| 04/08 | **§2.20 se contredisait avec §5 du même fichier** — « non encore appliquée » d'un côté, « appliquées » de l'autre, depuis le 01/08. **Un registre qui se contredit à dix sections d'écart fait douter des deux affirmations** | §2.20 · §5 |
| 04/08 | **§5.3 marquée tranchée** — les deux trous fonctionnels ont reçu leur arbitrage le 02/08 ; ce qui reste est de l'**application**, pas de la décision. Le titre annonçait encore « à trancher avant de dessiner » | §5.3 |
| 04/08 | **Emplacement de §5.4 signalé, pas corrigé** — elle porte le numéro 5.4 mais vit sous le §3, séquelle d'une édition du 02/08. Citée dix fois : un déplacement de cent lignes pour une question de rangement est le geste que l'emploi n°13 proscrit | §5 · §5.4 |
| 04/08 | **Quatrième obligation de méthode inscrite** (`AUDIT-UI` §7.3) : *une déclaration de conformité énonce ce qui a été mesuré, et sur quoi.* Tirée des six unités de correction | AUDIT-UI §7.3 |
| 05/08 | **Dette `--st-*` soldée.** Quatre planches sur douze portaient un objet de statut sur surface claire — **cinq objets**, repointés et mesurés au rendu, avant/après. Les huit autres n'en portaient aucun | 02.2 · 04.3 · 04.4 · 07.1 · §2.10 bis |
| 05/08 | **Une déclaration n'est pas un emploi.** L'estimation « douze planches » comptait les `--live-*` déclarés dans les `:root` ; **03.3 en déclare quatre et n'en consomme aucun**. Une dette de couleur se mesure sur les **emplois par surface**, jamais sur les déclarations | §2.10 bis |
| 05/08 | **Un membre non consommé d'une famille de §2.10 n'est pas un jeton mort** — 06.1, planche de référence, porte cinq `--live-*` et en consomme deux. Les familles se déclarent **en bloc** : c'est ce qui rend la reprise par la planche voisine correcte par construction | 06.1 · emploi n°12 |
| 05/08 | **Clôture élargie — les 20 pastilles des 13 planches en main mesurées**, pas seulement les 5 touchées. **Trois défauts trouvés hors de la famille `--live-*`**, donc invisibles à toute recherche sur le nom d'un jeton | §5.6 |
| 05/08 | **`.st-m` de 06.3 — 2,34:1.** « Compte suspendu » est dit par `--ink3` `#8A847A` sur un héro éteint `#3A3733` : **un gris sur un gris**. Le même gris passe sur clair (3,40:1 en 07.1) — il manque un **rôle neutre à deux valeurs, une par surface**, comme le statut en a deux | 06.3 · §5.6 |
| 05/08 | **`#3A3733` est un troisième noir** — `.hero.off` de 06.3 ne vient d'aucune famille de §2.10, qui n'en connaît qu'une. Relevé, **non touché** : exception à déclarer (§2.30) ou composition sur `--dark`, et cela ne se décide pas dans une planche | 06.3 · §2.10 · §5.6 |
| 05/08 | **Les cinq arbitrages de `DECISIONS-EN-ATTENTE-02-08.md` sont appliqués.** Deux l'étaient **déjà** — la réserve d'usage et « Prendre en charge » en 04.2 — et un troisième aussi, « Remplacer mon code PIN » en 07.1. **Trois relevés avant de refaire, trois planches non touchées** | 04.2 · 07.1 · §5.5 · §5.3 |
| 05/08 | **Une conséquence inscrite n'est pas une conséquence non faite.** §5.5 et §5.3 listaient comme « en attente » trois points que les planches portaient déjà. Un registre qui suit les décisions sans suivre les applications **fait refaire ce qui est fait** — relever la planche avant d'ouvrir le chantier, toujours | §5.5 · §5.3 · emploi n°12 |
| 05/08 | **03.3 recomptée — 17 → 20**, cinquième nature « Réparations » (3), rangée `5 j` **sans bouton** : le verbe change avec la garantie, la rangée ne la connaît pas (matrice 03.2). 25 sites de nombres, les deux feuilles « Filtrer » du régime 999 comprises | 03.3 · §5.5 |
| 05/08 | **Deux défauts trouvés dans 03.3 pendant le recomptage.** (1) Le rôle `user` annonçait **« Tout 2 » devant trois rangées** : la tâche « Code PIN à définir » avait été ajoutée sans son compte ni sa nature — corrigé, « Mon compte 1 », total 3. (2) Les feuilles « Filtrer » des colonnes 999 portaient **les chiffres de la colonne 1** (Tout 999, Validations 6) : copiées sans être recomptées | 03.3 |
| 05/08 | **`class="ch"` sur le chevron de la rangée code PIN (03.3)** — classe qui n'existe pas dans la planche : le chevron perdait `flex:0 0 15px` et sa couleur. Une classe morte **ne se voit qu'au rendu**, jamais à la lecture d'une feuille de style | 03.3 · §5.4 |
| 05/08 | **Un incident sans détenteur (§5.3) touche quatre phrases, pas une.** L'arbitrage nommait l'en-tête ; la feuille de 04.3 disait aussi « reste chez son porteur », « quitte le poste » et « Alice se retrouve sans poste ». Réglage `data-porteur`, contrôle §2.33 bis **8/8 conforme** — un seul `.fx`, sur la ligne de conséquence dont la base est `flex` | 04.3 · §2.33 bis |
| 05/08 | **Divergence de données relevée, non corrigée** : au régime 999, 03.2 répartit 612 · 287 · 100 et 03.3 répartit 520 · 86 · 287 · 66 · 40. Les deux somment à 999 et les deux décrivent le même état. À unifier quand l'une des deux planches sera rouverte | 03.2 · 03.3 |
| 05/08 | **Catalogue — A et B tranchées** (§5.7) : **A2**, familles → types ; la clé reste anglaise, le libellé passe en **table par langue** sur `Category`. Dessiné en **09.1**, et la conséquence appliquée dans la feuille de filtre de **04.1** (axe « Famille ») | §5.7 · 09.1 · 04.1 |
| 05/08 | **La dette lexique n°2 était sous-estimée : il y a quatre traductions, pas deux.** `Category.description`, `CATEGORY_LABELS`, les options en dur de `NewRequestPage`, et les planches. **Trois libellés pour `Monitor`** — « Écrans et moniteurs », « Moniteur », « Écran » | §5.7 |
| 05/08 | **Deux défauts fonctionnels, pas lexicaux** : `NewRequestPage` écrit `type:'Headset'` quand la donnée dit `Headphones` — l'équipement ne joint **aucune** catégorie, donc ni icône, ni amortissement, ni filtre — et le même écran ne propose ni serveur, ni imprimante, ni mobilier. `type` étant un `string`, rien ne le signale | produit · §5.7 |
| 05/08 | **A1 recommandée sur une mesure prise sur le mauvais composant, puis corrigée en A2.** L'argument de A2 portait sur la feuille « Filtrer » — `.sgrp`, `flex-wrap:wrap` — et la mesure a été faite sur `.chips`, la **rangée en ligne**, `overflow-x:auto`. Les deux existent dans la même planche, portent des pastilles identiques, et **ne débordent pas de la même façon** : l'une enroule, l'autre défile. Vérifié au rendu : 9 pastilles = 3 rangées en feuille, 1 rangée en ligne | §5.7 · §2.24 |
| 05/08 | **Le sélecteur de langue change la réponse B** — un champ `label` unique en français recréerait la table qu'on supprime. Table par langue, portée par la **donnée** et non par un dictionnaire de code : les catégories sont créées par l'utilisateur | §5.7 · §5.8 |
| 05/08 | **Un composant mesuré pour un autre est un relevé faux, pas un relevé approximatif.** Deux composants peuvent partager la classe `.chip`, la valeur, l'apparence — et diverger sur la seule propriété dont dépend l'argument. **Nommer le sélecteur exact sur lequel une mesure a été prise** devient obligatoire dès qu'elle fonde une décision | emploi n°12 · §5.7 |
| 05/08 | **09.1 a été dessinée pendant que j'écrivais, et je l'ai déclarée inexistante** sur un `list_files` vieux de plusieurs heures. Le listing d'un projet partagé se relit **au moment où l'on s'en sert**, pas au début d'une session | 09.1 · emploi n°12 |
| 05/08 | **Trois rôles neufs déclarés par 09.1 et inscrits ici** (§2.36) : `.fh` en-tête de famille, `.aid.todo` clé non relevée, `.lrow.mute` type inutilisable | 09.1 · §2.36 |
| 05/08 | **Divergence Serveur/Mobilier tranchée sur la donnée du produit** : *Serveur* **1 actif** (SVR-HQ-01), *Mobilier* **0**. Aucun des deux documents n'avait raison sur les deux : 04.1 tenait Serveur, `dashboard-analyse` tenait Mobilier | 09.1 · 04.1 · `dashboard-analyse.md` |
| 05/08 | **La cause : une carte bornée lue comme un inventaire.** `dashboard-analyse.md` comptait sur « Répartition par type » du tableau de bord, que `DashboardPage.tsx` borne à `.slice(0, 4)`. **Clavier, Imprimante et Serveur** en tombaient tous les trois — la conclusion « zéro actif » était juste pour Mobilier par accident et fausse pour les trois autres | `dashboard-analyse.md` |
| 05/08 | **Une carte bornée n'est pas un inventaire.** Une valeur lue dans une vue **dérivée** — top-N, agrégat, résumé — ne dit rien de l'ensemble. Un décompte qui fonde une décision se prend sur l'**entité**, jamais sur l'écran qui la résume. Troisième relevé faux de la journée, et le troisième pour la même raison : la mesure a été prise **ailleurs que là où portait la question** | emploi n°12 |
| 05/08 | **09.1 recomptée** : *Moniteur* 2 → **3**, *Mobilier* 1 → **0**. Elle avait la bonne somme — 14 — en ayant **déplacé un actif** de l'un vers l'autre : un total juste ne valide pas une ventilation | 09.1 |
| 05/08 | **Mobilier change de cas, pas seulement de chiffre.** Un type sans modèle *avec* un actif dit « le référentiel est en retard sur le parc » ; sans actif, il dit « cette entrée ne sert à rien ». **Deux défauts opposés, deux gestes opposés** — ajouter un modèle, ou supprimer l'entrée. La rangée et la note de 09.1 le disent maintenant | 09.1 |
| 05/08 | **`DECISIONS-EN-ATTENTE-02-08.md` supprimé**, comme il l'annonçait lui-même : ses **six points sont appliqués et consignés** — §5.5 points 1 à 4, §5.3, et son §4 (catalogue) recopié en §5.7 **avant** la suppression. Les mentions qui subsistent au journal sont **historiques** et le restent : un journal ne se réécrit pas. Le seul renvoi **vivant**, en §5.3, porte désormais la destination | §5.5 · §5.3 · §5.7 |
| 05/08 | **La bande sous la barre du haut n'avait pas de marge en tête** — `padding:0 20px 12px`, donc **0 px** entre le filet de la barre et le premier contrôle : le filet de la barre et la bordure du champ se touchaient. **Cinq occurrences, trois planches**, déclaration identique au caractère. Canon : **12 px, symétrique** (§2.37) | 04.1 · 05.1 · 09.1 · §2.37 |
| 05/08 | **Signalé par le commanditaire, pas par un contrôle** — et aucun des neuf contrôles ne pouvait le voir : ils comparent les déclarations **entre planches**, et les trois étaient d'accord. **Trois planches qui portent la même valeur fausse forment un consensus, pas une conformité.** Un contrôle d'identité ne juge pas la valeur | emploi n°12 · §2.37 |
| 05/08 | **06.1, maillon 1 aligné sur la grammaire de ses six voisines** — « Demandé par Karim Diallo », le type descend en sous-ligne. Il était le seul à l'actif, acteur en tête, et le seul à déborder : le débordement était le symptôme | 06.1 |
| 05/08 | **§5.6 point 1 clos sans créer de jeton** : `.st-m` employait `--ink3`, **l'encre d'une surface claire, sur une surface sombre**. Le neutre de la surface sombre existait depuis le 01/08 — `--on-dark-2`. §2.10 bis appliqué au **neutre**, qui n'avait pas de famille : 2,34 → **4,56:1** | 06.3 · §5.6 · §2.10 bis |
| 05/08 | **§5.6 point 3 clos — ce n'était pas un défaut, et le corriger l'aurait créé.** Sur une jauge, 1.4.11 porte sur le couple *plein vs vide* (**3,04:1**, conforme), pas sur le cran vide contre la carte. Passer le vide à `--line-strong` : 3,55:1 contre la carte, **1,06:1 contre le plein** — jauge illisible. **Le seuil se mesure sur la paire qui porte l'information** | 02.2 · 07.1 · §5.6 |
| 05/08 | **Un jeton manquant n'était qu'un jeton mal rangé.** Deux des trois objets sous le seuil ne demandaient aucune valeur neuve — l'un tenait dans un jeton existant, l'autre n'était pas un défaut. **Calculer avant de demander un arbitrage** a retiré les deux tiers de la question | §5.6 |
| 05/08 | **§5.6 point 2 clos — `.hero.off` recomposé sur `--dark`**, voile blanc `.14`, l'alpha déjà employé par `--dark-line`. Le troisième noir disparaît **sans nouvelle valeur ni nouvel alpha** ; composite mesuré #2C393C, l'état se lit à 0,02 près comme avant | 06.3 · §2.10 · §5.6 |
| 05/08 | **Un jeton qui passe les seuils n'est pas pour autant le bon jeton.** `--dark-2` réglait le point 2 avec un jeton existant — et ramenait l'écart entre héro éteint et héro vivant de 1,52 à **1,33** : l'état se serait vu **moins**. La mesure qui décidait ici n'était pas la lisibilité mais **l'écart qui porte le sens** | §2.10 · §5.6 |
| 05/08 | **§5.6 est close** — les trois objets sous le seuil réglés le jour même de leur relevé, **sans qu'aucune valeur transverse soit créée** : un jeton mal rangé, un faux défaut, une composition | §5.6 |
| 05/08 | **Le critère qui manquait à §5.4 : ce qui protège un mort.** Trois « règles mortes » relevées le matin sont des **membres d'une famille déclarée** — `.st-b` (03.2), `.st-a` et `.st-o` (06.3), pastilles de statut qu'une planche ne montre pas toutes. Même raison que pour les jetons de §2.10 : **un membre non consommé d'une famille n'est pas un mort, c'est la famille.** Gardées | 03.2 · 06.3 · §5.4 |
| 05/08 | **`.ok` déposée de 06.2** — et ce n'était pas une règle « ne visant plus rien » : **quinze éléments la portaient**. Aucune de ses déclarations ne rendait — `display` et `align-items` redits par `.pin i`, `font-size` et `color` battus par `.pin i.ok`, seul `gap:10px` survivait sur des `<i>` à enfant unique. **Un contrôle de présence la déclarait vivante ; un contrôle de rendu la dit muette.** Dépose vérifiée à zéro pixel | 06.2 · §5.4 |
| 05/08 | **`.ok` portait une violation latente de §2.10 bis** — `color:var(--live-vert)` sur une carte blanche, 2,36:1. Elle ne peignait pas, donc **le balayage de couleur ne pouvait pas la voir** : une déclaration battue est invisible à une mesure de rendu comme à une recherche de valeur. Elle n'attendait qu'une baisse de spécificité | 06.2 · §2.10 bis |
| 05/08 | **Attribut `assignable` appliqué en 09.1** — A3 recyclée, décidée le matin et dessinée nulle part : la faute même que le registre s'est inscrite deux fois aujourd'hui. Trois types sur huit passent à *non*. La donnée porte l'anomalie que l'attribut prévient : **SVR-HQ-01 est attribué à Alice SuperAdmin**, réception confirmée | 09.1 · §5.7 |
| 05/08 | **Un paramètre de type ne réécrit pas le passé.** Passer un type à *non attribuable* le retire du **sélecteur**, il ne défait aucune attribution faite — même règle que l'amortissement, déjà écrite dans la même planche. Dit sur la fiche, à l'endroit où la question se pose | 09.1 |
| 05/08 | **`assignable` implémenté dans le produit** — champ requis sur `Category`, huit valeurs, interrupteur au formulaire, et le **sélecteur d'attribution** exclut les types non attribuables. Vérifié en session réelle : `PRT-HQ-01`, disponible, disparaît ; les quatre autres disponibles restent | produit · §5.7 |
| 05/08 | **Un champ neuf sur une entité persistée demande deux replis, pas un.** L'absence d'`assignable` vaut `false` : sans repli, **tout le parc** sortait du sélecteur. Repli à l'hydratation depuis `localStorage` (catégories antérieures au champ) **et** à l'import CSV (colonne inexistante). *Ce qui ne dit rien est attribuable* | produit |
| 05/08 | **`tsc` ne peut pas servir de garde sur ce dépôt** — déjà rouge pour des raisons antérieures (`import.meta.env`, `this.props`, inférence de `mockData`). Le site de construction oublié — l'import CSV de catégories — a été trouvé **à la lecture**, pas par le compilateur. Un garde en panne ne prévient de rien | produit |
| 05/08 | **Divergence 03.2 / 03.3 réglée** : au régime 999, 03.2 affichait 612 · 287 · 100 = **exactement 999**, ce qui la faisait lire comme exhaustive alors que la file en compte cinq natures. Alignée sur la ventilation canonique de 03.3 — **520 · 287 · 86**, qui ne somme pas à 999 — et la légende dit maintenant *les trois natures les plus nombreuses* | 03.2 · 03.3 |
| 05/08 | **Une sonde lancée sur une copie périmée signale une régression qui n'existe pas.** Le balayage a annoncé `.meter i.f` retombé à 2,36:1 — la correction du matin. Le **serveur** la portait bien ; c'est mon extraction locale qui avait réécrit les deux planches avec leur version d'avant. **Avant de croire une régression, vérifier que ce qu'on mesure est ce qui est publié** | 02.2 · 07.1 |
| 05/08 | **`Equipment.status` porte des valeurs françaises comme clés** — `'Disponible'`, `'Attribué'`, `'En réparation'`. Symétrique exact du problème des catégories, sur le champ le plus lu du produit, jamais relevé jusqu'ici | §5.8 |
| 05/08 | **Audit complet du projet — relevé automatique sur les 21 planches.** 36 jetons : **0 divergence de valeur**. 86 composants partagés (≥ 3 planches) : **28 jamais nommés ici**, **23 portant plus d'une déclaration**. Pastilles de statut : 10 planches, **0 emploi hors de sa surface** — §2.10 bis tenue | toutes · `RAPPORT-AUDIT-2026-08-05.md` |
| 05/08 | **Le trio 09.x est bâti sur une copie du socle antérieure aux corrections du 04–05/08.** Quatre écarts, une seule cause : `.seek` sans marge en tête (§2.37, écrite le jour même), `.ch h3` à **17 px Archivo 600** (§2.6 rang 4 : 13 px / 500), `.warn` à **12,5 px** (valeur nommément bannie par §2.6), `.arow` à `padding:6px 0` (§2.16 : la gouttière verticale d'une rangée est `--rowy`) | 09.1 · 09.2 · 09.3 |
| 05/08 | **Réalignement appliqué et mesuré au rendu** : `.seek` 0 → **12 px** en tête (09.2 · 09.3), `.ch h3` 17/600 → **13/500**, `.warn` 12,5/18/9 → **12/17/10**, `.arow` 6 → **10 px**. **DOM identique** (618 · 429 · 453 éléments) ; hauteurs de téléphone **−15 à +33 px**, l'effet attendu des deux corrections de sens opposé | 09.1 · 09.2 · 09.3 |
| 05/08 | **Emploi n°14 — une planche neuve se compare au registre, pas à sa sœur.** §2.37 a été écrite pendant que 09.2 et 09.3 se dessinaient depuis un socle copié avant elle ; le contrôle qui compare les planches **entre elles** ne pouvait rien voir, **les deux nouvelles étaient d'accord**. C'est §2.37 relue dans l'autre sens : un consensus n'est pas une conformité, y compris quand il est neuf | emploi n°14 · §2.37 |
| 05/08 | **09.2 et 09.3 n'étaient nommées nulle part dans ce registre** — 09.1 l'est douze fois. Une planche publiée sans ligne de journal sort du dispositif : aucun contrôle ne sait qu'elle existe | 09.2 · 09.3 |
| 05/08 | **`.ch` porte deux composants sans rapport** — en-tête de carte (flex + `h3` + compte : 03.1 · 03.2 · 04.2 · 05.2 · 09.x) et **micro-libellé en capitales 11 px** (`.conseq .ch` : 04.3 · 04.4 · 05.3 · 05.4 · 06.1). Relevé, **non touché** : un renommage se décide | §2.18 · à arbitrer |
| 05/08 | **`.arow` porte deux jeux de métriques** — rangée de réglage (05.2 · 07.1 : filet sur l'élément, corps hérité) et rangée de référence du trio (filet sur `+`, `font-size:14px`). La **gouttière** est unifiée aujourd'hui ; le filet et le rang typographique demandent un arbitrage | §2.26 · à arbitrer |
| 05/08 | **`.hact` employée sur carte claire** dans le trio, alors que §2.14 a créé `.cact` pour ce cas exact. Le renommage serait mécanique, **l'attache ne l'est pas** : le `.cact` canonique (02.2) ne porte ni filet ni marge, et le trio en a besoin sous son `.warn`. Laissé en l'état plutôt que d'inventer un modificateur | §2.14 · à arbitrer |
| 05/08 | **Deux absences mesurées sur les 21 planches** : **aucun état de chargement**, **aucune perte de réseau**, et **aucune sortie du 393 px** (0 `@media`) alors que le produit a trois régimes de navigation. Ce ne sont pas des divergences — ce sont des écrans qui n'existent pas | rapport §3 |
| 05/08 | **Planche 06.4 dessinée — « Demander un équipement »**, premier maillon de la chaîne d'attribution et le seul qui n'avait pas d'écran. Quatre colonnes : la feuille au repos, la feuille de choix (les trois types **non attribuables** n'y sont pas), demander pour quelqu'un d'autre — où la destination change —, et ce que la demande laisse derrière | 06.4 |
| 05/08 | **Socle assemblé depuis les déclarations canoniques, rôle par rôle** — 94 règles reprises au texte **majoritaire des vingt et une planches**, aucune copiée d'une planche voisine. Mesuré après coup : **06.4 n'introduit aucune divergence** sur les 87 rôles partagés. Rayons 2/4/6/8, graisses 400/500/600, tailles toutes sur l'échelle §2.6 — aucun 12,5 px, aucun 17 px | 06.4 · emploi n°14 |
| 05/08 | **`.field.long` — variante déclarée de `.field`** (§2.38), première saisie à plusieurs lignes du produit. C'est le **seul** ajout : `.prefill`, `.pico`, `.opt`, `.pick`, `.ftt`, `.swap`, `.chips`, `.fh` sont repris au caractère. Deux relectures ont été nécessaires — la première version de `.prefill` portait trois propriétés de trop et créait la divergence qu'elle prétendait éviter | 06.4 · §2.38 |
| 05/08 | **Deux crans d'urgence au lieu de trois.** Relevé dans `ApprovalRow.tsx` : seule *Haute* a un effet — une étiquette sur la rangée du valideur ; **Basse et Normale rendent identiquement**, partout. Un réglage dont deux valeurs sur trois sont indistinguables fait trancher une question qui n'existe pas. Le Tweak « L'urgence » remet les trois crans pour peser la perte | 06.4 · à arbitrer côté produit |
| 05/08 | **La destination se dit avant l'envoi, pas dans un message après.** `approvalRequiresManagerGate` route vers le manager du bénéficiaire s'il existe **et diffère du demandeur**, sinon vers l'informatique : c'est la seule conséquence de l'acte, et elle change selon *qui demande pour qui*. L'écran actuel la dit aussi — en bas, sous le formulaire, après un émoji | 06.4 · 06.1 |
| 05/08 | **Deux relevés faits en dessinant, non corrigés.** (1) **Trois identifiants du sprite portent deux tracés** — `i-back` (1,7 contre 1,8 de graisse), `i-info` et `i-alert` —, les trois écarts étant portés par 09.1 · 09.2 · 09.3. §2.28 annonce « 0 divergence sur 37 identifiants » : le contrôle du 04/08 ne portait que sur **trois** planches, et sa formulation ne le disait pas. (2) **Les crans de densité de 03.2, 03.3 et 07.1 portent `--rowy` 15/8** là où §2.16 fixe 14/7, et quatre planches ne déplacent pas `--rowy` du tout — l'absence, encore, qu'aucun index de valeurs ne voit | §2.28 · §2.16 |
| 05/08 | **Sprite — contrôle élargi aux 71 identifiants des 22 planches : huit divergences.** Ramenés au tracé majoritaire : `i-back`, `i-info` et `i-alert` (les trois portées par 09.1 · 09.2 · 09.3), puis `i-box` (02.2), `i-lap` et `i-shield` (04.4), `i-pin` (09.2). **70 identifiants sur 71 portent désormais un tracé unique** | 7 planches · §2.28 |
| 05/08 | **`i-return` porte deux dessins, pas deux arrondis** — une flèche de retour en 04.2, un cadre à coin arrondi en 04.4. C'est le pendant sprite de `.ch` : **un nom, deux objets**. Non touché — choisir lequel garde le nom est un arbitrage, pas une application | 04.2 · 04.4 · à arbitrer |
| 05/08 | **Crans de densité — les cinq planches restées hors du chantier du 04/08 sont alignées.** 03.2, 03.3 et 07.1 portaient `--rowy` **15 / 8** au lieu de 14 / 7 ; 02.2 et 06.3 déclaraient le jeton sans le déplacer dans leurs crans — l'**absence**, encore. Les quatre planches qui ne déclarent pas `--rowy` ne l'emploient pas davantage : vérifié avant de conclure, laissées telles quelles | 5 planches · §2.16 |
| 05/08 | **Preuve au rendu du lot** : sur les neuf planches touchées, **DOM identique** et hauteur de page inchangée ; **pixels strictement identiques** sur les quatre corrections de densité — l'état par défaut ne bouge pas — et modifiés sur les cinq corrections de tracé. L'inverse eût été le défaut | 9 planches |
| 06/08 | **Planche 12.1 dessinée — les états transverses**, le seul manque à zéro du projet. Quatre formes que tous les écrans se partagent : le chargement, le geste en cours, l'acte qui échoue, hors ligne — plus introuvable et accès refusé, qui **empruntent** l'état vide de 03.3 au lieu d'inventer une sixième forme | 12.1 · §2.39 |
| 06/08 | **Deux rôles neufs, aucune valeur neuve** : `.sk` — le squelette, `--inset` employé comme une absence — et `.btn.busy` — le geste en cours, qui perd son aplat et son encre. Le squelette reprend la métrique de la vignette (§2.2) et les deux rangs typographiques qu'il remplace | 12.1 · §2.39 |
| 06/08 | **Ce que le produit fait aujourd'hui, relevé dans le code** : un tourniquet plein écran « Chargement de la vue… » ; **72 appels** à un message qui disparaît pour dire qu'un acte a échoué ; un `404` en très gros et un conseil de « vérifier le lien » sur un téléphone ; un écran *Accès Refusé* qui énumère **trois causes possibles** là où le produit sait laquelle est la sienne | 12.1 · relevé |
| 06/08 | **Mesuré : 12.1 n'introduit aucune divergence.** 109 règles de socle reprises au canon, six téléphones à 820, **0 débordement**, rayons 2/4/6/8 (plus le rond de `.vmot`), graisses 400/500/600, aucun point d'exclamation | 12.1 |
| 06/08 | **Le seuil de 300 ms et le comportement hors ligne sont des propositions, pas des relevés** — et la planche l'écrit. Le premier se vérifie sur un vrai réseau ; le second dépend de ce que « écrire » veut dire quand le serveur est optionnel | 12.1 · à trancher |
| 06/08 | **Les quatre arbitrages ouverts par l'audit sont tranchés et appliqués** (§2.40), et trois autres sont sortis en les instruisant : le micro-libellé avait **trois** noms et non deux, le chevron en avait deux, et `.ico` n'en visait aucun élément | 11 planches · §2.40 |
| 06/08 | **Recommandation révisée après mesure — le filet de `.arow` se porte sur `+`, pas sur l'élément.** `:first-of-type` désigne le premier **de son type de balise** : dans une carte où un `<div class="ch">` précède les rangées, il ne vise pas la première `.arow`. J'avais recommandé l'inverse sans l'avoir posé sur le markup réel | 05.2 · 07.1 · §2.40 |
| 06/08 | **`i-return` scindé en deux actes du lexique** — la flèche reste la **restitution** (04.2), le cadre où l'objet rentre devient `i-receive`, la **réception** (04.4). Le sprite suit désormais la même loi que les mots : un acte, un nom | 04.4 · LEXIQUE §1 |
| 06/08 | **Un chevron orphelin de plus en 03.3** — `<svg class="ch">` sans règle, alors que `.chev` était déclarée deux lignes plus haut. Le même défaut avait été corrigé le 05/08 sur la rangée voisine : **une classe morte ne se voit qu'au rendu**, et un correctif ponctuel ne balaie pas le fichier | 03.3 |
| 06/08 | **Les deux interdits du brief non tenus sont tranchés** (§2.41) : les capitales sont admises **pour le seul micro-libellé**, interdites partout ailleurs ; la règle des 48 px porte sur la **zone de frappe**, que l'idiome `.touch-target` du dépôt porte déjà. **À confirmer contre le brief avant amendement** | §2.41 · à confirmer |
| 06/08 | **Mesure du lot** : DOM identique et hauteur de page inchangée sur les onze planches ; divergences de déclaration **22 -> 20**, jetons **0 sur 36** | 11 planches |
| 06/08 | **Le portage a commencé, et il décide aussi.** 12.1 et 06.4 sont passées au produit : squelette de chargement, page introuvable sans son `404`, accès refusé qui dit **le** motif au lieu d'en lister trois, urgence à deux crans, seuil des vingt caractères reformulé, types non attribuables hors du sélecteur. Ce qui se décide en portant se décide **ici**, et ces lignes existent pour ça | 12.1 · 06.4 · produit |
| 06/08 | **03.3 portée — « Tâches » devient une vue et la destination de la barre.** Découverte en l'ouvrant : la barre du bas **disait déjà « Tâches »**, comme libellé court d'Approbations. Le mot du design était en place depuis le début, seule la destination était fausse. L'écran d'origine devient **« Demandes »** — dette n°1 du lexique, tranchée | 03.3 · LEXIQUE |
| 06/08 | **Deux renommages appliqués au produit avant d'être inscrits** — « Demander un équipement » et « Approbations → Demandes ». C'est précisément ce que le statut *renommage à valider* interdit. Les deux sont **déclarés comme tels** au lexique, avec leur réserve : le geste est fait, la décision reste à confirmer | LEXIQUE · à confirmer |
| 06/08 | **Une règle de dessin a trouvé un défaut de logique.** En appliquant §2.39 règle 3 — *une erreur vit là où le geste a été engagé* — au wizard de restitution, il est apparu que la couche de données **rendait la main en silence** quand une règle de rôle refusait : l'écran annonçait « Retour clôturé » sur un objet qui n'avait pas bougé. La règle cherchait où poser un message ; elle a trouvé qu'il n'y en avait aucun à poser | §2.39 · produit |
| 06/08 | **Ce que le portage doit encore trouver dans ce registre, et n'y trouve pas** : la loi du **delà de 393 px** — le produit a trois régimes, les planches n'en dessinent qu'un — et la **déclaration canonique des 28 composants partagés** que le rapport du 05/08 relève sans règle. Tant qu'ils manquent, le portage tranche seul | §2.40 · à écrire |
| 06/08 | **Les 28 rôles employés sans règle sont déclarés** (§2.42) — `.warn` servait dans quatorze planches, `.lab` dans treize, et aucun n'avait de texte canonique ici. La déclaration retenue est celle qui a été **mesurée** : le texte majoritaire de chaque rôle, avec le nombre de planches d'accord. `.lth` aligné dans la foulée (une propriété) ; `.note`, `.lab` et `.at2` restent à instruire, ce sont des décisions | 28 rôles · §2.42 |
| 06/08 | **La loi du delà de 393 px est écrite** (§2.43) et dessinée en **13.1** : trois régimes au lieu de cinq, **une** largeur de lecture (960) au lieu de sept `max-w-*`, un nombre de colonnes déduit du contenu — donc **medium reste à une colonne**, contre trente grilles à deux dans le produit —, la feuille qui devient dialogue à 840, et surtout **la liste de ce qui ne change jamais**. Trois rôles neufs : `.rail`, `.side`, `.dial` | 13.1 · §2.43 |
| 06/08 | **Paramètres dessinée (14.1) — trois règles de réglage** (§2.44) : un réglage **appartient à quelqu'un** et les trois propriétaires ne se mélangent pas ; il **s'applique au geste**, sauf des champs qui valent ensemble — feuille et pied ; et **un réglage qui change un calcul dit ce qu'il change et sur quoi**. Relevé : l'écran portait 5 sections de 3 natures et 2 boutons d'enregistrement au nom variable | 14.1 · §2.44 |
| 08/08 | **Premier écran porté — la connexion (02.1).** Le double panneau laisse place à la composition de la planche ; une seule colonne bornée à 440 px, centrée à toutes les largeurs (§2.43). Mesuré : le portage change **trois points de contrôle visuels et trois seulement** — `login` sur les trois appareils | 02.1 · produit |
| 08/08 | **Le portage a trouvé un trou dans le pont, pas dans le dessin.** Le rayon **6** de la vignette — canonique depuis le 31/07 (§2.2, §2.31), employé **88 fois** dans les planches — n'avait **aucune classe** côté code : `rounded-md` vaut 4, `rounded-lg` vaut 8. Il rendait donc à 4 px sans que rien ne le signale. Devenu un jeton de rôle, `--tk-radius-vignette`. **Une valeur que le registre fixe et que le pont ne sait pas dire est une valeur qui ne sera pas portée** | §2.2 · produit |
| 08/08 | **Deux défauts silencieux relevés en portant** : `var(--tk-color-surface-inset)` ne désigne aucun jeton et rendait **transparent** sans erreur ; et la sonde visuelle attendait le **texte** de l'invite du champ e-mail, donc elle s'est cassée à la première phrase changée. Les deux sont du même genre : **ce qui échoue en silence ne se voit qu'au rendu** | produit · QA |
| 06/08 | **Correction d'un constat que j'avais posé deux fois à tort.** J'avais annoncé que Paramètres n'avait aucune section sécurité, sur une lecture des quatorze premières entrées du fichier. Elle existe — session, mot de passe, double authentification — et **le doublon décrit par 07.1 est donc réel**. Rien n'avait été publié avec cette erreur ; elle est écrite ici parce qu'une conclusion tirée d'un relevé partiel se répète | 14.1 · 07.1 |

## 5 · Ce qui restait à trancher — **tranché le 01/08**

> **Où trouver §5.4.** La section « Nettoyage borné » porte le numéro 5.4 mais vit **physiquement
> plus haut**, à la fin du §3 — séquelle d'une édition du 02/08. Elle n'a pas été déplacée : elle est
> citée dix fois, et un déplacement de cent lignes pour une question de rangement est exactement le
> genre de geste qui casse ce qu'il ne visait pas (emploi n°13). *Signalé plutôt que corrigé.*

Les sept points ouverts par le balayage ont été arbitrés et appliqués. Ils sont conservés ici
avec leur décision : un point tranché sans trace écrite se rouvre tout seul.

| # | Point | Décision | Où c'est écrit |
| --- | --- | --- | --- |
| 1 | `.ini` portait trois rôles | **six porteurs, six noms** ; `.ini` supprimé du projet | §2.21 |
| 2 | Trois valeurs décidées, non appliquées | **appliquées** : marque d'événement 32, preuve 148/140, rangée de liste 72 | §2.19 · §2.20 |
| 3 | La cinquième marche à 14 px | **nommée** — titre de rangée ; les contrôles sortent de l'échelle ; 12,5 px supprimé | §2.6 |
| 4 | Planche 02 « Connexion » | **migrée** ; son bandeau devient un rôle nommé, pas une exception | §2.22 |
| 5 | `.abar` devait disparaître | **supprimé**, renommé `.tbar` — les métriques étaient déjà identiques | §2.14 |
| 6 | Densité des deux fiches | **la règle est désormais tenue** ; une carte d'une ligne fusionnée ; la règle précisée | §2.23 |
| 7 | Numérotation des documents | **réécrite** dans les trois documents normatifs et dans la prose des planches ; `PASSATION.md` reste un journal, avec une table de lecture | §5.1 |

### 5.1 · Correspondance des numéros de planche

Le volet a été renuméroté le 31/07. Les documents normatifs — ce registre, `AUDIT-UI.md`,
`LEXIQUE.md` — et la prose des planches ne désignent plus que les numéros actuels.
`PASSATION.md` garde les siens : c'est un **journal daté**, et un journal réécrit ne prouve plus
rien ; il porte désormais sa table de lecture en tête.

| Ancien | Actuel | Fichier |
| --- | --- | --- |
| planche 4 | **04.2** | `equipement-2-detail-piste.html` |
| planche 7 · 9 | **06.1** | `attribution-1-parcours-piste.html` |
| planche 8 | **05.2** | `utilisateur-2-detail-piste.html` |
| planche 10 | **05.3** | `utilisateur-3-creation-piste.html` |
| planche 11 | **05.4** | `utilisateur-4-compte-piste.html` |
| planche 12 | **03.2** | `dashboard-2-atraiter-piste.html` |
| planche 13 | **08** | `lexique-piste.html` |
| planche 14 | **06.2** | `attribution-2-preuve-piste.html` |
| planche 15 | **06.3** | `attribution-3-fins-de-flux-piste.html` |
| planche 16 | **03.3** | `dashboard-3-taches-piste.html` |
| planche 17 | **07.1** | `mon-compte-piste.html` |

### 5.2 · Ce qui reste, et qui n'est pas une divergence

Deux chantiers de **dessin**, pas de cohérence — ils attendent une planche, pas un arbitrage :

1. ~~**Première connexion**~~ — **dessinée le 02/08**, planche **02.2**
   (`screens/login-2-premiere-connexion-piste.html`) : le courriel d'invitation, l'écran
   d'invitation hors session, le mot de passe, le code PIN **en renvoi vers 06.2**, et les quatre
   cas qui cassent une arrivée. Elle a produit trois décisions et un renommage — voir le journal
   du 02/08.
2. **Les catégories du catalogue** en anglais dans la donnée, en français dans les planches
   (`LEXIQUE.md`, dette n°2) — **décision produit**, pas de maquette. Options soumises à
   arbitrage dans `RAPPORT-PASSE-2.md` §5.

### 5.5 · Conséquences ouvertes par le dessin du 02/08

Elles ne sont pas des divergences : ce sont des **suites** que les planches réclament et qui
touchent d'autres planches. Inscrites pour ne pas être perdues, non appliquées.

| # | Ce qu'il faut | Où | Pourquoi c'est en attente |
| --- | --- | --- | --- |
| 1 | ~~**Cinquième nature de tâche : « Réparations »**~~ | 03.3 | **Clos le 05/08.** 17 → 20, avec sa rangée dans la file — **sans bouton** : le verbe de l'acte change avec la garantie (04.4) et la rangée ne la connaît pas. **25 sites de nombres** repris, deux défauts trouvés au passage (journal). |
| 2 | ~~**Champ « réserve » à la fiche équipement**~~ | 04.2 | **Déjà fait — constaté le 05/08, aucune modification.** La rangée « Réserve d'usage » existe dans les **deux** colonnes de 04.2, avec sa provenance déclarée (« elle survit à la clôture de l'incident »). |
| 3 | ~~**Point d'entrée « Prendre en charge »**~~ | 04.2 | **Déjà fait — constaté le 05/08, aucune modification.** `.mi.esv.e-rep`, cinquième entrée conditionnelle à `data-etat="repar"`, avec sa note de colonne. |
| 4 | ~~**Contrôle borné de `.fx`**~~ | 03.3 · 04.1 · 04.2 · 04.3 · 05.1 | **Clos le 04/08.** Un défaut trouvé et corrigé — deux `.fx` en trop en **04.3** (§2.33 bis). Réserve de mesure ci-dessous. |

> **Ce qui a été mesuré, et sur quoi — la réserve du point 4.** 03.3 a été relevé le 03/08 sur la
> feuille de style, faute d'inspection navigateur. **04.3 a été contrôlé le 04/08 sur le DOM rendu**,
> réglage forcé sur ses deux valeurs : 17 éléments conditionnés, 2 défauts, corrigés dans le même
> tour, 0 défaut au recontrôle. **04.1, 04.2, 05.1 et 06.1 avaient été contrôlés sur un export
> local du 3 août** — réserve **levée le 04/08**. Le relevé a été rejoué sur les fichiers du projet :
> 03.1, 04.1 et 06.1 y sont **identiques à l'octet** aux tailles de l'export (56 035 · 56 200 ·
> 59 399), et 04.2 comme 05.1 ont été relus intégralement. L'export était un instantané fidèle ;
> les quatre verdicts tiennent **sans réserve**.
>
> C'est l'application de la leçon de `RAPPORT-PASSE-3` §5 : **une déclaration de conformité énonce
> ce qui a été mesuré**, pas seulement son verdict. Un « conforme » sans base de mesure se relit
> deux semaines plus tard comme une garantie qu'il n'était pas.

> **Une correspondance de numéros à corriger, relevée le 04/08.**
> `DECISIONS-EN-ATTENTE-02-08.md` désignait `attribution-1-parcours-piste.html` comme « 05.1 » ;
> §5.1 le numérote **06.1**, et c'est cette table qui fait foi depuis la décision du 01/08.
> Conséquence : `utilisateur-1-liste-piste.html`, le **vrai 05.1**, n'a jamais figuré dans la liste
> du contrôle `.fx` — la liste ne couvrait que quatre planches sur les cinq qu'elle annonçait. Il a
> été contrôlé en supplément, et il est conforme. Corrigé dans le document de suivi.

### 5.3 · Deux trous fonctionnels nommés le 01/08 — **tranchés le 02/08, appliqués le 05/08**

Ils sortent de la vérification de couverture, et aucun ne se règle en maquette. **Les deux ont reçu
leur arbitrage le 02/08** (`DECISIONS-EN-ATTENTE-02-08.md` §3 — **document supprimé le 05/08 une fois
ses six points appliqués ; son contenu vit en §5.5, §5.3 et §5.7**) ; ce qui reste est de l'**application
dans les planches**, pas de la décision :

| Trou | Décision du 02/08 |
| --- | --- |
| En-tête d'un incident sans détenteur | mention explicite, pas de champ vide : **« Aucun détenteur — objet non attribué »**, alignée sur ce qui avait déjà été tranché côté « Écart » |
| Personne ne peut changer son propre code PIN | l'acte **« Remplacer mon code PIN »** est ajouté à 07.1 et **renvoie** vers 06.2. *Condition posée : si 07.1 devait dupliquer la vue au lieu de renvoyer, on ne le fait pas et on remonte le point.* |

**Application, 05/08.** Le premier a demandé un réglage neuf en 04.3, `data-porteur` : l'en-tête **dit** l'absence
au lieu de la laisser vide, et **les trois autres phrases de la feuille qui supposaient un porteur** suivent —
un correctif qui n'aurait tenu que sur l'en-tête aurait laissé la feuille se contredire deux lignes plus bas.
Le second était **déjà appliqué** : 07.1 porte l'acte « Remplacer mon code PIN » et **renvoie** vers 06.2 sans
recopier la vue — la condition posée le 02/08 est donc tenue, et la rangée du dessus a bien perdu son chevron.

L'énoncé d'origine est conservé ci-dessous — il dit pourquoi ces trous existaient :

1. **Un incident sans détenteur n'a pas d'en-tête.** La feuille de 04.3 nomme l'objet **et son
   détenteur** (« LPT-HQ-01 · Ordinateur portable · chez Alice »). Or §3.2 fait entrer dans cette
   même feuille l'écart « il est abîmé », dont l'incident est ouvert **au nom de personne**.
   La feuille a donc un point d'entrée qu'elle ne sait pas afficher. À trancher : l'en-tête
   devient-il *« remis par Clara Admin, jamais réceptionné »* dans ce cas — c'est-à-dire une
   **provenance** au lieu d'un détenteur ?
2. **Personne ne peut changer son propre code PIN.** « Mon compte » (07.1) porte le code PIN en
   **rangée de référence** (« Code PIN défini · jamais lisible »), pas en acte ; le seul chemin qui
   définit un code est 06.2, atteint après une **réinitialisation par un administrateur** ou à la
   première remise. Le libellé du menu de l'avatar, lui, annonce « Mot de passe, **code PIN**,
   sessions ». Deux issues, et c'est une décision de produit, pas de dessin : soit « Mon compte »
   gagne un acte « Remplacer mon code PIN » qui réutilise l'écran de 06.2, soit le code PIN sort
   du sous-titre du menu. **Ne rien faire est le seul choix exclu** : aujourd'hui le menu promet
   une porte qui n'existe pas.


### 5.6 · Les trois objets sous le seuil — **tous clos le 05/08**

Le repointage `--st-*` fait, les **vingt pastilles des treize planches en main** ont été mesurées
au rendu, fond recomposé. Trois restaient sous 3:1.

> **Relevé du 05/08, après calcul : deux des trois ne demandaient aucune valeur neuve.**
> Le point 1 se règle avec un jeton **qui existe déjà** ; le point 3 **n'est pas un défaut**, et le
> corriger casserait ce qu'il prétend protéger. Seul le point 2 reste à trancher, et il ne bloque
> plus rien.

**Point 1 — clos.** `.st-m` employait `--ink3` `#8A847A`, **l'encre d'une surface claire**, sur une
surface sombre. C'est exactement la faute de §2.10 bis — *une famille par surface* — appliquée au
**neutre**, qui n'avait pas de famille et que personne n'avait donc pensé à ranger. Le neutre de la
surface sombre existe depuis le 01/08 : c'est **`--on-dark-2` `#A9C0C4`** (§2.10). Repointé en 06.3,
mesuré au rendu : **2,34 → 4,56:1**. Aucun jeton créé.

| Fond recomposé | `--ink3` (avant) | `--on-dark-2` (après) |
| --- | --- | --- |
| `#4E4B47` — `.hero.off` actuel | ✗ 2,34 | **4,56:1** |
| `#223034` — si `.hero.off` devenait `--dark` | 3,67 | 7,15:1 |
| `#4A5558` — si `.hero.off` devenait `--dark` voilé à .18 | ✗ 2,07 | 4,02:1 |

**Le choix du neutre est donc indépendant du point 2** : `--on-dark-2` passe sur les trois fonds
envisageables. C'est ce qui permet de fermer l'accessibilité sans attendre l'arbitrage du noir.

**Point 3 — clos, et ce n'était pas un défaut.** Le cran **vide** de la jauge de force fait 1,24:1
contre la carte, mais **3,04:1 contre le cran plein** — et c'est ce couple-là que 1.4.11 protège sur
une jauge : ce qui doit se percevoir, c'est *combien de crans sont remplis*. Mesuré, la correction
« évidente » se retourne : passer le cran vide à `--line-strong` lui donnerait 3,55:1 contre la
carte et **1,06:1 contre le cran plein** — la jauge deviendrait illisible. **Le seuil se mesure sur
la paire qui porte l'information, pas sur chaque élément contre son fond.** Inscrit comme exception
déclarée (§2.30) plutôt que laissé en dette.

**Point 2 — clos.** `.hero.off` est **recomposé sur `--dark`** : `--dark` sous un voile blanc à
`.14`, l'alpha que la famille emploie déjà pour `--dark-line`. Aucun noir de plus, aucun alpha de
plus. Le navigateur compose **#2C393C**, à une unité du calcul.

**Et l'état se lit exactement comme avant** — c'est ce qui rendait le choix non évident :

| | `#3A3733` (avant) | `--dark` + voile `.14` |
| --- | --- | --- |
| pastille `.st-m` | 4,56 | **4,60:1** |
| titre `.hn` | 11,84 | **11,95:1** |
| mention `.hs` | 6,21 | **6,27:1** |
| **écart avec le héro vivant** | 1,52 | **1,50:1** |

> **Pourquoi pas `--dark-2`, qui existait déjà.** C'était la réponse attendue après le point 1 —
> un jeton du registre plutôt qu'une valeur neuve — et elle est mauvaise ici. `--dark-2` `#1B3238`
> passe tous les seuils, mais il ramène l'écart avec le héro vivant à **1,33** : l'état « éteint »
> se verrait **moins** qu'aujourd'hui. Le rôle de `--dark-2` est par ailleurs *la surface posée sur
> le noir* (§2.10), pas une variante du noir. **Un jeton qui passe les seuils n'est pas pour autant
> le bon jeton** : ici la mesure qui décide n'est pas un contraste de lisibilité, c'est l'écart qui
> porte le **sens de l'état**.

| # | Ce qui est mesuré | Où | Ce qu'il faut décider |
| --- | --- | --- | --- |
| 1 | ~~**`.st-m` — 2,34:1**~~ | 06.3 | **Clos le 05/08 — `--on-dark-2`, 4,56:1.** Le neutre a bien deux valeurs, une par surface : `--ink3` sur clair (3,40:1 sur `.badge.off` en 07.1) et **`--on-dark-2` sur sombre**. Les deux existaient déjà ; seul le rangement manquait. |
| 2 | ~~**`#3A3733` — un troisième noir**~~ | 06.3 | **Clos le 05/08 — recomposé sur `--dark`**, voile blanc `.14` (l'alpha de `--dark-line`). Composite mesuré **#2C393C** ; les quatre mesures de l'état bougent de moins de 0,05. La famille du noir inversé redevient **unique**. |
| 3 | ~~**`.meter i` — 1,24:1**~~ | 02.2 · 07.1 | **Clos le 05/08 — ce n'est pas un défaut.** Le couple qui porte l'information est *plein vs vide* : **3,04:1**, conforme. « Corriger » le cran vide à `--line-strong` le mettrait à 3,55:1 contre la carte et **1,06:1 contre le cran plein** — la jauge cesserait d'être lisible. **Exception déclarée (§2.30).** |

> **Pourquoi ces trois-là ont échappé au relevé du 04/08.** Aucun des trois n'emploie `--live-*` :
> deux sont des **gris**, le troisième est `--line`. Une recherche sur le nom d'un jeton ne les rend
> pas, et un relevé des `:root` pas davantage — ils n'apparaissent qu'à la **mesure de la couleur
> rendue**, objet par objet. C'est l'emploi n°12 étendu d'un cran : *le relevé se fait sur la
> planche rendue*, ici sur sa **couleur** et non sur sa structure.


### 5.7 · Catégories du catalogue — **tranché le 05/08, et la réponse A corrigée le même jour**

Le fichier des arbitrages du 02/08 avait ses six points appliqués le 05/08 ; **son §4 n'était pas
un point à appliquer mais le chantier d'après**, et il est recopié ici pour ne pas dépendre d'un
fichier qui a vocation à disparaître.

**Catégories du catalogue — dette lexique n°2.** Les catégories sont **en anglais dans la donnée**
(*Laptop, Monitor, Mouse, Headphones*) et **en français dans les planches**. Un arbitrage partiel
existe (26/07, `LEXIQUE.md`) : *on suit la donnée quand on la cite, le français quand on nomme un
type* — il n'a jamais été appliqué côté produit.

**L'ordre imposé a été tenu** : options présentées en détail le 05/08 (`DECISION-CATALOGUE-05-08.md`,
confrontées à la donnée réelle du produit), arbitrage rendu, **puis** dessin. Le commanditaire a
délégué les deux décisions et **ajouté un fait qui en change une** : *« dans les paramètres il y aura
l'option choix de langue »*.

| | Décision | Ce qui la fixe |
| --- | --- | --- |
| **A** | **A2 — deux niveaux, famille → type.** Quatre familles coiffent les huit types ; le filtre porte les **familles**, les types apparaissent une fois une famille prise. A3 reste écartée comme structure, et recyclée en **attribut** `assignable` sur `Category` — pour retirer serveurs, imprimantes et mobilier du sélecteur d'attribution, pas pour filtrer. **Dessiné en 09.1 et implémenté dans le produit le 05/08.** | **Mesuré sur la feuille rendue à 393 px** : l'axe à plat fait **9 pastilles sur 3 rangées** (783 px pour 393 px utiles), l'axe de familles **5 pastilles sur 2 rangées** (594 px). Ce que A2 borne n'est pas la hauteur d'aujourd'hui mais la **croissance** : quatre familles restent quatre à quinze types. `Category` portant `defaultDepreciation`, la famille ne porte **aucune** valeur — c'est un axe de lecture, pas un objet de gestion, et c'est ce qui la rend peu coûteuse. |
| **B** | **La clé reste `Laptop` — un identifiant, pas un mot.** Le libellé vit sur `Category`, **en table par langue**, pas en champ unique. Les trois autres sources disparaissent. | `Equipment.type` est la **clé de jointure par le nom affiché** (`types/index.ts:174`) *et* une clé de logique métier (`['Laptop','Server','Printer'].includes(type)`). La migrer ne casserait rien à la compilation — elle rendrait les tests **faux en silence**. |

> **Ce que le choix de langue ajoute, et pourquoi B a bougé.** Un champ `label` unique en français
> était la réponse tant que le produit était monolingue. Avec un sélecteur de langue aux Paramètres
> — déjà dessiné en **07.1**, rangée « Affichage — français » — un libellé unique est une impasse :
> il faudrait le retraduire quelque part, c'est-à-dire recréer la quatrième table qu'on supprime.
> **Le libellé devient donc une table par langue portée par la catégorie.** Et il ne peut pas vivre
> dans un dictionnaire de code : **les catégories sont créées par l'utilisateur** (écran « Ajouter
> une catégorie »), et une catégorie créée demain n'aurait aucune traduction. La langue de la donnée
> saisie est une question de produit, ouverte : voir §5.8.

**Corollaire pour le lexique.** `LEXIQUE.md` fixe un mot par acte **en français**. Le jour où une
seconde langue existe, il devient la **locale `fr`** d'un lexique à deux colonnes, et la règle
« un acte, un mot » se lit par langue. Rien à faire aujourd'hui ; à ne pas découvrir au moment de
brancher le sélecteur.


### 5.8 · Ouvert par l'arbitrage du 05/08 — ce que le choix de langue laisse en suspens

Ni le dessin ni le registre ne peuvent trancher ces trois-là. Ils sont nommés pour ne pas être
découverts au moment de brancher le sélecteur de langue.

| # | La question | Pourquoi elle n'est pas dans les planches |
| --- | --- | --- |
| 1 | **Quelles langues, et laquelle fait foi ?** La table de libellés de `Category` a autant de colonnes que de langues, et il faut une **langue de repli** quand une traduction manque. | C'est un choix de produit et d'exploitation, pas de maquette. |
| 2 | **La donnée saisie se traduit-elle ?** Un nom de site (« Bureau Paris »), une note de gestionnaire, un motif de sortie : ils sont saisis dans **une** langue et lus dans une autre. Le libellé de catégorie est un cas particulier — c'est une **nomenclature fermée**, donc traduisible ; le reste ne l'est pas. | La frontière entre *nomenclature* et *donnée libre* décide de la moitié du travail d'internationalisation. |
| 3 | **Les statuts sont-ils une nomenclature ou du texte ?** `Equipment.status` porte aujourd'hui des valeurs **françaises** — `'Disponible'`, `'Attribué'`, `'En réparation'` — dans un type TypeScript. C'est **le symétrique exact** du problème des catégories, sur le champ le plus lu du produit, et il n'a jamais été relevé. | Même mécanisme : une valeur affichable employée comme clé. Il faudra le trancher avec le sélecteur, ou vivre avec un produit dont les statuts restent français en toutes langues. |


### 2.36 · Trois rôles du catalogue — déclarés par 09.1, inscrits le 05/08

Une planche ne crée pas de rôle : elle en propose un, et il s'inscrit ici ou il n'existe pas
(« Comment il s'emploie », point 2). Les trois que 09.1 a nommés sont repris **au caractère**.

| Rôle | Ce qu'il fait | Déclaration canonique |
| --- | --- | --- |
| **`.fh`** — en-tête de famille | **Coiffe** une carte sans être dedans. Un nom de famille posé *dans* la carte se lirait comme une rangée de plus ; posé au-dessus, il groupe. | `.fh{display:flex;align-items:baseline;justify-content:space-between;gap:12px;font-size:13px;font-weight:500;color:var(--ink);padding:0 2px 8px}` · `.fh span{font-weight:400;font-size:12px;color:var(--ink2);font-variant-numeric:tabular-nums}` |
| **`.aid.todo`** — la clé non relevée | **Variante** de la clé `.aid`, pas un rôle de plus : la forme dit que la valeur n'est pas connue au lieu de l'inventer. | `.l2 .aid.todo{letter-spacing:0;border-bottom:1px dotted var(--ink3)}` |
| **`.lrow.mute`** — le type inutilisable | Une rangée dont l'objet **ne peut pas servir** — un type sans modèle. Elle éteint le nom, elle ne l'alerte pas : un référentiel incomplet n'est pas une panne. | `.lrow.mute .l1 .c{color:var(--ink2)}` |

> **Ce que `.aid.todo` ajoute au registre au-delà du catalogue.** C'est la première forme du
> projet qui dit *« cette valeur n'est pas connue »* au lieu d'afficher un vide ou une valeur
> plausible. La même question se posera partout où une donnée peut manquer sans être fausse —
> et §5.3 vient d'en traiter un cas voisin avec « Aucun détenteur — objet non attribué ».
> **Deux formes pour une même idée : la mention explicite en toutes lettres quand la place le
> permet, la variante typographique quand elle ne le permet pas.**


### 2.37 · La bande sous la barre du haut — **12 px, symétrique**

Le rôle : une bande de chrome **attachée à la barre du haut**, qui porte la recherche et les
pastilles (`.seek`) ou le contexte d'un geste (`.ctx`). Elle n'est pas la page — elle appartient à
l'en-tête, et c'est pour cela qu'elle partage sa surface et son filet.

**Elle prend 12 px en haut comme en bas.** Sans marge en tête, le filet de la barre et la bordure
du premier contrôle se retrouvent **à 1 px l'un de l'autre** : deux traits parallèles que rien ne
sépare, et un champ qui semble sortir de la barre au lieu de vivre sous elle.

| Déclaration canonique | |
| --- | --- |
| `.seek` | `.seek{background:var(--surface);border-bottom:1px solid var(--line);padding:12px 20px;display:flex;flex-direction:column;gap:10px}` |
| `.ctx` | `.ctx{padding:12px 20px;background:var(--surface);border-bottom:1px solid var(--line);font-size:12px;color:var(--ink2)}` |

**Pourquoi 12 et pas 16.** 16 px est l'inset de `.page` (§2.16, `--pad`) : c'est la respiration
d'une **page**, entre le chrome et le contenu. La bande, elle, est *dans* le chrome ; elle se règle
sur elle-même, et 12 px est la valeur que ses trois planches portaient déjà en bas. **On rend la
valeur symétrique plutôt que d'en introduire une quatrième.**

> **Ce que ce défaut dit des contrôles.** Il a été **signalé de vive voix**, pas trouvé par un
> balayage — et aucun des neuf contrôles ne pouvait le voir. Le septième compare la déclaration
> d'un rôle **entre planches**, texte contre texte : les trois étaient identiques au caractère,
> donc conformes. **Trois planches qui portent la même valeur fausse forment un consensus, pas une
> conformité.** Un contrôle d'identité vérifie qu'on ne diverge pas ; il ne juge jamais la valeur
> sur laquelle on s'accorde. C'est la limite structurelle de tout ce dispositif, et elle mérite
> d'être écrite ici plutôt que redécouverte.


> **Ce qui protège un mort — critère inscrit le 05/08.** §5.4 relève des règles « ne visant plus
> rien » sans dire lesquelles se déposent, et le contrôle du 04/08 en laissait cinq « protégées »
> sans énoncer pourquoi. Le critère est celui-ci, et il est le même que pour les jetons de §2.10 :
>
> - **Un membre non consommé d'une famille déclarée se garde.** `.st-b` en 03.2, `.st-a` et `.st-o`
>   en 06.3 sont des pastilles de statut qu'une planche donnée ne montre pas toutes. Les déposer
>   ferait diverger la famille d'une planche à l'autre — c'est-à-dire créerait la faute qu'on
>   corrige. **Ce n'est pas un mort, c'est la famille.**
> - **Un orphelin hérité d'une planche voisine se dépose.** `.ok` en 06.2 n'appartenait à aucune
>   famille : quinze éléments la portaient, **aucune de ses déclarations ne rendait**, et elle
>   transportait un `--live-*` sur carte blanche qui n'attendait qu'une baisse de spécificité.
>
> **Et la mesure qui départage n'est ni la présence ni la couleur rendue.** Un contrôle de
> présence disait `.ok` vivante — quinze porteurs. Un balayage de couleur ne la voyait pas — elle
> ne peint rien. Il a fallu **déposer la règle et comparer les deux rendus** : la seule différence
> était un `gap` sans effet. *Pour savoir si une déclaration sert, on l'enlève et on regarde.*

### 2.38 · Le champ de saisie longue — **variante déclarée de `.field`**

Proposé par 06.4, inscrit le 05/08. Le projet n'avait **aucun champ à plusieurs lignes** : les
formulaires livrés ne demandent que des valeurs courtes — un nom, une date, un montant, un code.
« Pourquoi maintenant » est la première saisie du produit qui attend une **phrase**, et une phrase
ne s'écrit pas dans un contrôle de 48 px.

**Ce n'est pas un rôle neuf**, et c'est pourquoi il ne porte pas de nom neuf : c'est le même champ,
avec les trois propriétés que le passage à plusieurs lignes impose. La bordure, le rayon, la
gouttière et l'encre ne bougent pas.

| Déclaration canonique | |
| --- | --- |
| `.field.long` | `.field.long{align-items:flex-start;min-height:96px;padding:12px;line-height:21px}` |

**Pourquoi 96 px.** Deux lignes de saisie et leur respiration : au-dessous, le champ suggère un mot ;
au-dessus, il réclame un paragraphe que personne n'écrira. `align-items:flex-start` parce que le
texte part du haut — le champ court centre son contenu parce qu'il n'en a qu'une ligne. Et
`padding:12px` symétrique, là où le champ court n'a qu'un padding horizontal : sa hauteur, à lui,
vient de `--btnh`.


### 2.39 · Les quatre états transverses — proposés par 12.1, inscrits le 06/08

Le relevé du 05/08 comptait **zéro chargement et zéro perte de réseau sur vingt-deux planches**.
Ce n'était pas une divergence : c'était un trou, et un trou se comble une fois pour tout le monde,
sinon chaque écran l'invente à sa façon.

| Règle | Ce qu'elle dit |
| --- | --- |
| **Rien avant 300 ms** | En dessous, l'apparition de quoi que ce soit est un **clignotement** qui coûte plus qu'il n'informe. Au-delà : un **squelette**, jamais un tourniquet — la personne voit *ce qui vient*, et l'écran ne saute pas à l'arrivée de la donnée puisque la place est tenue. Le seuil est une **convention proposée**, à vérifier sur un vrai réseau. |
| **Un acte en cours occupe le bouton qui l'a lancé** | Il n'ouvre pas d'écran et ne pose pas de voile : même place, même taille, verbe au présent, et il cesse d'être frappable. C'est l'**inverse d'une action masquée** (interdit n°8) : celle-là est impossible, celle-ci est en train de se faire. |
| **Une erreur vit là où le geste a été engagé** | La feuille **reste ouverte**, la saisie **reste écrite**, la ligne d'erreur se pose **au-dessus du pied** en `.hint.bad`, et le geste primaire devient **« Réessayer »**. Un message qui passe pour dire qu'un acte a échoué est pire que pas de message : il laisse croire au succès. |
| **Hors ligne : on lit, on n'écrit pas** | Le bandeau `.ctx` (§2.37) le dit **une fois**, sous la barre du haut ; les gestes d'écriture **disparaissent** au lieu de s'afficher barrés. Ce qui est chargé reste lisible. **Proposition** : ce que « écrire » veut dire sans réseau reste à trancher côté code. |

**Deux rôles neufs, et aucune valeur neuve.**

| Rôle | Déclaration canonique |
| --- | --- |
| **`.sk`** — bloc de squelette | `.sk{display:block;background:var(--inset);border-radius:4px}` · `.sk-v{width:40px;height:40px;flex:0 0 40px;border-radius:6px;background:var(--inset)}` · `.sk-l{height:15px}` · `.sk-s{height:12px;margin-top:6px}` |
| **`.btn.busy`** — geste en cours | `.btn.busy{background:var(--inset);color:var(--ink2)}` |

Le squelette reprend la **métrique de la vignette** (§2.2 : 40, rayon 6) et les deux rangs
typographiques qu'il remplace (15 et 12). Il emploie `--inset` — la surface d'information —
**comme une absence** : un état qui réclamerait une couleur inédite serait un état de trop.

**Introuvable et accès refusé n'ont pas de forme propre** : ils empruntent l'**état vide** de 03.3
(`.vide` · `.vmot` · `.vt` · `.vs`), le seul écran du produit qui ait droit à une image.


### 2.40 · Les sept arbitrages du 06/08 — un nom, un rôle, appliqué

Les quatre questions ouvertes par l'audit du 05/08, plus trois trouvées en les instruisant. Toutes
tranchées et appliquées le même jour ; aucune n'a demandé de valeur neuve.

| # | Question | Tranché | Appliqué |
| --- | --- | --- | --- |
| 1 | `.hact` employée sur carte claire | **`.cact`**, et son attache devient une **variante déclarée** : `.cact.tied{margin-top:12px;padding-top:12px;border-top:1px solid var(--line)}`. Le `.cact` nu (02.2) reste sans filet | 09.1 · 09.2 · 09.3, 5 emplois |
| 2 | `.ch` porte plusieurs lectures | **`.ch` = en-tête de carte** (8 planches). Le **micro-libellé** rejoint `.lab` — il n'avait pas deux noms mais **trois** (`.lab`, `.sh`, `.conseq .ch`) pour un dessin identique au caractère. Le **chevron** rejoint `.chev` | 5 planches (15 emplois) + 4 planches (8 chevrons) |
| 3 | `.arow` — deux mécaniques de filet | **`.arow+.arow`** : il ne dépend pas de l'ordre des balises, là où `:first-of-type` se trompe dès qu'un `.ch` précède la première rangée. *Recommandation révisée après mesure : j'avais proposé le filet sur l'élément.* | 05.2 · 07.1 |
| 4 | Le titre d'une rangée de réglage | **rang 3, 14 px** (§2.6) — c'est un titre de rangée, pas un corps de texte | 05.2 · 07.1 |
| 5 | `.ico` (registre) contre `.lth` (planches) | **`.lth`** : `.ico` ne visait **aucun élément** d'aucune planche. §2.21 corrigée | registre |
| 6 | `i-return` porte deux dessins | **deux actes, deux noms**, comme au lexique : `i-return` reste la flèche de **restitution** (04.2), le cadre où l'objet rentre devient **`i-receive`** — la **réception** (04.4) | 04.4 |
| 7 | Cartes numérotées 09.1/09.2/09.3 dans des sections 09/10/11 | **la carte prend le numéro de sa section** : `10.1 Emplacements`, `11.1 Rôles et permissions` | volet + manifeste |

**Mesuré après application** : DOM identique et hauteur de page inchangée sur les onze planches
touchées ; seul le rang typographique de `.arow` bouge, et c'est le but. Les divergences de
déclaration passent de **22 à 20**, les jetons restent à **0**.

### 2.41 · Les deux interdits du brief que les planches ne tenaient pas — tranchés le 06/08

Ils ne se tranchent pas dans une planche (§« Comment il s'emploie »), et ils touchent l'ADN :
**ce qui suit est la lecture retenue, à confirmer contre `DESIGN_BRIEF.md` avant d'amender le brief.**

**Les capitales.** L'interdit visait des **badges de rôle en majuscules peintes** et des titres qui
crient — c'est ce que le relevé du 30/07 corrigeait. Un **micro-libellé** de 11 px, interlettré à
`.06em`, en `--ink3`, n'est pas de cette famille : il ne crie pas, il **classe**. Retenu : les
capitales sont admises **pour ce seul rôle** — `.lab` et sa variante de feuille `.sh` — et
**interdites partout ailleurs**, y compris sur un badge, un titre, un statut ou un nom d'écran.

**Les cibles tactiles.** La règle des 48 px porte sur la **zone de frappe**, jamais sur la boîte
visible : un filtre de 40 px dans une rangée de 56 n'est pas une petite cible, c'est un petit
dessin. Le dépôt porte déjà l'idiome qui le dit — un pseudo-élément `::before` de 48 px minimum
sous `@media (pointer:coarse)`, livré au lot mobile n°2 et mesuré à la sonde CDP. Retenu : les
pastilles restent à **40**, les tris à **44**, et **la zone de frappe est portée à 48 au portage**.
Ce qui reste interdit : une cible dont ni la boîte ni la zone n'atteint 48.


### 2.42 · Les vingt-huit rôles que le registre employait sans les déclarer

Le balayage du 05/08 a compté **89 composants partagés par au moins trois planches**, dont
**28 sans aucune règle ici**. Ils n'étaient pas des accidents : `.warn` sert dans quatorze
planches, `.lab` dans treize. Ils étaient simplement **tenus par l'usage**, ce qui suffit tant
qu'on dessine et ne suffit plus dès qu'on porte : un portage ne lit pas les planches, il lit
le registre.

**La déclaration est celle qui a été mesurée**, pas une valeur choisie après coup : pour chaque
rôle, le texte majoritaire des planches qui l'emploient. La colonne « accord » dit sur combien
de planches ce texte est déjà unanime.

| Rôle | Ce qu'il est | Déclaration canonique | Accord |
| --- | --- | --- | --- |
| `.warn` | **Encart d'information** — un fait qui change la décision, sur la surface d'information. Jamais un avertissement décoratif : trois lignes d'encart coûtent plus qu'elles n'apportent (§3c d'`AUDIT-UI`). | `.warn{display:flex;gap:10px;padding:11px 12px;background:var(--inset);border-radius:4px;font-size:12px;line-height:17px;color:#4A453E}` | 14/14 |
| `.lab` | **Micro-libellé** — le sur-titre d'un champ ou d'un bloc. Seul emploi des capitales admis (§2.41). | `.lab{font-size:11px;font-weight:500;letter-spacing:.06em;text-transform:uppercase;color:var(--ink3);margin-bottom:5px}` | 12/13 · **1 planche(s) à aligner** : login |
| `.btn-full` | **Geste pleine largeur** — la seule propriété de mise en page tolérée sur un bouton, par exception à §2.29 : elle ne distribue pas, elle occupe. | `.btn-full{width:100%}` | 10/10 |
| `.tid` | **Identité de la barre du haut** — ce qui distingue cet écran des autres du même type ; porte `.code` et `.aid`. | `.tid{flex:1;min-width:0;padding:0 4px}` | 10/10 |
| `.note` | **Note de bloc** — le commentaire d'une carte ou d'une feuille sur elle-même, sous le contenu. | `.note{font-size:12px;line-height:17px;color:var(--ink2);margin-top:7px;padding:0 2px}` | 6/9 · **3 planche(s) à aligner** : equipement-3-creation, equipement-4-incident-suite, login |
| `.abs` | **Zone de preuve** — l'aire où l'on signe ou dépose une empreinte (§2.20) ; bordure tiretée, elle attend un geste. | `.abs{margin-top:12px;padding:12px 14px;background:var(--inset-2);border:1px dashed #C9C4BA;border-radius:6px}` | 8/8 |
| `.ovl` | **Racine d'un `details` de superposition** — neutralise le positionnement pour que la feuille se pose sur le téléphone, pas sur elle. | `.ovl{position:static}` | 8/8 |
| `.opt` | **Rangée d'une feuille de choix** — un chemin, sans engagement ; c'est la rangée qu'on tape pour continuer. | `.opt{display:flex;align-items:center;gap:12px;min-height:56px;padding:8px 12px;border:1px solid var(--line);border-radius:4px}` | 7/7 |
| `.bdim` | **Écran d'arrière-plan d'une planche** — le contenu estompé sous une feuille montante. Chrome de planche, jamais du produit. | `.bdim{padding:16px 20px;opacity:.3;display:flex;flex-direction:column;gap:10px}` | 6/6 |
| `.bline` | **Barre d'arrière-plan estompée** — le trait qui figure une ligne de texte sous le voile. Chrome de planche. | `.bline{height:12px;border-radius:2px;background:var(--ink3)}` | 6/6 |
| `.cnt` | **Ligne de décompte** — ce que la liste compte, au-dessus d'elle, avec son tri à droite. | `.cnt{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:44px;font-size:13px;color:var(--ink2)}` | 6/6 |
| `.sort` | **Bouton de tri** — 44 px, texte 13 px : c'est un bouton de réglage, pas un geste (§2.14). | `.sort{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 8px;margin-right:-8px;border:0;background:none;font-family:inherit;font-size:13px;font-weight:500;color:var(--ink);cursor:pointer;border-radius:4px}` | 6/6 |
| `.at2` | **Texte d'une rangée de réglage** — titre au rang 3 et sa sous-ligne. | `.at2{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}` | 3/5 · **2 planche(s) à aligner** : mon-compte, utilisateur-2-detail |
| `.fab` | **Bouton flottant** — le geste d'ajout d'une liste, 56 px, rayon 8, posé à 76 px du bas pour dégager la barre. | `.fab{position:absolute;right:20px;bottom:76px;width:56px;height:56px;border-radius:8px;border:0;background:var(--btn-y-bg);color:var(--btn-y-fg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(10,25,29,.22);cursor:pointer}` | 5/5 |
| `.ftt` | **Texte d'un choix fait** — dans `.pick` : ce qu'on a retenu, et rien d'autre. | `.ftt{flex:1;min-width:0}` | 5/5 |
| `.lth` | **Vignette de rangée à glyphe** — 40 × 40, rayon 6 : la métrique de §2.2, avec un dessin au lieu d'initiales. | `.lth{width:40px;height:40px;flex:0 0 40px;border-radius:6px;overflow:hidden;background:var(--inset);display:flex;align-items:center;justify-content:center;color:var(--ink3)}` | 4/5 · **1 planche(s) à aligner** : emplacements-1-referentiel |
| `.pico` | **Porte-icône d'un rappel** — dans `.prefill` : 40 px sur `--inset-2`, parce qu'il se pose sur `--inset`. | `.pico{width:40px;height:40px;flex:0 0 40px;border-radius:6px;background:var(--inset-2);display:flex;align-items:center;justify-content:center;color:var(--ink2)}` | 5/5 |
| `.prefill` | **Rappel de ce qui est déjà là** — un fait pré-rempli ou déjà en cours, avec son lien. Il informe, il ne bloque pas. | `.prefill{display:flex;align-items:center;gap:12px;padding:11px 12px;background:var(--inset);border-radius:4px}` | 5/5 |
| `.swap` | **Le moyen de changer un choix** — le mot à droite de `.pick`. Ce n'est pas un bouton : la rangée entière ouvre le choix. | `.swap{font-size:13px;font-weight:500;flex:0 0 auto;padding:0 4px}` | 5/5 |
| `.scale` | **Empilement d'échantillons** — la colonne qui présente une gamme dans une planche. Chrome de planche. | `.scale{display:flex;flex-direction:column;gap:8px}` | 4/4 |
| `.fixed` | **Rangée d'un élément non modifiable** — ce que l'écran pose et que la saisie ne demande pas. | `.fixed{display:flex;align-items:center;gap:12px;padding:8px 0}` | 3/3 |
| `.hi` | **En-tête d'identité d'un bloc** — la ligne porteur + texte d'un héro ou d'une carte de tête. | `.hi{display:flex;align-items:center;gap:14px}` | 3/3 |
| `.ht` | **Texte d'un en-tête d'identité** — l'enfant souple de `.hi`. | `.ht{flex:1;min-width:0}` | 3/3 |
| `.msep` | **Séparateur d'un menu de débordement** — 1 px, il groupe les entrées par conséquence. | `.msep{height:1px;background:var(--line);margin:4px 0}` | 3/3 |
| `.shot` | **Vignette de photo** — 56 px, l'emplacement d'un cliché dans une preuve ou un incident. | `.shot{width:56px;height:56px;flex:0 0 56px;border-radius:4px;background:var(--inset);color:var(--ink3);display:flex;align-items:center;justify-content:center}` | 3/3 |
| `.shots` | **Rangée de vignettes de photo** — l'aire où elles s'alignent. | `.shots{display:flex;gap:8px}` | 3/3 |
| `.tree` | **Bloc d'arbre de décision** — surface inversée, il montre un enchaînement plutôt qu'il ne le raconte. | `.tree{background:var(--dark);color:var(--on-dark);border-radius:8px;padding:20px 18px;display:flex;flex-direction:column;gap:0}` | 3/3 |
| `.tt` | **Texte d'une rangée d'objet** — l'enfant souple d'`.orow` et de ses voisines. | `.tt{flex:1;min-width:0}` | 3/3 |

**Ce que cette section ne fait pas.** Elle n'invente aucune valeur et ne tranche aucun nom :
elle écrit ce qui existe. Trois rôles restent à instruire, et ils demandent une décision, pas
un relevé :

- **`.note` a deux formes qui ne sont pas le même rôle** — la note sous une carte (six planches)
  et un **cadre à filet de 44 px** en 04.3 et 04.4, qui ressemble davantage à une valeur posée
  qu'à un commentaire. Nommer le second est un arbitrage.
- **`.lab` en 02.1** porte un `display:block` que les douze autres n'ont pas — c'est la planche
  validée jamais réalignée, déjà relevée au rapport du 05/08.
- **`.at2`** s'écrit en colonne explicite dans les trois planches du 05/08 et sans direction
  dans 05.2 et 07.1 : même rendu, deux écritures.


### 2.43 · Au-delà du téléphone — les trois régimes, écrits le 06/08

Vingt-trois planches, **toutes à 393 px**. Le produit, lui, porte **cinq points de rupture** et
bascule sa navigation deux fois. Le registre ne disait rien de ce qui arrive au-dessus du
téléphone, donc le portage tranchait seul : le relevé du 06/08 compte **trente grilles
`medium:grid-cols-2`** posées écran par écran et **sept largeurs maximales différentes**
(`max-w-md`, `2xl`, `lg`, `7xl`…). Dessiné en **13.1**.

**Trois régimes, pas cinq.** Il n'y a que trois façons de poser la navigation, donc trois
régimes. Les seuils sont ceux du produit — on s'y range plutôt que d'en inventer.

| Régime | Fenêtre | Navigation | Padding de page |
| --- | --- | --- | --- |
| **compact** | < 600 | barre du bas, 5 entrées | **16** |
| **medium** | 600 – 839 | **rail**, 88 px | **24** |
| **expanded** | ≥ 840 | **barre latérale**, 264 px | **24** |

`large` (1200) et `extra-large` (1600) **ne changent rien à la mise en page** : ils n'élargissent
que le vide autour du contenu, et c'est la largeur de lecture qui s'en charge.

**Une seule largeur de lecture — 960 px.** Une liste étirée sur 1600 px n'est pas plus lisible :
l'œil perd la ligne entre le nom et la valeur au bout de la rangée. Le contenu s'arrête à 960, le
reste est de la marge. **Exception déclarée** : un tableau que l'on vient *comparer* — un rapport,
un export à l'écran — prend toute la largeur ; ce n'est pas de la lecture, c'est du balayage.

**Le nombre de colonnes se déduit du contenu, jamais de l'écran.** Une carte passe à deux
colonnes quand **chaque colonne garde au moins 360 px** — la largeur sous laquelle une rangée
« étiquette · valeur » se casse en deux lignes. Conséquences : **medium reste à une colonne**
(768 moins le rail ne laisse pas la place), et la seule bascule à deux colonnes accordée est
celle d'une **fiche à partir de 1280 px**, sujet à gauche, **référence bornée** à droite. Ce qui
appelle un geste reste à gauche avec le sujet, sinon deux colonnes deviennent deux écrans.

**La feuille montante devient un dialogue au-dessus de 840 px.** Mêmes champs, même pied, même
ordre : c'est la même vue posée autrement (§1), pas une seconde. Une feuille qui monte du bas
suppose un pouce ; au clavier, elle traverse l'écran pour trois champs.

**Ce qui ne change JAMAIS avec la largeur** — et c'est la partie qu'un portage oublie :

> la hauteur d'une rangée (72 en liste, 56 en réglage) · la vignette (40, rayon 6) · le héro
> d'identité (52) · les cinq marches de l'échelle typographique · les quatre jetons de densité ·
> les rayons 2/4/8 · la hauteur d'un geste (48) · la place du jaune.
>
> **Un écran large ne mérite pas des rangées plus hautes : il mérite plus de rangées visibles.**

**Trois rôles neufs, déclarés par 13.1 :**

| Rôle | Déclaration canonique |
| --- | --- |
| **`.rail`** — navigation debout (medium) | `.rail{width:88px;flex:0 0 88px;background:var(--surface);border-right:1px solid var(--line);display:flex;flex-direction:column;align-items:center;padding:12px 0;gap:4px}` · `.rail>a{width:72px;min-height:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:11px;color:var(--ink2);text-decoration:none;border-radius:8px}` |
| **`.side`** — navigation en toutes lettres (expanded) | `.side{width:264px;flex:0 0 264px;background:var(--surface);border-right:1px solid var(--line);display:flex;flex-direction:column;padding:16px 12px;gap:2px}` · `.side>a{display:flex;align-items:center;gap:12px;min-height:48px;padding:0 12px;border-radius:8px;font-size:14px;color:var(--ink2);text-decoration:none}` |
| **`.dial`** — la feuille posée au centre | `.dial{width:440px;background:var(--surface);border-radius:8px;box-shadow:0 12px 40px rgba(10,25,29,.24);padding:0 0 12px;display:flex;flex-direction:column;text-align:left}` |

**Proposé, non relevé** : les 960 px de lecture, les 360 px de colonne minimale et le seuil de
840 px pour le dialogue sont des conventions de cette planche. Les seuils 600/840, le rail, la
barre latérale et le padding 16 → 24 viennent du produit.


### 2.44 · Où vit un réglage, et quand il s'applique — écrit le 06/08 (planche 14.1)

L'écran Paramètres portait **cinq sections de trois natures différentes** et **deux boutons
d'enregistrement** qui changeaient de nom selon l'onglet. Trois règles en sortent.

**1 · Un réglage appartient à quelqu'un, et l'écran le dit.** Trois propriétaires, jamais
mélangés dans une même carte :

| Propriétaire | Exemples | Où il vit |
| --- | --- | --- |
| **la personne** | son compte, sa connexion, son code PIN | **07.1**, atteint par un renvoi — jamais refait |
| **l'entreprise** | devise, année fiscale, amortissement par défaut | Paramètres, une vue par sujet |
| **l'informatique** | sources de collecte, agent, annuaire, scan | Paramètres, une vue par sujet |

**2 · Un réglage s'applique au geste.** Pas de bouton « Enregistrer » qui apparaît selon
l'endroit : un geste qui se renomme d'un onglet à l'autre apprend qu'un réglage posé ne compte
pas tant qu'on n'a pas trouvé le bouton. **Une seule exception, déclarée** : des champs qui
**valent ensemble ou pas du tout** — les identifiants d'une source, une clé et son URL — vont
en **feuille avec un pied**. À moitié saisis, ils cassent ce qu'ils règlent.

**3 · Un réglage qui change un calcul dit ce qu'il change, et sur quoi.** « Durée : 3 ans » ne
décide rien ; « ces trois réglages décident de la valeur de **14 actifs** » décide. Et il dit
aussi ce qu'il **ne** change pas : les objets déjà amortis gardent leur plan. Sans cette phrase,
personne n'ose toucher au réglage — ce qui est une autre façon de ne pas l'avoir.

> **Deux conséquences, tirées de règles qui existaient déjà.** Les cinq compteurs de machines
> détectées quittent Paramètres : *un compteur qui appelle une action n'est pas un compteur*
> (jurisprudence du tableau de bord) — c'est **du travail**, donc sa place est la file (03.3).
> Et la section « Affichage » tombe avec sa phrase *« le mode sombre sera proposé dans une
> prochaine version »* : le brief interdit d'annoncer ce qui n'existe pas, et l'identité est
> claire **par décision**, pas en attendant mieux.

---

## Deux points en attente d'arbitrage — relevés le 14/08

Notés ici parce qu'ils portent sur **la règle**, pas sur une planche : les trancher se fait une fois,
et s'applique ensuite au corpus entier.

### A · Les six légendes de 00.1 n'entrent dans aucun des trois préfixes

Contrôle mécanique du 14/08 sur les 35 planches : 35 cartes, 35 viewports présents, groupes homogènes.
**Sept légendes** ont été requalifiées (17.2 ×4, 09.1 ×2, 03.3 ×1) — la passe du 12/08 les avait
manquées parce qu'elle ne cherchait que les « Piste — ». **Six restent**, toutes dans **00.1 Direction
esthétique** : *1 · La palette*, *2 · L'échelle*, *3 · Les composants*, *4 · Le héro du sujet*,
*5 · Le système d'icônes*, *6 · La démonstration*.

Ce sont des **chapitres**, pas des états : leur imposer `État — ` serait faux, et `Relevé — ` est
défini comme *ce que le produit actuel porte, montré pour être écarté* — l'inverse de ce que 00.1 fait.

**Tranché le 14/08 : exemption du groupe `00. Références du système`**, écrite dans CLAUDE.md. Pas de
quatrième préfixe — un mot de plus à retenir pour six titres sur tout le corpus, et le jour où
quelqu'un hésite entre `Repère — ` et `Relevé — `, la règle coûte plus qu'elle ne rend. L'exemption
dit quelque chose de vrai et de court : **les trois préfixes décrivent des pages, et ces trois
planches n'en décrivent pas.**

Le contrôle mécanique ne rapporte donc plus de faux positif : **0 légende hors préfixe sur les 32
planches de page.**

### B · Le « Centre d'aide » porte quatre tuiles mortes

`SettingsPage.tsx` : *Documentation*, *Support*, *Tutoriels*, *FAQ* — quatre
`<Button variant="outlined">` **sans `onClick`**. Elles ont l'apparence exacte d'un geste et ne font
rien. Le Centre d'aide étant une **section de la page Paramètres**, cela ne fait pas une planche : c'est
un **état à dessiner dans 14.1**, ou quatre lignes à retirer.

**La question est de contenu avant d'être de dessin** : *y a-t-il une documentation utilisateur à
ouvrir ?* Tant que la réponse est inconnue, dessiner les tuiles serait dessiner une promesse qu'on ne
peut pas tenir. Voir `DECISION-DOCUMENTATION-14-08.md` §4.
