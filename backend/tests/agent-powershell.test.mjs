/**
 * Le script de l'agent (`deployment/gpo/Neemba-Agent-Checkin.ps1`) face au serveur.
 *
 * Passé quand PowerShell n'est pas installé. Hors de Windows, le relevé du poste (WMI) est
 * remplacé par un relevé d'essai : ce sont l'envoi, la clé et la file hors ligne qu'on éprouve.
 */
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, describe, test } from 'node:test';
import { demarrerLeServeur, lireLaConfiguration } from '../server.mjs';

const ICI = dirname(fileURLToPath(import.meta.url));
const AGENT = resolve(ICI, '../../deployment/gpo/Neemba-Agent-Checkin.ps1');
const LOT = resolve(ICI, '../../deployment/host/Invoke-NeembaBatchImport.ps1');
const ANNUAIRE = resolve(ICI, '../../deployment/host/Export-NeembaAnnuaire.ps1');
const INSTALLATION = resolve(ICI, '../../deployment/gpo/Install-NeembaAgentTask.ps1');
const CLE = 'cle-des-postes-pour-les-essais';
const CLE_ADMIN = 'cle-admin-pour-les-essais';
const muet = { log() {}, warn() {}, error() {} };

const powershell = ['pwsh', 'powershell'].find(
    (commande) => spawnSync(commande, ['-NoProfile', '-Command', 'exit 0']).status === 0,
);

describe("L'agent PowerShell", { skip: !powershell && 'PowerShell absent' }, () => {
    let dossier;
    let serveur;
    let port;
    let file;
    let pilote;

    const monter = async () => {
        const config = {
            ...lireLaConfiguration({
                NEEMBA_AGENT_API_KEY: CLE,
                NEEMBA_ADMIN_API_KEY: CLE_ADMIN,
                HOST: '127.0.0.1',
                PORT: String(port ?? 0),
            }),
            dossier: join(dossier, 'serveur'),
        };
        serveur = await demarrerLeServeur(config, { journaliser: muet });
        port = serveur.adresse().port;
    };

    /**
     * Lance l'agent avec un relevé d'essai : `machine` nomme le poste. Sans bloquer : le
     * serveur tourne dans ce même processus et doit pouvoir lui répondre.
     */
    const lancerLAgent = (machine, { cle = CLE, utilisateur = 'k.mensah' } = {}) =>
        new Promise((rendre) => {
            const enfant = spawn(powershell, [
                '-NoProfile',
                '-File',
                pilote,
                '-Url',
                `http://127.0.0.1:${port}/api/agent/checkin`,
                '-Cle',
                cle,
                '-Attente',
                file,
                '-Machine',
                machine,
                '-Utilisateur',
                utilisateur,
            ]);
            let erreurs = '';
            enfant.stderr.on('data', (morceau) => (erreurs += morceau));
            enfant.on('close', (status) => rendre({ status, stderr: erreurs }));
        });

    const lancer = (arguments_) =>
        new Promise((rendre) => {
            const enfant = spawn(powershell, ['-NoProfile', ...arguments_]);
            let sortie = '';
            let erreurs = '';
            enfant.stdout.on('data', (morceau) => (sortie += morceau));
            enfant.stderr.on('data', (morceau) => (erreurs += morceau));
            enfant.on('close', (status) => rendre({ status, stdout: sortie, stderr: erreurs }));
        });

    const machines = async () => {
        const reponse = await fetch(`http://127.0.0.1:${port}/api/agent/machines`, {
            headers: { 'x-admin-key': CLE_ADMIN },
        });
        return (await reponse.json()).machines;
    };

    const lignesDeLaFile = async () =>
        existsSync(file)
            ? (await readFile(file, 'utf8')).split(/\r?\n/).filter((ligne) => ligne.trim())
            : [];

    before(async () => {
        dossier = await mkdtemp(join(tmpdir(), 'agent-ps-'));
        file = join(dossier, 'file', 'agent-checkins.jsonl');
        pilote = join(dossier, 'pilote.ps1');
        await writeFile(
            pilote,
            `param([string]$Url, [string]$Cle, [string]$Attente, [string]$Machine, [string]$Utilisateur)
. '${AGENT}' -ApiUrl $Url -ApiKey $Cle -QueuePath $Attente -Country 'Togo' -Site 'Lomé Siège'
function Get-DeviceFacts {
    return @{
        schema = 'neemba.agent.checkin.v1'
        generatedAt = (Get-Date).ToUniversalTime().ToString('o')
        source = 'agent'
        agentVersion = $AgentVersion
        checkinId = ('chk-{0}-{1}' -f $Machine, [Guid]::NewGuid().ToString('N'))
        device = @{ machineName = $Machine; hostname = $Machine; serialNumber = ('SN-' + $Machine); type = (Get-DeviceType -ChassisTypes @(10)) }
        user = @{ name = $Utilisateur }
        context = @{ country = $Country; site = $Site; service = $Service }
        apps = @{ sentinelOne = (Test-AnyPath @('/chemin/absent*')); matrix42 = $false; manageEngine = (Test-AnyPath @('/chemin/absent*', '${dossier}')) }
    }
}
Invoke-CheckIn
`,
            'utf8',
        );
        await monter();
    });

    after(async () => {
        await serveur?.fermer().catch(() => {});
        await rm(dossier, { recursive: true, force: true });
    });

    test('les scripts se lisent sans erreur de syntaxe', () => {
        for (const script of [AGENT, LOT, ANNUAIRE, INSTALLATION]) {
            const lecture = spawnSync(
                powershell,
                [
                    '-NoProfile',
                    '-Command',
                    `$e = $null; $null = [System.Management.Automation.Language.Parser]::ParseFile('${script}', [ref]$null, [ref]$e); $e.Count`,
                ],
                { encoding: 'utf8' },
            );
            assert.equal(lecture.stdout.trim(), '0', lecture.stderr);
        }
    });

    test('une remontée arrive, la clé dans l’en-tête et les accents intacts', async () => {
        const passage = await lancerLAgent('PC-LOME-010', { utilisateur: 'Kossi Adébayor' });
        assert.equal(passage.status, 0, passage.stderr);
        const [machine] = await machines();
        assert.equal(machine.faits.machineName, 'PC-LOME-010');
        assert.equal(machine.faits.userName, 'Kossi Adébayor');
        assert.equal(machine.faits.site, 'Lomé Siège');
        assert.equal(machine.faits.type, 'Laptop');
        assert.deepEqual(machine.agents, {
            sentinelOne: false,
            matrix42: false,
            manageEngine: true,
        });
        assert.equal((await lignesDeLaFile()).length, 0);
    });

    test('serveur injoignable : la remontée attend dans la file, sans la clé', async () => {
        await serveur.fermer();
        assert.equal((await lancerLAgent('PC-LOME-011')).status, 0);
        assert.equal((await lancerLAgent('PC-LOME-012')).status, 0);
        const lignes = await lignesDeLaFile();
        assert.equal(lignes.length, 2);
        assert.equal(lignes.join('\n').includes(CLE), false);
    });

    test('serveur revenu : la file part avant la remontée du jour, puis se vide', async () => {
        await monter();
        assert.equal((await lancerLAgent('PC-LOME-013')).status, 0);
        assert.equal((await lignesDeLaFile()).length, 0);
        const noms = (await machines()).map((machine) => machine.faits.machineName).sort();
        assert.deepEqual(noms, ['PC-LOME-010', 'PC-LOME-011', 'PC-LOME-012', 'PC-LOME-013']);
    });

    test('clé refusée : rien ne sert de garder la remontée', async () => {
        assert.equal((await lancerLAgent('PC-LOME-014', { cle: 'fausse' })).status, 0);
        assert.equal((await lignesDeLaFile()).length, 0);
        assert.equal((await machines()).length, 4);
    });

    test('le relevé résiste à un poste qui ne répond pas à WMI', () => {
        const essai = spawnSync(powershell, ['-NoProfile', '-File', AGENT, '-DryRun'], {
            encoding: 'utf8',
        });
        assert.equal(essai.status, 0, essai.stderr);
        const remontee = JSON.parse(essai.stdout);
        assert.equal(remontee.schema, 'neemba.agent.checkin.v1');
        assert.equal(remontee.auth, undefined);
        assert.equal(typeof remontee.apps.manageEngine, 'boolean');
    });

    test('le dépôt par lots : un fichier entier passe à l’archive, un fichier abîmé à part', async () => {
        const arrivee = join(dossier, 'arrivee');
        const archive = join(dossier, 'archive');
        const erreur = join(dossier, 'erreur');
        await mkdir(arrivee, { recursive: true });
        await writeFile(
            join(arrivee, 'kara.ndjson'),
            [
                '{"hostname":"PC-KARA-020","serialNumber":"KARA0020"}',
                '{"hostname":"PC-KARA-021","serialNumber":"KARA0021"}',
            ].join('\n'),
        );
        await writeFile(
            join(arrivee, 'mixte.json'),
            JSON.stringify([
                { hostname: 'PC-KARA-022', serialNumber: 'KARA0022' },
                { os: 'sans identifiant' },
            ]),
        );
        const passage = await lancer([
            '-File',
            LOT,
            '-InputPath',
            arrivee,
            '-ArchivePath',
            archive,
            '-ErrorPath',
            erreur,
            '-ApiUrl',
            `http://127.0.0.1:${port}/api/agent/checkin`,
            '-ApiKey',
            CLE,
        ]);
        assert.equal(passage.status, 1, 'un fichier en partie refusé se signale');
        assert.deepEqual(await readdir(archive), ['kara.ndjson']);
        assert.deepEqual(await readdir(erreur), ['mixte.json']);
        assert.deepEqual(await readdir(arrivee), []);
        assert.match(passage.stdout, /ligne 2 : Aucun identifiant/);
        const noms = (await machines()).map((machine) => machine.faits.machineName);
        for (const attendu of ['PC-KARA-020', 'PC-KARA-021', 'PC-KARA-022']) {
            assert.equal(noms.includes(attendu), true, attendu);
        }
    });

    test('l’export d’annuaire : les comptes vivants partent, sous la source « annuaire »', async () => {
        const piloteAnnuaire = join(dossier, 'annuaire.ps1');
        await writeFile(
            piloteAnnuaire,
            `param([string]$Url, [string]$Cle)
. '${ANNUAIRE}' -ApiUrl $Url -ApiKey $Cle -Country 'Togo' -StaleDays 90
function Get-DirectoryComputers {
    return @(
        [pscustomobject]@{ Name = 'SRV-FICHIERS'; DNSHostName = 'srv-fichiers.neemba.local'; OperatingSystem = 'Windows Server 2022'; OperatingSystemVersion = '10.0 (20348)'; LastLogonTimestamp = (Get-Date).AddDays(-2).ToFileTimeUtc() },
        [pscustomobject]@{ Name = 'PC-LOME-010'; DNSHostName = 'pc-lome-010.neemba.local'; OperatingSystem = 'Windows 11 Pro'; OperatingSystemVersion = '10.0 (22631)'; LastLogonTimestamp = (Get-Date).AddDays(-1).ToFileTimeUtc() },
        [pscustomobject]@{ Name = 'PC-OUBLIE'; DNSHostName = 'pc-oublie.neemba.local'; OperatingSystem = 'Windows 10'; OperatingSystemVersion = '10.0'; LastLogonTimestamp = (Get-Date).AddDays(-200).ToFileTimeUtc() }
    )
}
Invoke-Export
`,
            'utf8',
        );
        const passage = await lancer([
            '-File',
            piloteAnnuaire,
            '-Url',
            `http://127.0.0.1:${port}/api/agent/checkin`,
            '-Cle',
            CLE,
        ]);
        assert.equal(passage.status, 0, passage.stderr);
        assert.match(passage.stdout, /2 ordinateur\(s\), 2 enregistré\(s\)/);

        const connues = await machines();
        const serveurDeFichiers = connues.find(
            (machine) => machine.faits.machineName === 'SRV-FICHIERS',
        );
        assert.equal(serveurDeFichiers.source, 'active_directory');
        assert.equal(serveurDeFichiers.faits.domain, 'neemba.local');
        assert.equal(
            connues.some((machine) => machine.faits.machineName === 'PC-OUBLIE'),
            false,
        );
        /* Le poste déjà remonté par son agent n'est pas dédoublé, et reste une machine d'agent :
           l'annuaire ne lui retire ni son numéro de série ni ses logiciels. */
        const poste = connues.filter((machine) => machine.identifiants.hote === 'pc-lome-010');
        assert.equal(poste.length, 1);
        assert.equal(poste[0].source, 'agent');
        assert.deepEqual(poste[0].sources.sort(), ['active_directory', 'agent']);
        assert.equal(poste[0].faits.serialNumber, 'SN-PC-LOME-010');
        assert.equal(poste[0].agents.manageEngine, true);
    });

    test('la session vient de la console, jamais du compte qui lance la tâche', async () => {
        const essai = await lancer([
            '-Command',
            `. '${AGENT}'; @(
                (Resolve-SessionUser @('NEEMBA\\k.mensah', 'NEEMBA\\autre', 'SYSTEM')),
                (Resolve-SessionUser @('', 'NEEMBA\\a.lawson', 'PC-01$')),
                (Resolve-SessionUser @('', '', 'SYSTEM')),
                (Resolve-SessionUser @('PC-01$', 'k.mensah@neemba.com', '')),
                (Get-DeviceType -ChassisTypes @(3)),
                (Get-DeviceType -ChassisTypes @(23)),
                (Get-DeviceType -ChassisTypes @(99))
            ) -join '|'`,
        ]);
        assert.equal(
            essai.stdout.trim(),
            'k.mensah|a.lawson||k.mensah|Desktop|Server|',
            essai.stderr,
        );
    });
});
