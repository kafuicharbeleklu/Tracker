# PROMPT POUR L'AGENT DE CODE

## Avant tout — le préalable matériel

L'agent travaille dans le dépôt `TRACKER`, pas ici. **Copiez-y d'abord ces fichiers**, sinon il n'a
rien à lire :

```
TRACKER/docs/design/
  REGLES-TRANSVERSES.md
  LEXIQUE.md
  DOSSIER-PASSATION-DEV.md
  CORRESPONDANCE-ICONES.md
  PASSATION.md
  DECISION-DOCUMENTATION-14-08.md
  screens/            ← les 35 fichiers .html
```

Les planches sont du HTML autonome : l'agent les lit comme du code, et c'est le point important — il
n'a pas à deviner une intention à partir d'une image.

---

## 1 · L'amorce de session — à donner une fois, en début de chaque session

> Tu travailles sur Neemba Tracker. Un chantier de design de trois semaines vient de se terminer : il
> a produit **35 planches** dans `docs/design/screens/` et cinq documents dans `docs/design/`.
>
> **Lis d'abord, dans cet ordre :** `DOSSIER-PASSATION-DEV.md` (l'ordre de marche et les dix dettes),
> `REGLES-TRANSVERSES.md` (le registre normatif), `LEXIQUE.md` (un mot par acte),
> `CORRESPONDANCE-ICONES.md` (les ~80 icônes vers Phosphor).
>
> **Les planches sont la référence, pas le code existant.** Chaque planche est un fichier HTML avec des
> colonnes légendées : `État —` un état de la vue, `Vue —` la même page pour un autre rôle, `Relevé —`
> ce que le code fait aujourd'hui et pourquoi cela change. **Quand le code et une planche divergent, la
> planche gagne** — sauf si tu trouves une raison technique, et alors tu la dis avant de coder.
>
> **Trois interdits, ce sont les dérives que le chantier a corrigées :**
> 1. **Ne pose jamais une valeur au cas par cas.** Une hauteur de rangée, une largeur maximale, un
>    nombre de colonnes : la valeur est dans le registre. Le produit porte aujourd'hui trente
>    `medium:grid-cols-2` et sept `max-w-*` posés écran par écran — c'est exactement ce qu'il ne faut
>    plus faire.
> 2. **Ne construis pas écran par écran.** Trois composants partagés portent la moitié du produit ; ils
>    passent avant tout écran. L'ordre est en §2 du dossier de passation.
> 3. **N'annonce jamais ce qui n'existe pas.** Pas de bouton sans destination, pas de « bientôt
>    disponible ». Un geste mort est pire qu'un manque.
>
> **Ne fais rien pour l'instant.** Dis-moi ce que tu as compris de l'ordre de construction, et quelles
> dettes de la §4 bloquent la première étape.

---

## 2 · Les prompts par étape — un par lot, dans cet ordre

### Étape 1 — les trois composants transverses

> Construis les trois composants partagés, dans cet ordre : **17.3** (`transverses-2-attente-scan-piste.html`
> — squelettes, scan par lot, hors ligne), **17.2** (`transverses-1-selection-piste.html` — mode
> sélection, confirmation destructive), **17.1** (`etats-piste.html` — vide, erreur d'acte, hors ligne,
> introuvable, refusé).
>
> Ils valent respectivement **28 écrans**, **20 emplois** et **4 états** : chaque décision que tu prends
> ici se répète partout. Lis les quatre colonnes de chaque planche, y compris la colonne `Relevé` — elle
> dit ce que le code fait aujourd'hui et pourquoi cela change.
>
> Ne touche à aucun écran. Livre les composants, leurs états, et la liste des emplacements du code qui
> devront les appeler.

### Étape 2 — un gabarit à la fois

> Construis le gabarit **&lt;liste | fiche | formulaire | assistant | référentiel | tableau de bord&gt;**
> d'après sa planche de référence (§2 du dossier), **et son régime tablette** d'après 00.3, 00.4 ou 00.5.
>
> Le gabarit d'abord, l'instanciation ensuite. Rappel du registre : **une rangée fait 72 px à toutes les
> largeurs**, un réglage 56, une vignette 40. Ce qui gagne de la place gagne des rangées, pas de la
> hauteur.

### Étape 3 — les écrans, par domaine

> Implémente le groupe **&lt;NN. Domaine&gt;** d'après ses planches. Pour chacune : lis l'intro (ce
> qu'elle tranche), les colonnes `État` et `Vue` (ce qu'il faut construire), et la colonne `Relevé` (ce
> qu'il faut retirer — c'est aussi du travail).
>
> Emploie les composants de l'étape 1 ; si tu es tenté d'en réécrire un localement, arrête-toi et
> dis-le-moi.

### Étape 4 — la migration des icônes

> Remplace `MaterialIcon` par `@phosphor-icons/react` d'après `CORRESPONDANCE-ICONES.md`.
>
> **Ce n'est pas un remplacement mécanique.** La table §8 liste trois paires à fusionner, deux ensembles
> à ne surtout pas fusionner (`shield`/`verified`/`shield_person` sont trois choses différentes), un
> conflit à arbitrer (`tune` contre `Funnel`), et les tailles à ramener à **20 px** pour un geste,
> **18 px** en rangée, **32 px** pour l'état vide. Signale-moi le conflit avant de le trancher seul.

---

## 3 · Ce qu'il ne peut pas faire, et doit signaler

Quatre dettes du dossier **ne se règlent pas au clavier**. Si l'agent les rencontre, il doit s'arrêter
et le dire au lieu de bricoler :

| Dette | Pourquoi il doit s'arrêter |
| --- | --- |
| **D1** département / service | Migration de données. Quatre services sur sept n'attendent aucun actif ; aucun code ne répare ça. |
| **D4** `Snackbar` jamais appelé | Décision produit : l'adopter, ou la forme 2 des clôtures perd son second cas. |
| **D8** documentation utilisateur | Question de contenu : y a-t-il quelque chose à ouvrir ? Sinon les quatre pavés du Centre d'aide se retirent. |
| **Icônes** `tune` / `Funnel` | Arbitrage de vocabulaire visuel, à trancher une fois pour tout le produit. |

---

## 4 · La phrase de fin, à ajouter à chaque prompt d'étape

> Quand tu as fini, dis-moi : ce que tu as construit, **ce que tu as dû décider seul et pourquoi**, et
> ce qui reste. Si une planche est ambiguë, ne devine pas — cite la colonne et pose la question.
