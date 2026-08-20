import React from 'react';
import MaterialIcon from '../components/ui/MaterialIcon';
import {
    User,
    Equipment,
    Category,
    Model,
    AuditCountryStats,
    Approval,
    Report,
    HistoryEvent,
} from '../types';

/* Les pictogrammes de catégorie ont quitté ce fichier pour `constants/categoryIcons` :
   ce sont **une donnée du référentiel**, arrêtée par la planche 09.1, pas un décor du
   jeu d'essai — et la table y existait déjà pour la file et la campagne d'audit. */

// --- User Data ---
const inferCountryFromUser = (user: User): string => {
    if (user.country) return user.country;
    if (user.managedCountries && user.managedCountries.length > 0) return user.managedCountries[0];
    const department = user.department.toLowerCase();
    if (department.includes('sénégal') || department.includes('afrique')) return 'Sénégal';
    if (department.includes('togo') || department.includes('direction')) return 'Togo';
    return 'France';
};

const inferSiteFromCountry = (country: string): string => {
    if (country === 'Sénégal') return 'Campus Dakar';
    if (country === 'Togo') return 'Lomé Siège';
    return 'Bureau Paris';
};

const normalizeUserForDemo = (user: User): User => {
    const country = inferCountryFromUser(user);
    const site = user.site || inferSiteFromCountry(country);
    const dialingCode = country === 'Sénégal' ? '+221' : country === 'Togo' ? '+228' : '+33';
    const paddedId = user.id.padStart(2, '0');
    return {
        ...user,
        country,
        site,
        status: user.status || 'active',
        phone: user.phone || `${dialingCode} 6 00 00 00 ${paddedId}`,
    };
};

export const mockAllUsersExtended: User[] = [
    {
        id: '1',
        name: 'Alice SuperAdmin',
        email: 'alice.admin@tracker.app',
        lastLogin: '14/01/2026 12:07',
        role: 'SuperAdmin',
        department: 'IT HQ',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    },
    {
        id: '2',
        name: 'Bob Admin Sénégal',
        email: 'bob.senegal@tracker.app',
        lastLogin: '14/01/2026 09:30',
        role: 'Admin',
        department: 'IT Sénégal',
        managedCountries: ['Sénégal'],
        rbacGroupIds: ['group.it.senegal'],
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    },
    {
        id: '3',
        name: 'Jane Manager',
        email: 'jane.manager@tracker.app',
        lastLogin: '13/01/2026 16:45',
        role: 'Manager',
        department: 'Sales',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
    },
    {
        id: '4',
        name: 'Ethan Employé',
        email: 'ethan.user@tracker.app',
        lastLogin: '12/01/2026 10:15',
        role: 'User',
        department: 'Sales',
        managerId: '3',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan',
    },
    {
        id: '5',
        name: 'Abdoulaye Deen TOURE',
        email: 'abdoulaye.toure@tracker.app',
        lastLogin: '10/01/2026 08:00',
        role: 'User',
        department: 'Marketing',
        managerId: '3',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abdoulaye',
    },
    {
        id: '6',
        name: 'Clara Admin France',
        email: 'clara.france@tracker.app',
        lastLogin: '14/01/2026 11:42',
        role: 'Admin',
        department: 'IT France',
        country: 'France',
        managedCountries: ['France'],
        rbacGroupIds: ['group.it.france'],
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Clara',
    },
    {
        id: '7',
        name: 'Oumar Manager Dakar',
        email: 'oumar.manager@tracker.app',
        lastLogin: '13/01/2026 17:05',
        role: 'Manager',
        department: 'Support Afrique',
        country: 'Sénégal',
        site: 'Campus Dakar',
        rbacGroupIds: ['group.audit.operators'],
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oumar',
    },
    {
        id: '8',
        name: 'Fatou Support',
        email: 'fatou.support@tracker.app',
        lastLogin: '13/01/2026 15:31',
        role: 'User',
        department: 'Support Afrique',
        country: 'Sénégal',
        site: 'Campus Dakar',
        managerId: '7',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatou',
    },
    {
        id: '9',
        name: 'Marc Finance',
        email: 'marc.finance@tracker.app',
        lastLogin: '12/01/2026 09:12',
        role: 'User',
        department: 'Finance',
        country: 'France',
        site: 'Bureau Paris',
        managerId: '10',
        rbacGroupIds: ['group.finance.reviewers'],
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marc',
    },
    {
        id: '10',
        name: 'Nora Finance Manager',
        email: 'nora.manager@tracker.app',
        lastLogin: '14/01/2026 08:58',
        role: 'Manager',
        department: 'Finance',
        country: 'France',
        site: 'Bureau Paris',
        rbacRoleIds: ['role.custom.finance_controller'],
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nora',
    },
    {
        id: '11',
        name: 'Lea Marketing',
        email: 'lea.marketing@tracker.app',
        lastLogin: '11/01/2026 14:23',
        role: 'User',
        department: 'Marketing Europe',
        country: 'France',
        site: 'Bureau Paris',
        managerId: '3',
        rbacDirectPermissions: [{ key: 'action.reports.export', effect: 'allow', access: 'write' }],
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lea',
    },
].map(normalizeUserForDemo);

// --- Equipment Data with Financials ---
const WARRANTY_YEARS_BY_TYPE: Record<string, number> = {
    Laptop: 3,
    Monitor: 3,
    Keyboard: 2,
    Mouse: 2,
    Server: 5,
    Headphones: 2,
    Printer: 3,
};

const DEFAULT_SITE_BY_COUNTRY: Record<string, string> = {
    France: 'Bureau Paris',
    Sénégal: 'Campus Dakar',
    Togo: 'Lomé Siège',
};

const DEFAULT_DEPARTMENT_BY_COUNTRY: Record<string, string> = {
    France: 'IT HQ',
    Sénégal: 'Support Afrique',
    Togo: 'Direction',
};

const buildHostnameFromName = (name: string, assetId: string): string => {
    const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug || assetId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
};

const addYearsToDate = (dateValue: string | undefined, years: number): string | undefined => {
    if (!dateValue) return undefined;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return undefined;
    date.setFullYear(date.getFullYear() + years);
    return date.toISOString().slice(0, 10);
};

const normalizeEquipmentForDemo = (item: Equipment): Equipment => {
    const country = item.country || 'France';
    const site = item.site || DEFAULT_SITE_BY_COUNTRY[country] || 'Bureau Paris';
    const department =
        item.department ||
        item.user?.department ||
        DEFAULT_DEPARTMENT_BY_COUNTRY[country] ||
        'IT HQ';
    const typeWarrantyYears = WARRANTY_YEARS_BY_TYPE[item.type] || 2;
    const warrantyEnd =
        item.warrantyEnd || addYearsToDate(item.financial?.purchaseDate, typeWarrantyYears);
    const serialNumber = item.serialNumber || `SN-${item.assetId.replace(/[^A-Za-z0-9]/g, '')}`;
    const hostname = item.hostname || buildHostnameFromName(item.name, item.assetId);
    const isComputingAsset = ['Laptop', 'Server', 'Printer'].includes(item.type);

    const os =
        item.os ||
        (item.type === 'Laptop'
            ? item.model.toLowerCase().includes('macbook')
                ? 'macOS Sonoma 14'
                : 'Windows 11 Pro'
            : item.type === 'Server'
              ? 'Ubuntu Server 22.04 LTS'
              : item.type === 'Printer'
                ? 'HP FutureSmart'
                : 'N/A');

    const ram =
        item.ram ||
        (item.type === 'Laptop'
            ? '16 GB'
            : item.type === 'Server'
              ? '128 GB ECC'
              : item.type === 'Printer'
                ? '2 GB'
                : 'N/A');

    const storage =
        item.storage ||
        (item.type === 'Laptop'
            ? '512 GB SSD'
            : item.type === 'Server'
              ? '2 TB NVMe'
              : item.type === 'Printer'
                ? '16 GB eMMC'
                : 'N/A');

    return {
        ...item,
        country,
        site,
        department,
        warrantyEnd,
        serialNumber,
        hostname,
        os,
        ram,
        storage,
        securityAgents: item.securityAgents || {
            sentinelOne: isComputingAsset,
            matrix42: isComputingAsset,
            manageEngine: isComputingAsset,
            lastCheckedAt: '2026-01-15T09:00:00Z',
        },
    };
};

export const mockAllEquipment: Equipment[] = [
    {
        id: '1',
        name: 'LPT-HQ-01',
        assetId: 'ASSET-10001',
        type: 'Laptop',
        model: 'Dell Latitude 7420',
        status: 'Disponible',
        country: 'France',
        image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=100&h=100&fit=crop',
        user: null,
        financial: {
            purchasePrice: 1250,
            purchaseDate: '2025-01-05',
            depreciationYears: 3,
            depreciationMethod: 'linear',
        },
        assignmentStatus: 'NONE',
    },
    {
        id: '2',
        name: 'SCR-DK-01',
        assetId: 'ASSET-20001',
        type: 'Monitor',
        model: 'Dell U2721DE',
        status: 'Disponible',
        country: 'Sénégal',
        image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=100&h=100&fit=crop',
        user: null,
        financial: {
            purchasePrice: 400,
            purchaseDate: '2023-01-15',
            depreciationYears: 5,
            depreciationMethod: 'linear',
        },
        assignmentStatus: 'NONE',
    },
    {
        id: '3',
        name: 'MBP-SALES-01',
        assetId: 'ASSET-30001',
        type: 'Laptop',
        model: 'MacBook Pro 14"',
        status: 'Attribué',
        country: 'France',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=100&h=100&fit=crop',
        user: {
            name: 'Jane Manager',
            email: 'jane.manager@tracker.app',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
        },
        financial: {
            purchasePrice: 2400,
            purchaseDate: '2024-03-20',
            depreciationYears: 3,
            depreciationMethod: 'linear',
        },
        assignmentStatus: 'CONFIRMED',
        confirmedBy: '3',
        confirmedAt: '2024-03-21T09:00:00Z',
    },
    {
        id: '4',
        name: 'KEY-SALES-02',
        assetId: 'ASSET-30002',
        type: 'Keyboard',
        model: 'Logitech MX Keys',
        status: 'Attribué',
        country: 'France',
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b91a603?w=100&h=100&fit=crop',
        user: {
            name: 'Ethan Employé',
            email: 'ethan.user@tracker.app',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ethan',
        },
        financial: {
            purchasePrice: 120,
            purchaseDate: '2023-11-05',
            depreciationYears: 2,
            depreciationMethod: 'linear',
        },
        assignmentStatus: 'CONFIRMED',
    },
    {
        id: '5',
        name: 'SCR-SNG-02',
        assetId: 'ASSET-20002',
        type: 'Monitor',
        model: 'LG UltraFine 5K',
        status: 'En réparation',
        country: 'Sénégal',
        image: 'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=100&h=100&fit=crop',
        user: null,
        financial: {
            purchasePrice: 900,
            purchaseDate: '2022-05-10',
            depreciationYears: 5,
            depreciationMethod: 'linear',
        },
        assignmentStatus: 'NONE',
    },
    {
        id: '6',
        name: 'MSE-HQ-03',
        assetId: 'ASSET-10003',
        type: 'Mouse',
        model: 'Logitech MX Master 3',
        status: 'Attribué',
        country: 'France',
        image: 'https://images.unsplash.com/photo-1615900119312-2acd3a71f3ad?w=100&h=100&fit=crop',
        user: {
            name: 'Alice SuperAdmin',
            email: 'alice.admin@tracker.app',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
        },
        financial: {
            purchasePrice: 90,
            purchaseDate: '2024-01-10',
            depreciationYears: 2,
            depreciationMethod: 'linear',
        },
        assignmentStatus: 'CONFIRMED',
    },
    {
        id: '7',
        name: 'SVR-HQ-01',
        assetId: 'ASSET-50001',
        type: 'Server',
        model: 'Dell PowerEdge R750',
        status: 'Attribué',
        country: 'France',
        image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&h=100&fit=crop',
        user: {
            name: 'Alice SuperAdmin',
            email: 'alice.admin@tracker.app',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
        },
        financial: {
            purchasePrice: 7800,
            purchaseDate: '2024-06-09',
            depreciationYears: 5,
            depreciationMethod: 'degressive',
        },
        assignmentStatus: 'CONFIRMED',
        serialNumber: 'SVR-FRA-001-A',
        hostname: 'srv-hq-01',
    },
    {
        id: '8',
        name: 'HDP-DK-01',
        assetId: 'ASSET-60001',
        type: 'Headphones',
        model: 'Sony WH-1000XM5',
        status: 'Attribué',
        country: 'Sénégal',
        image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=100&h=100&fit=crop',
        user: {
            name: 'Fatou Support',
            email: 'fatou.support@tracker.app',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatou',
        },
        financial: {
            purchasePrice: 340,
            purchaseDate: '2025-03-15',
            depreciationYears: 2,
            depreciationMethod: 'linear',
        },
        assignmentStatus: 'CONFIRMED',
        department: 'Support Afrique',
        site: 'Campus Dakar',
    },
    {
        id: '9',
        name: 'PRT-HQ-01',
        assetId: 'ASSET-70001',
        type: 'Printer',
        model: 'HP LaserJet Pro M404',
        status: 'Disponible',
        country: 'France',
        image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=100&h=100&fit=crop',
        user: null,
        financial: {
            purchasePrice: 280,
            purchaseDate: '2024-04-20',
            depreciationYears: 5,
            depreciationMethod: 'linear',
        },
        assignmentStatus: 'NONE',
    },
    {
        id: '10',
        name: 'LPT-DK-03',
        assetId: 'ASSET-90001',
        type: 'Laptop',
        model: 'Lenovo ThinkPad T14 Gen 4',
        status: 'Disponible',
        country: 'Sénégal',
        image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=100&h=100&fit=crop',
        user: null,
        financial: {
            purchasePrice: 1650,
            purchaseDate: '2025-01-22',
            depreciationYears: 3,
            depreciationMethod: 'linear',
        },
        assignmentStatus: 'NONE',
        department: 'Support Afrique',
        site: 'Campus Dakar',
    },
    {
        id: '11',
        name: 'MSE-TOG-02',
        assetId: 'ASSET-90002',
        type: 'Mouse',
        model: 'Logitech M720',
        status: 'Disponible',
        country: 'Togo',
        image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=100&h=100&fit=crop',
        user: null,
        financial: {
            purchasePrice: 55,
            purchaseDate: '2025-02-11',
            depreciationYears: 2,
            depreciationMethod: 'linear',
        },
        assignmentStatus: 'NONE',
        site: 'Lomé Siège',
        department: 'Direction',
    },
    {
        id: '12',
        name: 'LPT-HQ-07',
        assetId: 'ASSET-90003',
        type: 'Laptop',
        model: 'HP EliteBook 840 G10',
        status: 'Attribué',
        country: 'France',
        image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100&h=100&fit=crop',
        user: {
            name: 'Marc Finance',
            email: 'marc.finance@tracker.app',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marc',
        },
        financial: {
            purchasePrice: 1490,
            purchaseDate: '2025-05-30',
            depreciationYears: 3,
            depreciationMethod: 'linear',
        },
        assignmentStatus: 'CONFIRMED',
        serialNumber: 'LPT-FRA-007-M',
        hostname: 'lpt-hq-07',
    },
    {
        id: '13',
        name: 'SCR-TOG-03',
        assetId: 'ASSET-90004',
        type: 'Monitor',
        model: 'Samsung ViewFinity S8',
        status: 'En réparation',
        country: 'Togo',
        image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=100&h=100&fit=crop',
        user: null,
        financial: {
            purchasePrice: 620,
            purchaseDate: '2023-02-14',
            depreciationYears: 5,
            depreciationMethod: 'linear',
        },
        assignmentStatus: 'NONE',
        repairStartDate: '2026-01-10',
        site: 'Lomé Siège',
        notes: 'Flickering intermittent sur entrée DisplayPort.',
    },
    {
        id: '14',
        name: 'HDP-HQ-04',
        assetId: 'ASSET-90007',
        type: 'Headphones',
        model: 'Jabra Evolve2 65',
        status: 'Attribué',
        country: 'France',
        image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=100&h=100&fit=crop',
        user: {
            name: 'Lea Marketing',
            email: 'lea.marketing@tracker.app',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lea',
        },
        financial: {
            purchasePrice: 220,
            purchaseDate: '2025-04-25',
            depreciationYears: 2,
            depreciationMethod: 'linear',
        },
        assignmentStatus: 'CONFIRMED',
        department: 'Marketing Europe',
    },
].map(normalizeEquipmentForDemo);

// --- Management Data with Defaults ---

export const mockCategories: Category[] = [
    {
        id: '1',
        name: 'Laptop',
        family: 'Informatique',
        assignable: true,
        icon: <MaterialIcon name="laptop" size={24} />,
        iconName: 'Laptop',
        description: 'Ordinateurs portables',
        defaultDepreciation: { method: 'linear', years: 3, salvageValuePercent: 0 },
    },
    {
        id: '2',
        name: 'Monitor',
        family: 'Périphériques',
        assignable: true,
        icon: <MaterialIcon name="monitor" size={24} />,
        iconName: 'Monitor',
        description: 'Écrans et moniteurs',
        defaultDepreciation: { method: 'linear', years: 5, salvageValuePercent: 0 },
    },
    {
        id: '3',
        name: 'Keyboard',
        family: 'Périphériques',
        assignable: true,
        icon: <MaterialIcon name="keyboard" size={24} />,
        iconName: 'Keyboard',
        description: 'Claviers',
        defaultDepreciation: { method: 'linear', years: 2, salvageValuePercent: 0 },
    },
    {
        id: '4',
        name: 'Mouse',
        family: 'Périphériques',
        assignable: true,
        icon: <MaterialIcon name="mouse" size={24} />,
        iconName: 'Mouse',
        description: 'Souris',
        defaultDepreciation: { method: 'linear', years: 2, salvageValuePercent: 0 },
    },
    {
        id: '5',
        name: 'Server',
        family: 'Informatique',
        assignable: false,
        icon: <MaterialIcon name="dns" size={24} />,
        iconName: 'Server',
        description: 'Serveurs physiques',
        defaultDepreciation: { method: 'degressive', years: 5, salvageValuePercent: 10 },
    },
    {
        id: '6',
        name: 'Headphones',
        family: 'Périphériques',
        assignable: true,
        icon: <MaterialIcon name="headphones" size={24} />,
        iconName: 'Headphones',
        description: 'Casques audio',
        defaultDepreciation: { method: 'linear', years: 2, salvageValuePercent: 0 },
    },
    {
        id: '7',
        name: 'Furniture',
        family: 'Mobilier et divers',
        assignable: false,
        icon: <MaterialIcon name="chair" size={24} />,
        /* `Furniture` n'existait pas au registre : le rendu retombait sur le carton
           générique. 09.1 arrête `Armchair` pour ce type. */
        iconName: 'Armchair',
        description: 'Mobilier de bureau',
        defaultDepreciation: { method: 'linear', years: 10, salvageValuePercent: 5 },
    },
    {
        id: '8',
        name: 'Printer',
        family: 'Impression et réseau',
        assignable: false,
        icon: <MaterialIcon name="print" size={24} />,
        iconName: 'Printer',
        description: 'Imprimantes',
        defaultDepreciation: { method: 'linear', years: 5, salvageValuePercent: 0 },
    },
];

export const mockModels: Model[] = [
    {
        id: '1',
        name: 'Dell Latitude 7420',
        type: 'Laptop',
        count: 1,
        image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=100&h=100&fit=crop',
    },
    {
        id: '2',
        name: 'Dell U2721DE',
        type: 'Monitor',
        count: 1,
        image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=100&h=100&fit=crop',
    },
    {
        id: '3',
        name: 'LG UltraFine 5K',
        type: 'Monitor',
        count: 1,
        image: 'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=100&h=100&fit=crop',
    },
    {
        id: '4',
        name: 'Logitech MX Keys',
        type: 'Keyboard',
        count: 1,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b91a603?w=100&h=100&fit=crop',
    },
    {
        id: '5',
        name: 'Logitech MX Master 3',
        type: 'Mouse',
        count: 1,
        image: 'https://images.unsplash.com/photo-1615900119312-2acd3a71f3ad?w=100&h=100&fit=crop',
    },
    {
        id: '6',
        name: 'MacBook Pro 14"',
        type: 'Laptop',
        count: 1,
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=100&h=100&fit=crop',
    },
];

export const mockPendingApprovals: Approval[] = [
    {
        id: '1',
        requesterId: '1',
        requesterName: 'Alice Admin',
        requesterRole: 'SuperAdmin',
        beneficiaryId: '1',
        beneficiaryName: 'Alice Admin',
        isDelegated: false,
        equipmentCategory: 'Laptop',
        equipmentModel: 'Dell Latitude 7420',
        reason: 'Remplacement ancien PC',
        urgency: 'normal',
        status: 'WAITING_IT_PROCESSING',
        createdAt: '2026-01-14T10:00:00Z',
        updatedAt: '2026-01-14T10:00:00Z',
        image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=100&h=100&fit=crop',

        // Legacy mappings
        equipmentName: 'Dell Latitude 7420',
        equipmentType: 'Laptop',
        requestType: 'Attribution',
        requester: 'Alice Admin',
        requestDate: '0j',
    },
];

export const mockApprovalHistory: Approval[] = [
    {
        id: '2',
        requesterId: '4',
        requesterName: 'Ethan Harper',
        requesterRole: 'User',
        beneficiaryId: '4',
        beneficiaryName: 'Ethan Harper',
        isDelegated: false,
        equipmentCategory: 'Keyboard',
        equipmentModel: 'Logitech MX Keys',
        reason: 'Demande standard',
        urgency: 'low',
        status: 'Completed',
        createdAt: '2023-10-30T10:00:00Z',
        updatedAt: '2023-11-02T10:00:00Z',
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b91a603?w=100&h=100&fit=crop',

        // Legacy mappings
        equipmentName: 'Logitech MX Keys',
        equipmentType: 'Keyboard',
        requestType: 'Attribution',
        requester: 'Ethan Harper',
        requestDate: '813j',
    },
];

export const mockReports: Report[] = [
    {
        id: '1',
        title: 'Inventaire Complet',
        description: 'Exporter la liste complète de tous les équipements et leurs détails.',
        icon: <MaterialIcon name="package_2" size={24} />,
    },
    {
        id: '2',
        title: 'Historique par Utilisateur',
        description:
            'Générer un rapport de toutes les attributions et retours pour un utilisateur spécifique.',
        icon: <MaterialIcon name="manage_accounts" size={24} />,
    },
    {
        id: '3',
        title: 'Équipement Vieillissant',
        description:
            "Lister tous les équipements de plus de 3 ans pour la planification de l'amortissement.",
        icon: <MaterialIcon name="history" size={24} />,
    },
    {
        id: '4',
        title: 'Expiration des Garanties',
        description: 'Voir les équipements dont la garantie expire dans les 90 prochains jours.',
        icon: <MaterialIcon name="gpp_maybe" size={24} />,
    },
];

export const mockLocationCountries = ['France', 'Sénégal', 'Togo'];

export const mockAuditCountries: AuditCountryStats[] = [
    { name: 'France', sites: 1, completed: 0, total: 3 },
    { name: 'Sénégal', sites: 1, completed: 0, total: 0 },
    { name: 'Togo', sites: 2, completed: 0, total: 3 },
];

// --- History Events Mock ---
export const mockHistoryEvents: HistoryEvent[] = [
    {
        id: 'evt_1',
        timestamp: '2026-01-14T13:15:00Z',
        type: 'CREATE',
        actorId: '1',
        actorName: 'Alice SuperAdmin',
        actorRole: 'SuperAdmin',
        targetType: 'EQUIPMENT',
        targetId: '1',
        targetName: 'Dell Latitude 7420 (ASSET-12345)',
        description: "Création de l'équipement",
        isSystem: false,
        isSensitive: false,
    },
    {
        id: 'evt_2',
        timestamp: '2026-01-14T10:00:00Z',
        type: 'ASSIGN_PENDING',
        actorId: '1',
        actorName: 'Alice SuperAdmin',
        actorRole: 'SuperAdmin',
        targetType: 'EQUIPMENT',
        targetId: '1',
        targetName: 'Dell Latitude 7420 (ASSET-12345)',
        description: 'Attribution initiée pour Alice SuperAdmin',
        metadata: { beneficiaryId: '1' },
        isSystem: false,
        isSensitive: false,
    },
    {
        id: 'evt_3',
        timestamp: '2026-01-13T16:00:00Z',
        type: 'LOGIN',
        actorId: '3',
        actorName: 'Jane Manager',
        actorRole: 'Manager',
        targetType: 'USER',
        targetId: '3',
        targetName: 'Jane Manager',
        description: 'Connexion utilisateur',
        isSystem: false,
        isSensitive: false,
    },
    {
        id: 'evt_4',
        timestamp: '2026-01-12T09:30:00Z',
        type: 'RETURN',
        actorId: '1',
        actorName: 'Alice SuperAdmin',
        actorRole: 'SuperAdmin',
        targetType: 'EQUIPMENT',
        targetId: '4',
        targetName: 'Keyboard (ASSET-30002)',
        description: "Retour d'équipement (Mise en stock)",
        metadata: { condition: 'Bon' },
        isSystem: false,
        isSensitive: false,
    },
];
