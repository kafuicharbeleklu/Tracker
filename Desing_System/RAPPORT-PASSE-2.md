# RAPPORT — PASSE 2 · 2026-08-01

Suite de `RAPPORT-AUDIT-2026-08-01.md`. Même format : ce qui a été corrigé, la cause, et les
points **nommés** plutôt que tranchés en silence.

L'ordre demandé était celui de `PASSATION.md` §14. Première observation, qui change le contenu
de cette passe : **trois des quatre étapes étaient déjà livrées.** Tâches est la planche 03.3,
Mon compte la 07.1, et la passe de densité a été faite le 01/08. Le travail restant n'était donc
pas de dessiner, mais de **vérifier que ce qui est livré tient**, et de trancher ce qui bloque la
seule planche encore à dessiner. C'est ce que fait ce rapport.

---

## 1 · Tâches — le bouton filtre : l'écart est fermé, deux défauts trouvés en le vérifiant

**Votre écart est corrigé, et il l'était sans avoir été nommé.** Les trois pages qui filtrent —
Tâches (03.3), liste équipements (04.1), annuaire (05.1) — portent **le même composant `.fbtn`**,
aux mêmes valeurs : 48 × 48, rayon 4, filet `--line-strong`, glyphe `i-filter` 20 px, survol
`--inset`, `aria-label="Filtrer"`. Il a été aligné par la normalisation du 31/07 sur les barres,
mais **aucun rapport ne l'a dit** — d'où votre doute, qui était légitime. Il est désormais écrit :
`REGLES-TRANSVERSES.md` §2.24.

Deux défauts sont apparus **parce que** je vérifiais au lieu de constater :

| # | Écart | Cause | Traitement |
| --- | --- | --- | --- |
| **1.1** | **Le badge de compte `.fbtn b` n'était pas déclaré dans l'annuaire** (05.1). Le composant y est identique, sa pastille de filtres actifs n'existe pas : le jour où un filtre y devient actif, le chiffre sort sans style, hors de la boîte. | Le badge n'est visible que dans un état — filtre actif — que la planche 05.1 ne montre pas. **Un composant se copie avec tous ses états, pas avec ceux qu'on dessine.** | **corrigé** — règle ajoutée, identique aux deux autres |
| **1.2** | **`.si.big .ic` tenait à 38 px, rayon 4** — une vignette de rangée hors canon (40 / rayon 6), dans les deux listes. | **Troisième survivante de la famille `--avs` / `--thw`** : une vignette dimensionnée dans une variante de rangée, donc invisible aux corrections portées sur `.av` et `.ico`. | **corrigé** — 40 / rayon 6 |

### 1.3 · Et un piège de méthode, laissé en place mais nommé

Deux écrans d'illustration de 03.3 — l'état « avant » et l'état vide, tous deux en `opacity` —
portent `<span class="fbtn">` au lieu de `<summary class="fbtn">`, parce qu'ils ne s'ouvrent pas.
**C'est légitime**, et c'est *exactement* la configuration qui a fait diverger la barre du bas
deux fois : un inventaire cherchant `<summary class="fbtn">` ne verrait pas ces deux-là. Règle
inscrite avec le composant : **un composant inerte garde la classe du composant vivant, et le
balayage se fait sur la classe, jamais sur la balise.**

### 1.4 · Une couleur de plus sans nom — `#EDEAE3`, sept planches

Trouvée en lisant le bandeau de filtres actifs de 03.3 : le gris du bandeau était **écrit en dur**,
et le même gris était écrit en dur dans **sept planches** — encart, note, étiquette de dette du
lexique. C'est le défaut de `#FEF3D6` à plus grande échelle. **Un gris employé sept fois n'est pas
une valeur locale, c'est un jeton qui n'avait pas de nom.**
→ **`--inset-2: #EDEAE3`** — la surface d'*information* posée sur une carte, un cran plus sombre
que `--inset` qui est le *creux* d'une carte. 21 occurrences remplacées. Registre §2.25.

---

## 2 · Déclarer un incident — la frontière, tranchée avant de dessiner

Votre question est la bonne, et la réponse était **déjà à moitié écrite dans la planche 06.3** sans
que personne l'ait lue comme telle : la troisième nature d'écart, « Il est abîmé », porte en
sous-titre *« Ouvre un incident, au nom de personne »*.

**Ce sont deux actes distincts, et le discriminant est un fait, pas une préférence :
l'objet est-il déjà à mon nom ?**

| | **Signaler un écart** (06.3) | **Déclarer un incident** (04.3) |
| --- | --- | --- |
| Quand | au moment d'attester — **on refuse d'attester** | à tout moment, sur un objet qu'on détient |
| État de l'objet | **En attente** — au nom de personne | **Attribué** — à mon nom |
| Effet | **suspend** la remise | ouvre une prise en charge sur **mon** objet |
| Première question | *ce qui ne va pas* — trois natures | *ce qu'on voit* — **la photo d'abord** |

S'il n'est pas à mon nom, je ne peux pas déclarer d'incident : je n'en réponds pas. S'il l'est, je
n'ai plus rien à refuser d'attester : c'est fait. **Aucune fusion**, donc — mais **une seule
feuille d'incident**, celle de 04.3 : l'écart « il est abîmé » y **renvoie**, il ne la redessine
pas. C'est la règle des vues de référence appliquée à un acte qui a deux origines, et c'est
précisément ce qui aurait produit le doublon suivant. Inscrit : `REGLES-TRANSVERSES.md` §3.2.

**Conséquence, et c'est un point ouvert, pas une correction** — voir §4.1 : la feuille de 04.3
nomme l'objet **et son détenteur**, et l'écart y entre sans détenteur.

---

## 3 · Mon compte — la planche couvre le parcours, à une porte près

Vérification de couverture de 07.1, colonne par colonne : **Mon compte** (trois sujets : *me
connecter* · *prouver une remise* · *où je suis connecté*) · **changer mon mot de passe** ·
**double authentification** en trois temps, codes de secours compris · **mes sessions** ·
**Paramètres** réduit à une ligne de renvoi.

**Rien ne manque côté dessin.** Ce qui manque est fonctionnel, et je ne peux pas le trancher seul :
**personne ne peut changer son propre code PIN** — voir §4.2.

---

## 4 · Points ouverts — nommés, pas tranchés

### 4.1 · Un incident sans détenteur n'a pas d'en-tête

La feuille de 04.3 s'ouvre sur *« LPT-HQ-01 · Ordinateur portable · chez Alice »*. L'écart
« il est abîmé » y entre avec un objet que **personne n'a jamais réceptionné**. La feuille a donc
un point d'entrée qu'elle ne sait pas afficher.
**À trancher :** dans ce cas, l'en-tête porte-t-il une **provenance** — *« remis par Clara Admin,
jamais réceptionné »* — au lieu d'un détenteur ? C'est ma proposition ; elle change une ligne de
la feuille, pas la feuille.

### 4.2 · Personne ne peut changer son propre code PIN

Les faits, tels que les planches les écrivent aujourd'hui :

- **07.1** porte le code PIN en **rangée de référence** — « Code PIN défini · jamais lisible » —
  pas en acte ;
- le seul écran qui **définit** un code est 06.2, atteint après une **réinitialisation par un
  administrateur**, ou à la première remise ;
- **05.4** dit la doctrine : *« le code ne se consulte pas, il se remplace »* ;
- et le sous-titre du menu de l'avatar annonce **« Mot de passe, code PIN, sessions »**.

**Le menu promet donc une porte qui n'existe pas.** Deux issues, et c'est une décision de produit :
soit « Mon compte » gagne un acte **« Remplacer mon code PIN »** qui réutilise l'écran de 06.2 —
mon avis, parce qu'un code de remise qu'on soupçonne connu doit pouvoir être remplacé sans passer
par l'informatique — soit **le code PIN sort du sous-titre du menu**. *Ne rien faire est le seul
choix exclu.*

### 4.3 · Première connexion — approche validée, reste à dessiner

Vous avez validé la reprise du bandeau de §2.22. La planche n'est pas dessinée ; elle enchaîne
*accepter l'invitation* → *définir son code PIN* (l'écran de 06.2, deuxième temps). Elle ne
re-choisit rien : bandeau de marque, champ, geste et étiquette sont tous au registre.

---

## 5 · Catégories du catalogue — options soumises à votre arbitrage

**L'état réel, mesuré dans les planches.** Huit types en français : *Ordinateur portable ·
Moniteur · Serveur · Clavier · Souris · Casque · Imprimante · Mobilier*. La donnée, elle, est en
anglais (*Laptop, Monitor, Mouse, Headphones*).

**Et un fait que la mesure a sorti, qui compte pour votre décision :** le préfixe du code d'actif
n'est **pas** la catégorie. `LPT-HQ-01` **et** `MBP-SALES-01` sont tous deux des « Ordinateur
portable ». Le préfixe dit la **famille de modèle**, la catégorie dit le **type**. Ce sont deux
axes, et les confondre est la première façon de rater cette structure.

### Deux questions indépendantes — à trancher séparément

**Question A — la structure.**

| Option | Structure | Ce que ça donne au filtre | Ce que ça coûte |
| --- | --- | --- | --- |
| **A1 — plat, tel quel** | 8 types, un niveau | 9 pastilles, **deux rangées** qui débordent | « Mobilier » se présente comme comparable à « Souris ». Ne tient plus à 15 types |
| **A2 — deux niveaux : famille → type** | 4–5 familles (*Informatique · Périphériques · Impression et réseau · Mobilier*), le type dessous | **une rangée** de familles, les types à la demande | un niveau de plus à maintenir dans la donnée |
| **A3 — un niveau, mais celui qui décide du geste** | *Attribuable à une personne* (portable, écran, casque, clavier, souris) · *Partagé ou immobile* (serveur, imprimante, mobilier) | 2 pastilles, et le **type reste un attribut**, pas un filtre | rompt avec la façon dont l'inventaire est pensé aujourd'hui |

**Mon avis : A2**, et pour une raison qui n'est pas esthétique. **A3 est la plus juste
conceptuellement** — on n'*attribue* pas un serveur, et l'application entière est construite sur
l'attribution — mais elle déplace une notion produit, ce qui n'est pas un arbitrage de maquette.
**A2 règle le problème visible** (les pastilles débordent, et elles déborderont plus) sans rien
déplacer. Et si A3 devait être retenue un jour, elle se pose **par-dessus** A2 comme un attribut
de famille, sans refaire le travail.

**Question B — la langue.** Elle est indépendante de A.

| Option | Principe | Conséquence |
| --- | --- | --- |
| **B1 — clé anglaise, libellé français** | la donnée garde `Laptop` comme **clé**, un champ `label_fr` porte « Ordinateur portable » | rien à migrer, l'interface n'invente plus de traduction, un seul endroit à corriger |
| **B2 — migrer la donnée en français** | `Laptop` → `Ordinateur portable` dans la base | migration + tout intégrateur tiers casse |
| **B3 — statu quo** | l'interface traduit au vol | c'est **la dette actuelle** : chaque écran retraduit, donc chaque écran peut diverger |

**Mon avis : B1**, franchement. C'est la seule option qui interdit structurellement la divergence :
tant que la traduction vit dans le code d'un écran, elle se refait à chaque écran — c'est
exactement le mécanisme qui a produit les 101 divergences de la passe 1, appliqué aux mots.

---

## 5 bis · Deux défauts trouvés au contrôle de cette passe

| # | Écart | Cause | Traitement |
| --- | --- | --- | --- |
| **5.1** | **`.btn` ne déclare aucun `padding` dans cinq planches** — il contredit la §2.14 que je venais d'écrire. Invisible à l'œil parce que les gestes de pied de feuille sont en `flex:1` et s'étirent ; un `.btn` à largeur intrinsèque sortirait collé à son texte. | **L'absence est invisible à un index de valeurs.** Le balayage de la passe 1 comparait les valeurs *déclarées* : une planche qui n'écrit pas la propriété n'a rien à confronter, donc n'apparaît dans aucun tableau de divergence. | **corrigé** dans les 5 planches, et le **relevé des absences** devient une obligation de procédure (registre, emploi n°4) |
| **5.2** | **Le bandeau de règle avait deux noms et deux tailles** — et l'erreur était **dans mon registre** : §2.15 appelait `.band h2` « bandeau de règle ». Faux. Le bandeau de règle est `.rule` (filet jaune 3 px, fond `--inset-2`, corps 15 px, identique dans 6 planches) ; `.band h2` est un **titre de section de planche** (17 px / 500). En prime, `.rule` portait un **second rôle** en 06.1 : une citation à filet gris dans une colonne. | Un registre écrit vite nomme le rôle d'après la première planche où on l'a vu. **Un registre qui nomme mal fait corriger à côté** : il aurait fait normaliser `.band` en croyant traiter le bandeau. | **corrigé** — §2.15 réécrit avec les deux rôles ; la citation de 06.1 devient `.quo` |

## 5 ter · Trois défauts trouvés au second contrôle

| # | Écart | Cause | Traitement |
| --- | --- | --- | --- |
| **5.3** | **Le badge que je venais d'ajouter à l'annuaire n'était pas identique aux deux dont il était copié** : il portait un `text-align:center` de plus. Invisible à un chiffre, visible à deux. | Le registre disait « identique aux deux autres ». **Une règle qui dit « identique aux autres » ne se vérifie pas** : elle désigne au lieu d'énoncer, et une copie approximative la satisfait. | **corrigé** — la déclaration de `.fbtn b` est désormais **écrite en entier** au registre, et les trois planches sont alignées dessus |
| **5.4** | **`.btn-d` et `.btn-o` portaient chacune deux remplissages**, et la règle de surface de §2.7 était implémentée de **trois** façons : base redéfinie (4 planches), override scopé (2 planches), et un `.btn-d` **sans emploi** à la valeur voilée. Un même rôle visuel — le geste secondaire sur héro inversé — sous deux noms et deux mécanismes. | §2.14 le **mentionnait** sans le corriger, et il manquait à la table « un nom, un rôle » de §2.18. **Un écart mentionné n'est pas un écart traité** — c'est la même faute que la §2 B de la passe 1, commise dans le même souffle que sa dénonciation. | **corrigé** — la base n'est **jamais** redéfinie ; le voile est porté par la surface (`.hact .btn-o`, `.hact .btn-d`), seul mécanisme qui survive à une planche portant les deux surfaces ; `.hb` renommé `.hact` ; règle morte détruite ; ligne ajoutée à §2.18 |
| **5.5** | **`.btn-ghost{padding:0 4px}`**, délibéré et cohérent dans **huit** planches, n'était nulle part au registre — dont §2.14 qui fixe `.btn` à `0 16px`. | Une variante non écrite est indéfendable : elle ressemble à une dérive. **Un lecteur appliquant §2.14 à la lettre aurait « corrigé » les huit.** | **inscrit** comme variante déclarée : sans fond, donc sans gouttière |

## 5 quater · La rangée de référence — deux composants sous un nom, et ma règle les validait tous les deux

**La cause, en une phrase :** §2.11 ne fixait que `font-size` et `padding`, si bien que les deux
anatomies du projet la respectaient **toutes les deux** — le composant était *sous-spécifié*, pas
divergent par accident.

Les deux familles, opposées sur trois points :

| | Famille A — les deux fiches | Famille B — 06.3 · 03.2 · 05.3 · 05.4 |
| --- | --- | --- |
| Alignement | `center` | `baseline` |
| Hauteur | `min-height: 44px` | libre |
| Le gris | porté par **l'étiquette** `.k` | porté par **la rangée**, la valeur re-encrée |

La troisième différence est la seule qui se voit vraiment, et elle est mécanique : **griser la
rangée puis rencrer la valeur laisse tout autre enfant hériter du gris.** La sous-ligne `.dest` de
05.4 rendait donc en `--ink2` chez B et en `--ink` chez A — **le même markup, deux couleurs.**

**Une décision, une édition :** le mécanisme A gagne — c'est le seul qui survive à une rangée
portant un troisième enfant — et §2.11 est réécrite en **bloc entier** (six règles : la rangée, son
premier filet, `.k`, `.v`, la variante `.v.q`, la sous-ligne `.dest`). Les six planches portent
désormais ce bloc **identique au caractère**, ce qui rend le contrôle trivial : le texte correspond,
ou il ne correspond pas. En 05.3, les rangées n'avaient aucune classe d'enfant (`<span>` nus, la
valeur atteinte par `span:last-child`) — étiquettes et valeurs y ont été nommées `.k` et `.v`.

**Ce que ça ajoute à la procédure :** *un composant transverse se déclare bloc entier.* Une règle
qui ne fixe qu'une partie d'un composant ne le tient pas — **elle légitime ses variantes**, et avec
l'autorité d'un registre.

## 5 quinquies · La normalisation a détruit ce qu'elle ne visait pas

**La cause, en une phrase :** mon expression de capture des règles `.rrow` avait des ailes non
ancrées (`[^{}\n]*` de chaque côté), si bien qu'elle a happé une règle voisine écrite sur la même
ligne — et la boucle de suppression l'a effacée avec les autres.

**Le dégât :** la **barre du bas** de la planche 05.4 avait perdu ses trois règles. Le markup était
intact, les cinq onglets aussi ; sans `display:flex`, ils s'empilaient verticalement sur 218 px de
haut le long du bord gauche. Le relevé miroir a trouvé trois autres pertes ou absences :
`.rlist` (05.2), `.field .act` (05.3), et `.si.big .chq` (05.1) — cette dernière **antérieure**, un
chevron qui n'était pas tourné faute de règle.

**Et le pire n'est pas la perte, c'est que mon contrôle ne pouvait pas la voir.** Il comparait le
bloc `.rrow` obtenu au bloc canonique. Il correspondait — forcément, je venais de l'écrire.
**Un contrôle qui ne regarde que ce qu'on a voulu changer ne voit jamais ce qu'on a cassé à côté.**

**Une décision, une édition :** le contrôle d'après-normalisation devient le **miroir du relevé
des absences** — pour chaque planche, les classes présentes dans le markup qu'aucune règle ne
déclare. Il est passé sur les seize planches ; il ne reste que `dBv-adm` en 04.2, une ancre de
réglage sans effet visuel. Inscrit au registre, emploi n°6.

## 5 sexies · Le contrôle ne comparait jamais deux planches entre elles

**La cause, en une phrase :** mes six contrôles vérifiaient chaque planche **contre elle-même** ou
contre une liste de reliquats ; **aucun ne comparait une même règle d'une planche à l'autre** — un
rôle pouvait donc être différent dans les seize sans qu'aucun contrôle ne le signale.

Le symptôme : `.idh` restait à **17 px** dans deux planches quand §2.21 en déclare 19 — la passe de
valeurs avait visé le sélecteur `.ini` par son nom, or ces deux-là écrivaient `.hero .ini`.
**Une règle du même rôle atteignable sous un autre sélecteur échappe à une édition indexée sur le
sélecteur** — exactement ce qui était arrivé à `.dot` et `.mkg`.

**Une décision, une édition :** le septième contrôle compare, pour chacun des vingt-neuf rôles du
registre, la déclaration **texte contre texte** entre les seize planches. Il a sorti **dix-sept
rôles divergents** :

- **neuf ne différaient que par l'ordre des propriétés** ou une propriété sans effet (`cursor`,
  `text-decoration`) — invisibles à l'œil, invisibles à tout contrôle visuel, et pourtant elles
  rendent impossible toute vérification future. **L'ordre des propriétés fait partie de la
  déclaration** : c'est ce qui rend le contrôle trivial.
- **trois étaient la règle de surface écrite dans la classe de base** — `.av`, `.rbtn`, `.more` :
  la faute de `.btn-d`, dans trois composants de plus. Le voile est désormais porté par la surface
  (`.hero .av`, `.hero .rbtn`, `.hact .more`).
- **deux étaient un second rôle sous un nom occupé** : le `.chip` du lexique (devenu `.stg`) et le
  `.trow` de 06.1, qui est une **rangée de matrice** et non une rangée « à traiter » (devenu `.mrow`).
- **cinq étaient des variantes voulues** que rien ne déclarait : la feuille posée au-dessus de la
  barre du bas, la paire de gestes en rangée, le « voir plus » centré, le geste fantôme, et le héro
  qui porte une photo. Elles sont **nommées** au registre §2.27 — sans quoi le contrôle d'identité
  stricte les aurait détruites au nom de la conformité.

**Ce que ça dit du registre :** un contrôle d'identité n'est utilisable que si le registre porte
aussi les **différences voulues**. Sinon il ne distingue pas une dérive d'une intention, et il
devient un instrument de régression.

## 5 septies · Un jeton employé sans être déclaré

**La cause, en une phrase :** ma garde d'insertion testait le **nom** du jeton et non sa
**déclaration**, si bien que l'emploi `var(--live-ambre-wash)` — écrit une ligne plus tôt par le
même script — satisfaisait la garde, qui a sauté la déclaration.

**Le dégât :** en 06.1, la pastille « En attente » du diagramme de chaîne avait perdu son fond. La
propriété ne casse rien, elle **disparaît** : le fond devient transparent, et l'on se retrouve avec
la seule pastille non remplie de la rangée, en jaune sombre sur la carte claire. Second cas trouvé
au même contrôle : `--dark-line` en 05.1.

**C'est la deuxième fois que ce mécanisme frappe le même jeton.** La première, la normalisation de
`--live-ambre` avait repointé une pastille vers un ambre pâle. La règle qui manquait n'était donc
pas sur la couleur mais sur la **garde** : *une garde d'existence de jeton se teste sur `--nom:`,
avec les deux points — jamais sur le nom nu*, puisque le nom nu est aussi ce qu'écrit l'emploi.

**Une décision, une édition :** le huitième contrôle vérifie que **chaque `var(--x)` a sa
déclaration**, sur les seize planches. C'est le seul des huit qui attrape une faute *invisible au
code comme à la relecture* — une propriété qui s'évapore ne laisse aucune trace dans la feuille de
style. Inscrit au registre, emploi n°8.

## 5 octies · Un renommage qui ne renomme que la règle de base

**La cause, en une phrase :** chaque renommage de cette passe visait la forme `X{`, si bien que les
sélecteurs **descendants et composés** — `X .enfant`, `X b`, `X:hover` — ont survécu en pointant une
classe qui n'existe plus.

**Le dégât, visible :** le renommage `.trow` → `.mrow` en 06.1 a laissé trois descendants orphelins.
La ligne secondaire des rangées de matrice a perdu son `display:block` et s'est mise à courir dans
le texte précédent — « *un ordinateur portable**il y a 3 jours* » — et sa pastille a perdu sa
forme ronde.

**Et mon sixième contrôle ne pouvait pas le voir.** Il cherche si le nom de classe apparaît
quelque part dans la feuille de style ; or `.tm` y apparaissait bien… à l'intérieur de `.trow .tm`.
Le contrôle testait la **présence d'une chaîne**, pas l'existence d'une **cible**.

**Une décision, une édition :** neuvième contrôle — les classes citées par un sélecteur et absentes
du markup. Avec une exception obligatoire, sans quoi il est inutilisable : les **variantes
déclarées** de §2.27, qu'un réglage peut n'activer que dans un état. *Un contrôle qui ne fait pas
cette exception crie faux, et un contrôle qui crie faux se fait désactiver* — c'est la troisième
fois de la journée que je le vérifie à mes dépens.

Il a aussi montré que j'avais posé des surcharges de surface (`.hero .av`, `.hact .more`) dans trois
planches **qui n'ont ni héro ni bloc de gestes** : retirées. Et il a listé un lot de règles mortes
**antérieures** à cette passe — inscrites au registre §5.4 comme nettoyage borné, **pas supprimées
en bloc** : c'est exactement ce geste-là qui avait fait disparaître une barre du bas.

## 6 · Ce que cette passe change dans la méthode

**Un écart corrigé sans être écrit reste un écart, du point de vue de qui lit.** Le bouton filtre
était conforme depuis le 31/07 ; vous avez eu raison de le redemander, parce que rien ne permettait
de le savoir. Corollaire ajouté à la procédure : **une correction qui ferme un point que vous avez
signalé se déclare nommément, même quand elle a été faite par ricochet.**

Et une confirmation du §4 de la passe 1 : **vérifier trouve, constater ne trouve pas.** Les trois
étapes de cette passe étaient « déjà livrées » ; les vérifier a sorti deux défauts de composant,
une septième couleur sans nom, et deux trous fonctionnels qu'aucun inventaire de style n'aurait
pu voir.

**Et le relevé lui-même a encore reculé d'un cran.** La passe 1 avait déjà découvert qu'il ne
lisait que les `:root` ; cette passe découvre qu'il ne lit que les **valeurs présentes**. Une
propriété absente n'a pas de valeur à confronter : elle n'apparaît nulle part. Le relevé se fait
désormais **dans les deux sens** — pour chaque rôle du registre, les planches qui en divergent
*et* celles qui n'en déclarent rien. Cinq planches y sont passées du bon côté d'un coup.

Le deuxième défaut est plus inconfortable, et il vaut d'être écrit : **l'erreur était dans le
registre, pas dans les planches.** §2.15 nommait `.band h2` « bandeau de règle » parce que c'est
sous ce nom que je l'avais vu la première fois. Un registre qui nomme mal ne se contente pas d'être
inexact : **il fait corriger à côté**, avec toute l'autorité d'une règle. D'où la vérification
ajoutée : avant d'inscrire un rôle, on liste **toutes** les classes qui le tiennent dans le projet,
et on nomme le rôle d'après ce qu'il fait — pas d'après la planche où on l'a rencontré.

Le second contrôle en a sorti trois de plus, et ils disent tous la même chose sur la façon
d'écrire une règle :

1. **Une valeur canonique s'énonce, elle ne se désigne pas.** « Identique aux deux autres » a
   suffi à laisser passer une quatrième variante — écrite de ma main, le jour où je déclarais le
   composant canonique.
2. **Un écart mentionné n'est pas un écart traité.** §2.14 signalait que `.btn-d` et `.btn-o`
   portaient le même voile ; rien n'était corrigé. C'est la faute de la §2 B de la passe 1 —
   « annoncé, appliqué à moitié » — commise dans le même souffle que sa dénonciation.
3. **Une variante non écrite est indéfendable.** `.btn-ghost` à `0 4px` est juste et cohérent dans
   huit planches, et une lecture littérale du registre l'aurait détruit. **Le registre doit porter
   les exceptions voulues, sinon il fabrique des régressions au nom de la conformité.**
