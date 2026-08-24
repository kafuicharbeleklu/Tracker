# Tracker — objectif et solution

> Section « objectif et solution » du dossier de passation. Destinée à un lecteur non technique.
> Rédigée à partir de l'analyse du code source, complétée par les documents internes du projet.

## 1. Contexte et problématique

Neemba gère un parc d'équipements informatiques réparti sur plusieurs pays et plusieurs sites, confié à des collaborateurs qui changent de poste, de service ou d'entreprise. Sans outil dédié, trois questions restent sans réponse fiable : qui détient quoi aujourd'hui, qui a autorisé cette remise, et que vaut encore ce matériel. Les tableurs et les échanges par courriel ne conservent ni la preuve d'une remise, ni la trace d'une validation hiérarchique, et ne permettent pas de rapprocher ce que dit l'inventaire de ce qui est réellement présent dans un service. S'y ajoute une difficulté financière : les dépenses informatiques (achats, licences, maintenance, services cloud) arrivent sous forme de factures éparses, difficiles à rattacher à un budget et à suivre dans le temps.

## 2. Objectif du projet

Doter Neemba d'une application interne unique qui suit chaque équipement de son acquisition à sa sortie du parc, encadre les remises et les restitutions par un circuit de validation traçable, et rattache le tout au budget informatique. Objectif final : à tout moment, savoir où se trouve un équipement, qui en répond, et ce qu'il coûte.

## 3. Solution apportée

### Inventaire du parc

L'application tient la fiche de chaque équipement : identification, caractéristiques, détenteur actuel, emplacement, documents joints et informations d'achat. Chaque fiche porte un statut lisible par tous — disponible, attribué, en attente, en réparation, en maintenance préventive, retiré, perdu, manquant. La création se fait à l'unité ou par import d'un fichier pour les entrées en volume.

### Remise et restitution des équipements

C'est le cœur du produit. Une demande d'équipement suit un circuit à quatre étapes : validation du responsable hiérarchique, traitement par l'informatique, validation de la dotation, puis confirmation de réception par la personne qui reçoit le matériel. Chaque partie atteste son propre geste : l'informatique déclare avoir remis, le bénéficiaire confirme avoir reçu, avec signature ou code à quatre chiffres à l'appui. Tant que les deux attestations ne sont pas réunies, l'équipement reste dans un état intermédiaire qui n'accuse personne. La restitution suit le chemin inverse et se clôt par un constat d'état, qui oriente automatiquement l'équipement vers le stock, la réparation ou la sortie du parc.

### Espace de travail personnel

Chaque collaborateur retrouve au même endroit ce qui l'attend : les demandes à valider, les réceptions à confirmer, les restitutions à traiter, les remises à effectuer. Le tableau de bord adapte ce qu'il montre au rôle de la personne — vue d'ensemble du parc et points de blocage pour un gestionnaire, équipements détenus et demandes en cours pour un utilisateur final.

### Audit physique du parc

Des campagnes de vérification sont menées service par service : l'application liste ce qui est attendu sur place, enregistre ce qui est effectivement trouvé, et isole deux catégories d'écarts — le matériel attendu et absent, et le matériel trouvé là où il n'était pas prévu. Chaque écart doit être tranché (rattacher au service, laisser où il est, compléter la fiche, écarter le relevé) avant que la campagne puisse être clôturée : aucun écart ne peut être laissé en suspens.

### Détection automatique des postes

En complément de l'audit manuel, l'application peut recevoir les remontées des postes du réseau et les rapprocher automatiquement des fiches existantes, avec un indice de fiabilité de la correspondance. Les appareils inconnus ou ambigus sont présentés pour arbitrage humain plutôt qu'intégrés d'office, afin d'éviter les doublons dans l'inventaire.

### Budgets et dépenses

Un budget annuel est réparti par poste, et chaque dépense (achat, licence, maintenance, service, cloud) vient s'y imputer, avec un suivi permanent de ce qui reste. Les factures déposées dans l'application sont pré-lues pour proposer fournisseur, montant, date et numéro de pièce, à charge pour l'utilisateur de confirmer ; un contrôle signale les factures déjà enregistrées afin d'éviter les doubles saisies. L'application calcule par ailleurs la valeur résiduelle des équipements selon des durées d'amortissement définies globalement, par catégorie ou équipement par équipement.

### Rapports et exports

Quatre restitutions prêtes à l'emploi couvrent les besoins récurrents : l'inventaire complet, l'historique des remises et restitutions d'une personne, les équipements de plus de trois ans, et les garanties qui expirent dans les quatre-vingt-dix jours. Chaque rapport se consulte à l'écran avant d'être exporté, dans un format bureautique ou en PDF.

### Personnes, rôles et périmètres

L'annuaire des collaborateurs porte la hiérarchie (qui valide pour qui) et le rattachement géographique. Les droits ne se limitent pas à un rôle : ils se composent de rôles, de groupes, d'attributions temporaires à durée limitée et de droits accordés individuellement, avec trois niveaux (consulter, modifier, supprimer) et la possibilité d'un refus explicite qui prime sur toute autorisation. Les emplacements sont organisés par pays, site et local, et le service sert de périmètre aux campagnes d'audit.

### Référentiel et paramètres

Catégories et modèles d'équipements sont tenus dans un référentiel commun, ce qui garantit que deux personnes désignent le même matériel de la même façon. Les paramètres généraux couvrent la devise, l'exercice comptable, les règles d'amortissement par défaut et la configuration de la détection automatique.

### Traçabilité

Toute opération significative — création, modification, attribution, validation, refus, restitution, export, consultation de données sensibles — alimente un journal horodaté qui conserve l'auteur, la cible, la nature du changement et, le cas échéant, le motif invoqué. Ce journal est consultable et filtrable, et il alimente aussi bien l'historique d'un équipement que celui d'une personne.

## 4. Bénéfices et valeur ajoutée

- **Une responsabilité établie, pas déclarée.** La double attestation de remise et de réception, associée au journal horodaté, remplace la parole contre la parole par une trace opposable en cas de litige ou de départ d'un collaborateur.
- **Des décisions engagées au bon niveau.** Le circuit de validation garantit qu'aucun équipement n'est remis sans l'accord du responsable et de l'informatique, et rend visible à tout moment l'étape à laquelle une demande se trouve.
- **Un inventaire qui reflète le terrain.** Les campagnes d'audit et la détection automatique confrontent régulièrement les fiches à la réalité, et obligent à trancher les écarts au lieu de les laisser s'accumuler.
- **Moins de saisie et moins d'erreurs.** Imports en masse, pré-lecture des factures, référentiel commun de catégories et de modèles et contrôle des doublons réduisent la ressaisie et l'hétérogénéité des libellés.
- **Une vision financière tenue à jour.** Le rattachement des dépenses au budget et le calcul de la valeur résiduelle permettent de suivre la consommation en cours d'exercice et d'anticiper les renouvellements plutôt que de les subir.
- **Un accès proportionné.** La finesse des droits permet d'ouvrir l'outil à des profils variés — direction, ressources humaines, contrôle de gestion, audit externe — sans exposer à chacun l'ensemble des données.
- **De la matière pour rendre des comptes.** Journal d'événements, rapports exportables et campagnes d'audit clôturées fournissent les pièces attendues lors d'un contrôle interne ou d'une revue de parc.

---

### Ce qui est établi, ce qui est déduit

- **Établi par le code et les documents du projet** : les domaines fonctionnels décrits ci-dessus, les statuts d'équipement, les quatre étapes du circuit de validation, la logique de clôture des campagnes d'audit, les règles d'amortissement, les quatre rapports et le modèle de droits.
- **Déduit** : la problématique de départ (section 1) et les bénéfices (section 4). Ils ne sont écrits nulle part en ces termes ; ils sont reconstitués à partir de ce que le produit cherche visiblement à résoudre.
- **À clarifier** : le périmètre de déploiement réel. Plusieurs mécanismes sont aujourd'hui simulés à des fins de démonstration — l'authentification, les données de départ, la reconnaissance faciale et la lecture « intelligente » des factures, qui repose sur des règles de reconnaissance simples et non sur un modèle d'intelligence artificielle. Le produit est complet dans ses parcours, mais il conviendra de préciser au repreneur ce qui relève de la maquette fonctionnelle et ce qui est destiné à la production.
