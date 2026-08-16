# Rôles et permissions — ce qu'il faut trancher avant de dessiner 09.3

Écrit le 05/08. Relevé sur `screens/actuel/rbac.png`, confronté à `dashboard-analyse.md` §1 et au
vocabulaire des planches livrées. Ordre du catalogue et d'Emplacements : options, arbitrage, **puis**
dessin.

---

## Le fait central, et il commande les quatre points

**L'écran actuel déclare 8 rôles et jusqu'à 24 permissions chacun. L'application en consomme un
booléen.** `dashboard-analyse.md` §1, relevé le 28/07 : *« toute la variation par rôle repose sur un
seul booléen : `permissions.canManageInventory` »*. Les deux vues du tableau de bord, la barre du
bas à quatre ou cinq onglets, la file de tâches à 20 ou 3 entrées — tout cela sort de **ce booléen**,
pas d'une matrice.

Ce n'est pas un défaut de dessin. C'est un écran qui **promet un système que le produit n'applique
pas**, et il faut le trancher avant de le redessiner, sans quoi on redessine la promesse.

**Relevé sur la capture, à ne pas paraphraser.** Quatre cartes de tête — *Rôles* **8**, *Groupes*
**5**, *Affectations* **11**, *Workflows* **1**, *Conflits (utilisateur)* **0**. Trois onglets visibles
— *Rôles*, *Permissions*, *Workflows* — et un indicateur **4** en bout de barre. Les huit rôles portent
une **clé technique** et un **compte de permissions** : `role.system.admin` 24 · `role.custom.external_auditor`
7 · `role.custom.finance_controller` 5 · `role.system.employee` 5 · `role.system.manager` 9 ·
`role.custom.security_lead` 4 · `role.custom.hr` 5 · `role.system.superadmin` 24. Badge **SYSTÈME**
ou **PERSONNALISÉ** ; **seuls les quatre personnalisés portent une corbeille**. Cinq groupes —
*Auditeurs externes*, *IT France*, *IT Sénégal*, *Opérateurs Audit*, *Validation Finance* — **tous à
« 1 rôle(s) »**. Les deux formulaires de création sont **en bas de leur carte**, pas en feuille.

**Ce que les planches livrées disent, elles.** Trois rôles, et trois seulement : *Super admin*
(05.2), *gestionnaire* et *utilisateur* (`data-role="gest"` / `"user"` dans les trois planches de
tableau de bord). **Aucun ne figure dans la liste des huit** — le plus proche est *Manager*.
Et `LEXIQUE.md` **ne fixe aucun nom de rôle** : le mot « gestionnaire » traverse le projet en prose
sans jamais avoir été arrêté.

---

## A · Combien de rôles cet écran montre-t-il ?

| | Option | Ce qu'elle coûte |
| --- | --- | --- |
| **A1** | **Les huit, plus la création de rôles personnalisés.** Le produit d'aujourd'hui. | On redessine une matrice de 8 × 24 que rien ne lit. Le premier gestionnaire qui retire une permission à *Comptable* constatera qu'il ne s'est rien passé. |
| **A2** | **Les trois que le produit distingue** — administrateur, gestionnaire, utilisateur. Les rôles personnalisés sortent, à rouvrir quand le produit saura les appliquer. | Honnête, et court. Mais **cinq rôles existent dans la donnée** et 11 affectations pointent dessus : les supprimer de l'écran ne les supprime pas de la base, et l'écran cesse d'être *la source* que 05.2 dit qu'il est. |
| **A3** | **Les huit, et l'écran dit lesquels changent quelque chose.** Un rôle porte son **effet réel** — *« donne accès à la gestion du parc »* — et les rôles sans effet distinct le disent : ils existent, ils sont affectés, ils ne modifient pas encore ce que la personne voit. | Un écran qui avoue un écart au lieu de le peindre. C'est plus difficile à écrire, et c'est le seul état qui ne mente pas. |

**Recommandation : A3.** Un référentiel se corrige sur l'écran qui le tient (règle de 09.1) ; ici, ce
qui est à corriger est **l'écart entre ce qui est déclaré et ce qui est appliqué**, et un écran qui le
cache le rend introuvable.

---

## B · Que vaut le mot « permission » ?

| | Option | Ce qu'elle coûte |
| --- | --- | --- |
| **B1** | **La matrice cible.** On dessine les permissions que le produit *devrait* avoir. | Une maquette d'intention. Elle sera lue comme un état des lieux — c'est déjà arrivé sur le catalogue. |
| **B2** | **Ce qui est appliqué, et le compte de ce qui ne l'est pas.** Une permission **effective** se lit normalement ; une permission **déclarée mais non appliquée** porte la forme de `.aid.todo` — la valeur dit qu'elle n'a pas d'effet. | Il faut relever, permission par permission, laquelle est lue par le code. Ce relevé n'existe pas : **c'est un travail de source**, pas de dessin. Sans lui, on ne dessine que la première ligne. |
| **B3** | **Les compteurs disparaissent.** Un rôle dit ce qu'il permet en une phrase, sans nombre. | *« 24 permissions »* n'informe personne — mais le nombre est le seul indice qu'un rôle est plus large qu'un autre. Le supprimer sans le remplacer perd une information vraie. |

**Recommandation : B2, dans sa version honnête** — la planche montre la forme, et déclare que
**le relevé permission par permission reste à faire**. C'est la même règle qu'aux quatre clés de
catalogue non relevées : la forme dit ce qu'elle ne sait pas.

---

## C · Le **groupe** est-il le périmètre ?

Les cinq groupes du produit sont **tous à un seul rôle**, et deux d'entre eux — *IT France*,
*IT Sénégal* — sont exactement un **service × pays**. C'est le couple que l'arbitrage d'Emplacements
vient de séparer : le service est sorti de l'arbre géographique, il reste un attribut de la personne.

| | Option | Ce qu'elle coûte |
| --- | --- | --- |
| **C1** | **Le groupe est un rôle + un périmètre.** *IT France* = gestionnaire, sur les sites de France. C'est ce que la donnée montre déjà, et ça donne au groupe une raison d'exister que « 1 rôle(s) » n'exprime pas. | Le périmètre devient un objet à dessiner : sur quel axe ? **Site**, pas service — décidé en §5.9. Un gestionnaire de Dakar ne gère pas Paris, et rien aujourd'hui ne le dit. |
| **C2** | **Le groupe est un sac d'utilisateurs**, sans périmètre : une commodité d'affectation. | Le produit d'aujourd'hui, où le groupe n'apporte rien qu'une indirection. Cinq groupes pour cinq rôles uniques. |
| **C3** | **Pas de groupes.** Le rôle s'affecte à la personne. | Simple, et faux : les noms de groupes relevés portent une information de **territoire** qui n'a nulle part ailleurs où vivre. |

**Recommandation : C1.** C'est la seule qui explique les noms observés, et elle solde une question
ouverte depuis le 29/07 (`dashboard-analyse.md` : *« une personne peut-elle appartenir à plusieurs
sites ? Si oui, le sélecteur de périmètre change tout ce que l'écran affiche »*).

---

## D · Les **workflows** appartiennent-ils à cet écran ?

Un onglet *Workflows* vit dans l'écran des rôles, et il en compte **un**. Or la validation du
manager — le seul workflow du produit — est **déjà dessinée** dans la file de tâches et dans le
parcours d'attribution (07.x), et `LEXIQUE.md` en fixe les mots.

| | Option | Ce qu'elle coûte |
| --- | --- | --- |
| **D1** | **Les workflows sortent de 09.3.** Un rôle dit *qui peut* ; un workflow dit *dans quel ordre* — deux objets. | Un onglet en moins, et une question posée : où se **règle** le workflow ? Nulle part aujourd'hui. |
| **D2** | **Ils restent**, parce qu'un workflow n'est qu'une chaîne de rôles. | Un écran qui fait deux métiers, et l'onglet *Permissions* devient le troisième. Trois onglets pour trois écrans, c'est le mécanisme qui a fait éclater « Paramètres » le 29/07. |

**Recommandation : D1**, et **on ne dessine pas** le réglage du workflow ici : c'est un écran de
plus, pas une carte de plus.

---

## Le point de lexique, à trancher en même temps

`LEXIQUE.md` fixe un mot par acte et **aucun nom de rôle**. Trois vocabulaires coexistent :
*Super admin* / *gestionnaire* / *utilisateur* dans les planches, *SuperAdmin* / *Manager* /
*Employé* dans la donnée, *administrateur* dans les notes. **Le nom du rôle est affiché sur chaque
fiche utilisateur** (05.1, 05.2, 06.2) : c'est un mot très vu, jamais arrêté.

**Proposition :** les trois rôles que le produit distingue s'appellent **administrateur**,
**gestionnaire**, **utilisateur** ; les cinq autres gardent leur libellé de donnée tant qu'ils n'ont
pas d'effet. À inscrire dans `LEXIQUE.md` comme un tableau de rôles, pas d'actes.
