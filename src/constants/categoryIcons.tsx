import React from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import {
    Armchair,
    Camera,
    Cpu,
    DeviceMobile,
    DeviceTablet,
    HardDrive,
    HardDrives,
    Headphones,
    Key,
    Keyboard,
    Laptop,
    Monitor,
    Mouse,
    Package,
    Printer,
    SpeakerHigh,
    Television,
    WifiHigh,
} from '@phosphor-icons/react';

import Icon, { type IconSize } from '../components/ui/Icon';
import { Category } from '../types';

/**
 * Map centrale catégorie d'équipement → icône Material Symbols (audit X10).
 * Source unique — ne plus définir de map locale ni de fallback trompeur
 * (ex. tout afficher en « monitor ») dans les composants.
 */
const CATEGORY_ICON_MAP: Record<string, string> = {
    laptop: 'laptop_mac',
    monitor: 'monitor',
    keyboard: 'keyboard',
    mouse: 'mouse',
    headphones: 'headphones',
    smartphone: 'smartphone',
    phone: 'smartphone',
    tablet: 'tablet_mac',
    printer: 'print',
    server: 'dns',
};

/** Icône neutre quand la catégorie est inconnue — préférable à une icône fausse. */
export const UNKNOWN_CATEGORY_ICON = 'devices_other';

export const getCategoryIcon = (category?: string | null): string =>
    CATEGORY_ICON_MAP[(category || '').trim().toLowerCase()] ?? UNKNOWN_CATEGORY_ICON;

/**
 * **Les pictogrammes de catégorie — arrêtés une fois, repris partout** (planche 09.1,
 * `CORRESPONDANCE-ICONES.md` §6).
 *
 * *« Un type n'a pas de photo, mais il a un pictogramme. Le référentiel des types est
 * le seul endroit où le pictogramme de catégorie est une donnée : les huit sont fixés
 * ici, et les autres écrans s'y réfèrent. »*
 *
 * Ce fichier portait déjà la table Phosphor pour la file (08.1) et la campagne d'audit
 * (16.2) — précisément pour qu'il n'y en ait pas deux. Le Catalogue, lui, en tenait une
 * troisième dans `mockData`, encore en `MaterialIcon`, et les trois avaient divergé :
 *
 * - **Clavier** était rendu par `Key` — la clé, pas le clavier. §6 pose `Keyboard`.
 * - **Serveur** portait `dns` côté catalogue, une icône de réseau pour une machine.
 * - **Mobilier** portait `iconName: 'Furniture'`, absent des deux tables : le rendu
 *   retombait sur le carton générique. Un type dont le pictogramme est un carton ne se
 *   distingue plus de son voisin — c'est ce qui faisait qu'on ne voyait pas les
 *   catégories dans le référentiel.
 *
 * Il n'y a donc plus qu'une table. Elle est indexée par le **nom de pictogramme** porté
 * par le type (`Category.iconName`) ; les écrans qui ne tiennent qu'un nom de type en
 * chaîne y accèdent par `getCategoryGlyph`, qui passe par la même table.
 */
export const CATEGORY_GLYPHS: Record<string, PhosphorGlyph> = {
    /* Les huit du référentiel, dans l'ordre des familles de 09.1. */
    Laptop,
    Server: HardDrives,
    Monitor,
    Keyboard,
    Mouse,
    Headphones,
    Printer,
    Armchair,
    /* Le reste du jeu figé par §6 — proposé au sélecteur d'une fiche de type. */
    Smartphone: DeviceMobile,
    Tablet: DeviceTablet,
    Speaker: SpeakerHigh,
    Tv: Television,
    Router: WifiHigh,
    Camera,
    HardDrive,
    Cpu,
};

/** Le repli, **déclaré** : un type sans pictogramme connu se lit comme un manque. */
export const CATEGORY_FALLBACK_GLYPH = Package;

/**
 * Les autres clés qui désignent un glyphe du registre : anciennes valeurs de la donnée
 * et synonymes de type employés par les écrans qui ne tiennent qu'une chaîne. Elles ne
 * sont pas proposées au sélecteur — ce serait le même dessin deux fois dans la grille.
 */
const CATEGORY_GLYPH_ALIASES: Record<string, PhosphorGlyph> = {
    furniture: Armchair,
    screen: Monitor,
    headset: Headphones,
    phone: DeviceMobile,
    mobile: DeviceMobile,
    accessory: Key,
};

/** Table insensible à la casse, construite une fois depuis le registre et ses alias. */
const GLYPH_BY_LOWER_KEY: Record<string, PhosphorGlyph> = Object.fromEntries(
    [...Object.entries(CATEGORY_GLYPHS), ...Object.entries(CATEGORY_GLYPH_ALIASES)].map(
        ([name, glyph]) => [name.toLowerCase(), glyph],
    ),
);

/** Le glyphe d'un type désigné par son `iconName` — la donnée portée par le type. */
export const resolveCategoryGlyph = (iconName?: string | null): PhosphorGlyph =>
    GLYPH_BY_LOWER_KEY[(iconName || '').trim().toLowerCase()] ?? CATEGORY_FALLBACK_GLYPH;

/**
 * Glyphe de vignette (§2.2) pour un écran qui ne tient que le **nom du type** —
 * la file (08.1), la campagne d'audit (16.2). Même table, même repli.
 */
export const getCategoryGlyph = (category?: string | null): PhosphorGlyph =>
    resolveCategoryGlyph(category);

/**
 * Le registre tel que le consomment le sélecteur de la fiche de type et l'import CSV :
 * un nœud par clé, alias exclus.
 */
export const CATEGORY_ICONS: Record<string, React.ReactNode> = Object.fromEntries(
    Object.entries(CATEGORY_GLYPHS).map(([name, glyph]) => [
        name,
        <Icon key={name} glyph={glyph} size={24} />,
    ]),
);

/**
 * Le pictogramme d'un type, à la taille demandée. Les tailles admises sont les quatre
 * du registre (I2) : la vignette de rangée prend 20, le héros d'une fiche 32.
 */
export const renderCategoryIcon = (category: Category | undefined, size: IconSize = 24) => (
    <Icon glyph={resolveCategoryGlyph(category?.iconName)} size={size} />
);
