# CORRESPONDANCE DES ICÔNES — `MaterialIcon` vers Phosphor

**14/08/2026.** Répond à la dette **D10** du dossier de passation, qui disait *« remplacer
`MaterialIcon` par Phosphor »* sans dire par quoi. Sans cette table, chaque développeur choisit son
icône et la règle **I3** se perd écran par écran.

**Relevé** : ~80 noms distincts dans `src/`, tous en Material Symbols par `<MaterialIcon name="…" />`.
La cible est **`@phosphor-icons/react`**, déjà employée par les 35 planches.

---

## 1 · Les trois règles avant la table

**Le poids.** Les planches emploient `regular` partout, et `fill` **uniquement** pour dire *actif* ou
*acquis* : l'onglet de navigation en cours, une coche de fait accompli. Un `fill` ailleurs se lit comme
une insistance, et deux insistances côte à côte n'insistent plus.

**Les deux tailles d'emploi.** **20 px** pour un geste (barre du haut, bouton, rail), **18 px** dans une
rangée ou à côté d'un mot. Les 24, 28, 32, 40, 56 relevés dans le code sont à ramener à ces deux
valeurs, sauf l'icône d'état vide — **32 px**, une seule fois par écran.

**I3 — un état se dit par un pictogramme *et* un mot.** Jamais par la seule couleur, jamais par le seul
pictogramme. Si vous remplacez une icône d'état, vérifiez que le mot est à côté.

---

## 2 · Navigation et direction

| `MaterialIcon` | Phosphor | Note |
| --- | --- | --- |
| `arrow_back` | `ArrowLeft` | Retour. Jamais `CaretLeft` : le chevron est pour la hiérarchie, la flèche pour l'historique. |
| `arrow_forward` · `arrow_right_alt` | `ArrowRight` | Deux noms Material pour un seul rôle — **fusionner**. |
| `chevron_right` | `CaretRight` | Ouvre un détail, en fin de rangée. |
| `chevron_left` | `CaretLeft` | Pagination seulement. |
| `arrow_drop_down` | `CaretDown` | Déclencheur de liste déroulante. |
| `unfold_more` | `CaretUpDown` | Tri, ou champ à deux sens. |
| `south` | `ArrowDown` | Mouvement descendant (retour d'actif). |
| `home` | `House` | `fill` quand la destination est active. |
| `dashboard` · `grid_view` | `SquaresFour` | **Collision** : deux noms Material, une seule icône Phosphor. Vérifier qu'ils ne cohabitent pas dans un même écran. |
| `more_vert` | `DotsThreeVertical` | Débordement. |

## 3 · Gestes et acquittements

| `MaterialIcon` | Phosphor | Note |
| --- | --- | --- |
| `add` | `Plus` | Le seul geste d'ajout. |
| `check` | `Check` | Coche nue, dans un contrôle (case, puce, option). |
| `check_circle` · `task_alt` | `CheckCircle` | **Fusionner.** `fill` = fait accompli, `regular` = état courant. |
| `close` | `X` | Fermer. Distinct de `cancel`. |
| `cancel` | `XCircle` | Refuser un acte — pas fermer une vue. |
| `do_not_disturb_on` | `Prohibit` | Rejeter une demande. |
| `save` | `FloppyDisk` | À éviter : le registre demande un **verbe** sur le bouton, pas une disquette. |
| `refresh` · `restart_alt` | `ArrowsClockwise` / `ArrowCounterClockwise` | Recharger vs réinitialiser — **deux sens, deux icônes**. Le code les confond. |
| `visibility` | `Eye` | Consulter sans modifier. |
| `play_arrow` | `Play` | Démarrer une campagne. |
| `login` | `SignIn` | Connexion. |
| `search` | `MagnifyingGlass` | — |
| `tune` | `SlidersHorizontal` | Filtres. Jamais `Funnel` **et** `SlidersHorizontal` dans le même produit — les planches emploient **`Funnel`** ; à trancher, puis un seul. |
| `open_with` | `ArrowsOutCardinal` | Déplacer. |
| `fit_screen` | `CornersOut` | Recentrer. |
| `center_focus_strong` | `Crosshair` | Mode focus. |

## 4 · États, alertes, attente

| `MaterialIcon` | Phosphor | Note |
| --- | --- | --- |
| `error` | `WarningCircle` | Erreur d'acte. Avec le mot, toujours (I3). |
| `gpp_maybe` | `ShieldWarning` | Garantie qui expire. |
| `info` | `Info` | — |
| `help` | `Question` | Aussi l'écart d'audit *manquant* (16.2). |
| `progress_activity` | `CircleNotch` | Attente **courte**. Au-delà, ce sont des squelettes — voir 17.3. |
| `pending_actions` | `ClockCountdown` | *À lancer*, *en retard*. |
| `history` | `ClockCounterClockwise` | Historique, journal. |
| `calendar_today` | `CalendarBlank` | Une date. |
| `lock` | `Lock` | Accès refusé, champ verrouillé. |
| `lock_reset` | `LockKeyOpen` | Changer un mot de passe. |
| `shield` · `verified` · `shield_person` | `ShieldCheck` · `SealCheck` · `ShieldStar` | Trois rôles distincts : **compte vérifié**, **acte certifié**, **rôle d'administration**. Le code les échange ; ne les fusionnez pas. |
| `bolt` | `Lightning` | — |
| `science` | `Flask` | Étiquette de donnée simulée. |

## 5 · Personnes et rôles

| `MaterialIcon` | Phosphor |
| --- | --- |
| `person` | `User` |
| `person_add` | `UserPlus` |
| `manage_accounts` | `UserGear` |
| `how_to_reg` | `UserCheck` |
| `groups` | `UsersThree` |
| `mail` | `EnvelopeSimple` |
| `comment` | `ChatTeardropText` |

## 6 · Catégories d'actifs — le jeu à figer

Ces seize-là sont dans `mockData.tsx` et servent de **vignette de rangée** (40 px, rayon 6). Elles sont
les plus visibles du produit : figez-les une fois.

| Catégorie | `MaterialIcon` | Phosphor |
| --- | --- | --- |
| Laptop | `laptop` | `Laptop` |
| Monitor | `monitor` | `Monitor` |
| Keyboard | `keyboard` | `Keyboard` |
| Mouse | `mouse` | `Mouse` |
| Smartphone | `smartphone` | `DeviceMobile` |
| Tablet | `tablet` | `DeviceTablet` |
| Headphones | `headphones` | `Headphones` |
| Speaker | `speaker` | `SpeakerHigh` |
| Tv | `tv` | `Television` |
| Printer | `print` | `Printer` |
| Server | `dns` | `HardDrives` |
| Router | `router` | `WifiHigh` |
| Camera | `photo_camera` | `Camera` |
| HardDrive | `hard_drive` | `HardDrive` |
| Cpu | `memory` | `Cpu` |
| Armchair | `chair` | `Armchair` |

## 7 · Métier

| `MaterialIcon` | Phosphor | Note |
| --- | --- | --- |
| `inventory` | `Package` | Le parc. |
| `assignment_return` | `ArrowUUpLeft` | Restituer — un mouvement, pas un document. |
| `fact_check` | `ClipboardCheck` | Audit. |
| `task` | `ClipboardText` | Un reçu, un bon. |
| `inbox` | `Tray` | File d'approbations. |
| `settings` | `Gear` | — |
| `account_balance_wallet` | `Wallet` | Finances. |
| `savings` | `PiggyBank` | Amortissement. |
| `build` | `Wrench` | En réparation. |
| `cloud_upload` | `UploadSimple` | Import de fichier. |
| `layers` | `Stack` | — |
| `translate` | `Translate` | — |
| `policy` | `Scroll` | Gouvernance. |
| `map` | `MapTrifold` | Mini-carte. |
| `account_tree` · `tree_structure` | `TreeStructure` | **N'existe que dans l'explorateur de documentation, exclu du périmètre** — à supprimer avec lui. |

---

## 8 · Ce que la migration doit corriger au passage

Quatre choses que la table rend visibles, et qu'un remplacement mécanique laisserait passer :

1. **Six paires à fusionner** — `arrow_forward`/`arrow_right_alt`, `check_circle`/`task_alt`,
   `dashboard`/`grid_view`. Un rôle, un nom.
2. **Trois triplets à *ne pas* fusionner** — `shield`/`verified`/`shield_person`, et
   `refresh`/`restart_alt`. Le code les échange déjà ; la migration est le bon moment pour trancher.
3. **Un conflit de filtre à arbitrer** — le code emploie `tune`, les 35 planches `Funnel`. Choisissez,
   puis un seul dans tout le produit.
4. **Les tailles.** 24, 28, 32, 40 et 56 px sont relevés dans le code. Le registre n'en connaît que
   **20** (geste), **18** (rangée) et **32** (état vide, une fois par écran).

**Source de vérité** : les 35 planches de `screens/`, où chaque icône est employée dans son contexte
réel. En cas de doute sur un choix, ouvrez la planche du domaine plutôt que cette table — elle montre
la taille, le poids et le mot qui l'accompagne.
