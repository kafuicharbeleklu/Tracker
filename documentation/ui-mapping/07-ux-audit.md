# UX / UI Audit

## Méthode et limites

Les constats ci-dessous proviennent de la lecture des routes, props, handlers et composants. Les différences pixel, espacements, couleurs, typographies et transitions n'ont pas été comparées par capture de toutes les vues; elles demandent une campagne visuelle dédiée. Les constats de mutualisation sont structurels.

## Critique

### Deux imports montés avec le mauvais contrat

`ImportEquipmentPage` et `ImportUsersPage` exigent `onCancel` et `onSave`. `AppLayout.tsx` leur passe `onViewChange`, prop absente de leur contrat. Annuler et terminer l'import tentent alors d'appeler une fonction non fournie. Les imports modèles et emplacements reçoivent, eux, les callbacks attendus.

Sources : `ImportEquipmentPage.tsx`, `ImportUsersPage.tsx`, `AppLayout.tsx`.

### Deux URLs de Gestion rendent silencieusement le Dashboard

Pour `#/management/categories` et `#/management/models`, le parseur entre dans la branche mais n'assigne pas de vue lorsqu'il n'y a aucun troisième segment. La valeur initiale `dashboard` est conservée. L'URL et l'interface divergent sans écran 404 ni message.

Source : `src/hooks/useAppNavigation.ts`.

## Haute

### Paramètre mort pour le détail Audit

`navigateToItem('audit_details', id)` construit `/audit/details/:id`, mais le parseur n'assigne jamais cet identifiant et la page n'en reçoit aucun. L'URL contient une information sans effet.

### Trois conventions de navigation

| Convention | Exemples | Risque |
| --- | --- | --- |
| `onViewChange` / tables de routes | Dashboard, Inventory, Users | typée et centralisée |
| `navigate('/chemin')` | Approvals, NewRequest, Details, Locations, RBAC | chaînes brutes non centralisées |
| lecture directe du hash | Assignment wizard | query invisible au routeur |

Les variantes rendent les renommages plus risqués et compliquent les audits de destinations.

### Dashboard conditionné à une permission d'inventaire

Les trois surfaces de navigation cachent Dashboard avec `canViewInventory`, alors que la route par défaut et `canAccessView('dashboard')` l'autorisent. Un profil concerné arrive à Dashboard mais ne dispose plus d'un moyen de le sélectionner.

Sources : `Sidebar.tsx`, `NavigationRail.tsx`, `NavigationBar.tsx`, `AppLayout.tsx`.

## Moyenne

### Deux tables de titres divergent

`VIEW_TITLES` dans `useAppNavigation.ts` et `getTopAppBarTitle` dans `AppLayout.tsx` décrivent les mêmes vues avec des libellés différents : détail/détails, profil/détail utilisateur, attribution/assistant d'attribution et localisations/emplacements. Cela contredit le rôle de terminologie unique de `src/constants/glossary.ts`.

### Même formulaire, atterrissages différents

`AddEquipmentPage` et `AddUserPage` sont correctement partagés entre ajout et édition. Après sauvegarde, l'ajout revient à la liste alors que l'édition revient au détail. Ce peut être une intention; elle n'est pas standardisée ni exposée par un contrat commun.

### `goBack` incomplet

`goBack` ne traite explicitement que inventory, users, management, audit et approvals/new. Depuis import emplacements, rapports, finance, RBAC, paramètres ou certains wizards, le fallback va à Dashboard plutôt qu'à la section parente.

### Contrats de pages hétérogènes

Six formes coexistent : `onViewChange`, `onCancel/onSave`, `onBack`, `onCancel/onComplete`, aucun prop, `onLogout`. La divergence a déjà produit le défaut critique des imports.

### Accessibilité de trois cartes d'emplacements

Les cartes de synthèse d'`LocationsPage.tsx` utilisent un `div onClick` vers inventaire, utilisateurs et audit. Elles doivent être examinées pour le clavier, rôle, focus et nom accessible, contrairement à `Card` qui gère ces aspects.

## Faible

`AppLayout.tsx` maintient un `case 'not_found'` et un `default` de vue introuvable. Avec l'union `ViewType` couverte, le second chemin est a priori redondant.
