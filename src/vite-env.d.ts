/// <reference types="vite/client" />

/*
  Les types du client Vite — `import.meta.env` et les imports d'assets (`.webp`,
  `.png`, `?raw`…).

  Ils ne se chargent pas tout seuls ici : `tsconfig.json` porte `"types": ["node"]`,
  qui **restreint** les types globaux à cette seule entrée. La référence triple-slash
  ci-dessus passe outre cette restriction, ce qu'un ajout à `"types"` ferait aussi —
  mais au prix de rouvrir la liste, alors que la restriction est délibérée.

  Sans ce fichier, `tsc` signalait comme erreurs des emplois parfaitement corrects :
  `import.meta.env.DEV` (App, AuthContext, ErrorBoundary, LoginPage) et l'import de
  l'image de héro du tableau de bord. Des faux positifs, qui masquaient les vraies
  erreurs dans le bruit. Ajouté le 20/08.
*/
