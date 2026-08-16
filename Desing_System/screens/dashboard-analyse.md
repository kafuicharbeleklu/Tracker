# Dashboard — ce qui est réellement implémenté

Analyse de `src/features/dashboard/pages/DashboardPage.tsx` (750 lignes), faite avant de
dessiner. À lire avant de proposer une maquette.

---

## 1. Il n'y a pas trois tableaux de bord. Il y en a deux.

Toute la variation par rôle repose sur **un seul booléen** : `permissions.canManageInventory`.

| | `canManageInventory = true` | `canManageInventory = false` |
| --- | --- | --- |
| **Qui** | SuperAdmin, Admin, IT | Utilisateur final |
| **Actions en tête** | Retour matériel · Attribuer | Nouvelle demande |
| **KPI** | Total actifs · Attribués · En attente · Disponibles · En réparation | Mes équipements · Demandes en cours · Réceptions à confirmer |
| **Bloc financier** | Total dépenses · Valeur actuelle | *masqué* |
| **Derniers événements** | affiché | affiché |
| **Répartition par type** | affiché | **affiché aussi** |
| **Performance & garantie** | affiché | **affiché aussi** |
| **Besoin d'aide** | affiché | affiché |

**Le Manager n'a pas de composition propre.** Il tombe dans l'une des deux colonnes selon
qu'il détient ou non `canManageInventory`. C'est l'écart principal entre l'intention
énoncée (« le dashboard du manager est spécifique à lui ») et le code.

## 2. Le bloc « à traiter » existe déjà — mais il est enterré

Une section conditionnelle s'affiche pour **n'importe quel rôle**, pilotée par la donnée
et non par le rôle :

- **Validations managériales** — les demandes qui attendent l'arbitrage de la personne
  connectée, avec les boutons Valider / Refuser directement dans la carte ;
- **Réceptions à confirmer** — les livraisons dont elle doit accuser réception.

C'est la seule partie de l'écran qui demande une action. **Elle est placée après la
grille de KPI** : sur téléphone, il faut donc dépasser cinq cartes de chiffres avant de
voir ce qui attend vraiment. C'est le principal défaut de composition, avant même
l'esthétique.

C'est aussi, de fait, le « dashboard du manager » : un manager voit ce bloc parce qu'il a
des validations en attente, pas parce qu'il est manager.

## 3. Deux blocs sont probablement de trop pour l'utilisateur final

« Répartition par type » et « Performance & garantie » portent sur **tout le parc**. Ils
sont rendus à l'utilisateur final, qui n'a aucune action à en tirer — et qui n'a
peut-être pas à connaître l'état global du parc. À arbitrer.

## 4. Conséquences pour le design

1. **Le bloc « à traiter » remonte en tête**, sous le titre. C'est lui la dominante.
2. **Trois compositions à dessiner**, pas une — ou alors il faut assumer qu'il n'y en a
   que deux et le dire.
3. Les KPI descendent d'un cran : ils informent, ils ne demandent rien.
4. Un seul graphique par écran sur mobile, et sans couleur sémantique décorative
   (aujourd'hui le rouge code « Headphones » et le vert code « Mouse »).
5. La grille 2+2+1 disparaît : cinq KPI, c'est une carte orpheline garantie.

## 5. Arbitrages rendus (2026-07-26)

- **Deux compositions, pas trois.** Le manager n'a pas d'écran propre : il est servi par
  la donnée, via le bloc « à traiter » remonté en tête. Décision confirmée.
- **L'utilisateur final ne voit plus les graphiques de parc** ni le bloc financier.
- **Icônes conservées, mais en NEUTRE.** Elles sont jaune / vert / rouge dans
  l'application. Les repeindre dépasserait les deux usages du jaune autorisés par écran et
  remettrait de la couleur qui ne signifie rien (une icône verte pour « Disponibles »
  n'ajoute rien au mot). Le rouge subsiste sur le **chiffre** de « Réparation », là où il
  signale quelque chose. Décision confirmée le 26/07.
- **Icônes présentes partout** : en-tête de carte, KPI, boutons d'action, barre du bas.
  Pas d'icône sur l'en-tête « Valeur du parc » : ses deux chiffres portent déjà la leur.
- **KPI admin en 2×2**, KPI utilisateur en **2 + 1**, dans une seule carte à séparateurs.
  À 393 px, quatre ou trois cellules sur une ligne sont trop étroites une fois l'icône
  ajoutée. L'interdit §8.7 vise une mini-carte orpheline, pas une cellule de grille.
- Maquettes : `dashboard-actuel.html` (référence), `dashboard-admin.html`,
  `dashboard-utilisateur.html` (pistes), puis `dashboard-final-admin.html` et
  `dashboard-final-utilisateur.html` (versions finales, chacune côte à côte avec la
  réplique de l'existant).

## 6. Reste ouvert

- **« Derniers événements » est-il filtré par rôle ?** Aujourd'hui l'admin voit les
  sessions des autres utilisateurs. Pour l'utilisateur final, à vérifier dans le code
  avant l'implémentation.

## 7. Version finale (2026-07-26) — écarts avec les pistes

Décision consignée ce jour : **le dashboard utilisateur garde « Mes équipements par
type » et « Garantie »** (scopés à ses propres équipements), en présentation compacte.
Cela remplace la ligne « l'utilisateur final ne voit plus les graphiques de parc » du §5,
qui portait sur des graphiques qu'on croyait à tort calculés sur tout le parc.

Livrables : `dashboard-final-admin.html` et `dashboard-final-utilisateur.html` — chacun
présente la réplique de l'existant à gauche et la proposition à droite (méthode §2, que
les pistes ne respectaient pas : l'actuel était dans un fichier séparé).

### Corrections apportées aux pistes

1. **Données alignées sur la réplique** (jeu de démo : 14 actifs, 17 615 XOF…). Les
   pistes montraient 247 actifs et 17 615 000 XOF : comparaison impossible côte à côte.
2. **Renommages annulés** : « Retourner » redevient **« Retour matériel »** ;
   « Demandes » redevient **« Demandes en cours »** ; les catégories reprennent les noms
   de la donnée (**Laptop, Monitor, Mouse, Headphones**) au lieu d'une traduction ; les
   textes d'événements sont repris **verbatim** de l'existant. Seule la casse change
   (« Total Actifs » → « Total actifs », « En Réparation » → « En réparation ») —
   application de l'interdit sur les majuscules.
3. **Suppressions non consignées annulées** : « Besoin d'aide ? » restauré côté admin ;
   « Performance et garantie » retrouve **tout** son contenu (disponibilité globale,
   rangée d'âges ≤ 3 ans / ≥ 5 ans, phrase d'enseignement) sous forme de rangées à
   filets sous l'anneau ; les 5 événements admin sont conservés (la piste en gardait 3
   avec un lien « Voir tout » inventé, retiré). L'ordre des sections redevient celui du
   code (événements avant les graphiques).
4. **En-tête « Valeur du parc » retiré** : il n'existe pas dans l'écran actuel et il
   prétend porter sur le parc entier alors que `DashboardPage.tsx:50` filtre au
   périmètre de la personne. La carte fusionnée garde les deux libellés d'origine
   (« Total dépenses » / « Valeur actuelle ») sans titre.
5. **Secondaire `#726E66`** (ADN opposable) au lieu du `#78746C` des pistes.
6. **Le bloc « à traiter » admin est marqué comme illustration** : la capture réelle
   montre 0 validation et 0 réception (« En attente : 0 »). Deux entrées de démo
   montrent la forme du bloc.
7. **Réplique utilisateur = reconstruction.** Aucune capture de la vue utilisateur
   n'existe (la capture est la vue admin). La réplique de gauche est déduite de
   l'analyse du code et marquée comme telle sur la page.

### Points encore ouverts (non tranchés ici)

- **Longueur de « Derniers événements »** : 5 entrées conservées côté admin par
  fidélité. Passer à 2–3 + « Voir tout » raccourcirait l'écran — à décider.
- **Phrase d'enseignement** « Le parc sous garantie est +40 pts plus disponible » :
  conservée côté admin, **omise côté utilisateur** car le mot « parc » y serait faux
  (données scopées). Sa reformulation — ou sa suppression — est à décider.
- **Ordre des sections** : le code place les événements avant les graphiques ; les
  pistes les mettaient en dernier. La finale suit le code — à confirmer.
- **Titre « Garantie »** côté utilisateur (la décision cite ce nom) : « Garantie de mes
  équipements » serait plus explicite sur le périmètre — à décider.
- **Rangées « Disponibilité » et âges côté utilisateur** : le code semble rendre le même
  composant scopé (hypothèse — non vérifié) ; les valeurs 100 % / 4 / 0 sont de la démo.
- Toujours ouvert : filtrage de « Derniers événements » par rôle (§6), Q-B2/Q-B3/Q-B6
  de la passation.

---

# Phase 1 — Références

Recherche menée le 26/07/2026 sur ce qui donne de la **présence** à un dashboard mobile
sans recourir à ce que l'ADN interdit (ombres lourdes, couleur décorative, graisses
fortes). Sources publiques citées en fin de section. Pour chaque référence : les
mécanismes, pas les impressions.

## R1 — Stripe : la présence par le traitement du nombre

- **Hiérarchie.** La zone dominante est une bande de 4 cartes de métriques en haut de la
  zone de contenu ; chaque carte porte **un chiffre, un indicateur de tendance
  (flèche + pourcentage), une sparkline — et rien d'autre**. Les libellés sont réduits au
  strict minimum : « Revenue », pas « Total revenue for the current period »
  (artofstyleframe).
- **Chiffres.** Chaque cellule qui porte de la monnaie ou un décompte active les
  **chiffres tabulaires** (`font-feature-settings:"tnum"`), avec un resserrement de
  l'interlettrage ; c'est décrit comme la signature discrète de l'ADN financier de la
  marque (designmd, webdesignhot).
- **Graisse.** Le display est en **300**, pas en 600–700 : « là où d'autres emploient
  600–700 pour capter l'attention, la légèreté fait l'autorité » (open-design,
  webdesignhot). La présence vient de la **taille et du contraste**, pas de la graisse.
  C'est directement transposable à une contrainte 400/500.
- **Accent.** Un seul « voltage » de marque (indigo), réservé au CTA : **un seul bouton
  plein par bande**, jamais deux qui se disputent la même zone (shadcn.io/design/stripe).
- **Sections.** Les tableaux sont séparés par des **filets fins sans zébrures**, libellés
  à gauche, valeurs numériques **alignées à droite** (webdesignhot).

## R2 — Linear : la profondeur sans ombre

- **Échelle de surfaces à 4 crans** (canvas → surface-1 → surface-2 → surface-3 →
  surface-4) : c'est elle qui porte la hiérarchie, **pas l'ombre** — la marque « résiste
  presque entièrement aux ombres portées » (awesome-design-md, shadcn.io/design/linear).
- **Élévation = luminance.** Une surface qui « flotte » n'a pas d'ombre : elle est
  **plus claire** que ce qu'elle survole (soul-design-md). En clair, la transposition
  s'inverse : la surface qui compte se **détache par un écart de ton**, pas par un relief.
- **Filets à la place des ombres** : hairlines 0,5–1 px pour séparer les surfaces
  (refero.design).
- **Rythme d'espacement volontairement inégal** : échelle 8 / 12 / 24 / 96 — les écarts
  entre sections sont d'un autre ordre de grandeur que les écarts internes ; c'est ce
  différentiel qui fait lire les groupes (refero.design).
- **Rayons serrés** (12 px, jamais de pilule) et **pas de second accent chromatique** ;
  l'accent n'apparaît **jamais décorativement** (awesome-design-md).
- **Garde-fou de contraste que la même source pose** : un gris à 3,1:1 est réservé au
  décoratif / désactivé / placeholder ; tout texte porteur d'information passe au cran
  au-dessus (soul-design-md). C'est exactement l'arbitrage Q-B1 de notre passation.

## R3 — Material 3 : l'étagement tonal comme système

- L'élévation est exprimée **principalement par superposition tonale**, pas par l'ombre
  (developer.android.com). Le rôle `surfaceContainer` compte **cinq tons** : plus le ton
  est haut, plus le conteneur est **proéminent** (SAP Fiori/M3).
- Les rôles nommés existent précisément pour éviter les « nuances au hasard » :
  `surfaceContainerLowest → Highest`, chacun avec un usage (rangées de liste et cartes
  « calmes » sur le ton bas, conteneur mis en avant sur le ton haut) — la profondeur
  devient un **vocabulaire**, pas un effet (flutter API, Medium/M3 color roles).
- **`inverseSurface`** : une surface au contraste **inversé**, prévue pour une zone qui
  doit trancher sur la page (barre sombre sur écran clair). L'inversion est donc un
  mécanisme **prévu et documenté**, pas une fantaisie — c'est l'appui de la direction B.
- L'ombre reste admise pour un cas précis : quand le **contraste tonal ne suffit pas**
  (élément posé sur une image, zone visuellement chargée) — donc jamais dans notre cas.

## R4 — Dashboards d'exploitation (flotte, maintenance, inventaire)

- **Le test des 10 secondes** : l'écart entre une interface d'exploitation ancienne et une
  moderne n'est pas la quantité de données mais « la bonne donnée, dans la bonne
  hiérarchie » — de la connexion à « je sais quels trois véhicules demandent mon attention
  ce matin » en moins de 10 s (heavyvehicleinspection).
- **L'action vit dans l'alerte.** « Chaque alerte répond à *que dois-je faire ?*, pas
  seulement *voici quelque chose d'inhabituel* » — et les meilleures implémentations
  **placent le bouton d'action à l'intérieur de la carte d'alerte**
  (heavyvehicleinspection). C'est la validation externe de notre bloc « à traiter » avec
  ses boutons en rangée.
- **Hiérarchie de KPI en étages** + indicateurs de tendance compacts + statut en feu
  tricolore + priorité mobile : le mobile **réordonne** en une colonne, il ne réduit pas
  (heavyvehicleinspection).
- **Cibles 44–48 px** et navigation dépendante du rôle (3–4 destinations pour un
  opérateur, 6–8 pour un dispatcher) (volpis).
- Signal d'alarme documenté pour notre cas : « **les mises en page denses et sans bordures
  créent une surcharge cognitive** » — l'absence de délimitation n'est pas neutre
  (heavyvehicleinspection).

## R5 — Doctrine de composition de dashboard (règles opposables)

- **Une question primaire, répondue en moins de 5 secondes.** La réponse doit être
  « l'élément le plus grand et le plus proéminent de la page » ; le contexte secondaire
  passe **sous la ligne de flottaison** ou dans un panneau replié (dashtemplate).
- **Le mode d'échec nommé** : « chaque métrique reçoit le même poids visuel » + « la
  couleur sert à faire moderne plutôt qu'à signifier » = dashboard que personne ne
  consulte au bout d'une semaine (dashtemplate). C'est mot pour mot notre problème.
- **Un seul visuel par carte de métrique** : sparkline **ou** micro-barre **ou** flèche de
  tendance — jamais les trois (artofstyleframe).
- **Un chiffre sans référence ne se lit pas** : cible, écart ou tendance ; sinon le lecteur
  devine (tabulareditor). Corollaire honnête : **si la donnée de comparaison n'existe pas,
  il ne faut pas simuler la tendance** — mieux vaut n'afficher aucun indicateur.
- **Hiérarchie de lecture en trois étages** : au-dessus de la ligne, l'état et les KPI
  (« est-ce que ça va ? ») ; au milieu, tendances et comparaisons ; en bas, détails et
  ventilations (think.design).
- **Étages par la taille** : les éléments plus grands deviennent les points focaux,
  les plus petits jouent l'appui — la variation d'échelle crée le rythme et
  **empêche la monotonie** (taap.bio).

## Les 5 mécanismes transposables à Tracker

1. **Étager les surfaces au lieu d'ajouter des ombres** (R2, R3). Trois tons neutres
   chauds au maximum : canvas `#FAF9F7` → carte `#FFFFFF` → zone interne `#F5F3EF`
   (à valider). La zone dominante est celle qui **change de ton**, pas celle qui a une
   ombre. Compatible avec l'interdit « ni bordure ni ombre ».
2. **Faire porter la présence par les chiffres** (R1). Valeur KPI nettement plus grande
   que tout le reste (24–28 px contre 20 aujourd'hui), chiffres tabulaires, libellé court
   au-dessus en 12 px, valeurs alignées à droite dans les rangées. La graisse reste 500 :
   c'est la **taille** et le **contraste**, pas le gras, qui donnent l'autorité.
3. **Une seule zone dominante, et c'est celle qui demande une action** (R4, R5). Le bloc
   « à traiter » porte le bouton dans la rangée. Tout le reste descend d'un cran :
   plus petit, plus calme, sans en-tête décoré.
4. **Rythme d'espacement inégal** (R2). Écarts internes 8/12 px, écarts entre groupes
   24 px, et **un écart plus large (32–40 px) avant la zone d'analyse** : c'est le
   différentiel qui fait lire trois groupes au lieu de six cartes équivalentes.
5. **Un seul visuel par carte, un seul accent** (R1, R5). Micro-barre **ou** chiffre,
   jamais les deux ; un seul jaune dans le contenu (la barre du bas consomme l'autre) ;
   le rouge/vert/ambre uniquement quand il change une décision.

## Sources

- artofstyleframe.com/blog/dashboard-design-patterns-web-apps/ (Stripe : 4 cartes,
  un visuel par carte, libellés courts)
- designmd.co/d/stripe · webdesignhot.com/design.md/stripe/ ·
  open-design.ai/plugins/design-system-stripe/ (tnum, graisse 300 comme signature)
- shadcn.io/design/stripe (un seul bouton plein par bande)
- github.com/voltagent/awesome-design-md — linear.app/DESIGN.md ·
  shadcn.io/design/linear (échelle de 4 surfaces, refus de l'ombre)
- github.com/soulcore-dev/soul-design-md — linear/DESIGN.md (luminance stacking ;
  seuil de contraste 3,1:1 réservé au décoratif)
- styles.refero.design (filets 0,5 px, échelle d'espacement 8/12/24/96, pas de graisse 700)
- developer.android.com/develop/ui/compose/designsystems/material3 ·
  sap.com/design-system/fiori-design-android (élévation tonale, 5 tons de conteneur)
- api.flutter.dev ColorScheme (rôles surfaceContainer* et inverseSurface)
- heavyvehicleinspection.com/blog/post/modern-fleet-management-ui-ux-dashboard-kpis-guide
  (test des 10 s, bouton dans l'alerte, densité sans bordures = surcharge)
- volpis.com/blog/user-experience-design-of-fleet-management-apps/ (cibles 44–48 px,
  navigation selon le rôle)
- dashtemplate.com/blog/dashboard-best-practices-2026/ (question primaire en 5 s ;
  « même poids visuel partout » comme mode d'échec)
- tabulareditor.com/blog/kpi-card-best-practices-dashboard-design (un chiffre sans
  référence ne se lit pas)
- think.design/blog/dashboard-design-in-2026-dos-and-donts/ (trois étages de lecture)
- taap.bio/blog/dashboard-design-best-practices (l'échelle crée le rythme)

*Réserve : ces sources décrivent des systèmes publics et des doctrines de composition.
Aucune capture d'application concurrente n'a été reproduite, et rien n'a été transposé
sans passer par les Interdits du brief.*

---

# Phase 2 — Autocritique de la piste en cours

Fichiers examinés : `dashboard-piste-admin.html` et `dashboard-piste-utilisateur.html`
(l'ancien `dashboard-piste.html` a été scindé en un fichier par composition lors du
rangement). Chaque constat est rattaché à un mécanisme de la phase 1.

1. **Aucune zone dominante : six cartes strictement équivalentes.**
   « À traiter », KPI, valeur du parc, événements, répartition, garantie, aide — toutes en
   `#FFFFFF`, rayon 8, padding 16, même largeur, même gabarit d'en-tête (icône 18 px +
   titre 16/500). Le bloc qui demande une action ne se distingue de la carte d'aide par
   *rien* de visuel. → mode d'échec nommé par R5 (« même poids visuel partout ») et
   contraire à R4 (l'action doit être la zone dominante).
2. **Un seul cran de surface.** Canvas `#FAF9F7`, cartes `#FFFFFF` : l'écart est de ~2 %
   de luminance et il n'existe **aucune** troisième surface. Interdire l'ombre sans
   étager les tons, c'est se priver de tout moyen de profondeur. → R2/R3 : la profondeur
   est une **échelle de surfaces**, pas une absence d'effets.
3. **Les chiffres sont timides.** Valeur KPI **20 px**/500 contre titre de carte 16 px/500
   et libellé 12 px : le rapport valeur/titre est de 1,25. Chez R1 le chiffre est le seul
   élément à grande taille de sa carte. Résultat : rien n'attire l'œil dans la carte KPI,
   alors que c'est la carte d'état. → R1, mécanisme 2.
4. **Tout est au même niveau de gris.** Un seul gris secondaire `#726E66` porte les
   libellés KPI, les sous-titres de carte, les dates d'événements, les noms de catégories
   et les icônes. Aucune gradation entre « libellé de métrique » et « métadonnée
   d'événement ». → R2 : la hiérarchie de texte est un étage, pas une couleur unique.
5. **Rythme d'espacement uniforme : 24 px partout.** `gap:24px` entre toutes les sections,
   `padding:16px` dans toutes les cartes. Aucun regroupement n'est lisible : la page se lit
   comme une liste de six éléments, pas comme « décision → état → analyse ». → R2
   (échelle 8/12/24/96), mécanisme 4.
6. **Six en-têtes décorés qui banalisent l'écran.** Chaque carte répète icône + titre, et
   deux d'entre elles ajoutent une phrase explicative (« Validations et réceptions qui vous
   attendent », « Ce qui vous attend »). Ce texte occupe la place qui devrait revenir au
   contenu, et l'uniformité des en-têtes efface la distinction entre une zone d'action et
   une zone d'analyse. → R1 (libellés courts, pas de phrase de contexte).
7. **L'anneau de garantie est le plus gros objet de l'écran — et il ne sert à aucune
   décision.** 136 px de diamètre, centré, en bas de page : la seule vraie masse visuelle
   est attribuée à de l'analyse pendant que la zone d'action est traitée en rangées de
   14 px. → R5 : la réponse à la question primaire doit être l'élément le plus proéminent.
8. **Les deux seuls points de contraste sont mal placés.** Le jaune (Attribuer) et le
   noir/blanc de la barre du bas sont les seuls écarts de contraste de la page, et le
   bouton jaune est **au-dessous** du bloc à traiter, donc l'œil est attiré par l'action
   secondaire avant la liste qui la déclenche. → R1 (un seul plein par bande, bien placé).
9. **Aucune référence pour les chiffres.** « 14 actifs », « 7 attribués » : pas de part,
   pas de tendance, pas de comparaison. → R5/tabulareditor. ⚠ **Point à vérifier avant la
   direction C** : l'historique nécessaire à une tendance (« +3 cette semaine ») **n'a pas
   pu être vérifié dans le code depuis ce projet** — je n'y ai pas accès. Tant que ce
   n'est pas confirmé, la direction C s'appuiera sur des **parts du total** (calculables
   depuis les compteurs existants) et **aucune flèche de tendance ne sera dessinée** ;
   je le marque comme hypothèse plutôt que d'inventer une donnée.

## Ce que l'autocritique ne remet pas en cause

L'arc de lecture (décision → état → analyse), les deux compositions pilotées par
`canManageInventory`, les icônes en gris neutre, la carte KPI unique à séparateurs, les
barres à la place de l'anneau multi-parts : la **structure** est jugée juste par la
phase 1. Le défaut est un défaut de **présence**, pas d'organisation.

---

# Phase 3 — Trois directions

Livrable : `screens/dashboard-piste.html` — réplique de l'actuel + directions A, B, C en
composition administrateur, puis la composition utilisateur de la direction recommandée.
Les pistes minimales précédentes sont dans `screens/archive/dashboard-piste-min-*.html`.

## Acquis partagés par les trois

Arc **décision → état → analyse → activité** ; rangée d'actions en tête (**Attribuer**
jaune plein — l'unique jaune du contenu — et **Restituer** noir plein) ; bloc « à traiter »
comme **zone dominante unique**, bouton dans la rangée ; KPI en **une** carte à
séparateurs (2×2 admin, 2+1 utilisateur) ; répartition en barres ; icônes gris neutre
`#8A847A` ; rouge sur le seul chiffre de « Réparation » ; 3 événements avec **agrégation**
des répétitions (« Vous avez ouvert 3 sessions — 11:21 → 15:01 », dépliable : **la rangée
entière est la cible**, 64 px de haut ; « Déplier » n'est qu'un indicateur, jamais un lien
de 12 px isolé) ; **aucun
lien « Voir tout »** (destination non vérifiée, voir questions) ; phrase « +40 pts »
supprimée ; graisses 400/500 ; rayons 2/4/8 ; cibles 48 px (les boutons de rangée passent
de 36 à **48 px** — correction d'une non-conformité des pistes précédentes).

## A — Surfaces tonales

**Parti pris.** La profondeur par étagement : canvas `#F2F0EA`, cartes `#FFFFFF`, zones
internes `#F7F5F0`. Le bloc « à traiter » se distingue par sa **surface** (padding 18 px,
titre 17 px, rangées posées sur une zone interne au rayon 4) ; les cartes d'analyse sont
plus plates et plus serrées (padding 14, titre 14 px). Rythme inégal : 20 px entre
groupes, 32 px avant le groupe d'analyse.
**Sacrifices.** L'écart canvas↔carte reste le seul levier et il est **faible par nature en
mode clair** ; la zone interne ajoute un niveau d'imbrication (carte → zone → rangée) qui
frôle la limite des deux niveaux ; à contre-jour ou sur un écran mal calibré, les trois
tons peuvent se confondre. **Résultat exploitable même si elle échoue** : elle établit
que l'échelle claire ne suffit pas seule à créer une dominante.

## B — Héro inversé  *(amendement du brief)*

**Parti pris.** Le noir chaud `#1A1917` devient une **surface**, celle du seul bloc
« à traiter » : texte blanc, secondaire `#C9C4BA`, filets `rgba(255,255,255,.14)`, boutons
de rangée sur `#33302B`. La dominante est obtenue par **inversion de contraste**, sans
ombre, sans jaune supplémentaire et sans grossir quoi que ce soit. Le compte
(« 2 demandes ») remplace la phrase explicative. Cohérent avec le bandeau noir du Login.
**Amendement demandé** : le brief ne prévoit le noir que comme couleur de texte. Material 3
documente exactement ce rôle (`inverseSurface` : une surface à contraste inversé pour une
zone qui doit trancher) — c'est l'appui de la proposition, pas une fantaisie.
**Sacrifices.** Deux masses sombres coexistent avec le bouton « Restituer » noir juste
au-dessus ; il a fallu séparer les deux par la rangée d'actions et ne jamais mettre de noir
ailleurs. Une seconde zone inversée casserait immédiatement la direction. Le mode sombre
futur devra rejouer l'inversion autrement.

## C — Data expressive

**Parti pris.** La présence par les chiffres : valeurs KPI **28/500** tabulaires, **parts
du total** sous les valeurs (« sur 14 »), répartition en rangées valeur + pourcentage avec
**micro-barre**, garantie en **jauge linéaire** (64 %, « 9 sur 14 ») au lieu de l'anneau,
compte « 2 » en 28 px dans le bloc « à traiter ». Un seul visuel par métrique.
**Sacrifices.** Sur un parc de 14 objets, des chiffres de 28 px sur de petites valeurs
peuvent paraître emphatiques ; l'écran s'allonge (rangée + barre) ; la suppression de
l'anneau retire le seul objet non textuel de la page, ce qui la rend plus austère. Aucune
tendance : **il n'existe pas de série temporelle**, donc aucune flèche ni delta — décision
du 26/07.

## Recommandation — direction B

1. Elle crée une dominante **mesurable** (inversion ≈ 15:1 contre 1,03:1 pour un écart de
   surface clair), là où A dépend d'un écart que le mode clair comprime.
2. Elle ne dépense **aucun budget de couleur** : pas de jaune, pas de sémantique détournée.
3. Elle est **déjà dans l'ADN** : le bandeau noir du Login retenu la légitime, le dashboard
   devient le second point d'ancrage de ce vocabulaire.
4. Elle laisse A et C **cumulables** plus tard (l'échelle de surfaces et la taille des
   chiffres sont indépendantes de l'inversion).
5. Coût honnête : elle demande un amendement du brief et une règle explicite — **une seule
   surface inversée par écran**.

## Points nécessitant un amendement du brief

- **Noir `#1A1917` comme surface** (direction B) — aujourd'hui couleur de texte uniquement.
  Règle proposée : une seule surface inversée par écran, réservée à la zone d'action.
- **Échelle de surfaces réétalée** : canvas `#F2F0EA`, carte `#FFFFFF`, zone interne
  `#F7F5F0` — la valeur `#F5F3EF` proposée d'abord a été refusée (2 % du blanc). À porter
  dans la couche sémantique `--tk-*`, jamais en dur.
- **Filets 0,5–1 px comme séparateurs internes** : à inscrire explicitement comme
  contrepoids de l'interdit « bordure + ombre » (une carte sans aucune délimitation interne
  produit de la surcharge — source R4).
- **Ordre des sections** : activité **en dernier**, alors que le code la place avant les
  graphiques. Proposition de composition, pas un constat.
- **Agrégation des événements répétés** : mécanisme nouveau, à spécifier — règle de
  regroupement, libellé, état déplié, et **la rangée entière comme zone tactile** (64 px) ;
  l'indicateur « Déplier » ne doit jamais être une cible isolée.
- **Boutons de rangée à 48 px** : les pistes précédentes étaient à 36 px, sous la cible.

## Questions à poser à Claude Code (bloquantes pour l'implémentation, pas pour le dessin)

1. Existe-t-il une **destination** pour un lien « Voir tout l'historique » (route
   d'activité) ? Sans elle, pas de lien — c'est l'état actuel du dessin.
2. « Derniers événements » est-il **filtré par rôle** ? (question ouverte depuis le §6 —
   fuite d'information possible côté utilisateur final).
3. Les événements portent-ils un **type** exploitable pour l'agrégation, ou faut-il
   regrouper sur (acteur + libellé) ?
4. Le libellé exact du bouton de retour est-il **« Retour matériel »** (existant) ou peut-il
   devenir **« Restituer »** ? Les directions utilisent « Restituer » comme demandé —
   c'est un renommage à valider côté code.

## Autocontrôle avant livraison

| Interdit | A | B | C |
| --- | --- | --- | --- |
| 1. Jaune ≤ 2 usages, jamais en fond d'onglet/carte/badge | 1 seul (Attribuer) | 1 | 1 |
| 2. Deux graisses (400/500) | ok | ok | ok |
| 3. Rayons 2/4/8 | 8 cartes, 4 contrôles/zones, 2 barres | ok | ok |
| 4. Aucune majuscule hors code technique | ok | ok | ok |
| 5. Pas de point d'exclamation, verbe + objet | ok | ok | ok |
| 6. Cartes sans bordure **et** sans ombre | ok | ok | ok |
| 7. Cibles ≥ 48 px | boutons 48, nav 56, **rangée agrégée 64** (le libellé « Déplier » n'est pas une cible isolée : c'est la rangée entière qui est cliquable) | ok | ok |
| 8. Rouge/vert/ambre porteurs de sens | rouge sur « Réparation » seul | ok | ok |
| 9. Deux niveaux d'imbrication | **limite atteinte** (carte → zone → rangée) | ok | ok |
| 10. Pas de bouton désactivé + phrase d'instruction | aucun bouton désactivé | ok | ok |
| Pas de carte de stats orpheline | KPI en une carte | ok | ok |
| Une seule zone dominante | « à traiter » | « à traiter » | « à traiter » |
| Aucune donnée inventée | jeu de démo de l'app ; parts recalculées ; aucune tendance | idem | idem |

Deux honnêtetés maintenues sur la page : le bloc « à traiter » admin est **de la
démonstration** (la capture réelle n'en montre aucun) et la composition utilisateur est une
**reconstruction** (aucune capture de cette vue n'existe).


## Régimes de charge du bloc « À traiter » — arbitrage du 28/07

**Question posée :** que devient la zone « À traiter » à 999 demandes ?

**Diagnostic.** Le défaut n'est pas la longueur de la liste, c'est qu'une **liste non bornée** occupe le milieu d'une page qui défile : au-delà d'une vingtaine d'entrées, tout ce qui est en dessous (état du parc, argent, garantie, activité) devient inatteignable, et l'architecture de l'écran est détruite par la donnée. Deuxième défaut, plus profond : à 999, la **rangée individuelle perd son sens** — personne ne valide 999 demandes une par une en défilant.

**Écarté :** hauteur maximale + défilement interne. Sur mobile, un défilement imbriqué ne se distingue pas du défilement de page et rend le bas de l'écran difficile à atteindre.

**Retenu :** la zone est **bornée** — elle **change de forme** selon le volume au lieu de le suivre. Chaque régime est une composition à **nombre de lignes fixe** : sa hauteur dépend de sa forme, jamais du volume de la file. Un régime saturé occupe donc la même place à 999 qu'à 20 000 demandes — là où une liste non bornée dépasserait 60 000 px. Aucune hauteur en pixels n'est consignée ici : elle dériverait au premier ajustement de composition.

| Volume | Forme |
|---|---|
| 0 | La zone reste (pas de saut de mise en page d'un jour à l'autre) mais s'apaise : motif, « Rien à traiter ». |
| 1–3 | Rangées complètes, action directe sur place. |
| 4–20 | Les 2 plus anciennes + « Voir les N autres », qui porte aussi l'attente la plus longue → la file. Le dashboard montre un **échantillon**, jamais la liste. |
| 20+ | Aucune rangée : volume en grand, attente la plus longue, répartition par nature d'action — chaque ligne étant elle-même l'entrée filtrée dans la file (pas de bouton supplémentaire, qui serait redondant). |

**Principe.** Le tableau de bord dit la **taille et la forme** du travail ; il n'est pas le lieu où on le fait. À saturation il doit **passer la main** à la file (onglet Tâches), pas l'héberger.

**Questions pour Claude Code :**
1. Le tri « par ancienneté » est-il disponible côté requête, ou faut-il l'ajouter ? L'indicateur « la plus ancienne depuis N jours » en dépend.
2. Les trois natures d'action (validation d'attribution, réception à confirmer, retour en retard) sont-elles trois requêtes distinctes ou un seul type filtrable ?
3. La file (onglet Tâches) permet-elle la **sélection multiple** ? À 999 c'est indispensable, et c'est hors du dashboard.
4. Le badge de la barre de navigation plafonne à « 99+ » — le compte total est-il déjà exposé, ou faut-il un appel dédié ?

**Barre du haut.** Logo Neemba retiré (l'app n'a pas à se présenter à chaque écran) et nom complet remplacé par un **avatar initiales 44 px** : le prénom est déjà dans le titre « Bonjour Alice », l'afficher deux fois est redondant.

**Planche nettoyée.** Directions « A — surfaces tonales » et « C — data expressive » retirées du document ; leurs partis pris restent décrits plus haut dans ce fichier.


## Destination des liens de travail — arbitrage du 28/07

**Question :** comment atteint-on « les 15 autres » ? Faut-il obligatoirement passer par l'onglet Tâches ?

**Retenu : une seule destination, la file « Tâches ».** Les liens du dashboard n'ouvrent pas un écran distinct — ils ouvrent le même, en **portant le filtre et le tri** :

| Lien | Ouvre |
|---|---|
| « Voir les 15 autres » | Tâches, trié par ancienneté |
| « 612 validations d'attribution » | Tâches, filtré sur les validations |
| « 287 réceptions à confirmer » | Tâches, filtré sur les réceptions |
| « 100 retours en retard » | Tâches, filtré sur les retards |
| Onglet Tâches touché directement | La file entière, non filtrée |

**Pourquoi pas un écran dédié :** un second inventaire de la même liste crée une deuxième source de vérité, deux comportements de retour arrière, et deux endroits à maintenir. Le dashboard est un point de départ, pas un contenant.

## Répartition par type à grand catalogue — arbitrage du 28/07

**Question :** que devient la carte quand le parc compte 9, 20, 40 types ?

**Même règle que « À traiter » :** la carte est **bornée aux 5 types les plus nombreux**, triés décroissant, suivis d'**une seule ligne d'agrégat** — « 4 autres types · 4 actifs » — qui ouvre Actifs. Six lignes maximum, quel que soit le catalogue. Avec les 4 types du jeu de démonstration, l'agrégat n'apparaît pas. Réglage « Variété du parc » pour voir le comportement à 9 types (hypothèse de répartition, **total inchangé à 14 actifs**, donc cohérent avec la carte de KPI et le bloc financier).

**Appliqué le 28/07 : « Répartition par type » remplacée par « Types en tension ».** Compter les unités de chaque type décrit le parc sans rien décider. La carte ne liste que les types à **0 unité disponible**, les plus nombreux d'abord — **bornée à cinq lignes**, au-delà desquelles une ligne d'agrégat ouvre Actifs. Sur les 8 catégories réelles du Catalogue, trois seulement sont en tension : l'agrégat ne se déclenche pas, et les catégories couvertes sont dites en une phrase. Pas de barre de proportion : à zéro disponible, une barre ne porte aucune information. Quand tous les types sont couverts, la carte le dit en une phrase au lieu de rester vide. La vue utilisateur **garde** « Mes équipements par type » : la notion de tension n'a pas de sens sur quatre équipements personnels.

**Questions pour Claude Code :**
1. La file Tâches accepte-t-elle un filtre et un tri en paramètres d'URL / de navigation ? Tout le raisonnement en dépend.
2. Le tri « par ancienneté » et le comptage « 5 premiers + reste » se font-ils côté serveur ? À grand parc, ramener tous les types pour n'en afficher que cinq est inutilement coûteux.
3. Le catalogue de types est-il fermé (énumération) ou libre à la saisie ? S'il est libre, l'agrégat n'est pas une commodité mais une nécessité.


## Les deux menus — arbitrage révisé du 29/07, après lecture des cinq onglets de Paramètres

### Ce que l'écran Paramètres contient réellement

L'arbitrage du 28/07 reposait sur une seule capture — celle de l'onglet ouvert par défaut. Les cinq
onglets relevés depuis changent la conclusion.

| Onglet | Contenu | Nature |
|---|---|---|
| Affichage | Thème (une phrase annonçant le mode sombre — **aucun réglage**) | personne, mais vide |
| Compte | Identité, Session, Mot de passe, 2FA | **personne** |
| Finances | Devise, année fiscale, notation compacte, aperçu amortissement | **entreprise** — badgé « GLOBAL » |
| Collecte | Agent GPO/Intune, clé d'API, fréquence de check-in, forward backend | **entreprise** (exploitation) |
| Aide | Documentation, Support, Tutoriels, FAQ, version du système | **méta** |

**L'application se contredit elle-même :** l'onglet Finances porte un badge « GLOBAL » pour prévenir
que ce qu'on y règle affecte tout le monde. Ce badge n'aurait aucune raison d'exister si l'écran
était homogène — c'est l'aveu que plusieurs périmètres cohabitent sous un même titre.

Et l'écart n'est pas à deux niveaux mais à **trois** : mon mot de passe / la devise de l'entreprise /
une clé d'API et une fréquence de sondage en minutes. Mettre les trois derrière la même barre
d'onglets, c'est traiter comme équivalents « qui suis-je », « comment on compte » et « comment la
machine collecte ».

### La règle, corrigée

Le 28/07 la règle était « avatar = la personne, Plus = l'application ». **L'onglet Aide l'invalide :**
l'aide n'est ni l'une ni l'autre. La règle juste est :

> Le menu de l'avatar porte **ce qui n'agit pas sur le parc** — moi, et l'application elle-même.
> La navigation porte **le parc**.

C'est aussi la convention des applications actuelles : l'aide, la version et le compte vivent dans le
menu du profil ; la configuration d'entreprise est une destination.

### Découpage appliqué

**Menu de l'avatar** — en-tête (initiales, nom, rôle) / *Mon profil* / *Mon compte* (= l'onglet Compte,
promu en écran) / *Aide et support* / séparateur / *Se déconnecter* / `Tracker v1.2.0` en pied de menu.

**Feuille « Plus »** — trois groupes, plus aucun groupe orphelin :

| Groupe | Écrans |
|---|---|
| Référentiel | Catalogue, Emplacements |
| Analyse | Finances, Rapports |
| Administration | Audit, Rôles et permissions, **Configuration** |

**Configuration** = les onglets Finances + Collecte. Le nom « Paramètres » ne dit plus rien une fois la
personne partie ailleurs, et il entrait en collision avec la destination « Finances » déjà présente
dans le groupe Analyse.

**Affichage disparaît.** Un onglet dont l'unique contenu annonce une fonctionnalité future n'est pas un
onglet, c'est une note de version. Il redeviendra une ligne dans *Mon compte* le jour où le mode
sombre existe — une préférence d'apparence n'a de sens qu'appliquée à une personne.

### Ce que le découpage referme

1. **Plus de double porte.** Avatar → Paramètres › Compte et Plus → Paramètres menaient au même écran.
2. **Plus de groupe à une seule entrée** (« Réglages » n'existe plus).
3. **La barre d'onglets de Configuration tombe à 2** : plus de défilement horizontal, plus de chevrons
   aux deux bouts, plus de compteur « 5 » — **et l'onglet actif peut quitter l'aplat jaune, ce qui
   referme le manquement §8.1** (jaune en fond d'onglet). Le découpage supprime la violation au lieu
   de la déplacer.
4. **Point 6 clos** (barre du bas non adaptée au rôle) : une fois Mon compte et l'Aide sous l'avatar, un
   utilisateur simple n'a plus aucune destination dans « Plus » → sa barre passe à **4 onglets**.
5. **Point 7 clos** : la carte morte « Besoin d'aide ? » est retirée des deux vues. Le centre d'aide
   existait déjà — enterré au cinquième onglet d'un écran atteint par un menu de débordement. Un
   utilisateur qui bloquait faisait quatre gestes ; il en fait deux.
6. **L'aide est atteignable par tous les rôles**, y compris ceux qui n'ont aucune destination
   d'administration.

### Corrections mécaniques appliquées aux deux menus

- Rangées du menu avatar portées de **44 à 48 px** (règle §4.7).
- Rayon de la feuille « Plus » ramené de **12 à 8 px** (échelle 2/4/8, §8.3).
- **Poignée de glissement** ajoutée en tête de feuille (attendue sur Android).
- **Fermeture** : voile cliquable, touche Échap, un seul menu ouvert à la fois.
- **Double état actif corrigé** : feuille ouverte, « Plus » ne prend plus la couleur d'encre pleine
  (qui le faisait lire comme une seconde destination courante) mais un aplat de surface — il dit
  « menu ouvert », pas « vous êtes ici ». « Accueil » reste seul en état actif.
- **Sous-titres homogénéisés** : le décompte isolé de « Catalogue » est retiré (un seul sous-titre sur
  huit entrées) ; dans le menu avatar, les trois destinations en portent un, l'action terminale
  (« Se déconnecter ») en est séparée par un filet.
- **« Paramètres › Compte » supprimé** comme sous-titre : un chemin de navigation interne exposé à
  l'utilisateur. Remplacé par ce qu'on y fait — « Mot de passe, 2FA, session ».

**Le rôle reste affiché** (« Super-administrateur », « Utilisateur · Atelier ») : c'est lui qui explique
pourquoi le tableau de bord ne montre pas la même chose à deux personnes.

**Alignement des KPI.** La vue utilisateur reçoit le même traitement que l'admin : pastille d'état devant
le libellé et tuile teintée en intensité « assumée ». Bleu sur « Demandes en cours » (en circulation),
orange sur « Réceptions à confirmer » (action attendue de la personne), neutre sur « Mes équipements »
(un total ne porte pas d'état).

### Relevés sur les onglets, à traiter hors maquette

1. **Le bouton d'enregistrement est au-dessus de la barre d'onglets** — donc au-dessus du sélecteur qui
   décide de ce qu'il enregistre — et son libellé change selon l'onglet (« Enregistrer finances »,
   « Enregistrer collecte »). C'est l'écran qui avoue être plusieurs écrans.
2. **La clé d'API est affichée en clair** dans un champ texte. Masquage + révélation explicite.
3. **« Déconnexion » en rouge bordé** dans une rangée de carte — §8.2.
4. **2FA inactive sur un compte super-administrateur**, signalée par un bandeau enterré au quatrième
   niveau de navigation. Si c'est un vrai risque, il remonte dans le menu de l'avatar ; sinon l'alerte
   ne sert à rien.
5. **Cinq compteurs à zéro** dans Collecte (dont un rouge). Cinq cases vides disent moins qu'une phrase.
6. **Le bandeau « Données de démonstration »** de l'onglet Aide est un artefact qui ne doit pas partir
   en production.
7. **Quatre cartes bordées pour quatre liens d'une ligne** dans le centre d'aide : une liste déguisée
   en cartes.

**Questions pour Claude Code :**
1. Le changement de mot de passe est-il géré dans l'app ou délégué à l'annuaire (AD / SSO) ? S'il est délégué, l'entrée disparaît.
2. Le rôle affiché doit-il être le libellé technique renvoyé par l'API ou un libellé métier traduit ? La maquette suppose le second.
3. Une personne peut-elle appartenir à plusieurs sites / entités ? Si oui, le sélecteur de périmètre appartient à ce menu — et il change tout ce que l'écran affiche.
4. Le nombre de **disponibles par type** est-il exposé par l'API ? La carte « Types en tension » en dépend entièrement.
5. Découper l'écran Paramètres en deux routes (*Mon compte* / *Configuration*) est-il coûteux, ou les onglets sont-ils déjà des composants indépendants ?
6. L'onglet Collecte est-il visible par tous les administrateurs ou réservé au super-administrateur ? S'il est réservé, Configuration est une destination à droits, pas une destination d'administration.


## Onglet « Plus » — inventaire réel et regroupement, 28/07

Les quatre onglets couvrent quatre écrans : Accueil → Tableau de bord, Actifs → Inventaire, Tâches → Approbations, Équipe → Utilisateurs. **Les sept écrans restants tombent donc tous dans « Plus »** : Catalogue, Emplacements, Finances, Rapports, Audit, Rôles et permissions, Paramètres.

Sept entrées à plat sont un mur. Regroupées par **nature de la chose manipulée**, elles tiennent dans un écran et s'apprennent :

| Groupe | Écrans | Ce que le groupe manipule |
|---|---|---|
| Référentiel | Catalogue, Emplacements | Ce qui **définit** le parc avant qu'il existe |
| Analyse | Finances, Rapports | Ce qui **lit** le parc sans le modifier |
| Contrôle | Audit, Rôles et permissions | Ce qui **surveille** qui a fait quoi et qui peut quoi |
| Réglages | Paramètres | Le reste |

> **Périmé au 29/07.** Ce regroupement supposait que « Paramètres » était une destination unique. Après
> découpage, le groupe « Contrôle » devient **Administration** et accueille **Configuration** ; le groupe
> « Réglages » disparaît. Voir l'arbitrage révisé ci-dessus.

Rendu en **feuille montante** depuis la barre du bas, avec voile : c'est un menu de navigation, pas un écran — il ne mérite pas une page.

## La carte « Garantie » — mise au régime, 29/07

**Le constat.** Un anneau de 120 px, son trou, un pourcentage au centre, deux lignes de légende
à pastille : environ un tiers de hauteur d'écran pour dire « 9 sur 14 ». À côté, « Types en
tension » énonce une décision en trois lignes. Le rapport surface / information était le pire
de l'écran.

**Et l'anneau ne disait pas ce qui compte.** Une proportion à deux parts est déjà entièrement
contenue dans sa phrase : « 9 sur 14, soit 64 % ». Le cercle n'ajoute rien qu'un chiffre
n'ait dit — il ne se compare à rien (il n'y a pas d'autre anneau), il ne se lit pas plus vite,
et il coûtait la moitié du budget vertical de la section « analyse ».

**Appliqué.** La carte reste, réduite à une rangée :

| Élément | Rôle |
|---|---|
| Le chiffre, au corps des KPI | Ce qu'on retient |
| « équipements sur 14 sont couverts » | Ce que le chiffre veut dire, avec son dénominateur |
| Le pourcentage, à droite | La lecture relative, pour qui la préfère |
| Filet de proportion, 6 px | La forme du rapport, sans géométrie |
| Ligne de conséquence | **Ce que l'anneau ne disait pas** |

La ligne de conséquence est le vrai gain : « 5 hors garantie, aucun sans date de fin. La valeur
de remise en état de ces 5 n'est pas provisionnée. » L'anneau affichait une part ; la rangée
énonce un risque. Même donnée, deux fois moins de hauteur, une décision de plus.

Côté utilisateur, la même rangée nomme l'équipement concerné (« 1 hors garantie : Dell Latitude
5540, depuis mars 2026 ») — sur quatre équipements, une part de camembert était absurde et
l'identité de la machine est la seule chose utile.

**Ce que ça change ailleurs :** plus aucun anneau ni camembert dans la direction retenue. La
règle du 28/07 (« anneau conservé pour une proportion unique, barres pour le multi-catégories »)
devient : **une proportion unique se dit en une rangée ; le multi-catégories en barres.** Le
CSS de l'anneau et ses deux règles de réglage (échelle tonale « franc », densité « compacte »)
sont retirés — ils n'avaient plus de cible.

### La fusion — appliquée le 29/07, décision déléguée à la conception

L'arbitrage sur le bloc financier a été laissé à ma main. **Tranché : fusion.** Trois raisons.

**« Total dépenses » n'était pas une métrique, c'était un dénominateur.** Deux chiffres côte à
côte (17 615 investis / 8 276 actuels) laissaient le rapport entre eux à la charge du lecteur —
alors que ce rapport *est* l'information. Écrit en une rangée, « 8 276 XOF de valeur restante
sur 17 615 investis — 47 % », le calcul est fait et une carte entière disparaît.

**Les deux rangées partagent la même grammaire** : une part d'un tout, dite en « X sur Y » plus
un pourcentage plus un filet. Deux chiffres de même forme dans deux cartes séparées demandaient
au lecteur de découvrir deux fois la même mécanique de lecture.

**Une seule carte, un seul lien.** Le grief initial — le bloc financier double l'écran Finances
sur deux écrans et demi de défilement — se règle en ramenant le dashboard à ce qu'il doit
faire : dire la taille et la forme, puis renvoyer. *Détail financier → dans Finances*.

**Ce que la fusion préserve :** la distinction de couleur reste sémantique — le filet de valeur
prend `--data`, celui de la garantie une teinte d'état. *(Note du 29/07 : au réglage par défaut
`--data` est indiscernable de l'encre ; la distinction ne tient donc que sous le réglage « accent
sur la donnée ». Le repère de rythme ne s'appuie plus sur la couleur mais sur la **géométrie** — il
dépasse le filet de 4 px en haut et en bas, avec un liseré de surface, donc il reste lisible que le
remplissage l'ait franchi ou non.)* Et la
provenance est enfin déclarée : « Estimation issue de l'amortissement paramétré par catégorie,
pas d'une réévaluation. » L'amortissement est paramétré par catégorie dans l'application ; la
valeur actuelle en découlait sans jamais le dire, ce qui faisait passer une estimation pour une
mesure.

**Bilan de la section « analyse » :** trois cartes (financier, garantie, types) deviennent deux,
et l'écran perd environ un écran de défilement sans perdre un seul chiffre.

**La vue utilisateur ne fusionne pas** : elle n'a pas de bloc financier — un utilisateur ne voit
pas la valeur du parc. Sa carte reste « Garantie de mes équipements », en une rangée qui nomme
la machine concernée.

### Correction du 29/07 après lecture de l'onglet Synthèse de Finances

**L'erreur.** La rangée disait « 8 276 XOF de valeur restante sur 17 615 investis — 47 % ». Le mot
« restante » se lit comme une valeur de revente, alors que 8 276 est la **valeur nette comptable**
— exactement ce qu'il reste à amortir. Les 9 339 XOF de différence ne sont pas perdus : ils sont
**déjà passés en charge**. La rangée présentait un solde d'écriture comptable comme s'il s'agissait
de la valeur du parc.

**Pire : les deux chiffres existaient déjà, nommés, sur l'écran Finances.** « VALEUR DU PARC
8 276 XOF — valeur nette comptable après amortissement » et « EFFICACITÉ DES ACTIFS 47,0 % —
valeur résiduelle du parc ». Le dashboard rejouait deux cartes de Finances sous un libellé inventé.
C'était exactement le doublon que la fusion prétendait supprimer, déplacé d'un cran.

**Ce que l'onglet Synthèse contient réellement :** valeur du parc (8 276), amortissement mensuel
(390 XOF de charge qui court), efficacité des actifs (47,0 %), **risque fin de vie : 2 actifs
amortis à plus de 85 %**, une projection de dépréciation sur 6 mois, et une « valeur par entité »
(France / Sénégal / Togo) badgée DÉMO. Deux autres onglets — **Journal** et **Pilotage** — n'ont
pas été capturés ; c'est là que vivent vraisemblablement les budgets et les dépenses.

**Le bon chiffre était juste à côté.** « Risque fin de vie : 2 » décide quelque chose : ces deux
machines sont à remplacer. « 47 % » ne décide rien — c'est un ratio comptable qui bouge de 390 XOF
par mois quoi qu'on fasse. Un tableau de bord montre ce sur quoi on peut agir.

**Appliqué.** « État du parc » porte deux rangées de **même nature — du risque non provisionné** :

| Rangée | Fait | Décision qu'elle porte |
|---|---|---|
| 2 sur 14 en fin de vie comptable | Amortis à plus de 85 % | Remplacer avant la panne |
| 5 sur 14 hors garantie | Aucun sans date de fin | Provisionner la remise en état |

Les deux filets se remplissent de la **part à risque**, tous deux en orange LIVE : même nature de
fait, même encodage, deux proportions différentes. Le vert a été retiré de la garantie — il
mesurait la part couverte, alors que la rangée nomme désormais la part qui ne l'est pas ; le
garder aurait fait dire « bien » à un filet qui dit « exposé ».

**L'argent n'est pas supprimé, il est subordonné.** Il vit dans le lien de bas de carte :
« Valeur nette comptable 8 276 XOF, soit 47 % → dans Finances ». Le vocabulaire est celui de
l'application, le dashboard ne le paraphrase plus, et la carte ne redit rien de ce que Finances
dit mieux.

**Découverte non liée mais lourde :** la « valeur par entité » implique un parc **multi-entités**
(trois pays). Si c'est réel et pas seulement de la démo, le sélecteur de périmètre appartient au
menu de l'avatar et il change tout ce que chaque écran affiche — y compris tous les « sur 14 » de
ce dashboard.

## Argent : trois natures, pas une section — 29/07 (onglets Journal et Pilotage lus)

**Le grief.** « État du parc » mélangeait la garantie, la valeur comptable et — dans l'intention — le
cumul des dépenses. Réponse : **non, ce n'est pas bien**, et la raison n'est pas une question de
place. Ce sont trois natures qui ne partagent que leur unité.

| Nature | Horloge | Décision qu'elle porte |
|---|---|---|
| **Le parc physique** — garantie, fin de vie comptable | continue, par équipement | Remplacer, provisionner |
| **La valeur comptable** — VNC 8 276, 390 XOF/mois, 47 % | mécanique, mensuelle, **subie** | **aucune** |
| **Le budget de l'exercice** — 17 440 dépensés, 132 560 restants, 11,6 % consommé, par enveloppe CAPEX/OPEX | annuelle, **remise à zéro** | Engager ou non, réallouer |

**Le test qui tranche : qu'est-ce qui change si le chiffre bouge ?** Le budget consommé fait
arbitrer un engagement. La fin de vie fait remplacer une machine. La valeur nette comptable ne fait
rien — elle baisse de 390 XOF par mois quoi qu'on décide. Un tableau de bord porte ce sur quoi on
agit ; le reste est du reporting, et le reporting a déjà son écran.

**Le piège :** les trois sont « de l'argent en XOF », ce qui les fait paraître de la même famille.
La nature d'un chiffre n'est pas son unité. L'amortissement regarde le passé d'un actif, le budget
regarde l'année en cours, la garantie regarde le risque à venir.

### Structure appliquée : deux cartes, et l'amortissement sort

1. **« État du parc »** — le risque physique, inchangé : 2 sur 14 en fin de vie comptable, 5 sur 14
   hors garantie. **La ligne de valeur nette comptable est retirée** : elle n'y décidait rien. Le
   lien de pied devient *Valeur et amortissement → dans Finances* — il nomme ce qu'on y trouvera au
   lieu de le résumer de travers.
2. **« Budget 2026 »** — carte nouvelle, l'engagement, en deux rangées de même grammaire que
   « État du parc » :
   - **17 440 XOF engagés sur les 150 000 alloués — 11,6 %.** Note : « au premier quart de
     l'exercice, le rythme tient ; 132 560 XOF restent disponibles ». **La conséquence de rythme est
     l'information, pas le montant** : 11,6 % consommé au bout de 25 % de l'année dit « nous sommes
     en dessous du plan » — un pourcentage seul ne le dit pas.
   - **12 500 XOF sur les 85 000 de Matériel IT (CAPEX) — 15 %**, l'enveloppe la plus avancée, avec
     « les trois autres restent sous 10 % ». Une enveloppe nommée, pas les quatre : Pilotage les
     détaille déjà, et la seule qui décide quelque chose est celle qui se rapproche du bord.
   - Lien : *Détail par enveloppe → dans Pilotage*.

   Le montant est en tête ici, alors que la quantité l'est dans « État du parc » — application
   directe de la règle ci-dessous. **Révisé en 2ᵉ passe le même jour :** la rangée d'enveloppe est
   retirée (le dashboard porte le global) et un **repère de rythme** est posé sur le filet. Voir
   « Budget et amortissement — analyse approfondie ».

### Quantité ou montant ? Les deux, mais jamais au même rang

Règle : **le dashboard compte des choses quand on agit sur des choses, et de l'argent quand on
engage de l'argent.**

- Fin de vie et garantie → on remplace des **machines** : la quantité en tête, le montant en note
  (« ce que coûterait leur remise en état »).
- Budget → on engage de l'**argent** : le montant en tête, le nombre de dépenses en note.

La rangée mise au point pour la garantie porte déjà les deux rangs (chiffre / phrase / pourcentage /
filet / conséquence) — il suffit de choisir lequel occupe le premier.

### Deux anomalies relevées au passage, à vérifier côté code

1. **Deux « total dépenses » qui ne s'accordent pas** : 17 615 XOF sur le dashboard, **17 440 XOF sur
   le Journal** (« Total dépenses Q1, exercice 2026 »). 175 XOF d'écart sous des noms presque
   identiques. Hypothèse : le dashboard additionne les **prix d'acquisition des actifs**, le Journal
   additionne les **transactions de l'exercice**. Ce sont deux notions distinctes ; si elles portent
   le même libellé, c'est une dette de vocabulaire avant d'être un défaut d'affichage.
2. **Le scan existe déjà** : « Nouvelle Dépense — scanner facture ou saisie manuelle ». La
   suggestion faite plus haut d'un scan de code-barres pour Attribuer / Restituer n'est donc pas une
   invention de maquette — l'application a déjà ce geste dans son vocabulaire.

## Budget et amortissement — analyse approfondie, 29/07 (2ᵉ passe)

### 1. Tu as raison sur la ventilation : le dashboard porte le global

Afficher « Matériel IT 12 500 sur 85 000 » sur le tableau de bord, c'était **commencer la
ventilation sans la finir** : une enveloppe sur quatre, choisie par moi, sans que le lecteur sache
sur quel critère. Soit on montre les quatre — c'est Pilotage, et il le fait mieux — soit on montre
le total. **Retiré.** Une seule rangée : 17 440 XOF engagés sur les 150 000 de l'exercice, 11,6 %.

**Mais le global seul cache un cas :** le total peut être rassurant pendant qu'une enveloppe est
déjà crevée. La réponse n'est pas de ventiler par précaution, c'est de **dire l'exception quand
elle existe**. La note porte donc « aucune des quatre enveloppes ne dépasse son rythme » — et le
jour où l'une le dépasse, c'est elle, nommée, qui apparaît. On montre ce qui sort de l'ordinaire,
jamais la liste complète au cas où.

### 2. L'amélioration qui vaut le plus : le repère de rythme

Un budget consommé à 11,6 % n'est ni bon ni mauvais tant qu'on ne sait pas **où on en est de
l'année**. Le même chiffre est excellent en décembre et alarmant en janvier. L'écran Pilotage et
l'écran Journal affichent tous deux un filet de consommation nu — donc un chiffre qu'on ne peut pas
juger.

**Appliqué : un repère vertical sur le filet, posé au quart d'exercice écoulé.** Le remplissage
s'arrête avant : l'engagement est **13 points sous le rythme**. Le filet dit maintenant quelque
chose qu'aucun nombre ne dit — *en avance ou en retard* — et le dit sans mot, en un coup d'œil.
C'est la seule information budgétaire réellement décisionnelle à ce niveau : soit on est dans les
bornes, soit on va les franchir avant la fin de l'exercice.

Le repère est explicité dans la note (« le repère marque le quart d'exercice écoulé ») : une marque
graphique non légendée est une devinette.

### 3. Où passe l'amortissement — il n'a pas disparu, il a changé de forme

C'est le point sur lequel il faut être précis, car retirer la valeur nette comptable a pu donner
l'impression d'avoir jeté l'amortissement.

L'amortissement a **trois expressions possibles**, et une seule porte une décision :

| Expression | Ce que ça dit | Décision |
|---|---|---|
| VNC 8 276 XOF | Ce qu'il reste à passer en charge | aucune — c'est un solde |
| Efficacité 47 % | La position du parc sur sa courbe | aucune — un ratio moyen |
| **2 actifs amortis à plus de 85 %** | **Ces deux machines arrivent au bout** | **les renouveler** |

Le dashboard garde donc **la troisième**, en tête de « État du parc » : *2 sur 14 arrivent en fin de
vie comptable*. C'est le taux d'amortissement, mais exprimé en **objets à traiter** plutôt qu'en
solde comptable. Les deux autres expressions restent derrière le lien *Valeur et amortissement →
dans Finances*, où elles ont leur place : Finances est l'écran du comptable, le dashboard est
l'écran de celui qui décide.

### 4. Le vrai manque du produit : le pont entre les deux

Voici la question qu'un responsable se pose réellement, et à laquelle **aucun écran de
l'application ne répond aujourd'hui** :

> Les machines qui arrivent en bout de course, ai-je le budget pour les remplacer ?

Elle exige les deux blocs à la fois : la pression de renouvellement (côté parc) et l'enveloppe
CAPEX disponible (côté budget). Synthèse a l'une, Pilotage a l'autre, personne ne les met en
regard. **C'est le seul endroit où le dashboard peut être meilleur que la somme de ses écrans.**

**Appliqué, sous la forme la plus honnête possible avec les données existantes :** la note de la
rangée « fin de vie » dit désormais *« leur renouvellement s'impute sur Matériel IT, où 72 500 XOF
restent engageables »*. Deux faits vérifiables, mis côte à côte, et le lecteur fait le rapprochement
que l'application ne faisait pas.

**Ce que je n'ai pas écrit, faute de donnée :** le **coût estimé** du renouvellement de ces deux
machines. C'est ce qui transformerait la note en verdict (« 72 500 disponibles, ~50 000
nécessaires : couvert »). Le prix d'acquisition existe par actif, et le Catalogue tient les modèles
— la donnée est probablement dérivable, mais elle serait une **estimation**, et une estimation ne
part pas dans une maquette de référence sans être déclarée. **Question ouverte n°10.**

### 5. Pourquoi deux cartes et non une

« État du parc » et « Budget 2026 » restent séparées, malgré le pont, parce qu'elles n'ont ni le
même horizon ni le même propriétaire :

- **État du parc** regarde des **objets**, sans date de fin, et se règle par des remplacements.
- **Budget 2026** regarde une **enveloppe**, avec une date de fin, et se règle par des arbitrages.
  Il **repart de zéro** le 1ᵉʳ janvier ; le parc, non.

Les fusionner obligerait à mélanger un compteur d'objets et un compteur d'argent sous un même titre
— précisément le défaut qu'on vient de corriger. Le pont dans la note fait le lien sans faire
l'amalgame.

## Autres améliorations relevées, non appliquées

1. **Deux vocabulaires pour la même chose.** Le dashboard groupe par « Laptop / Monitor / Mouse / Headphones » (anglais) ; l'écran Catalogue gère huit **catégories en français** (Mobilier, Casque, Clavier, Ordinateur portable, Moniteur, Souris, Imprimante, Serveur). *Appliqué dans la maquette* — le dashboard reprend le vocabulaire du Catalogue. Reste à trancher côté code : le dashboard groupe-t-il sur `asset.type` (champ libre) ou sur la catégorie du Catalogue ? Si ce sont deux champs distincts, c'est une dette de modèle, pas de libellé.

2. **Le bloc financier du dashboard double l'écran Finances** (2,5 écrans de la même matière). Suggestion : ne garder qu'un chiffre — la valeur actuelle — et un lien vers Finances. Deux chiffres sans contexte n'aident aucune décision ; l'écran Finances, lui, les explique.

3. **Deux catégories du Catalogue n'ont aucun actif** (Mobilier, Serveur). Un signal « catalogue à nettoyer » appartient à l'écran Catalogue, pas au dashboard — mais il vaut la peine d'exister : une catégorie vide fausse toute lecture par catégorie.

4. **L'amortissement est paramétré par catégorie** (linéaire / dégressif, 2 à 10 ans — relevé sur `gestion.png`). La « valeur actuelle » du dashboard en découle sans jamais le dire. Une mention de provenance (« selon les durées du Catalogue ») éviterait de faire passer une estimation pour une mesure.

5. **Emplacements occupe trois écrans** et le dashboard ne dit rien du **où**. Pour une entreprise multi-sites, « par emplacement » décide probablement plus que « par catégorie ». À trancher : le parc est-il réparti sur plusieurs sites ?

6. ~~**La barre du bas ne s'adapte pas au rôle.**~~ **Clos le 29/07** — appliqué. Une fois *Mon compte* et *Aide et support* passés sous l'avatar, un utilisateur simple n'a plus aucune destination dans « Plus » : sa barre passe à quatre onglets. Reste à confirmer côté code qu'il n'a pas non plus accès à Équipe.

7. ~~**« Besoin d'aide ? » est une carte vide**~~ **Clos le 29/07** — retirée des deux vues. Le centre d'aide existait déjà dans l'application (onglet Aide de Paramètres) ; il est remonté dans le menu de l'avatar sous *Aide et support*. Le contenu et l'affordance existaient tous les deux — ils ne s'étaient jamais rencontrés.
