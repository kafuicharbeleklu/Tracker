import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const workbookPath = path.join(projectRoot, 'Inventaire_Neemba_Togo_2026.xlsx');
const envPath = path.join(projectRoot, '.env.local');
const serviceAccountPath =
    process.env.FIREBASE_ADMIN_CREDENTIALS ||
    path.join(projectRoot, 'tracker-c801e-firebase-adminsdk-fbsvc-5dc59cd3fa.json');

function parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return Object.fromEntries(
        content
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter((line) => line && !line.startsWith('#'))
            .map((line) => {
                const index = line.indexOf('=');
                if (index === -1) {
                    return [line, ''];
                }
                const key = line.slice(0, index).trim();
                const value = line.slice(index + 1).trim();
                return [key, value];
            }),
    );
}

const env = { ...parseEnvFile(envPath), ...process.env };

const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY || '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.VITE_FIREBASE_APP_ID || '',
};

function requireFirebaseConfig() {
    const missing = Object.entries(firebaseConfig)
        .filter(([, value]) => !value)
        .map(([key]) => key);
    if (missing.length > 0) {
        throw new Error(`Missing Firebase config values: ${missing.join(', ')}`);
    }
}

function normalizeText(value) {
    return String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function slugify(value) {
    return normalizeText(value).replace(/\s+/g, '-').replace(/^-+|-+$/g, '');
}

function uniqueId(base, usedIds) {
    const normalizedBase = slugify(base) || 'item';
    let candidate = normalizedBase;
    let counter = 2;
    while (usedIds.has(candidate)) {
        candidate = `${normalizedBase}-${counter}`;
        counter += 1;
    }
    usedIds.add(candidate);
    return candidate;
}

function pick(row, aliases) {
    const normalizedEntries = Object.entries(row).map(([key, value]) => [normalizeText(key), value]);
    for (const alias of aliases) {
        const target = normalizeText(alias);
        const match = normalizedEntries.find(([key]) => key === target);
        if (match && match[1] !== undefined && match[1] !== null && `${match[1]}`.trim() !== '') {
            return match[1];
        }
    }
    return undefined;
}

function toIsoDate(value) {
    if (!value) return undefined;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        return value.slice(0, 10);
    }

    const text = String(value).trim();
    const dmy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) {
        const [, dd, mm, yyyy] = dmy;
        return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }

    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
    }

    return undefined;
}

function parseMoney(value) {
    if (value === undefined || value === null || value === '') return 0;
    const text = String(value).replace(/\s/g, '').replace(',', '.');
    const number = Number(text);
    return Number.isFinite(number) ? number : 0;
}

function stripUndefined(value) {
    if (Array.isArray(value)) {
        return value.map((item) => stripUndefined(item)).filter((item) => item !== undefined);
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value)
                .filter(([, entry]) => entry !== undefined)
                .map(([key, entry]) => [key, stripUndefined(entry)]),
        );
    }
    return value;
}

function defaultImageForSheet(sheetName) {
    const normalized = normalizeText(sheetName);
    if (normalized.includes('imprim')) {
        return 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=100&h=100&fit=crop';
    }
    if (normalized.includes('ecran')) {
        return 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=100&h=100&fit=crop';
    }
    if (normalized.includes('phone')) {
        return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&h=100&fit=crop';
    }
    if (normalized.includes('tablette')) {
        return 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=100&h=100&fit=crop';
    }
    if (normalized.includes('projecteur')) {
        return 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=100&h=100&fit=crop';
    }
    if (normalized.includes('switch') || normalized.includes('interco') || normalized.includes('fire')) {
        return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=100&h=100&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=100&h=100&fit=crop';
}

function sanitizeRow(row) {
    return Object.fromEntries(
        Object.entries(row).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    );
}

/**
 * **Les identités que le tableur ne porte pas.**
 *
 * La feuille d'inventaire nomme des porteurs ; elle ne dit ni leur adresse réelle ni
 * leurs droits. Sans ce registre, l'import donnait à tout le monde `@neemba.local` et le
 * rôle `User` — donc, après un nettoyage de la base, **plus personne ne pouvait
 * administrer le produit** (relevé du 07/09 : 61 comptes, 61 fois « User »).
 *
 * La clé est le nom **normalisé** (casse et accents repliés), parce que c'est la seule
 * chose que le tableur écrit de façon à peu près stable.
 */
const IDENTITES_DECLAREES = [
    {
        nom: 'kafui charbel eklu',
        email: 'charbel.eklu@neemba.com',
        role: 'SuperAdmin',
    },
];

function identiteDeclaree(name) {
    const cle = normalizeText(name);
    return IDENTITES_DECLAREES.find((entree) => normalizeText(entree.nom) === cle) || null;
}

function makeUserRecord(name, usedIds, context = {}) {
    const id = uniqueId(name, usedIds);
    const country = context.country || inferCountry(context.department, context.site);
    const site = context.site || inferSite(country);
    const avatarSeed = encodeURIComponent(name);
    const declaree = identiteDeclaree(name);
    return {
        id,
        name,
        /* `@neemba.local` est un repli explicite : ce n'est pas une adresse qui reçoit du
           courrier, et elle se distingue d'une vraie à l'œil. */
        email: declaree?.email || `${slugify(name)}@neemba.local`,
        department: context.department || 'Inventaire import',
        role: declaree?.role || 'User',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
        country,
        site,
        status: 'active',
    };
}

function inferCountry(department, site) {
    const value = normalizeText(`${department || ''} ${site || ''}`);
    if (value.includes('senegal') || value.includes('dakar')) return 'Sénégal';
    if (value.includes('togo') || value.includes('lome')) return 'Togo';
    return 'Togo';
}

function inferSite(country) {
    if (country === 'Sénégal') return 'Campus Dakar';
    if (country === 'France') return 'Bureau Paris';
    return 'Lomé Siège';
}

/**
 * LE TYPE D'UN OBJET EST UNE CLÉ DU CATALOGUE, PAS UN NOM DE FEUILLE.
 *
 * L'import écrivait `type: sheetName` : le parc portait « Ordinateurs », « Ecrans »,
 * « Interco » — aucune des clés que le catalogue connaît. Aucun des 243 objets ne
 * rejoignait donc son type, et la fiche « Ordinateur portable » annonçait 4 actifs quand
 * le parc en contenait 89.
 *
 * Le tableur porte pourtant la bonne information : la feuille *Ordinateurs* a une
 * colonne `Categorie` (Laptop, Desktop), les feuilles réseau ont `Type d'Equipement`.
 * On les lit d'abord ; la feuille ne sert que de repli.
 */
const TYPE_PAR_VALEUR = {
    laptop: 'Laptop',
    desktop: 'Desktop',
    switch: 'Switch',
    'access point': 'AccessPoint',
    'pare feux': 'Firewall',
    'pare feu': 'Firewall',
    'chek point': 'Firewall',
    'check point': 'Firewall',
    modem: 'NetworkDevice',
    routeur: 'NetworkDevice',
    gateway: 'NetworkDevice',
    serveur: 'Server',
};

const TYPE_PAR_FEUILLE = {
    ordinateurs: 'Laptop',
    ecrans: 'Monitor',
    imprimantes: 'Printer',
    phone: 'Phone',
    tablette: 'Tablet',
    'video projecteur': 'Projector',
    'station accueil': 'DockingStation',
    switch: 'Switch',
    interco: 'NetworkDevice',
    serveur: 'Server',
    'access point': 'AccessPoint',
    'pare feux': 'Firewall',
    nas: 'Server',
};

function resolveType(sheetName, row) {
    const declare = pick(row, ['Categorie', 'Catégorie', "Type d'Equipement", "Type d'équipement"]);
    if (declare) {
        const cle = TYPE_PAR_VALEUR[normalizeText(String(declare))];
        if (cle) return cle;
    }
    return TYPE_PAR_FEUILLE[normalizeText(sheetName)] || sheetName;
}

/**
 * DEUX NOMS POUR UN LIEU. Les feuilles réseau écrivent « Lomé », les autres
 * « Lomé Siège » : c'est le même site, et deux orthographes en faisaient deux
 * emplacements dans les filtres et dans les comptes.
 */
const SITE_CANONIQUE = { lome: 'Lomé Siège', 'lome siege': 'Lomé Siège' };

function resolveSite(valeur) {
    if (!valeur) return undefined;
    return SITE_CANONIQUE[normalizeText(String(valeur))] || String(valeur).trim();
}

function buildEquipmentFromRow(sheetName, row, rowIndex) {
    const country = pick(row, ['Pays']) || 'Togo';
    const site = resolveSite(pick(row, ['Site'])) || inferSite(country);
    const service = pick(row, ['Service']) || undefined;
    const userName = pick(row, ['Utilisateur']) || undefined;
    const emplacement = pick(row, ['Emplacement', 'Emplacement ']) || undefined;
    const serialNumber = pick(row, ['Numéro de série', 'N° Serie', 'N°', 'Numero de serie']) || undefined;
    const assetId = String(pick(row, ['ID']) || serialNumber || `${sheetName}-${rowIndex}`);
    const rawName =
        pick(row, ['Nom AD']) ||
        pick(row, ['Nom']) ||
        pick(row, ['Model Commercial']) ||
        pick(row, ['Modèle']) ||
        pick(row, ['Model']) ||
        pick(row, ['Code Model']) ||
        pick(row, ['Code model']) ||
        `${sheetName} ${rowIndex}`;
    const model =
        pick(row, ['Model Commercial']) ||
        pick(row, ['Modèle']) ||
        pick(row, ['Model']) ||
        pick(row, ['Code Model']) ||
        pick(row, ['Code model']) ||
        rawName;
    /* La marque : le tableur l'écrit « Fabricant » côté postes et réseau, « Marque »
       ailleurs. Elle nomme le modèle au catalogue (09.2) et l'initiale de sa vignette. */
    const brand = pick(row, ['Fabricant', 'Marque']) || undefined;
    const explicitStatus = pick(row, ['Statut']) || undefined;
    const userPresent = Boolean(userName);
    const status =
        explicitStatus ||
        (userPresent ? 'Attribué' : normalizeText(sheetName).includes('serveur') ? 'Actif' : 'Disponible');

    const equipment = {
        id: `${slugify(sheetName)}-${rowIndex}`,
        name: String(rawName).trim(),
        assetId,
        type: resolveType(sheetName, row),
        model: String(model).trim(),
        brand: brand ? String(brand).trim() : undefined,
        status,
        image: defaultImageForSheet(sheetName),
        serialNumber: serialNumber ? String(serialNumber).trim() : undefined,
        country,
        site,
        /* La colonne `Emplacement` des feuilles réseau — « Salle serveur », « New Bat ».
           Elle n'allait qu'en note libre, où le deuxième niveau de 16.1 ne pouvait pas
           la lire. */
        local: emplacement,
        department: service,
        notes: emplacement ? `Emplacement: ${emplacement}` : undefined,
        user: userName ? { name: String(userName).trim() } : null,
        operationalStatus: explicitStatus || status === 'Attribué' ? 'Actif' : 'Actif',
        financial: toIsoDate(pick(row, ['Date Achat']))
            ? {
                  purchaseDate: toIsoDate(pick(row, ['Date Achat'])),
                  purchasePrice: 0,
                  depreciationMethod: 'linear',
                  depreciationYears: 3,
              }
            : undefined,
        warrantyEnd: toIsoDate(pick(row, ['Date de fin de garantie'])),
        repairStartDate: toIsoDate(pick(row, ['Date de début de garantie'])),
        sourceSheet: sheetName,
        sourceRow: rowIndex,
        sourceData: sanitizeRow(row),
    };

    return stripUndefined(equipment);
}

/**
 * LE RÉFÉRENTIEL DES LIEUX SE DÉDUIT DE CE QUI EST ÉCRIT.
 *
 * Il était bâti sur les colonnes brutes `Pays` / `Site`, que **seules les feuilles
 * réseau portent** : le référentiel n'a longtemps connu que « Togo » et « Lomé », alors
 * que les 243 objets sont tous situés une fois l'import fait. L'inventaire physique
 * (16.1) s'ouvrait donc sur « 0 attendu ». On le construit désormais sur les objets
 * résolus — pays, site et local tels qu'ils seront enregistrés.
 */
function construireLieux(equipment) {
    /* **Uniquement sur les objets résolus.** Fusionner les colonnes brutes y remettait
       « Lomé » à côté de « Lomé Siège » — la graphie que la normalisation venait
       justement d'unifier — et recopiait les mêmes locaux sous les deux. */
    const countries = new Set();
    const sites = {};
    const locals = {};
    const services = {};

    const ajouter = (table, cle, valeur) => {
        if (!cle || !valeur) return;
        table[cle] = Array.from(new Set([...(table[cle] || []), valeur])).sort((a, b) =>
            a.localeCompare(b, 'fr'),
        );
    };

    for (const item of equipment) {
        if (item.country) countries.add(item.country);
        ajouter(sites, item.country, item.site);
        ajouter(locals, item.site, item.local);
        ajouter(services, item.site, item.department);
    }

    return {
        countries: Array.from(countries).sort((a, b) => a.localeCompare(b, 'fr')),
        sites,
        locals,
        services,
    };
}

/**
 * LES TYPES DU CATALOGUE QUE L'INVENTAIRE EMPLOIE.
 *
 * L'import ne créait aucune catégorie : le catalogue restait celui du jeu de
 * démonstration, et la fiche « Ordinateur portable » annonçait 4 actifs devant 89
 * machines. Les types écrits ici sont exactement ceux que les objets portent — pas un
 * de plus.
 */
const TYPE_REFERENCE = {
    Laptop: { family: 'Informatique', assignable: true, icon: 'Laptop', years: 3 },
    Desktop: { family: 'Informatique', assignable: true, icon: 'Desktop', years: 5 },
    Server: { family: 'Informatique', assignable: false, icon: 'Server', years: 5 },
    Monitor: { family: 'Périphériques', assignable: true, icon: 'Monitor', years: 5 },
    Phone: { family: 'Périphériques', assignable: true, icon: 'Smartphone', years: 3 },
    Tablet: { family: 'Périphériques', assignable: true, icon: 'Tablet', years: 3 },
    DockingStation: { family: 'Périphériques', assignable: true, icon: 'DockingStation', years: 5 },
    Printer: { family: 'Impression et réseau', assignable: false, icon: 'Printer', years: 5 },
    Switch: { family: 'Impression et réseau', assignable: false, icon: 'Switch', years: 7 },
    AccessPoint: { family: 'Impression et réseau', assignable: false, icon: 'AccessPoint', years: 7 },
    Firewall: { family: 'Impression et réseau', assignable: false, icon: 'Firewall', years: 7 },
    NetworkDevice: {
        family: 'Impression et réseau',
        assignable: false,
        icon: 'NetworkDevice',
        years: 7,
    },
    Projector: { family: 'Mobilier et divers', assignable: false, icon: 'Projector', years: 5 },
};

function construireCategories(equipment) {
    const employes = Array.from(new Set(equipment.map((item) => item.type))).sort();
    return employes.map((name, index) => {
        const reference = TYPE_REFERENCE[name] || {
            family: 'Mobilier et divers',
            assignable: true,
            icon: 'Package',
            years: 5,
        };
        return {
            id: slugify(name) || `type-${index + 1}`,
            name,
            family: reference.family,
            assignable: reference.assignable,
            iconName: reference.icon,
            description: '',
            defaultDepreciation: {
                method: 'linear',
                years: reference.years,
                salvageValuePercent: 0,
            },
        };
    });
}

/**
 * LES MODÈLES — **ce dont on a plusieurs exemplaires** (09.2). Un modèle est un couple
 * marque + modèle sous un type ; l'inventaire en porte plusieurs dizaines, et le
 * catalogue n'en connaissait que six, tous de démonstration.
 */
function construireModeles(equipment) {
    const table = new Map();
    for (const item of equipment) {
        const nom = String(item.model || '').trim();
        if (!nom) continue;
        const marque = String(item.brand || '').trim();
        const cle = `${item.type}::${marque}::${nom}`.toLowerCase();
        if (!table.has(cle)) {
            table.set(cle, {
                id: slugify(`${item.type} ${marque} ${nom}`) || `modele-${table.size + 1}`,
                name: nom,
                type: item.type,
                brand: marque || undefined,
                specs: '',
                image: '',
                count: 0,
            });
        }
    }
    return Array.from(table.values()).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

function buildLocationsFromRows(sheetRows) {
    const countries = new Set();
    const sites = new Map();
    const locals = new Map();
    const services = new Map();

    for (const { row } of sheetRows) {
        const country = pick(row, ['Pays']);
        const site = pick(row, ['Site']);
        const local = pick(row, ['Emplacement', 'Emplacement ']);
        const service = pick(row, ['Service']);

        if (country) {
            countries.add(String(country).trim());
        }
        if (country && site) {
            const key = String(country).trim();
            const value = String(site).trim();
            if (!sites.has(key)) sites.set(key, new Set());
            sites.get(key).add(value);
        }
        if (site && local) {
            const key = String(site).trim();
            const value = String(local).trim();
            if (!locals.has(key)) locals.set(key, new Set());
            locals.get(key).add(value);
        }
        if (site && service) {
            const key = String(site).trim();
            const value = String(service).trim();
            if (!services.has(key)) services.set(key, new Set());
            services.get(key).add(value);
        }
    }

    return {
        countries: [...countries].sort((a, b) => a.localeCompare(b, 'fr')),
        sites: Object.fromEntries(
            [...sites.entries()].map(([key, values]) => [key, [...values].sort((a, b) => a.localeCompare(b, 'fr'))]),
        ),
        locals: Object.fromEntries(
            [...locals.entries()].map(([key, values]) => [key, [...values].sort((a, b) => a.localeCompare(b, 'fr'))]),
        ),
        services: Object.fromEntries(
            [...services.entries()].map(([key, values]) => [key, [...values].sort((a, b) => a.localeCompare(b, 'fr'))]),
        ),
    };
}

function printSheetSummary(sheetName, rows) {
    console.log(`${sheetName}: ${rows.length} lignes`);
}

function loadServiceAccount(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Service account file not found: ${filePath}`);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!serviceAccount.client_email || !serviceAccount.private_key || !serviceAccount.project_id) {
        throw new Error('Service account JSON is missing required fields.');
    }

    return serviceAccount;
}

function getAdminFirestore() {
    const serviceAccount = loadServiceAccount(serviceAccountPath);
    if (!getApps().length) {
        initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.project_id,
        });
    }
    return getFirestore();
}

async function clearCollection(db, collectionName) {
    const snapshot = await db.collection(collectionName).get();
    const writer = db.bulkWriter();
    snapshot.docs.forEach((documentSnapshot) => writer.delete(documentSnapshot.ref));
    await writer.close();
}

async function upsertDocuments(db, collectionName, items, { clearFirst = false } = {}) {
    if (clearFirst) {
        await clearCollection(db, collectionName);
    }

    const writer = db.bulkWriter();
    for (const item of items) {
        writer.set(db.collection(collectionName).doc(item.id), stripUndefined(item), {
            merge: true,
        });
    }
    await writer.close();
}

function main() {
    if (!fs.existsSync(workbookPath)) {
        throw new Error(`Workbook not found: ${workbookPath}`);
    }

    const workbook = XLSX.readFile(workbookPath, { cellDates: true });
    const sheetRows = [];

    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null });
        printSheetSummary(sheetName, rows);
        rows.forEach((row, index) => {
            sheetRows.push({ sheetName, row, rowIndex: index + 2 });
        });
    }

    const usersUsedIds = new Set();
    const usersByName = new Map();
    const equipment = [];

    for (const { sheetName, row, rowIndex } of sheetRows) {
        const userName = pick(row, ['Utilisateur']);
        const service = pick(row, ['Service']);
        const site = pick(row, ['Site']);
        const country = pick(row, ['Pays']);

        if (userName) {
            const affiche = String(userName).trim();
            /* **Une personne, un compte.** La clé était le nom brut : « kafui Charbel
               EKLU » et « Kafui Charbel EKLU » faisaient deux comptes pour une seule
               personne, avec la **même** adresse générée — et « Aichatou » / « Aïchatou »
               de même. Deux paires sur soixante et un. La clé est désormais le nom
               normalisé ; la graphie retenue est celle qui porte une majuscule au
               prénom, à défaut la première rencontrée. */
            const cle = normalizeText(affiche);
            const existant = usersByName.get(cle);
            if (!existant) {
                usersByName.set(
                    cle,
                    makeUserRecord(affiche, usersUsedIds, {
                        department: service || sheetName,
                        site,
                        country,
                    }),
                );
            } else if (
                affiche.charAt(0) === affiche.charAt(0).toUpperCase() &&
                existant.name.charAt(0) !== existant.name.charAt(0).toUpperCase()
            ) {
                existant.name = affiche;
            }
        }

        const sheetEquipment = buildEquipmentFromRow(sheetName, row, rowIndex);
        equipment.push(sheetEquipment);
    }

    const users = [...usersByName.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));

    return {
        users: users.map((user) => stripUndefined(user)),
        equipment: equipment.map((item) => stripUndefined(item)),
        locationData: stripUndefined(construireLieux(equipment)),
        categories: construireCategories(equipment),
        models: construireModeles(equipment),
    };
}

async function run() {
    requireFirebaseConfig();

    const { users, equipment, locationData, categories, models } = main();
    const db = getAdminFirestore();

    const dryRun = process.argv.includes('--dry-run');
    const exportOnly = process.argv.includes('--export-only');

    if (exportOnly || dryRun) {
        const outputPath = path.join(projectRoot, 'backend', 'data', 'inventory-import-preview.json');
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(
            outputPath,
            JSON.stringify({ users, equipment, locationData, categories, models }, null, 2),
            'utf8',
        );
        console.log(`Preview written to ${outputPath}`);
    }

    if (dryRun || exportOnly) {
        console.log(`Users: ${users.length}`);
        console.log(`Equipment: ${equipment.length}`);
        console.log(`Categories: ${categories.length}`);
        console.log(`Models: ${models.length}`);
        console.log(`Countries: ${locationData.countries.length}`);
        return;
    }

    console.log('Importing users...');
    await upsertDocuments(db, 'users', users, { clearFirst: true });

    console.log('Importing equipment...');
    await upsertDocuments(db, 'equipment', equipment, { clearFirst: true });

    console.log('Importing categories...');
    await upsertDocuments(db, 'categories', categories, { clearFirst: true });

    console.log('Importing models...');
    await upsertDocuments(db, 'models', models, { clearFirst: true });

    console.log('Importing locations...');
    await db.collection('meta').doc('locations').set(stripUndefined(locationData), { merge: true });

    console.log(`Done. Imported ${users.length} users and ${equipment.length} equipment items.`);
}

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
