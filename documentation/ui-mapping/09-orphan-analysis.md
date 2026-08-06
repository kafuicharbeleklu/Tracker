# Orphan Analysis

## Routes et vues

| Elément | Etat constaté | Preuve / conséquence |
| --- | --- | --- |
| `src/routes/` | dossier sans route applicative | le routage est dans `useRouter` et `useAppNavigation` |
| `not_found` | sans entrée depuis l'UI | atteignable par hash inconnu, comportement attendu |
| `#/management/categories` | route piège | affiche Dashboard, voir audit |
| `#/management/models` | route piège | affiche Dashboard, voir audit |
| `/audit/details/:id` | paramètre orphelin | généré mais non consommé |
| `#/dev/design-system` | volontairement hors coque | seulement en développement |
| `#/documentation/ui-flow-map` | volontairement hors coque | documentation publique |

## Composants à usage absent ou unique

| Composant | Etat constaté |
| --- | --- |
| `ui/Divider` | aucun importateur applicatif relevé hors galerie |
| `ui/BottomSheet` | un appelant : `AuditOverviewMobile` |
| `ui/FloatingActionButton`, `ui/FabContainer`, `ui/Menu`, `ui/Snackbar`, `ui/Toggle`, `ui/ConfirmationDialog` | un appelant applicatif relevé chacun ; API à documenter plutôt qu'à supprimer sans analyse d'usage futur |
| `AddCategoryPage`, `AddModelPage` | nommés « pages » mais montés par `ManagementPage` comme modales |

## Boutons, destinations et cycles

| Catégorie | Constat |
| --- | --- |
| Boutons de navigation sans destination | aucun cas statique confirmé ; les deux imports cassés tentent toutefois d'appeler des callbacks absents |
| Destinations sans point d'entrée UI | `not_found` par conception; les routes d'édition sont accessibles depuis leurs détails |
| Boucles involontaires | aucune détectée dans le code de routage |
| Cycles intentionnels | liste → détail → édition → liste/détail, audit → détail → audit |
| Ecrans terminaux routés | Finances, RBAC, Rapports, Emplacements et Paramètres n'exposent pas de transition routée sortante dans le relevé; ils ouvrent des surfaces internes ou exécutent des actions locales |

## Points non prouvables statiquement

- Un composant peut être importé dynamiquement ou être destiné à une future fonctionnalité; « appelant unique » n'est pas une preuve de suppression nécessaire.
- La présence d'une route hash ne prouve pas qu'elle est référencée depuis un lien externe ou un favori.
- Les défauts d'interaction et de rendu nécessitent une campagne d'exécution et de capture en complément de cette analyse.
