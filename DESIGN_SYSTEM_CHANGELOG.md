# Journal du Tracker DS

Toute évolution de la couche de tokens (`index.css`, `tailwind.config.js`) ou de
la librairie (`src/components/ui/**`) s'inscrit ici. Un changement de composant
absent de ce journal est, du point de vue du DS, un changement qui n'a pas eu
lieu (voir la définition de « terminé », `DESIGN_SYSTEM.md` §14.3).

**Format d'une entrée**

```
## [version] — AAAA-MM-JJ

### Ajouté / Modifié / Corrigé / Déprécié / Retiré
- `Composant` — ce qui change, et **pourquoi**. Impact sur le rendu au repos :
  aucun / re-baseline nécessaire (checkpoints concernés).
```

Trois règles :

- On écrit **pourquoi**, pas seulement quoi. « Ajout de `active:scale` » n'a
  aucune valeur six mois plus tard ; « le composant annonçait un état pressé
  qu'il n'implémentait pas » en a.
- L'**impact sur le rendu au repos** est toujours déclaré. C'est ce qui décide
  s'il faut re-baseliner les références visuelles.
- Une dépréciation annonce son **remplaçant** et sa date de retrait.

---

## [2.3.0] — 2026-08-16

**Cinquième écran porté : Paramètres** (planche **14.1**). Le premier dont le portage est
surtout un **retrait** : 891 lignes derrière cinq onglets deviennent une liste de destinations.

### Ajouté

- **`RuleGroup`** — le **groupe à filets** de la règle **R4** (planche 00.1), enfin un composant.
  *« Le filet remplace la carte : une carte porte un sujet, une suite de réglages est un groupe
  dans une seule surface. »* Il était **recopié à la main** dans `UserDetailsPage` (05.2), et
  14.1 comme 11.1 allaient le recopier à leur tour : trois copies d'un rôle que le registre
  déclare une fois. La rangée fait **56 px** — ni la rangée de liste (72, `ListRow`) ni la
  rangée de référence (44, `ReferenceRow`) — et porte au plus quatre choses : ce qu'on règle,
  ce que le réglage décide, sa valeur, de quoi l'ouvrir.
  - `status` et `value` vont **ensemble** : le glyphe prend la teinte, la valeur porte le mot
    (I3, §0.3). Une pastille muette n'est pas un état.
  - `external` remplace le chevron par le glyphe de sortie : une rangée qui renvoie ailleurs
    le dit **avant** le clic.
  - **Écart de déclaration relevé** : `.gnote` vaut 11/16 sur `ink3` en 05.2 et 11.1, et 12/17
    sur `ink2` en 14.1. §2.26 tranche par la majorité — le composant porte 11/16, et c'est
    **14.1 qui est à corriger côté planche**.
  - Impact sur le rendu au repos : aucun (composant neuf ; `UserDetailsPage` garde sa copie
    manuscrite tant que sa migration n'est pas prouvée au pixel).
- **`APP_CONFIG.supportEmail`** — l'adresse du support quitte le code d'un pavé mort pour un
  réglage d'organisation. **Vide, la ligne ne s'affiche pas** : un écran de réglages ne porte
  pas une adresse qu'on n'a pas.

### Modifié

- **`SettingsPage`** — porté sur 14.1. Les cinq onglets — *Affichage · Compte & Sécurité ·
  Finances & Paramètres · Collecte automatique · Aide* — tombent au profit de **quatre groupes
  rangés par propriétaire** : ce qui est à vous, à l'entreprise, à l'informatique, et ce qui ne
  se règle pas. **La valeur passe à droite**, où elle se lit sans ouvrir, et le sous-titre dit
  la **conséquence** au lieu de répéter la valeur.
  - **Le bouton « Enregistrer » disparaît.** Il apparaissait sur deux onglets sur cinq et
    changeait de nom selon celui qu'on regardait — ce qui apprend qu'un réglage posé ne compte
    pas tant qu'on n'a pas trouvé le bouton. Un réglage s'applique **au geste**. Il ne reste
    qu'en **pied de feuille**, là où des champs valent ensemble ou pas du tout : les
    identifiants d'une source.
  - **La section « Affichage » tombe** : un seul réglage qu'on ne peut pas changer, et la
    promesse *« Le mode sombre sera proposé dans une prochaine version »*. On n'annonce pas ce
    qui n'existe pas ; le clair est une **décision d'identité**. Le fait descend en ligne
    d'« À propos », au présent.
  - **Le « Centre d'aide » et ses quatre pavés tombent** — `<Button variant="outlined">` **sans
    `onClick`** : ils réagissaient au survol et ne menaient nulle part. Un geste mort est pire
    qu'un manque, et la promesse était faite quatre fois. Il en reste une ligne, conditionnelle.
  - **La file des machines détectées quitte l'écran** : ce n'est pas un réglage, c'est du
    travail. Paramètres règle les sources ; il ne garde pas leur produit.
  - **Le bouton « Mettre à jour » du mot de passe existait sans handler.** Il devient une
    feuille branchée sur `authService.changePassword`.
  - Impact sur le rendu au repos : **re-baseline nécessaire** — `settings`, sur les trois
    appareils, et rien d'autre.
- **`TasksPage`** — la tâche de collecte s'examinait dans **Paramètres** (`target: 'settings'`).
  Elle ouvre désormais une feuille **sur place**, avec les faits de la machine et les deux actes
  (importer, ignorer). Conséquence directe du retrait ci-dessus : sans elle, le geste renvoyait
  vers un écran qui ne porte plus la file. Impact au repos : aucun (feuille fermée).
- **`AddEquipmentPage`** — le troisième palier de la cascade d'amortissement (**fiche → type →
  défaut global**) était un `GLOBAL_FINANCIAL_SETTINGS` **écrit en dur**, si bien que le réglage
  « Amortissement par défaut » **n'avait aucun consommateur** : on pouvait le changer sans que
  rien ne bouge. Il lit maintenant `settings`. Relevé en portant 14.1, qui exige qu'un réglage
  dise ce qu'il change — encore faut-il qu'il change quelque chose. Valeurs par défaut
  identiques (`linear` / 3 ans / 0 %) : impact au repos **aucun**, et le point de contrôle
  `add_equipment` le confirme (match sur les trois appareils).
- **`AppLayout`** — `settings` rejoint `adnMobileViews` : l'écran porte sa propre barre, la
  barre d'application ne doit plus redire le titre.

### Relevé, non corrigé

- **`settings.renewalThreshold` et `settings.roundingRule` n'ont aucun consommateur** et aucun
  écran. Un réglage qui ne change rien ne mérite pas une rangée — ils restent hors de 14.1.
- **Le point de contrôle visuel était vert sur un `dist/` périmé.** Le run du 15/08 donnait
  39/39 ; celui du 16/08, précédé d'un `npm run build`, en donne 36 changés — dont
  `locations`, `reports`, `finance`, que ce portage ne touche pas. La différence visible est
  **la barre du bas**, passée aux pictogrammes Phosphor par du travail non commité. Le seul
  point sans barre du bas, `add_equipment`, est aussi le seul qui **matche**. La référence n'a
  donc **pas** été réécrite : elle accepterait 35 changements qui n'appartiennent pas à ce
  portage.

---

## [2.4.0] — 2026-08-16

**Sixième écran porté : Rôles et accès** (planche **11.1**). Le portage repose sur une
**correction de prémisse** : le relevé du 28/07 disait que l'application ne consommait qu'un
booléen et que redessiner la matrice serait redessiner une promesse creuse. Le code dit le
contraire — 24 clés déclarées, plus de cent appels. La matrice n'est pas une promesse, c'est le
moteur, et c'est pour cela qu'elle mérite un écran.

### Ajouté

- **`Notice`** — l'encart d'information (`.warn` de 14.1, `.pv` de 11.1) devient un composant.
  Il était local à `SettingsPage` et 11.1 allait le recopier. **Ce n'est pas une alerte** : il
  porte ce que la forme ne peut pas dire — où vit un réglage voisin, pourquoi une case est vide
  — d'où la surface encastrée et l'absence de rouge. Pour l'échec d'un acte, c'est `InlineError`.
  Impact au repos : aucun (extraction à l'identique).

### Modifié

- **`RbacPage`** — porté sur 11.1, et il absorbe `RbacManagementPanel` (voir *Retiré*).
  - **Les rôles se rangent par portée déclarée**, plus par *système / personnalisé* : ce
    classement-là parle de la base, pas de la personne. Le rangement par portée est ce qui
    **rend visible** que le code rassemble onze portées et n'en lit aucune.
  - **Le niveau d'accès est affiché** — lecture, écriture, suppression. SuperAdmin et Admin ont
    les mêmes quatorze actions ; seul le niveau les sépare, et l'écran ne le montrait pas.
  - **Le refus explicite devient un troisième état**, avec son groupe et **sans bascule** : un
    droit refusé gagne contre tout ce qui l'accorderait, le remettre à permis demande de
    retirer le refus. Deux gestes différents, deux formes différentes.
  - **La fiche d'un rôle** remplace le maître-détail : héro R3 (portée, politique de connexion,
    trois métriques), l'héritage dit ce qu'il **ajoute réellement** — *Responsable sécurité*
    affiche 4 règles, en porte 24, et n'ajoute rien : le calcul est fait, pas recopié.
  - **Les cinq cartes de compteurs tombent** — Rôles 8, Groupes 5, Affectations 11, Workflows 1,
    Conflits 0 — trois rangées pour ce qu'une ligne dit au-dessus d'une liste ; *Conflits 0*
    mesurait ce qui n'arrive jamais.
  - **Les trois formulaires de création deviennent des feuilles** (rôle, groupe, affectation).
  - **Deux états vides sur quatre sont gardés**, dont un au **titre faux** corrigé : le code
    disait « Aucun rôle » quand quatre rôles système existent toujours et que l'écran interdit
    de les supprimer — seul l'ensemble *personnalisé* peut être vide. Les deux autres
    disparaissent avec leur objet : « Aucun rôle sélectionné » était l'attente d'un
    maître-détail que la fiche remplace, « Aucun workflow » appartient à l'écran qui réglera
    les workflows.
  - **Les libellés de vue viennent du registre des destinations** (X1), jamais d'une table
    locale : l'écran nommait « Inventaire » ce que la barre du bas appelle « Actifs ».
  - Impact au repos : **pas de point de contrôle visuel** — `rbac` n'est pas dans les 13
    checkpoints du harnais. Vérifié par sonde dédiée (liste, fiche Manager, fiche Auditeur
    externe, groupes) : rendu conforme, **aucune erreur console**, et les huit décomptes de la
    planche retrouvés à l'écran (24, 24, 9, 5, 5, 5, 7, 4). **Un checkpoint `rbac` est à
    ajouter au harnais** — reporté tant que la référence visuelle est en litige (voir 2.3.0).

### Retiré

- **`RbacManagementPanel`** (1 542 lignes) — absorbé par `RbacPage`, workflows compris. **D1
  tient** : un rôle dit *qui peut*, un workflow dit *dans quel ordre*. L'unique workflow du
  produit est déjà dessiné dans la file de tâches et le parcours d'attribution ; son réglage
  n'a pas d'écran, et lui en donner un ici mélangeait deux questions. `upsertRbacWorkflow` et
  `deleteRbacWorkflow` restent dans le `DataContext` : la donnée survit, c'est **l'écran** qui
  sort. Le paquet `RbacPage` passe de 34,6 ko à 21,4 ko.

---

## [2.5.0] — 2026-08-16

**Septième écran porté : Finances et Rapports** (planche **15.1**). Cas particulier : la
**mise en page était déjà conforme** — héro « ce qui reste » plutôt que l'enveloppe, postes à
jauge, cartes de rapport portant leur nombre de lignes et leurs colonnes, aperçu en tableau
qui glisse. Ce qui divergeait n'était pas la forme, c'étaient **deux chiffres devinés et une
permission mal dite**.

> **Un chiffre deviné ne se présente pas comme un chiffre su.** Ni le classement d'une ligne
> de budget, ni un montant lu sur une facture floue. Le premier se demande, le second arrive
> vide : un champ vide se remplit en trois secondes, un champ faux se découvre trois mois plus
> tard. *(15.1)*

### Modifié

- **`FinanceBudgetItem.capitalization`** (nouveau champ) + **`AddBudgetModal`** — le classement
  **CAPEX / OPEX est saisi**, plus déduit. Le produit le devinait en deux temps : deux listes de
  mots-clés, puis un repli sur le montant — *au-dessus de 5 000, investissement ; en dessous,
  frais courants*. La colonne s'appelait **« Type (IA) »** et rien, à l'écran, ne distinguait la
  supposition d'une saisie. Le sélecteur n'a **aucune valeur par défaut** : un défaut ici serait
  la devinette sous un autre nom, gardée par la moitié des lignes sans avoir été lue. Une ligne
  héritée qui n'en porte pas affiche **« non renseigné »** — un blanc se remarque et se corrige,
  une supposition se recopie dans le rapport de clôture.
- **`AddExpenseModal`** — **la confiance ne se dit plus, elle décide**. La lecture de facture
  pré-remplissait *aussi* ce qu'elle n'avait pas su lire, avec une mention de confiance à côté
  que rien n'oblige à lire. Un champ de confiance faible arrive désormais **vide**, et l'écran
  **nomme** ce qui n'a pas été lu au lieu d'afficher quatre scores. La donnée était déjà là —
  `fieldConfidence` par champ — elle n'était simplement pas écoutée.
- **`ReportsPage`** — sans la permission d'export, les boutons CSV et PDF sont **absents**, pas
  grisés : *une action qu'on ne peut pas faire n'a pas à occuper la place*. Idem pour un rapport
  à zéro ligne, qui le disait déjà sur sa carte mais gardait ses deux boutons morts.
- Impact sur le rendu au repos : `finance` et `reports` **changent** (colonne renommée, badge
  conditionnel, boutons absents). Vérifié par sonde : rendu conforme, **aucune erreur console**.

---

## [2.6.0] — 2026-08-16

**Huitième écran porté : le Catalogue** (planches **09.1** et **09.2**). Deuxième portage
partiel : `ImportModelsPage` portait déjà le contrat de colonnes et les lignes refusées nommées
de 09.2, les spécifications inventées de la fiche de modèle avaient déjà disparu. **Ce qui
manquait, c'était le rangement** — et un écran qui annonçait « 4 familles » sans en montrer une
seule.

### Ajouté

- **`Category.family`** et **`CATEGORY_FAMILIES`** — les quatre familles de l'arbitrage **A2**
  deviennent une **donnée du type**, choisie à sa création. La mesure qui a tranché A2 : à
  393 px, cinq pastilles de famille tiennent en deux rangées là où neuf pastilles de type en
  prenaient trois — mais le gain n'est pas là. **Quatre familles restent quatre à quinze
  types ; huit types en deviennent quinze.** La rangée de familles est bornée, la liste de
  types ne l'est pas.

### Modifié

- **`ManagementPage`** — la grille de cartes devient une **liste rangée famille → type**.
  - **B1 appliqué** : la clé anglaise de la donnée se lit **à droite de la rangée**, à la place
    où la liste des équipements montre `ASSET-10001`. C'est le seul écran qui en a besoin — un
    intégrateur qui branche un import cherche `Laptop`, pas « Ordinateur portable » — et le
    seul où elle apparaît.
  - **Le signal « catalogue à nettoyer » vit ici**, pas au tableau de bord : un type sans modèle
    ne permet de créer aucun équipement alors que le parc en porte. Il se lit à la **pastille
    ambre et au mot** — « Aucun modèle — 1 actif au parc, rien pour en créer » — jamais à un
    badge rouge : un catalogue incomplet n'est pas une panne.
  - **Le référentiel ne se pagine plus** : il est borné, il se parcourt.
  - **« 4 familles » était écrit en dur** dans le porte-voix, au-dessus d'une liste qui n'en
    montrait aucune. Le nombre est compté.
  - **Les deux actes quittent la rangée** — le crayon et la corbeille apparaissaient au survol
    d'une carte, c'est-à-dire à l'endroit exact où passe le pouce qui fait défiler. Ils
    descendent **sur la fiche du type**, devant l'objet.
- **`CategoryDetailsPage`** — trois corrections que le portage a fait remonter :
  - La fiche lisait **`mockCategories` et `mockModels` en direct**, jamais le contexte : un type
    créé ou modifié par l'utilisateur n'apparaissait pas dans sa propre fiche.
  - La famille était **déduite du nom** par un `switch` de trente lignes listant les variantes
    françaises et anglaises — il se trompait sur tout type créé après lui. Elle se lit
    maintenant sur le type.
  - Même chose pour la clé de la donnée, qui retombait sur « clé à relever » pour quatre types
    dont le code porte pourtant la clé.
  - La fiche reçoit **« Modifier le type »** et **« Supprimer le type »**, cette dernière avec sa
    conséquence chiffrée : *N actifs portent ce type ; ils ne sont pas supprimés, mais plus rien
    ne définira ce qu'ils sont.*
- Impact sur le rendu au repos : `management` **change** (rangement, clé, pastille). Vérifié par
  sonde : rendu conforme à 09.1, **aucune erreur console**, et les décomptes de la planche
  retrouvés — Informatique 2 types, Périphériques 4, Impression et réseau 1, Mobilier et divers 1.

### Relevé, non fait

- **Le filtre de 04.1 doit passer aux familles** (09.1, colonnes 5 et 6). Les pastilles de la
  liste d'équipements portent les **états**, pas les types ; le changement vise la feuille de
  filtre, qui appartient à la planche 04.1. À traiter avec elle, pas ici.

---

## [2.7.0] — 2026-08-16

**Neuvième écran porté : l'Audit** (planches **16.1** et **16.2**). Troisième portage partiel :
`AuditOverviewMobile` portait déjà 16.1 — bandeau de périmètre, porte-voix, feuille de filtre —
mais le **rendu au rail ne la suivait pas**, et la campagne gardait ses quatre onglets.

### Modifié

- **`AuditDetailsPage`** — **quatre onglets deviennent deux, plus trois puces**. Trois des quatre
  onglets montraient **la même liste à trois moments** : un actif est *à scanner*, puis
  *retrouvé*, et *manquant* seulement si la campagne se clôture sans lui. Ce ne sont pas trois
  sujets, ce sont **trois états d'un même sujet** — donc un onglet, « Le parc du service », et
  trois puces. L'écart reste un onglet parce que c'est un **autre sujet** : un objet que le
  service n'attendait pas. Les puces filtrent le même parc ; l'onglet change de sujet.
- **`AuditDetailsPage`** — **« Manquants » quitte la rangée de chiffres**. Il n'existe
  qu'**après la clôture**, et un chiffre qui vaudra zéro jusqu'à la dernière seconde n'est pas
  un qualifiant. Restent attendus, retrouvés, écarts — et la couverture.
- **`PhysicalAuditView`** — **les quatre chiffres n'apparaissent qu'en campagne** (16.1). Hors
  campagne, la vue globale répond à une seule question — *qu'est-ce qui n'a pas été vérifié, et
  depuis combien de temps* — et six tuiles à zéro ne l'aident pas : elles occupent la place de
  la réponse. `AuditOverviewMobile` appliquait déjà la règle ; le rendu au rail la contredisait.

### Vérification du lot des quatre derniers portages

Le premier run du jour — pris juste après le portage de Paramètres — sert de **témoin**. Entre
ce témoin et le run final, **dix points de contrôle bougent, et dix seulement** :

| Écran | Appareils | Portage |
| --- | --- | --- |
| `settings` | 3 | 14.1 (retouches post-run) |
| `management` | 3 | 09.1 |
| `audit_details` | 3 | 16.2 |
| `finance` | 1 (expanded) | 15.1 |

`login`, `dashboard`, `approvals`, `locations`, `reports`, les deux assistants, `user_details` et
`add_equipment` sont **identiques au bit près**. C'est la preuve que chaque refonte est restée
dans son écran. `reports` ne bouge pas parce que le compte de démonstration **a** la permission
d'export : le retrait des boutons ne se voit que sans elle. `rbac` n'a pas de point de contrôle.

La référence visuelle n'a **pas** été réécrite : elle est en litige depuis le run de ce matin
(voir 2.3.0, « le point de contrôle était vert sur un `dist/` périmé »), et l'accepter
enregistrerait 26 changements qui n'appartiennent à aucun de ces portages.

---

## [2.2.0] — 2026-08-15

**Quatrième écran porté : le tableau de bord** (planche **03.1**). C'est l'écran d'entrée, et le
premier des quatre à posséder un point de contrôle visuel.

### Modifié

- **`DashboardPage`** — porté. L'arc devient celui de la planche : **décision → état → analyse →
  activité** (le code plaçait l'activité avant les graphiques).
  - **« À traiter » n'est plus une liste, c'est une zone bornée** dont la **forme** change avec
    le volume, jamais la hauteur : rien à traiter · quelques rangées qui agissent **sur place**
    · les plus anciennes suivies d'un renvoi. Le tableau de bord dit **la taille et la forme**
    du travail ; la file (Tâches) est le lieu où on le fait — **une seule destination**.
  - **« Répartition par type » devient « Types en tension »** : compter les unités décrit le
    parc sans rien décider ; ce qui décide, c'est **de quel type il ne reste rien**. La carte ne
    liste que les types à zéro disponible, bornée à cinq, et ce qui est couvert tient **en une
    phrase**.
  - **Le sous-titre dit le travail qui attend** (« 2 choses vous attendent · 14 actifs ») au lieu
    de « Vue d'ensemble de votre parc informatique », qui ne disait rien qu'on ne sache déjà.
  - Tombent : **l'anneau de répartition** et ses quatre couleurs de catégorie (un type n'est pas
    un état — §8.8), **les quatre cartes de totaux financiers** (des chiffres qui ne décident
    rien ; restent les deux proportions qui appellent un geste), et **les deux bandeaux d'alerte**
    empilés en tête.
- **`AppLayout`** — `dashboard` rejoint `adnMobileViews`.

### Non porté, et pourquoi

- **« Budget 2026 »** exige les enveloppes de l'exercice, que cet écran ne lit pas.
- **Le régime « saturé »** (agrégat par nature au-delà de quelques centaines de demandes) exige
  des décomptes que seule la file produit.
- **Le menu de compte sous l'avatar** : la planche l'y déplace en même temps qu'elle redécoupe
  Paramètres (14.1). Tant que ce découpage n'est pas fait, l'accès au compte reste où il est.

### Relevé par le portage

- **Les clés anglaises de catégorie s'affichent de nouveau** — « Headphones », « Keyboard »,
  « Server » dans *Types en tension*, comme « LAPTOP » sur la fiche. La planche l'annonçait :
  *« le dashboard affiche Laptop / Monitor / Mouse alors que le Catalogue gère huit catégories en
  français — deux vocabulaires pour la même chose »*. C'est la **dette n°2 du lexique**, tranchée
  le 05/08 et jamais appliquée ; elle est maintenant visible sur **deux écrans portés**.

### Mesuré, et une leçon de méthode

| | 393 | 900 |
| --- | --- | --- |
| titre · sous-titre | **Bonjour Alice** · « Rien à traiter · 14 actifs » | idem |
| zone inversée | **1** | **1** |
| gestes en tête (dont un seul jaune) | 2 | 2 |
| cellules d'état | 4 | 4 |
| anneau de répartition · cartes de totaux | **0 · 0** | **0 · 0** |
| Types en tension · État du parc · activité en dernier | 1 · 1 · 1 | 1 · 1 · 1 |

**Re-baseline : 30 points de contrôle mis à jour**, puis vérifiés **39/39** au run suivant. Trente
et non trois, et le détour vaut d'être écrit :

> **Un `vite preview` fantôme rend la suite visuelle silencieusement fausse.** Le script se
> connecte à `127.0.0.1:4173` ; si un serveur y est déjà lié — ici celui d'une sonde lancée à la
> main —, il **mesure ce vieux build sans une ligne d'avertissement**. J'ai d'abord soupçonné la
> fonte, puis le portage lui-même ; c'est le diff au pixel qui a donné la réponse (l'astérisque
> des champs obligatoires manquait sur la connexion, écran que je n'avais pas touché). Les
> références précédentes avaient été écrites dans cet état-là ; celles-ci l'ont été serveur
> arrêté, `dist/` reconstruit, et confirmées par un second passage.
>
> **À retenir :** avant tout run visuel, `pgrep -af vite` doit être vide. Une garde dans
> `scripts/run-md3-visual-regression.mjs` — échouer si le port est déjà pris au lieu de s'y
> connecter — supprimerait la classe entière de faux relevés.

## [2.1.0] — 2026-08-15

**Troisième écran porté : l'annuaire** (planche **05.1**). Il devait dire si `ListTemplate`
tient sur un sujet qui n'est pas un objet — il tient, et il a fait remonter une correction.

### Modifié

- **`UsersPage`** — porté. L'écran s'appelle désormais **« Équipe »**, le mot que la barre du
  bas portait déjà. Ce que le portage **ajoute**, et c'est la seule donnée qui décide quelque
  chose : **le nombre d'équipements détenus** — le pendant exact de « chez qui est l'objet » sur
  la liste des actifs, dans l'autre sens. Ce qu'il **retire** : les **avatars illustrés** (onze
  visages de dessin animé qui pèsent plus que les noms), les **badges de rôle en majuscules
  colorées** — deux interdits d'un coup, les capitales (§8.4) **et** la couleur qui code une
  catégorie (§8.8) —, la **corbeille de rangée**, la **pagination**, et l'**e-mail** de la
  rangée, qui reste clé de recherche mais n'écrase plus le nom qu'il accompagnait.
- **Le tri est dit, donc il est fait.** Il n'y a pas d'ordre naturel pour des personnes et la
  liste rangeait sans le dire : il est alphabétique, il partage la ligne du décompte, et il se
  renverse. *(À l'inverse de l'inventaire, où le tri de la planche n'a aucun champ derrière —
  voir [1.8.0].)*
- **`ListRow` — le second identifiant et la référence redeviennent visibles à toutes les
  largeurs.** Je les avais passés à `medium` d'après le cadre de comparaison de 00.4 ; **les deux
  planches de page les dessinent à 393** — le modèle sur 04.1, le rôle et le nombre d'objets sur
  05.1. Sur 05.1 la référence **est** la donnée qui décide : la cacher au téléphone vidait le
  portage de son objet. C'est le **porteur** qui se tronque, comme dans les planches.
- **`AppLayout`** — `users` rejoint `adnMobileViews`.

### Non porté, et pourquoi

- La **feuille de filtre à quatre axes** (département, site, état du compte, activité) : seuls
  les deux premiers existent dans la donnée, et le département est déjà un axe de recherche.
- Le second chemin d'ajout (« importer depuis l'annuaire ») : la planche le déclare elle-même
  comme une proposition, et rien ne l'implémente.

### Appliqué depuis la planche

- **Supprimer une personne qui détient du matériel est refusé**, et c'est **dit avant le geste** :
  la feuille de confirmation nomme les comptes concernés et annonce qu'ils seront ignorés.
  Conséquence directe de la donnée ajoutée à la rangée — effacer un compte qui porte deux
  machines rend ces machines introuvables. *(Règle proposée par 05.1, appliquée ici.)*

### Mesuré

| | 393 | 900 |
| --- | --- | --- |
| titre | **« Équipe »** | idem |
| rangées · hauteur | 11 · **72** | 11 · **72** |
| pagination · corbeilles · badges majuscules | **0 · 0 · 0** | **0 · 0 · 0** |
| pastilles de rôle avec compteur | 5 | 6 |
| tri annoncé | **« Nom (A → Z) »** | idem |
| « N équipements » · « aucun équipement » | 6 · 5 | 6 · 5 |

`lint`, `ds:check`, `tsc` sur les fichiers touchés, `build` : verts.

## [2.0.0] — 2026-08-15 — **la peau du produit passe aux planches**

Version majeure : **tous les écrans changent d'aspect**, y compris les vingt-six qui n'ont pas
encore été portés. Décision prise après un relevé **au rendu** — pas sur les noms de jetons —
qui montrait que le portage reproduisait la **composition** des planches et pas leur **peau** :
onze rôles de couleur sur treize divergeaient, plus la fonte d'affichage.

**Pourquoi en une fois plutôt qu'écran par écran** (ce que le brief §9 prévoyait) : les valeurs
cibles sont déjà arbitrées ; chaque écran porté sous l'ancienne peau aurait dû être revérifié
plus tard ; et un produit à deux peaux pendant vingt-six écrans coûte plus cher à lire qu'une
journée de re-baseline.

### Modifié — la couche sémantique

| rôle | avant | après *(valeur des planches)* |
| --- | --- | --- |
| `--tk-color-app-bg` | #FAF9F7 | **#F2F0EA** — le papier chaud du dessin |
| `--tk-color-surface-muted` | #F4F2EF | **#F7F5F0** |
| `--tk-color-text-primary` | #1C1917 | **#1A1917** *(15,42:1 sur le canevas)* |
| `--tk-color-border-default` | neutre 200 | **#EAE6DF** |
| `--tk-color-inverse-surface` | #1C1917 *(noir chaud)* | **#0A191D** *(le bleu-noir de §2.10 ; blanc dessus 17,95:1)* |
| `--tk-type-font-brand` | Inter | **Archivo** 500/600 |
| corps (`body-large`) | 14 / 20 | **15 / 21** — rang 2 du registre §2.6 |
| secondaire (`body-medium`) | 14 / 20 | **13 / 19** — rang 5 |

### Non basculé — et c'est mesuré, pas oublié

Les deux gris de texte et les quatre teintes de statut des planches **ne passent pas AA en
texte**, mesurés sur les trois surfaces :

| valeur de planche | canevas | surface | creux | texte AA | glyphe 3:1 |
| --- | --- | --- | --- | --- | --- |
| encre 2 `#726E66` | 4,45 | 5,08 | 4,66 | **non** | oui |
| encre 3 `#8A847A` | 3,25 | 3,71 | 3,40 | **non** | oui |
| vert `#5B913C` | 3,31 | 3,78 | 3,47 | **non** | oui |
| bleu `#288AC5` | 3,33 | 3,80 | 3,48 | **non** | oui |
| ambre `#A97C00` | 3,31 | 3,77 | 3,46 | **non** | oui |
| orange `#E45329` | 3,31 | 3,77 | 3,46 | **non** | oui |

Les rôles **textuels** gardent donc leurs valeurs AA (`text-secondary` 6,87 · `text-muted` 4,89
· `success` 4,81 · `info` 4,54). C'est la confirmation au rendu des questions **Q-B1** et
**Q-B2** que le brief avait laissées ouvertes, et c'est cohérent avec §2.10 bis, qui mesure déjà
la famille `--st-*` comme un **objet graphique** à 3:1 et non comme du texte. La règle posée avec
`ListRow` — *la teinte est au glyphe, le mot garde l'encre de la rangée* — rend l'écart invisible
là où il compte.

### Corrigé — un piège de cascade, et il touchait tous les titres portés

`font-brand` et `font-semibold` étaient **silencieusement écrasés** partout où ils cohabitaient
avec une classe maison `.text-body-*` sur le même élément : ces classes déclarent
`font-family` **et** `font-weight`. Les titres de rangée sortaient en **14 / 400** au lieu de
**15 / 500**. Ce n'est pas un conflit `twMerge` — la sonde `check-cn-merge` ne pouvait pas le
voir. Corrigé sur `ListRow`, `ListTemplate` (deux régimes) et `ScanView`, vérifié au rendu.

> **La règle qui manquait, à porter au registre :** *une classe de rang typographique maison ne
> cohabite jamais avec une utilitaire `font-*` sur le même élément* — l'une des deux est perdue,
> et c'est toujours celle qu'on croyait avoir écrite.

### Re-baseline

`qa:visual:update` — **39 points de contrôle mis à jour**. Les nouvelles références contiennent
trois choses, et il faut le savoir : (1) cette bascule de peau, (2) les deux écrans portés
(liste et fiche équipement), (3) **le travail non commité qui précédait ce chantier** —
`--tk-type-label-large-weight` 600 → 500, `Button.tsx`, `InputField.tsx`, jetons de la connexion.
Un `git checkout docs/md3-visual-baseline` défait l'ensemble si l'un des trois ne convient pas.

## [1.9.0] — 2026-08-15

**Étape 3, deuxième écran : la fiche équipement** passe sur la planche **04.2** et le gabarit
`DetailTemplate`. C'est la destination du chevron posé la veille sur quatorze rangées.

### Modifié

- **`EquipmentDetailsPage`** — porté. Ce que le portage **retire** :
  - **les trois cartes de démonstration** — « Santé 100 % », « Maintenance à jour » et leur
    voisine occupaient le premier écran avec des chiffres fabriqués, avant la moindre donnée
    réelle. C'est ce que leur badge DÉMO avouait ; elles reviendront quand l'agent de collecte
    les alimentera.
  - **le bloc financier** — prix, valeur actuelle, amortissement total **en rouge**, barre en
    dégradé, tableau de trois lignes et deux encarts d'alerte, pour dire « amorti à 50 % ». Rien
    n'y portait de décision. Il devient **deux rangées de proportion** et leur conséquence.
  - **le second en-tête**, le **crayon** et le **triangle sans libellé** (un triangle peut dire
    « signaler un problème » comme « il y a un problème ») — la barre porte le code,
    l'identifiant et un menu d'actes **nommés**.
  - **« Supprimer » du rang primaire** → **« Sortir du parc »**, au menu, derrière un
    séparateur : un actif qui a un historique ne s'efface pas.
  - **l'ascenseur interne de l'historique** (200 mouvements) → trois événements et un renvoi
    vers l'écran d'Audit, qui fait déjà ce travail.
- **`AppLayout`** — `equipment_details` rejoint `adnMobileViews`.

### Non porté, et pourquoi

- **« Déclarer un incident »** attend la planche **04.3**. Le geste actuel affiche
  *« Signalement envoyé au support »* alors que **rien n'est envoyé ni créé** : reconduire une
  phrase fausse est pire que l'absence. L'entrée est retirée jusqu'à ce que la feuille existe.
- **« Réaffecter »** : aucun chemin ne l'implémente aujourd'hui.

### Relevé par le portage

- **L'étiquette du héro affiche la clé anglaise de la catégorie** (« LAPTOP » là où la planche
  écrit « Ordinateur portable »), à la place la plus visible de la fiche. C'est la **dette n°2 du
  lexique**, tranchée le 05/08 — *clé anglaise dans la donnée, libellé français porté par un
  champ de `Category`, aucun écran ne traduit* — et jamais appliquée côté produit. Rien n'a été
  inventé ici : traduire dans l'écran serait recréer la table qu'on supprime.

### Mesuré

| | 393 | 1440 |
| --- | --- | --- |
| héros par écran | **1** | **1** |
| métriques dans le voile | **3** | **3** |
| cartes de démonstration | **0** | **0** |
| « amortissement total » en rouge | **0** | **0** |
| second en-tête | **0** | **0** |
| numéro de série copiable | **1** | **1** |
| geste primaire (état *Disponible*) | **« Attribuer »** | idem |
| menu | Modifier la fiche · **Sortir du parc** | idem |
| colonnes | 1 (héro 361) | **2** (héro 440) |

`lint`, `ds:check`, `tsc` sur les fichiers touchés, `build` : verts. Aucun point de contrôle
visuel ne couvre `equipment_details` — comme pour la liste, l'écran est invisible à la suite.

## [1.8.0] — 2026-08-15

**Étape 3 — le premier écran est porté.** `InventoryPage` passe sur la planche **04.1** et le
gabarit `ListTemplate`. C'est le premier changement de ce chantier **visible dans le produit**.

### Modifié

- **`InventoryPage`** — porté. Ce que le portage **retire** est la moitié du travail :
  la **pagination** (deux pages pour 14 actifs, un troisième jaune, et dix rangées de 180 px à
  défiler pour viser 40 px sous le bouton flottant — sur un parc on ne feuillette pas, on
  cherche) ; la **corbeille de chaque rangée** (l'acte le plus irréversible de l'écran, en
  rouge, là où passe le pouce — il est déjà arbitré sur la fiche) ; les **badges d'état en
  majuscules et en aplats** ; la **rangée à trois lignes** de 180 px ; la **feuille de six
  actions** du bouton flottant. Ce qu'il **apporte** : la rangée de 72 px qui dit enfin **chez
  qui est l'objet**, les états en tête **avec leurs compteurs**, le mode sélection de 17.2,
  l'état vide de 17.1, le bandeau hors-ligne, et l'attente en squelette.
- **`ListRow` absorbe le rôle de `SelectableRow`, qui est supprimé.** C'est le portage qui l'a
  révélé : une liste doit faire les deux, et deux composants pour une même rangée auraient
  divergé à la première modification (§2.18). La bascule reste **au pixel** — la case prend la
  place de la vignette, le texte ne bouge pas d'un point.
- **`ListRow` — la référence rejoint les faits de `medium`.** Au téléphone, l'état, le porteur
  **et** l'identifiant ne tiennent pas : le porteur se réduisait à « Burea… ». 00.4 dit deux
  faits au téléphone, quatre au-delà ; l'identifiant, qu'on ne lit pas de mémoire, passe après.
- **`BulkActionBar` devient collant.** Les actes de la sélection restaient au bas d'une liste de
  quatorze rangées : il fallait défiler pour agir.
- **`AppLayout`** — `equipment` rejoint `adnMobileViews` : l'écran porté possède son en-tête, la
  barre du haut générique ne le redouble plus.

### Ajouté

- **`src/constants/statusPresentation.ts`** — l'état d'un actif, **son pictogramme, son mot et
  sa teinte**, fixés une fois (I3, §0.3). Le mot vient de `getStatusLabel` : le vocabulaire est
  affaire de lexique, la teinte affaire de design system, et les mélanger ferait d'un renommage
  de statut un changement de couleur.

### Non porté, et pourquoi

- **Le tri** que la planche pose sur la ligne du décompte (« Ajout récent ») : aucun champ ne
  porte la date d'entrée au parc — `financial.purchaseDate` est la date d'achat, ce n'est pas le
  même fait. Trier dessus en l'appelant « ajout » inventerait une donnée.
- **La feuille de filtre** à trois axes (famille, emplacement, période) : elle attend le
  catalogue à deux niveaux de 09.1. Le seul axe qui existe est le statut, et il est en tête —
  un bouton de filtre ouvrant une feuille vide serait un geste mort.

### Mesuré

| | 393 | 900 |
| --- | --- | --- |
| rangées affichées | **14** *(10 paginées avant)* | **14** |
| hauteur de rangée | **72** *(180 avant)* | **72** |
| pagination · corbeilles · badges majuscules | **0 · 0 · 0** | **0 · 0 · 0** |
| pastilles d'état avec compteur | 4 | 4 |
| mots d'état présents (I3) | 12 | 12 |
| sélection : cases · barre · pied | 14 · « 1 sélectionné » · 1 | idem |

`qa:visual:auto` : **33 différences, exactement les mêmes qu'avant le portage** — aucun point de
contrôle ne bouge. La raison est un manque à signaler : **la liste des équipements n'a aucun
point de contrôle visuel**, alors qu'elle est l'onglet le plus fréquenté. Les 33 restent
imputées au travail non commité qui précède ce chantier (`--tk-type-label-large-weight`,
`Button`, `InputField`).

## [1.7.0] — 2026-08-15

**Étape 2, deuxième gabarit : la fiche** (planche 04.2, régime §2.43). Cinq écrans —
équipement, utilisateur, modèle, catégorie, rôle. Aucun écran porté.

### Ajouté

- **`DetailTemplate`** (`src/components/layout/`) — le gabarit. Une fiche répond d'abord à
  *« quel objet, dans quel état, chez qui, et quoi faire »*, et cela tient sur le premier écran
  **sans défilement** ; tout le reste est de la **référence bornée**. Deux conséquences
  structurelles, portées par le gabarit et non par l'écran : **aucune zone ne défile à
  l'intérieur de la page** (l'historique est borné et renvoie à l'écran d'Audit, qui fait déjà
  ce travail) et **aucune information n'est écrite deux fois**. **Un seul en-tête**, et il porte
  l'identité — « Détail équipement » ne dit rien qu'on ne sache déjà et coûte 56 px.
- **`DetailHero`** — R3 (§0.4) en code : étiquette, sujet, état, **trois métriques au plus**.
  Le type l'impose — `DetailMetrics` est un tuple de 1 à 3, une quatrième cellule **ne compile
  pas**. Corollaire écrit sur place : *ce que le héro porte, les cartes ne le reprennent pas* —
  c'est la faute qui s'est produite cinq fois sur 04.2. Et les qualifiants **suivent le rôle** :
  le gestionnaire voit le prix d'achat, le porteur voit la date de remise à la même place.
- **`ReferenceRow`** — §2.11, déclaration entière. **Le gris est porté par l'étiquette, jamais
  par la rangée** : c'est le seul mécanisme qui survive à une rangée portant un troisième enfant.
  Variante `copyable` pour le numéro de série — le seul champ qu'on lit à voix haute au support,
  et qui passe **en premier** de la référence technique alors qu'il était dernier.
- **`ProportionRow`** — *une rangée, jamais un anneau*. Le bloc financier tenait un tiers de
  l'écran pour dire « amorti à 50 % », en rouge. **Un amortissement n'est pas une anomalie** :
  reste le nombre, la barre, puis **la conséquence** — quand renouveler, et sur quelle enveloppe.
  La provenance se déclare, sans quoi un chiffre exact passe pour une mesure.

### Tranché

- **Le seuil de deux colonnes est 1280 px, et pas le point de rupture `large` du produit
  (1200).** Les seuils de `breakpoints.ts` décident du **régime de navigation** ; celui-ci décide
  d'une **mise en page de contenu**, et le registre le dérive du plancher de 360 px. Basculer à
  1200 serait 80 px trop tôt sans que rien ne le demande. Mesuré : à 1240 px une colonne et le
  héro à **960** ; à 1440 px deux colonnes et le héro à **440**.
- **`DetailPageShell` n'est pas repris.** Son mécanisme — barre épinglée à hauteur fixe,
  hystérésis par `IntersectionObserver` — répond à une contrainte réelle (audit UX §9.7 :
  un en-tête à hauteur variable fait osciller le max de défilement). Mais **la fiche des planches
  n'a ni barre escamotable ni onglets épinglés**, donc rien à escamoter. Les deux cohabitent le
  temps de la bascule ; `DetailPageShell` garde ses cinq appels et part avec le dernier.

### Mesuré

| | 393 | 1024 | 1240 | 1440 |
| --- | --- | --- | --- | --- |
| héros par écran | **1** | **1** | **1** | **1** |
| métriques dans le voile | **3** | **3** | **3** | **3** |
| colonnes | 1 | 1 | 1 | **2** |
| largeur du héro | 285 | 884 | **960** | **440** |

`lint`, `ds:check` (fichiers du lot), `check:tokens`, `check:cn-merge`, `build` : verts. Aucun
impact sur les 39 points de contrôle — rien n'appelle encore le gabarit.

> **Une leçon de méthode, payée comptant.** Un import manquant (`ShieldWarning`) a traversé
> `npm run build` **et** `npm run lint` sans un mot, et n'est apparu qu'à l'ouverture de la
> galerie : `vite build` **ne type-checke pas** — il n'y a pas de `tsc` dans le script. Le trio
> `build` + `lint` + smoke test que documente `CLAUDE.md` ne couvre donc pas les erreurs de
> type ni les identifiants absents. `npx tsc --noEmit` les voit, mais la base est aujourd'hui
> **rouge** sur du code antérieur (`import.meta.env` sans `vite/client`, `ErrorBoundary`,
> `mockData`) : la garde ne peut pas être ajoutée telle quelle. Les 21 fichiers de ces trois
> lots, eux, ont été vérifiés au type et sont propres.

## [1.6.0] — 2026-08-15

**Étape 2 du dossier de passation : le premier gabarit.** « Liste / file » a été retenu parce
qu'il **met l'étape 1 au travail** au lieu de la regarder — squelette, état vide, hors-ligne et
mode sélection y sont câblés une fois — et parce qu'il porte quatre écrans (04.1, 03.3, 05.1,
09.1). Aucun écran n'est porté : le gabarit d'abord, l'instanciation ensuite.

### Ajouté

- **`ListTemplate`** (`src/components/layout/ListTemplate.tsx`) — le gabarit. Il décide **une
  fois** ce que quatre écrans décidaient chacun : ni pagination ni corbeille de rangée (« sur un
  parc, on ne feuillette pas — on cherche »), les états en tête **avec leurs compteurs**, le tri
  sur la ligne du décompte, un seul jaune dans le contenu, et la **largeur de lecture à 960 px**.
  C'est le premier endroit du produit où le 960 de §2.43 est réellement appliqué — `PageContainer`
  reste à `max-w-[1600px]`, et c'est la dette **D7** à faire converger écran par écran.
- **`ListRow`** — la rangée : **72 px à toutes les largeurs**, vignette 40, deux lignes (ce qu'est
  l'objet · où il en est et chez qui). **Deux faits au téléphone, quatre dès `medium`** — le
  modèle et la date viennent de la fiche, aucun n'est inventé pour remplir.
- **`SearchField`** et **`FacetChip`** — deux rôles que le gabarit réclamait et que les primitives
  existantes ne portaient pas au bon gabarit. Règle de choix inscrite en **§11.6** : `Chip` et
  `SearchFilterBar` restent aux écrans non basculés ; les nouvelles formes ne servent que les
  écrans portés, et l'ancienne disparaît avec son dernier appel.

### Tranché

- **Deux divergences entre planches, arbitrées et écrites sur place** — 04.1 (planche de la page)
  l'emporte sur 00.4 (planche du régime) dans les deux cas : (a) le **champ de recherche est
  permanent dès 393 px**, le cadre de 393 px de 00.4 étant une comparaison de rangées et non la
  spécification du compact ; (b) **la teinte d'état colore le glyphe, pas le mot** — ce qui est
  aussi la seule lecture tenable en accessibilité, un objet graphique se jugeant à 3:1 et un texte
  à 4,5:1.
- **Une teinte manque au produit.** Le registre §0.3 fixe cinq états dont un **orange** (hors
  service) distinct du rouge de refus ; la palette n'a pas cet orange à un contraste tenable.
  `attention` emprunte `danger` et ne se distingue de `refused` que par la nuance et par son
  glyphe. **C'est un jeton à ajouter à la bascule de couleur**, pas une décision de composant.

### Mesuré

Sonde sur la galerie, aux trois régimes — c'est la promesse du registre, prise au pixel :

| | 393 | 768 | 1440 |
| --- | --- | --- | --- |
| hauteur de rangée | **72** | **72** | **72** |
| largeur de liste | 285 | 628 | **960** |
| modèle · date en rangée | non | oui | oui |
| mot d'état présent (I3) | 3/3 | 3/3 | 3/3 |

`lint`, `ds:check` (sur les fichiers du lot), `check:tokens`, `check:cn-merge`, `build` : verts.
Impact sur les 39 points de contrôle : **aucun** — aucun écran n'appelle encore le gabarit.

## [1.5.0] — 2026-08-15

**Étape 1 du dossier de passation : les trois composants transverses**, avant tout écran.
17.3 vaut 28 écrans et 3 emplois de scan, 17.2 vingt emplois dont 9 confirmations, 17.1
quatre états. Aucun écran n'est porté dans ce lot — seuls les composants et leur
raccordement le sont.

### Ajouté

- **`@phosphor-icons/react` 2.1.10 et la primitive `Icon`** (`src/components/ui/Icon.tsx`).
  Le registre §0.1 (I1) impose Phosphor sur les 35 planches et interdit tout sprite maison ;
  les trois composants de ce lot en dépendent directement (état vide, attente courte, erreur
  d'acte, scan). Les installer plus tard aurait voulu dire écrire les composants les plus
  partagés du produit sur `MaterialIcon`, puis les rouvrir à l'étape 4 — d'où l'avance sur
  l'ordre du dossier, décidée avec le commanditaire. `Icon` n'expose que **quatre tailles**
  (32 / 24 / 20 / 18, §0.2) et **deux graisses** (`regular`, `fill` réservé à *actif* ou
  *acquis*) : `thin`, `bold`, `duotone` et les tailles 26/28/40/56 sont hors d'atteinte par
  construction. L'icône est toujours `aria-hidden` — I3 veut que le mot soit à côté, et c'est
  le contrôle porteur qui porte le nom accessible. **Les 72 fichiers qui emploient
  `MaterialIcon` ne bougent pas** : la migration du parc reste l'étape 4. Impact sur le rendu
  au repos : **aucun** (39/39 checkpoints identiques, run témoin ci-dessous).
- **Jeton de rôle `--tk-color-skeleton` et sa classe `bg-skeleton`.** La règle A3 de 17.3
  fixe **une** nuance d'attente, sans pulsation ni vague brillante — le balayage lumineux
  attire l'œil *sur* l'attente au lieu de l'en détourner. Rôle neuf, donc déjà à son nom
  définitif ; il ne crée **aucune valeur** : la planche demande `#E7E3DB`, le jeton pointe le
  neutre 200 du produit (`#E8E4DF`), un cran de la même rampe.
- `SkeletonQueue` et `SkeletonDetail` (`Skeleton.tsx`) — les **trois** formes que 17.3
  reconnaît aux vingt-huit écrans : liste (4 écrans), fiche (5), file (3). La fiche est la
  seule qui dessine **aussi le héro** : c'est le bloc le plus lourd de l'écran, et l'omettre
  ferait sauter tout le reste de 200 px à l'arrivée des données.
- `useDelayedPending` (`src/hooks/useDelayedPending.ts`) — la règle **« rien avant 300 ms »**
  (§2.39, A5) en un seul endroit, pour que sa révision soit une ligne. Le seuil est une
  convention proposée par la planche, à vérifier sur un vrai réseau.
- `ScanView` (`src/components/ui/ScanView.tsx`) — le canevas de scan, **jamais dessiné**
  jusqu'ici alors que le produit porte trois gestes de scan et que le geste existe déjà pour
  la facture. Une vue, deux modes (`simple`, `batch`), les quatre règles N1–N4 : le cadre de
  visée **est** l'instruction, la valeur lue **s'écrit en clair** avant acceptation, le retour
  est **visuel et haptique** (`navigator.vibrate`, l'inventaire se fait debout en local
  bruyant), et le lot **compte et qualifie** — « 23 sur 41 attendus », l'écart nommé à part.
  Le composant **ne décode rien** : le flux et la lecture appartiennent à l'appelant, ce qui
  lui permet de servir les quatre emplois sans en connaître aucun.
- `SelectionTopBar`, `SelectableRow`, `BulkActionBar`, `useSelection`, `useLongPress` — le
  mode sélection de 17.2, aujourd'hui réinventé dans trois pages (`InventoryPage`,
  `UsersPage`, `ManagementPage`). **S1 est portée par le code, pas par l'appelant** :
  `BulkActionBar` rend `null` à sélection vide — un pied d'actions grisé demande de deviner ce
  qui le débloquerait. La bascule se fait **au pixel** : la case de 40 px prend exactement la
  place de la vignette, le texte ne bouge pas d'un point, et la zone de frappe passe à 48 par
  `touch-target` (§2.41).
- `ScreenState` (`src/components/ui/ScreenState.tsx`) — **une forme pour trois états** :
  écran vide, page introuvable, accès refusé. Les deux portes fermées empruntent l'état vide ;
  seule change **ce qu'on peut faire ensuite**.
- `useOnlineStatus` + `OfflineBanner` / `ContextBanner` (`src/components/ui/ContextBanner.tsx`)
  — dette **D9** : `navigator.onLine` n'apparaissait **nulle part** dans `src/`, alors que
  l'état hors ligne est dessiné. La bande suit §2.37 (12 px, symétrique, attachée à la barre du
  haut). ⚠️ **Le retrait des gestes d'écriture n'est pas implémenté** : la planche le donne
  comme *proposition* et ce que « écrire » veut dire sans réseau reste à trancher côté produit
  — le crochet dit l'état, il ne l'applique pas.
- `InlineError` — la ligne d'erreur de 17.1 (règle 1), là où le geste a été engagé.

### Modifié

- `ConfirmationDialog` → **`ConfirmationSheet`**, consommé par `ConfirmationContext` (29 appels,
  9 écrans). **Une feuille sous 840 px, un dialogue de 440 px au-dessus** (§2.43) : mêmes
  champs, même pied, même ordre — c'est la même vue posée autrement, pas une seconde. La
  boîte centrée à toutes largeurs disparaît. Nouvelles entrées : `details` (les faits qui
  pèsent sur la décision), `reason` (le motif transmis tel quel), `tone`, `irreversible`.
  **`tone` et `irreversible` sont séparés à dessein** : la couleur suit l'appel hérité tant
  que l'écran n'est pas porté, mais la phrase « Cette action est irréversible » est une
  affirmation sur l'acte — on ne la déduit pas d'un rouge hérité. Les 13 appels
  `variant: 'danger'` restent donc rouges **sans** la déclarer : à instruire écran par écran
  (LEXIQUE §5 : suspendre est réversible, donc jamais rouge). Impact : **aucun checkpoint**
  — la feuille ne s'ouvre sur aucun point de contrôle ; vérifiée par sonde dédiée (ci-dessous).
- `ConfirmationContext` — l'échec d'un acte **ne referme plus la feuille** : elle reste
  ouverte, la saisie reste écrite, l'erreur se pose au-dessus du pied et le geste primaire
  devient « Réessayer » (17.1, règle 1). `message` accepte un `ReactNode`, `onConfirm` reçoit
  le motif. Les 29 appels existants compilent et rendent sans modification.

- `DesignSystemGalleryPage` — les huit primitives neuves y sont **instanciées**, dans la
  taxonomie de la galerie plutôt que dans une section « lot 17 » : `Icon` en Fondations, la
  sélection en *Sélection & navigation*, squelettes / `ScreenState` / bandes et erreur en
  *Rétroaction & états*, `ConfirmationSheet` et `ScanView` en *Superpositions*. §14.2 tient
  ici : **la galerie n'illustre rien, elle instancie** — le mode sélection y est réellement
  pilotable (appui long compris), et le pied d'actions y disparaît vraiment à sélection vide.

### Déprécié

- `EmptyState` — remplacé par `ScreenState` (planche 17.1). Conservé le temps que ses **12
  appels** soient portés ; retrait au dernier. Ne pas l'employer dans du code neuf.

### Retiré

- `ConfirmationDialog` (`src/components/ui/ConfirmationDialog.tsx`) — **supprimé** : plus aucun
  importeur une fois les 29 appels passés par le contexte et la galerie basculée sur
  `ConfirmationSheet`. Garder les deux aurait laissé un composant qui *ressemble* à un emploi
  et répond faux le jour où quelqu'un demande « qui confirme ? » — c'est le cas « un nom, deux
  rôles » de §2.18, et la règle du registre sur l'orphelin hérité (§5.4). Son exception §10.5
  (tourniquet local au lieu de la prop `loading`) tombe avec lui.

### Mesuré

Trois runs `qa:visual:auto`, parce qu'un seul n'aurait rien prouvé — l'arbre de travail
portait **déjà** des modifications non commitées (`--tk-type-label-large-weight` 600 → 500,
`Button.tsx`, `InputField.tsx`, jetons de la connexion) qui touchent tous les écrans :

| Run | Arbre | Résultat |
| --- | --- | --- |
| 1 | arbre complet (pré-existant + ce lot) | 6 match / **33 changed** |
| 2 | témoin, `HEAD` nu | **39/39 match** |
| 3 | `HEAD` + **ce lot seul** | **39/39 match** |

**Les 33 différences appartiennent au travail en cours qui précède ce lot**, pas à l'étape 1 :
la graisse des libellés de bouton passée de 600 à 500 suffit à elle seule à faire bouger les
trente-neuf écrans. Ce lot est **inerte au repos** — ses composants ne s'affichent que pendant
une attente, une sélection, une confirmation ou une panne, dont aucun point de contrôle
n'existe. La confirmation, seul chemin vivant, a été vérifiée par sonde : à 393 px la feuille
est ancrée en bas sur toute la largeur, à 1280 px c'est un dialogue de **440 px** centré, les
deux portant « Annuler » et le verbe de l'acte, sans erreur de page.

⚠️ **`npm run lint:ds` reste rouge, et c'était déjà le cas avant ce lot** : `ds:check` échoue
sur `DocumentationExplorerPage.tsx` seul (hex en dur, contrôles natifs, `rounded` nu) — le
fichier que la passation exclut du périmètre et qu'aucune route ne déclare (dette **D8**).
`lint`, `check:tokens`, `check:cn-merge`, `check:encoding` et `build` sont au vert.

## [1.4.0] — 2026-08-08

### Ajouté
- **Jeton de rôle `--tk-radius-vignette` (6 px) et sa classe `rounded-vignette`.** Le registre
  fixe la vignette de rangée à **40 × 40, rayon 6** depuis le 31/07 (`REGLES-TRANSVERSES` §2.2
  et §2.31) et les planches l'emploient **88 fois** — mais le pont Tailwind n'offrait que
  `rounded-sm`/`md` (4 px) et `rounded-lg` (8 px). Le rayon canonique de la vignette était donc
  **inexprimable** en code : le premier portage l'a rendu à 4 px sans que rien ne le signale.
  Le jeton rejoint les rôles existants (`control`, `card`, `sheet`) : il nomme une intention,
  il ne concurrence pas l'échelle. Impact sur le rendu au repos : **aucun** — aucun composant
  ne l'employait avant.

### Modifié
- `LoginPage` — **porté sur la planche 02.1** (piste B validée). Le double panneau
  hero/formulaire laisse place à la composition de la planche : bandeau de marque (motif
  cartouche des quatre marques de valeurs, filet jaune, nom, **une** phrase), puis le formulaire
  sur le canevas, en **une colonne bornée à 440 px centrée à toutes les largeurs** (§2.43 : le
  contenu ne s'étire pas). Les comptes de démonstration passent des avatars générés aux
  **initiales** (§2.21). Les trois arguments de vente, le hero `medium` et la double signature
  de pied tombent. Impact : **re-baseline** des trois points de contrôle `login`.

## [1.3.0] — 2026-08-06

### Ajouté
- `Skeleton` / `SkeletonRow` / `SkeletonList` (`src/components/ui/Skeleton.tsx`) — le
  produit n'avait **aucun état de chargement dessiné** : le fallback de route montrait
  un tourniquet plein écran légendé « Chargement de la vue… », qui nomme la mécanique
  et non ce que la personne attend. Le squelette **tient la place de ce qui arrive**,
  donc l'écran ne saute pas quand la donnée arrive. Aucune couleur propre :
  `bg-surface-container`, la surface d'information employée comme une absence.
  Règle et métriques : planche 12.1, `REGLES-TRANSVERSES.md` §2.39.
  Impact sur le rendu au repos : **aucun** — le composant ne s'affiche que pendant
  l'attente d'une vue paresseuse.

### Modifié
- `AppLayout` — `PageLoadingFallback` passe de `LoadingSpinner` à `SkeletonList`
  (4 rangées). Impact : aucun au repos ; la capture d'un écran en cours de chargement
  change, mais aucun point de contrôle visuel n'en tient.
- `AppLayout` — la vue `not_found` emploie `EmptyState` au lieu d'un gabarit local :
  le `404` (un code d'un autre métier, adressé à personne) et « vérifiez le lien »
  (personne n'a tapé de lien sur un téléphone) tombent ; deux sorties nommées les
  remplacent. Impact : **re-baseline** si un point de contrôle couvre `#/404`.
- `AccessDeniedPage` — l'écran listait **trois causes possibles** et laissait la
  personne trier ; le motif réel remonte désormais de la vérification
  (`AuthContext.accessDeniedReason`) et devient le titre. Le motif ne passe plus par
  un message éphémère. Impact : **re-baseline** si un point de contrôle couvre l'écran.

## [1.2.1] — 2026-07-26

### Corrigé

- **Échelle de rayons — retour au carré (Q-B5 tranchée).** `--tk-radius-control`,
  `--tk-radius-card` et `--tk-radius-sheet` portaient les valeurs 10 / 14 / 16 du brief.
  Appliquées à l'écran Audit, elles ont été jugées **trop arrondies pour la nature du
  projet** : l'identité voulue est « légèrement adouci, mais qui se lit encore comme un
  carré ». Les trois rôles pointent désormais sur l'échelle canonique — 4 / 8 / 8
  (`--tk-radius-md`, `--tk-radius-lg`). **Pourquoi garder les rôles** plutôt que revenir
  à `rounded-md`/`rounded-lg` aux appels : ils nomment une *intention* (contrôle, carte,
  feuille) que les crans ne nomment pas, et ils concentrent le réglage en un point — si
  l'arrondi doit rebouger, c'est trois lignes, pas une chasse dans les composants.
  `DESIGN_BRIEF.md` §3, §10 (Q-B5) et §11.1 corrigés : il n'y a plus deux échelles.
  Impact au repos : **écran Audit compact uniquement** (seul consommateur de ces rôles) —
  cartes 14 → 8, contrôles 10 → 4, FAB et feuille 16 → 8. Captures régénérées.

---

## [1.2.0] — 2026-07-25

**Première bascule ADN mobile : l'écran Audit en compact (< 600 px).** Les tokens
cibles du brief cessent d'être dormants ; le pont Tailwind est alimenté pour la
première fois (`DESIGN_BRIEF.md` §9.2). Medium et expanded ne sont **pas** touchés :
la vue compacte est un rendu séparé, sélectionné en JS (`MEDIA.compact`), et non un
jeu de variantes responsives sur l'arbre historique — c'est la seule façon d'avoir
la garantie que les autres classes de fenêtre restent identiques au pixel.

### Ajouté

- **Pont Tailwind — namespace `adn-*`** (`tailwind.config.js`). Couleurs
  (`text-adn-text`, `-secondary`, `-muted`, `bg-adn-surface-muted`, `border-adn-line`,
  `text-adn-danger`, `bg-adn-warning-light`, `text-adn-warning-strong`,
  `text-adn-success`, `bg-adn-pressed`, `text-adn-on-brand`) et rayons
  (`rounded-adn-control`, `rounded-adn-card`, `rounded-adn-sheet`), plus le
  cran d'espacement `fab` (52 px). **Pourquoi un namespace** plutôt que de repointer
  `rounded-card` & co. : les rôles canoniques servent tous les écrans non basculés ;
  les repointer aurait rhabillé l'application d'un coup. Ces classes disparaissent en
  fin de bascule. Impact au repos : **aucun** (entrées purement additives).
- **`index.css` — variantes typographiques `-plain`** : `.text-headline-medium-plain`,
  `.text-title-medium-plain`, `.text-label-large-plain`, `.text-label-small-plain`,
  `.text-stat-value-mobile`. Identiques à leur cran d'origine **sauf la graisse**,
  portée par le nouveau rôle `--tk-type-weight-strong-next` (500) — l'ADN n'admet que
  deux graisses par écran (interdit §8.5) quand l'échelle canonique panache 500/600/700.
  **Pourquoi des classes et pas un `font-medium` à l'appel** : le typescale vit dans
  `index.css`, donc APRÈS les utilitaires Tailwind dans la cascade ; à spécificité
  égale `.text-title-medium` (700) gagne et la surcharge est perdue en silence. Mesuré
  au `getComputedStyle`, pas supposé. Le bloc est volontairement placé après
  `.page-title`/`.section-title` pour gagner aussi contre elles.
- `useHideOnScrollDown` (`src/hooks/`) — masque un élément flottant au scroll
  descendant (brief §5). Remonte au premier ancêtre réellement scrollable : le
  contenu des pages vit dans le conteneur `overflow-y-auto` d'`AppLayout`, pas dans
  `window`, et un écouteur sur la fenêtre ne se déclencherait jamais.

### Modifié

- `PageTabs` — nouvelle prop `appearance` (`brand` par défaut, `neutral`). En
  `neutral` : segmented control de l'ADN (fond neutre, segment actif **blanc**,
  segments à largeur égale, rayon de carte avec un segment au rayon de contrôle). Le
  jaune n'est plus jamais un fond d'onglet (interdits §8.1, décision §4 du brief).
  Impact au repos : **aucun** hors `appearance="neutral"` — la valeur par défaut rend
  exactement les mêmes classes qu'avant.
- `SearchFilterBar` — props `filterCount` et `filterButtonClassName`. Le compteur de
  filtres actifs s'affiche **en chiffres** sur le bouton filtre (brief §4 : « un
  bouton filtre unique avec compteur »), pas en pastille muette. Impact au repos :
  **aucun** tant que `filterCount` vaut 0 (défaut) — largeur de bouton, réservation
  d'espace et `aria-label` inchangés.
- `EmptyState` / `BottomSheet` — prop `titleClassName`. Leurs titres codaient en dur
  un cran à 700 : sans crochet, un écran ne pouvait pas tenir sa contrainte de deux
  graisses. Impact au repos : **aucun** (prop absente = rendu identique).
- `Chip` — la croix de suppression reçoit `.touch-target`. Sa boîte mesurait ~28 px,
  sous le plancher de 48 px (`DESIGN_SYSTEM.md` §12). Impact au repos : **aucun** —
  le pseudo-élément ne peint rien et n'agit que sur pointeur grossier.
- `AppLayout` — la barre d'application ne rend plus sur les vues passées à l'ADN
  (liste `adnMobileViews`, aujourd'hui `audit`). Ces vues portent elles-mêmes
  l'en-tête « titre 22 + sous-titre contextuel » (§5) ; la barre n'aurait affiché
  qu'un **doublon du titre**, la navigation étant déjà assurée par la barre du bas.
  La page reprend à son compte le dégagement d'encoche (`env(safe-area-inset-top)`).
  Impact au repos : **compact `/audit` uniquement**.
- `src/lib/utils.ts` — `cn()` connaît désormais l'échelle de rayons (`theme.radius`)
  et le cran `fab` (`theme.spacing`) de l'ADN, plus les cinq classes `-plain`. Sans
  ça, `rounded-adn-card` ne chasserait pas le `rounded-xl` d'une primitive (les deux
  classes émises, l'ordre du CSS tranche) et les classes `-plain` seraient prises
  pour des couleurs de texte, avalant les couleurs (`AUDIT_DESIGN_SYSTEM.md` §11.4).
  `scripts/check-cn-merge.mjs` gagne une section 1d qui verrouille ces deux points.

### Divergence ouverte

- **Q-B6 — graisse forte : 500 (écran) contre 600 (système).** Le brief §2 retient
  600 ; la spec de l'écran Audit du 2026-07-25 impose 500 pour tous les crans forts
  (titre 22, valeurs 20, nom de carte 16, action 14). L'écran respecte l'interdit
  §8.5 dans les deux cas (400 + une seule graisse forte). Choix : suivre la spec
  d'écran. Un seul point à basculer si l'arbitrage tranche pour 600 :
  `--tk-type-weight-strong-next`.

---

## [1.1.0] — 2026-07-25

Adoption du contrat de design mobile **ADN mobile v1** (`DESIGN_BRIEF.md`). La
couche de tokens accueille les valeurs cibles ; **aucun composant n'est touché**
et **aucun écran n'a basculé** — la bascule est progressive, écran par écran
(procédure `DESIGN_BRIEF.md` §9).

### Ajouté

- **Couche sémantique — 26 tokens cibles** (bloc « ADN MOBILE v1 » d'`index.css`,
  171 → 197 rôles). Deux conventions : `<rôle>-next` quand le rôle canonique
  existe et est consommé (le suffixe porte la valeur cible), `<rôle>` nu quand le
  rôle est nouveau. Pourquoi cette gymnastique plutôt que de repointer directement
  les rôles canoniques : `--tk-color-danger`, `--tk-color-success`,
  `--tk-color-text-*` etc. sont consommés par les écrans via le pont Tailwind — les
  repointer aurait rhabillé toute l'application d'un coup, ce que le brief exclut
  explicitement. Couverture : neutres chauds affinés (§1), sémantiques
  `#B3261E`/`#1B7F4D`/ambre (§1), graisse et tracking de la typographie mobile (§2),
  rayons 10/14/16 (§3), espacements 20/12/16/24 (§3), hauteur de contrôle 48 et FAB
  52 (§4/§5), or de navigation active (§5), fond de retour tactile (§6).
  Impact sur le rendu au repos : **aucun** — aucun de ces tokens n'est référencé
  hors de sa déclaration (vérifié par balayage), baselines inchangées.
- `--tk-size-touch-target` (48 px) — **seul token cible consommé** : l'utilitaire
  `.touch-target` portait la valeur en dur. Valeur identique, donc zéro diff
  visuel ; le plancher de cible tactile devient réglable comme le reste du tier 2.

### Modifié

- `scripts/check-ds-compliance.mjs` — documentation seule, aucun changement de
  règle. Les gardes `title=` (avertissement) et couleur hex (bloquante, périmètre
  `src/**`) sont rattachées aux « Interdits absolus » `DESIGN_BRIEF.md` §8, et
  l'en-tête déclare que la couverture est **partielle** : les interdits de
  structure ne sont pas décidables lexicalement et se vérifient en revue. La seule
  exception hex assumée — `<meta name="theme-color">` d'`index.html`, qu'aucune
  variable CSS ne peut porter — est désormais écrite.

### Déprécié

- Aucun. Les rôles canoniques divergents (`--tk-color-danger`, `--tk-radius-*`,
  `--tk-space-page`…) restent la source **tant que des écrans les consomment** ;
  ils ne seront retirés qu'à la fin de bascule, quand les valeurs `-next` seront
  reportées dans les rôles canoniques.

---

## [1.0.1] — 2026-07-25

Aucun changement de la librairie ni de la couche de tokens. Entrée conservée
ici parce qu'elle **retire** un usage de `Tooltip` que le DS avait entériné.

### Retiré

- `Tooltip` sur les avatars de comptes démo (`LoginPage`) — l'infobulle se
  positionnait sur le libellé de la section et répétait une information que le
  badge-lettre codait déjà (« Alice SuperAdmin · SuperAdmin »). Remplacée par
  la donnée **écrite en clair** dans une liste de rangées de 48 px (avatar +
  prénom + rôle). Rappel §11.3 : une infobulle complète une information déjà
  visible, elle ne la porte pas. Quand l'infobulle est le seul endroit où
  l'identité est lisible, c'est la mise en page qu'il faut corriger.
  Impact sur le rendu au repos : `LoginPage` uniquement, re-baseline du
  checkpoint `login` nécessaire (compact / medium / expanded).

---

## [1.0.0] — 2026-07-25 — Tracker DS v1

Première version gouvernée. Aucun changement de style : l'existant est codifié,
et les états **manquants** sont comblés. Le rendu au repos est inchangé sur
l'ensemble de la librairie — tous les ajouts se déclenchent au clavier, au
pointeur, ou sur une prop qu'aucun appelant vivant n'active.

### Corrigé — régressions bloquantes

- `Modal`, `SideSheet` — **ne se fermaient plus**. Le commit `283dd58` avait
  inversé la condition de sortie (`else if (visible)` → `else if (!visible)`) :
  à la fermeture d'une boîte montée en permanence (`isOpen` passe à `false`
  alors que `visible` vaut `true`), aucune branche ne s'exécutait, `closing`
  restait faux, l'animation de sortie n'était jamais amorcée — et
  `document.body.style.overflow` restait bloqué à `hidden`. Touchait tous les
  appelants qui gardent la boîte montée : `LocationsPage`, `AddBudgetModal`,
  `AddExpenseModal`, `FinanceManagementPage`, `AddModelPage`,
  `AddCategoryPage`, et `ConfirmationDialog` — donc toutes les confirmations de
  l'application. `BottomSheet`, épargné par ce commit, a servi de référence.
  **Découvert par la galerie** le jour de sa mise en service : le défaut est
  invisible en revue de code et absent des références visuelles, qui ne
  photographient que des boîtes fermées.
  *Impact rendu au repos : aucun.*

### Ajouté — états manquants (`DESIGN_SYSTEM.md` §10.4)

- `Toggle` — **focus-visible**. L'input est `sr-only` : sans relais
  `peer-focus-visible` sur la piste, l'interrupteur n'avait aucun indicateur de
  focus. Invisible au clavier.
- `FileDropzone` — **focus-visible et accès clavier**. `div` cliquable dont
  l'`<input type="file">` est `hidden`, donc non focalisable : la zone était
  inatteignable au clavier. Ajout de `role="button"`, `tabIndex`,
  Entrée/Espace, anneau de focus.
- `FileDropzone` — **état de chargement durci**. Le clic était gardé, pas le
  **dépôt** : un fichier pouvait être déposé pendant un traitement. Ajout de
  `aria-busy` et neutralisation du dépôt.
- `FloatingActionButton` — **disabled**. Le composant acceptait la prop sans
  aucun rendu associé : bouton mort d'aspect actif. `ListActionFab` la
  transmettait déjà.
- `Pagination` — **focus-visible** (anneau du DS au lieu de celui du
  navigateur) et **pressed**.
- `MovementTimeline` — **focus-visible** et **pressed** sur sa pagination
  interne.
- `SearchFilterBar` — **focus-visible**. Le champ porte `focus:outline-none` ;
  le focus n'était signalé que par une élévation, indicateur insuffisant.
  L'anneau est porté par le conteneur et ciblé `has-[input:focus-visible]` pour
  ne pas doubler celui des boutons de la barre.
- `Card` — **pressed**. Le JSDoc annonçait « supports focus, hover, and pressed
  states » ; le pressed n'existait pas. Aligné sur `MetricCard` / `EntityRow`.
- `Chip` — **pressed**.

*Impact rendu au repos : aucun (10 états, 8 composants).*

### Corrigé — états

- `Chip` — le survol du chip **sélectionné** (`hover:bg-primary/90`)
  s'appliquait même désactivé. Conditionné comme celui du chip au repos.
  *Impact rendu au repos : aucun.*

### Ajouté — gouvernance

- **`npm run ds:check`** remplace `md3:check` (`scripts/check-ds-compliance.mjs`).
  Périmètre étendu de `src/components/**` à **`src/**`** pour les règles de
  couleur : `features/` échappait au contrôle, et portait les six seuls écarts
  du dépôt. Nouvelle règle bloquante : **hex en dur sans liste d'exception**.
  Nouvel avertissement : `title=` porteur d'information seule.
  `lint:md3` devient **`lint:ds`**.
- **Galerie `#/dev/design-system`** — vitrine vivante des 39 primitives,
  alimentée par les composants réels, montée uniquement en développement.
  Le `import()` est placé dans la condition `import.meta.env.DEV` : un `lazy()`
  au niveau du module faisait émettre un chunk de 37 ko en production.
- **`DESIGN_SYSTEM.md` §10 à §14** — matrice d'états, règles de choix entre
  composants proches, patterns officiels, conventions de contenu, définition de
  « terminé ».
- **Ce journal.**

### Modifié — conformité (extension du périmètre de `ds:check`)

Six violations, toutes dans `LoginPage.tsx`, toutes corrigées **sans dérive de
rendu** :

- 3 × `text-slate-400` / `text-slate-200` → tokens de composant
  `--color-login-hero-text` et `--color-login-hero-text-muted`. Valeurs reprises
  **en oklch** et non en hex : la conversion vers sRGB de Tailwind v4 ne repasse
  pas exactement par `#E2E8F0` / `#94A3B8`.
- 3 × `className="bg-white"` sur `InputField` → **supprimé**. La variante
  `filled` applique déjà `bg-surface`, dont le token vaut `#ffffff` : la
  surcharge était morte.

L'entrée `HEX_ALLOWLIST` de `LoginPage` est retirée : la page n'a plus d'hex
depuis la tokenisation du constat #18.
*Impact rendu au repos : aucun.*

### Connu — non traité en v1

Ces points sont documentés, pas corrigés : ils touchent des chaînes affichées ou
la structure du DOM, donc les références visuelles.

- **« Retour matériel »** (`DashboardPage.tsx:355,378`) — groupe nominal là où
  la règle impose un verbe + objet (`DESIGN_SYSTEM.md` §13.2). Changer la chaîne
  change la largeur du bouton.
- **`DemoBadge`** — seul avertissement `title=` restant : son infobulle est une
  **définition**, pas une redondance. La convertir en `<Tooltip>` ajouterait un
  conteneur autour de chaque badge.
- **`EXAMPLE_PREFIX`** — le glossaire déclare `'Ex :'` (espacement français) ;
  15 placeholders écrivent `Ex:`.
- **Glossaire sous-consommé** — 9 entrées sur 32 le sont réellement, toutes via
  `destinations.ts`. Les blocs « Actions » et « Messages » sont réécrits
  littéralement dans les pages ; les valeurs coïncident, le risque est la dérive
  future.
- **`finance` et `rbac`** — libellés écrits en dur dans `destinations.ts` au
  lieu de passer par le glossaire.
- **`ConfirmationDialog`** — indicateur de chargement local plutôt que la prop
  `loading` de `Button`.
