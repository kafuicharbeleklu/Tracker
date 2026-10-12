# Scripts de déploiement (postes et hôte)

Les scripts PowerShell qui alimentent le serveur de collecte (`backend/README.md`). Ils
tournent sous Windows PowerShell 5.1, celui que Windows 10 et 11 livrent.

| Script | Où | Rôle |
|---|---|---|
| `gpo/Neemba-Agent-Checkin.ps1` | chaque poste | Relève le poste et l'envoie. Hors réseau, met la remontée en file et la renvoie au passage suivant. |
| `gpo/Install-NeembaAgentTask.ps1` | chaque poste, par GPO | Pose la tâche planifiée qui lance l'agent au démarrage puis à intervalle régulier. |
| `gpo/Uninstall-NeembaAgentTask.ps1` | chaque poste | Retire la tâche et l'agent. |
| `host/Export-NeembaAnnuaire.ps1` | un poste du domaine | Source « Annuaire » : envoie les ordinateurs d'Active Directory. |
| `host/Invoke-NeembaBatchImport.ps1` | l'hôte | Dépose des fichiers de remontées (`.json`, `.ndjson`), un lot par fichier. |

## Avant tout : le serveur et ses clés

Le serveur refuse de s'ouvrir au réseau avec les clés d'essai. Posez de vraies clés
(`NEEMBA_AGENT_API_KEY`, `NEEMBA_ADMIN_API_KEY`), et donnez la **clé des postes** aux scripts
ci-dessous. La clé d'administration ne va sur aucun poste.

L'adresse à donner aux scripts : `https://<serveur>/api/agent/checkin`.

## Les postes, par GPO

1. Copier `gpo/Neemba-Agent-Checkin.ps1` sur un partage que les postes lisent.
2. Déployer `gpo/Install-NeembaAgentTask.ps1` en script de démarrage.

```powershell
powershell.exe -ExecutionPolicy Bypass -File "\\srv\neemba\deployment\gpo\Install-NeembaAgentTask.ps1" `
  -ScriptSourcePath "\\srv\neemba\deployment\gpo\Neemba-Agent-Checkin.ps1" `
  -ApiUrl "https://collecte.neemba.example/api/agent/checkin" `
  -ApiKey "<clé des postes>" `
  -IntervalMinutes 240 `
  -Country "Togo" -Site "Lomé Siège"
```

`-Country` et `-Site` disent où sont les postes visés par cette stratégie : un agent ne peut
pas le deviner. Une stratégie par site. Sans eux, l'application déduit le lieu de la personne
dont la session est ouverte, puis de qui valide la machine.

Pour voir ce qu'un poste enverrait, sans rien envoyer :

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\Neemba-Agent-Checkin.ps1 -DryRun
```

Ce que l'agent relève : nom, numéro de série, UUID du BIOS, système, mémoire, disque,
processeur, adresse MAC et IP, type (portable, fixe, serveur, d'après le châssis), modèle,
session ouverte à la console, présence de SentinelOne, Matrix42 et ManageEngine.

La clé voyage dans l'en-tête de la requête : elle n'est ni dans la remontée ni dans la file
d'attente sur le disque (`C:\ProgramData\NeembaTracker\queue`, 500 remontées au plus).

## L'annuaire

Sur un poste du domaine qui a le module ActiveDirectory (RSAT), en tâche planifiée
quotidienne :

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\host\Export-NeembaAnnuaire.ps1 `
  -ApiUrl "https://collecte.neemba.example/api/agent/checkin" `
  -ApiKey "<clé des postes>" `
  -SearchBase "OU=Postes,DC=neemba,DC=local" -StaleDays 90
```

Les comptes désactivés et ceux muets depuis plus de `-StaleDays` jours ne partent pas.
L'annuaire ne connaît que le nom et le système : un poste que son agent a déjà remonté n'est
pas dédoublé, il garde son numéro de série et ses logiciels.

## Les fichiers

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\host\Invoke-NeembaBatchImport.ps1 `
  -InputPath "C:\neemba\incoming" `
  -ApiUrl "https://collecte.neemba.example/api/agent/checkin" `
  -ApiKey "<clé des postes>"
```

Un fichier entièrement accepté passe dans `archive` ; un fichier dont des lignes sont
refusées passe dans `error`, et le script dit lesquelles ; un fichier que le serveur n'a pas
pu recevoir reste en place et repartira.

## Ce qui a été éprouvé, et ce qui ne l'a pas été

`npm run backend:test` lance ces scripts contre un vrai serveur, sous PowerShell 7 : l'envoi,
la clé, les accents, la file hors ligne et sa reprise, le dépôt par lots, l'export d'annuaire
(avec un annuaire d'essai). Restent à éprouver sur site : le relevé WMI d'un vrai poste, la
tâche planifiée, Windows PowerShell 5.1, et un vrai Active Directory.
