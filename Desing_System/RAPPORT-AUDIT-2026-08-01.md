# RAPPORT D'AUDIT TRANSVERSE — balayage complet du 2026-08-01

Réponse à la demande : **cesser de corriger au fil des remarques, et passer le projet entier
en une fois.** Ce document est le compte rendu du balayage ; les valeurs qu'il a fait émerger
vivent dans `REGLES-TRANSVERSES.md`, pas ici.

---

## 0 · Comment le balayage a été mené — et pourquoi c'est la partie importante

Le reproche visait juste : les trois passes précédentes partaient de **votre liste**. Une
correction qui part d'une liste ne trouve jamais ce qui n'y est pas.

Le balayage du 01/08 part de l'inverse. **Aucune divergence connue n'a servi de point de
départ.** La méthode, appliquée aux **dix-huit planches** du dossier `screens/` :

1. **Extraction** de chaque déclaration de style de chaque planche — sélecteur, propriété,
   valeur, planche — soit un index de plusieurs milliers d'entrées.
2. **Regroupement par rôle**, pas par nom de fichier : *quel est ce composant, et où
   apparaît-il ?*
3. **Instruction de toute règle portant deux valeurs pour un même rôle.**
   Le relevé brut a sorti **101 divergences** de ce type.
4. **Second passage sur ce que le style ne dit pas** : jetons de couleur, libellés de bouton,
   noms de statut, barres du bas, points d'entrée, nombre de cases du code PIN — comparés
   entre planches et contre `LEXIQUE.md`.

C'est la leçon déjà inscrite dans `AUDIT-UI.md` §2.7, appliquée pour de bon : *un audit qui
cherche une seule forme ne trouve jamais les divergences de forme.* On ne cherche pas
`class="nav"`, on cherche « qu'est-ce qui sert de barre du bas ? ».

Deux résultats méritent d'être dits tout de suite, parce qu'ils qualifient le reste :

- **Ce qui avait été corrigé tient.** Code PIN : quatre cases et une seule métrique sur les
  quatre planches qui le portent, sans exception. Barre du bas : deux variantes, jamais une
  troisième, libellés conformes sur les treize planches. Vignette 40 / rayon 6, titre de
  section 13 px, héro d'identité 52 px : conformes.
- **Et pourtant trois corrections annoncées le 31/07 n'avaient été appliquées qu'à moitié.**
  C'est le plus instructif du rapport : voir §2, catégorie B.

---

## 1 · Écarts déjà connus et corrigés — rappel court, pour trace

Aucune régression relevée sur ces points.

| Écart | Corrigé le | Vérifié le 01/08 |
| --- | --- | --- |
| « Mon compte » dessiné deux fois (planche 07.1 + carte de *Mon profil*) | 31/07 | une vue, deux renvois, zéro champ dupliqué |
| Code PIN à six cases en 07.1 | 31/07 | **4 cases partout**, 64 × 76, chiffre 34 px |
| `.pin` employé pour un code d'authentification | 31/07 | `.pin` ne sert plus qu'au code PIN |
| 05.4 « Gérer un compte utilisateur » lu comme « Mon compte » | 31/07 | renommée, frontière écrite dans l'intro |
| Deux sous-titres pour la même destination dans le menu de l'avatar | 31/07 | un seul libellé |
| Vignette de rangée : 44 / 32 px, rayon 4 / 50 % | 31/07 | 40 / rayon 6 — *une exception trouvée, voir §2 A7* |
| Héro d'identité : 56 px, rayon 4, rayon 50 % | 31/07 | 52 / rayon 6 |
| Titre de section : `.ct` 13 px vs `.ch h3` 15 px | 31/07 | 13 px / 500 partout |
| Barre du bas : deux familles de balisage, barres empilées | 31/07 | un balisage, un jeu d'icônes, une barre par écran |
| Libellés « Mes actifs », « Demandes », onglet Équipe pour un porteur | 31/07 | conformes au lexique |

---

## 2 · Nouveaux écarts détectés au balayage — non signalés jusqu'ici

Vingt-huit écarts, en cinq catégories. **Corrigés dans les planches** sauf mention contraire.

### A · Jetons et couleurs — la couche la plus profonde, jamais auditée

Les passes précédentes portaient sur les composants. Personne n'avait comparé les `:root`
entre eux. C'est là que se trouvait le pire.

| # | Écart | Où | Traitement |
| --- | --- | --- | --- |
| **A1** | **`--dark` a deux valeurs : `#0A191D` bleu-noir et `#1A1917` noir chaud.** Le héro inversé n'a donc pas la même couleur sur le **tableau de bord** et le **détail équipement** que sur les dix autres planches — les deux écrans les plus vus du produit. Idem `--dark-2` (`#1B3238` / `#33302B`) et `--on-dark-2` (`#A9C0C4` / `#C9C4BA`). | 03.1 · 04.2 vs 10 planches | **corrigé** — famille unique `#0A191D`, `REGLES` §2.10 |
| **A2** | **Deux noirs sur le même écran.** Ces deux mêmes planches déclaraient *en plus* un jeton `--live-ink: #0A191D` employé pour l'avatar rond — un avatar bleu-noir posé sur un héro noir chaud. | 03.1 · 04.2 | **corrigé** — `--live-ink` supprimé |
| **A3** | `--rowy` vaut **11 px** au lieu de 10 : un pixel par rangée, dix-sept rangées dans la file de tâches. | 03.2 · 03.3 · 07.1 | **corrigé** |
| **A4** | `--dark-line` : `.16` au lieu de `.14`. | 04.1 · 05.2 | **corrigé** |
| **A5** | **`--live-ambre` non déclaré** → la couleur du statut ambre est **écrite en dur** `#E9C46A` dans la feuille de style. Une couleur en dur est une couleur qui ne suivra pas la prochaine décision de palette. | 04.1 · 04.2 | **corrigé** — jeton déclaré, valeur retirée du dur |
| **A6** | **`--avs: 44px` — jeton fantôme.** Reliquat de la vignette à 44 px corrigée le 31/07, encore déclaré dans **six planches** *et encore employé dans une* : la vignette du chemin de choix de 05.3 est restée à **44 px rayon 4** alors que §2.2 dit 40 / rayon 6. La correction du 31/07 avait traité les classes, pas le jeton qui les alimentait. | 6 planches · 05.3 | **corrigé** — `--avs` supprimé du projet |
| **A6 bis** | **`--thw` / `--thh: 44px` — le même jeton fantôme sous un autre nom**, trouvé au contrôle : la vignette d'objet de la liste équipements tenait aussi à **44 px rayon 4**. Deux noms, un même reliquat, la même cause — une vignette dimensionnée par variable échappe à toute correction portée sur les classes. | 04.1 | **corrigé** — jetons supprimés, 40 / rayon 6 |
| **A6 ter** | **Trois jetons redéclarés hors `:root`**, donc invisibles au relevé et gagnants par spécificité : `--live-ambre: #FEF3D6` en 04.2 — un **ambre pâle** pour la même pastille de statut que `#E9C46A` ailleurs —, `--dark-line` à `.16` dans deux règles de portée réduite, et le réglage « ton neutre » du tableau de bord qui **reteintait le noir inversé** (`#171716`) quand le même réglage, ailleurs, ne touche que la toile. | 04.2 · 03.1 | **corrigé** — règle écrite : un jeton ne se déclare que dans `:root` |
| **A7** | `--gap` : 20 px sur onze planches, **24 px** sur trois. | 03.1 · 04.2 · 05.2 | valeur canonique inscrite (§2.16) ; **application liée à la passe de densité** |
| **A8** | **Deux familles de noms de jetons cohabitent** : `--ink2` / `--ink3` (treize planches) et `--ink-2` / `--ink-3` (planche 02 et les répliques d'existant) ; `--btn-y-fg` et `--on-brand` pour la même encre. | 02 + répliques | voir §3, point 4 |

### B · Corrections annoncées le 31/07, appliquées à moitié

**La catégorie la plus utile du rapport.** Trois décisions étaient écrites, datées, et
n'avaient pas été portées partout — donc le registre disait vrai et les planches disaient
faux, ce qui est exactement l'état que le registre devait empêcher.

| # | Écart | Où | Traitement |
| --- | --- | --- | --- |
| **B1** | **Fusion `.krow` → `.rrow` : annoncée faite, faite à moitié.** Les deux fiches gardaient leur propre métrique de rangée de référence — **14 px sur 6 px de gouttière** contre 13 px sur 11 px partout ailleurs. | 04.2 · 05.2 | **corrigé** |
| **B2** | **`.krow` survivait comme règle morte** en 06.1 : plus aucun emploi dans le markup, mais la règle était toujours là, prête à resservir. *Une règle morte est une divergence qui attend.* | 06.1 | **corrigé** — règle détruite |
| **B3** | **`.bhead h2` : « ramené à 16 px » le 31/07, encore à 19 px** dans les deux planches de création. La correction n'avait touché que 06.1. | 04.3 · 05.3 | **corrigé** |
| **B4** | **`.abar` : « disparaît » (`AUDIT-UI` §4), toujours présent**, avec son propre `.abar .save`. | 04.3 · 05.3 | **non corrigé** — remplacement de markup, voir §3 point 5 |

### C · Composants transverses jamais mis en règle

Ces valeurs n'avaient jamais été arbitrées : elles divergeaient sans que rien ne soit
enfreint, faute de règle.

| # | Rôle | Ce qui a été trouvé | Traitement |
| --- | --- | --- | --- |
| **C1** | **Voile sous une feuille** (`.scrim`) | **trois opacités** — .42, .34, .28 — et dans le tableau de bord, un voile s'arrêtant à 56 px du bas, laissant la barre du bas allumée sous une feuille modale | **corrigé** — .42, pleine hauteur |
| **C2** | **Anatomie chiffrée de la feuille montante** | six variantes : `.sheet` 10/12 · `.sbody` 6/8/10 et gouttière 12/13/14 · `.sfoot` 2/6. §2.9 fixait les *types* de feuille, jamais ses cotes. | **corrigé** sur 12 planches |
| **C3** | **Menu de débordement** | **trois largeurs** — 250, 262, 274 px : le bord du menu se déplace selon l'écran d'où on l'ouvre | **corrigé** — 262 px |
| **C4** | **Geste primaire** (`.btn`) | `padding` `0 16px` (six planches) / `0 14px` (trois) | **corrigé** |
| **C5** | **Bouton de réglage** (`.rbtn`) | 48/44 px, `0 16px`/`0 14px`, 14/13 px | **corrigé** — 44 / `0 14px` / 13 px |
| **C6** | **Rangée « voir plus »** (`.more`) | 44 px sur deux planches, 48 ailleurs | **corrigé** — 48 px |
| **C7** | **Bouton d'icône de barre du haut** (`.tb`) | rayon 4 absent en 04.2 ; état de survol déclaré dans **3 planches sur 13** | rayon **corrigé** ; survol inscrit au registre (§2.14) |
| **C8** | **Titre de colonne de planche** (`.sttl h3`) | **17 px** dans les deux listes, 19 px sur les neuf autres : les deux listes avaient l'air d'un rang inférieur sans qu'aucune règle ne le demande | **corrigé** — 19 px |
| **C9** | **Bandeau de règle** (`.band h2`) | trois combinaisons pour trois planches : 17/500, 16/500, 17/600 | **corrigé** — 17 / 500 |
| **C10** | **Vignette sur surface inversée** (`.thumb`) | `--inset` sur fond clair, `--dark-2` sur héro — juste, mais nulle part écrit, donc rejouable au hasard | **inscrit** au registre (§2.17) |

### D · Un nom, deux rôles — la divergence qui ne se voit pas à l'inventaire

Chaque valeur est *juste dans son écran*. C'est le nom partagé qui garantit qu'elles
divergeront à la première modification globale.

| # | Nom | Rôles confondus | Traitement |
| --- | --- | --- | --- |
| **D1** | `.ini` | héro d'identité **52 px** (06.3 · 07.1 · 05.2) **et** vignette de rangée **40 px** (03.2 · 03.3 · 04.2) | à séparer — §3 point 1 |
| **D2** | `.ev .dot` | **troisième porteur de la marque d'événement**, à **26 px** quand §2.5 dit 32 : le fil d'activité s'ouvre sur un repère de 32 px au tableau de bord et de 26 px dans les deux fiches. Il avait échappé au filet du 31/07 parce qu'il ne porte ni initiale ni icône. | valeur canonique 32 px inscrite (§2.19) ; **application à valider** |
| **D3** | `.bar` | jauge de volume (4 px, `--data`) **et** progression d'import (6 px, `--dark`) | deux rôles à nommer (§2.18) |
| **D4** | `.chip` | filtre de liste (rayon 4, 13 px) **et** étiquette de statut du lexique (rayon 11, 11 px) | deux rôles à nommer (§2.18) |
| **D5** | `.ct` / `.ch h3` | deux noms pour le titre de section, **cohabitant dans la même planche** (06.1, 03.2, 04.3, 05.3, 05.4) — métriques alignées depuis le 31/07, rôles jamais départagés | départage inscrit : `.ch` = en-tête portant une action, `.ct` = titre seul |
| **D6** | `.bio` / `.sig` | zones de preuve à deux hauteurs entre 06.1 et 06.2 (132/148 et 120/140) | valeur canonique inscrite (§2.20) ; **application à valider** |
| **D7** | `.lrow` | 60 px en 06.3, 72 px dans les deux listes | valeur canonique inscrite ; **application à valider** |

### E · Libellés — quatre mots hors lexique, dont un dans la planche qui possède l'acte

| # | Planche | Écrit | Retenu | Gravité |
| --- | --- | --- | --- | --- |
| **E1** | **05.4** | geste « Réinitialiser le code » | **« Réinitialiser le code PIN »** | `LEXIQUE.md` §3 range ce mot parmi les **variantes rejetées** — et la faute était dans la planche qui *possède* l'acte, dont le titre de feuille, lui, était juste : **titre et bouton se contredisaient dans le même écran** |
| **E2** | **04.2** | statut « Réception à confirmer » | **« En attente »** | **troisième mot** pour l'état *remis, pas encore reçu* — même pas dans les variantes relevées |
| **E3** | **04.2** | « Le vôtre » | **« Attribué — à vous »** | la planche 06.3 dit déjà « Attribué — à vous » pour le même état vu par le porteur |
| **E4** | **04.3** | « Déclarer l'incident » | **« Déclarer un incident »** | article défini contre indéfini |

**Et une règle qui manquait, révélée par ces écarts.** Le produit emploie deux formes pour un
même acte — **libellé d'appel** à l'infinitif (« Confirmer la réception ») et **libellé
d'engagement** à la première personne (« Je confirme avoir reçu »), le second réservé au geste
primaire d'une feuille d'acte. C'est cohérent sur trois planches et ce n'était écrit nulle
part : rien ne permettait donc de dire si « Je rends cet équipement » était une variante
légitime de « Restituer » ou une cinquième faute. **Règle désormais inscrite** —
`REGLES-TRANSVERSES.md` §3.1.

---

## 3 · Les sept points ouverts — **tranchés le 01/08**

Vous avez délégué les sept arbitrages. Chacun est décidé, appliqué et inscrit au registre ;
aucun n'est laissé « à voir plus tard ». Deux méritent d'être justifiés, parce que j'ai tranché
contre ce que le registre laissait attendre.

### 3.1 · Les deux décisions qui vont contre l'attente

**La cinquième marche typographique : je la nomme au lieu de la supprimer.**
L'échelle disait quatre marches ; le balayage a compté **14 px dans onze planches**, toujours
pour le même rôle — le titre d'une rangée de liste, de menu ou de fil d'activité. Ramener
soixante déclarations à 15 px aurait gonflé toutes les listes du produit pour faire tenir un
tableau écrit sur deux planches. **Une valeur employée partout, pour un rôle stable, n'est pas
une dérive : c'est une marche qui manquait au tableau.** Elle est nommée « titre de rangée ».
Et j'en ai sorti un rang de plus, qui n'était nulle part : **le contrôle**. Un bouton ne se lit
pas, il se vise — il n'a pas à suivre l'échelle du texte. Ce qui restait, en revanche, était
bien une faute : **12,5 px**, ramené à 13. *Une demi-marche n'est pas un rang, c'est un réglage
fin fait à la main.*

**Le bandeau de connexion : je garde son noir chaud, et j'en fais un rôle.**
La planche 02 est migrée sur le vocabulaire commun — jetons, toile, filet, champ, étiquette,
vignette 40, geste `.btn` : onze écarts fermés. **Sauf un, délibérément.** Son bandeau de marque
est en `--ink` noir chaud, plein cadre, sans rayon, avant authentification ; le héro inversé est
en `--dark` bleu-noir, en carte, dans l'application. Les forcer à la même couleur aurait aligné
deux choses qui ne sont pas la même. Deux noirs coexistent donc dans le produit — **et le
registre le dit** : c'est exactement la différence entre une variante, interdite, et un rôle
nommé, légitime. Le prochain écran hors session prend ce bandeau et n'a plus à choisir.

### 3.2 · Les cinq autres

| # | Point | Décision |
| --- | --- | --- |
| **1** | `.ini` portait **trois** rôles (32 ronde, 36 ronde, 40 et 52 carrées), `.ico` deux, `.dot` deux | **six porteurs d'identité, six noms** — `.av` vignette · `.ico` vignette à glyphe · `.idh` héro · `.avat` avatar de moi · `.mk` marque d'événement · `.dot` pastille de statut. **`.ini` n'existe plus.** Le renommage a d'ailleurs révélé une **vignette de rangée du tableau de bord déguisée en marque d'événement** — un écart de plus, invisible tant que les deux partageaient un nom |
| **2** | Trois valeurs canoniques décidées, non appliquées | **appliquées** : marque d'événement 26 → **32 px**, zones de preuve → **148 / 140**, rangée de liste 60 → **72 px** |
| **5** | `.abar` devait disparaître | **supprimé.** En l'ouvrant, il s'est avéré que ses métriques étaient **déjà** celles de `.tbar` — retour 48, titre 16, ligne secondaire 11. Ce n'était plus un gabarit concurrent, seulement un nom en trop : un simple renommage |
| **6** | Densité des deux fiches | **la règle est tenue** : les fiches sont à 2–4 cartes de 2 à 5 rangées, contre 5 et 6 au moment du diagnostic — la plainte a été résorbée par les passes précédentes. Une seule violation restait : la carte « Documents » de la fiche vue par le porteur ne portait **qu'un contrat de garantie** ; elle est devenue une ligne de la carte « Garantie ». Et j'ai écrit la précision qui manquait pour que la règle ne se relitige pas : une **rangée de renvoi** constitue à elle seule le sujet d'une carte, et une ligne détachée rejoint la carte de **son sujet**, pas sa voisine de position |
| **7** | Numérotation des documents | **réécrite** dans les trois documents normatifs *et dans la prose des planches* — quatorze références périmées y dormaient, dont deux dans la note qui explique la fusion de « Mon compte ». `PASSATION.md` garde ses numéros : c'est un **journal daté**, et un journal réécrit ne prouve plus rien ; il porte maintenant sa table de lecture en tête. Deux états devenus faux ont été corrigés au passage : la feuille « Déclarer un incident » était donnée comme non dessinée alors qu'elle existe en 04.3 |

### 3.3 · Ce qui reste — et ce n'est plus de la cohérence

Deux chantiers de **dessin**, qui attendent une planche et non un arbitrage :

1. **Première connexion** — accepter l'invitation, définir son code PIN.
2. **Les catégories du catalogue**, anglais dans la donnée / français dans les planches : une
   **décision produit**, signalée, hors du champ de la maquette.

## 4 · Ce que ce passage change dans la méthode

L'audit précédent vérifiait des points. Celui-ci a **indexé le projet**, ce qui donne trois
acquis réutilisables :

1. **Le relevé se refait.** L'index sélecteur → propriété → valeur → planche se reconstruit à
   la demande ; toute règle à deux valeurs ressort. C'est cette relance, et non une relecture,
   qui doit précéder chaque livraison de planche.
2. **Le registre couvre maintenant la couche des jetons**, pas seulement celle des composants
   — c'est là que dormait la pire divergence du projet (A1, A2), invisible à trois audits de
   composants successifs.
3. **Une correction annoncée n'est pas une correction appliquée.** Trois décisions du 31/07
   n'étaient portées que sur une partie des planches (§2 B). Toute ligne du journal des
   décisions doit désormais nommer sa portée **et** être revérifiée au relevé suivant.
4. **Et le relevé lui-même avait un angle mort — il a été pris en flagrant délit.** Le premier
   passage ne lisait que les blocs `:root`. Il a donc manqué les jetons **redéclarés dans une
   règle de portée réduite** (`.phone.dBv{…}`, `body[data-tone=…] .phone{…}`) — et la
   normalisation de `--live-ambre` a d'abord **empiré** la situation en repointant la pastille
   de statut de 04.2 vers un `#FEF3D6` qui dormait dans une de ces règles. Trois cas trouvés au
   contrôle, tous corrigés (A6 ter), et deux leçons :
   - le relevé doit désormais lire **toute** déclaration `--*`, quelle que soit sa portée ;
   - remplacer une valeur en dur par un jeton n'est sûr **que si l'on a vérifié ce que le jeton
     vaut à cet endroit-là**. Une couleur en dur est un défaut visible ; un jeton qui pointe
     ailleurs qu'on croit est un défaut invisible.

   La règle qui en sort est au registre §2.10 : **un jeton se déclare dans `:root`, et nulle
   part ailleurs** ; un réglage de démonstration ne redéfinit jamais un jeton de couleur
   structurelle.
