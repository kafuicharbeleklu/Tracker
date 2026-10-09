import React, { useMemo, useState } from 'react';
import {
    CaretRight,
    Check,
    Columns,
    DownloadSimple,
    FileCsv,
    ListChecks,
    Warning,
    X,
} from '@phosphor-icons/react';
import Button from '../ui/Button';
import FacetChip from '../ui/FacetChip';
import { FileDropzone } from '../ui/FileDropzone';
import Icon from '../ui/Icon';
import { Skeleton } from '../ui/Skeleton';
import { FullScreenFormLayout } from './FullScreenFormLayout';
import { cn } from '../../lib/utils';
import { useOptionalData } from '../../context/DataContext';
import { JAUGE } from '../../lib/jauge';
import { buildCsvLine } from '../../lib/csv';
import { correspondre, lireClasseur, type ClasseurLu } from '../../lib/tableur';

/**
 * Une colonne du contrat — `.chp` de la planche 09.2. **Un jeton ne porte que le nom
 * de la colonne** : ce qu'elle exige se dit une fois, dans la phrase sous les jetons
 * (`contractNote`). Les descriptions par colonne faisaient trois rangées de texte
 * au-dessus d'une zone de dépôt qu'on ne voyait plus.
 */
export interface ImportColumn {
    /** Le nom du contrat, celui du fichier d'exemple. */
    key: string;
    /** Requise : le jeton prend la teinte bleue. */
    required?: boolean;
    /** Ce que la colonne porte — conservé pour le fichier d'exemple et la documentation. */
    description?: React.ReactNode;
    /** Le mot du contrat : « requis », « facultatif », « selon le type ». */
    requirement?: string;
    /**
     * **Les autres noms sous lesquels un fichier la porte** (09/10) — « Numéro de série »,
     * « N° série » pour `Serial`. Les colonnes se reconnaissent à leur nom, plus à leur rang.
     */
    alias?: readonly string[];
    /**
     * Ce qui la remplace quand le fichier ne la porte pas — « le site choisi plus bas ».
     * Requise par ligne, elle n'est alors pas requise au fichier.
     */
    remplacee?: string;
}

/** Une ligne de données lue dans le fichier, retenue ou refusée. */
export interface ImportCandidate<T> {
    /** Le numéro de ligne **du tableur**, en-tête comprise : c'est là qu'on ira corriger. */
    line: number;
    /** Ce qui nomme la ligne — son nom, ou « (sans nom) ». */
    label: string;
    /** La cause du refus, en toutes lettres. Absente : la ligne entre. */
    error?: string;
    /** Ce qui entre, mais mérite un regard : « date d'achat illisible, laissée vide ». */
    remarque?: string;
    /**
     * **Laissée de côté, sans faute** (09/10) — « déjà au catalogue », « répète une ligne plus
     * haut ». Elle n'entre pas et n'est pas refusée : il n'y a rien à corriger. Réimporter
     * l'inventaire de l'an dernier ne doit pas faire quatre-vingts refus.
     */
    ecartee?: string;
    /** Ce qui sera écrit si la ligne entre. */
    value?: T;
}

/** Une ligne du tableur, ses valeurs lues **par le nom de la colonne du contrat**. */
export interface LigneImportee {
    line: number;
    /** La valeur de la colonne du contrat, `''` si le fichier ne la porte pas. */
    get: (key: string) => string;
    cellules: string[];
}

/** Ce que l'appelant analyse : les lignes, et les colonnes que le fichier porte. */
export interface TableauImporte {
    /** Le nom de la feuille lue — « Imprimantes » dit déjà le type de ses lignes. */
    feuille: string;
    lignes: LigneImportee[];
    /** Pour chaque colonne du contrat, le nom qu'elle porte dans le fichier ; absente : `undefined`. */
    trouvees: Record<string, string | undefined>;
}

interface ReferentialImportTemplateProps<T> {
    title: string;
    onCancel: () => void;
    /** Le contrat de colonnes, montré **avant** d'aller chercher un fichier. */
    columns: ImportColumn[];
    /** Le fichier d'exemple — il illustre le contrat qu'on vient de lire. */
    sample: { fileName: string; content: string };
    /** Le nom de ce qui entre, pour les décomptes et le pied. */
    noun: { one: string; many: string };
    /** Analyse les lignes lues et rend une candidate par ligne de données. */
    parse: (tableau: TableauImporte) => ImportCandidate<T>[];
    /** Écrit les lignes retenues, dans l'ordre du fichier. */
    onImport: (values: T[]) => void;
    /** Une précision propre au référentiel, sous les lignes refusées. */
    rejectionNote?: React.ReactNode;
    /**
     * `.fnote` — la phrase qui dit **ce que le contrat exige au juste**, sous les jetons
     * de colonnes : « les deux premières sont requises ; Category doit être un type du
     * catalogue ». La planche la préfère à une description par colonne, qui faisait
     * trois rangées là où une phrase suffit.
     */
    contractNote?: React.ReactNode;
    /** Ce que la zone de dépôt annonce en second. */
    dropSubLabel?: string;
    /**
     * Un réglage qui s'applique aux lignes retenues — le rôle par défaut des personnes
     * importées (05.3), le site des actifs quand le fichier n'en porte pas. Il paraît
     * **après la lecture**, sous le fichier : on voit qui entre avant de décider comment.
     */
    reglages?: React.ReactNode | ((tableau: TableauImporte) => React.ReactNode);
}

/**
 * **L'import d'un référentiel — un composant, pas deux écrans qui se ressemblent**
 * (planche 09.2, colonnes 3 et 4).
 *
 * *« Même écran, même pied, même contrat : c'est un seul composant. Une seule chose
 * change, et elle est propre à la géographie : une ligne peut être juste et refusée
 * quand même, parce que son parent n'existe pas encore. »*
 *
 * Les deux imports du référentiel — modèles, emplacements — posaient la même question
 * et avaient chacun leur réponse : deux analyses de CSV, deux jeux de messages, deux
 * mises en page, et un seul des deux écrivait vraiment. Ce gabarit tient tout ce qui
 * ne dépend pas du référentiel ; l'appelant ne fournit plus que **son contrat, sa
 * lecture et son écriture**.
 *
 * ## La règle qu'il applique
 *
 * **Un import ne se juge pas au fichier, il se juge à ce qui va entrer.**
 *
 * - **Le contrat avant le dépôt.** Chaque colonne, ce qu'elle porte, si elle est
 *   requise — c'est la seule information dont on a besoin *avant* d'aller chercher un
 *   fichier, et la seule qu'on n'a plus sous les yeux quand on est dans son tableur.
 *   Le produit l'annonçait en une ligne de petit texte sous « Étape 1 ».
 * - **Le décompte avant l'écriture** : deux totaux, ce qui entre et ce qui est refusé.
 * - **Les lignes refusées se nomment, elles ne se comptent pas.** *« Trois lignes
 *   nommées valent mieux qu'un compte : c'est dans le tableur qu'on les corrigera, et
 *   il faut savoir lesquelles. »* Le produit affichait un tableau de **toutes** les
 *   lignes avec une pastille par rangée — il fallait chercher les fautives dedans.
 * - **Un fichier à moitié bon ne force pas à choisir entre tout et rien** : le pied
 *   propose d'écrire les valides. Quand il n'y en a aucune, il ne propose plus
 *   d'écrire — il propose de corriger le fichier.
 *
 * ## La lecture (09/10)
 *
 * Le fichier se lit **comme il arrive** (`lib/tableur`) : CSV — encodage et séparateur
 * déduits, guillemets respectés — ou classeur Excel, dont on choisit la feuille. L'en-tête
 * est la ligne qui nomme le plus de colonnes du contrat, et chaque colonne se reconnaît à
 * son nom ou à l'un de ses alias, plus à son rang. Ce que la lecture a compris se dit :
 * les colonnes reconnues et sous quel nom, les absentes, les refus **regroupés par cause**
 * — trente lignes au même modèle inconnu sont une seule chose à corriger —, et les lignes
 * refusées se téléchargent avec leur motif, pour les reprendre dans le tableur.
 */
function ReferentialImportTemplate<T>({
    title,
    onCancel,
    columns,
    sample,
    noun,
    parse,
    onImport,
    rejectionNote,
    contractNote,
    dropSubLabel = 'CSV ou Excel — les colonnes se reconnaissent à leur nom',
    reglages,
}: ReferentialImportTemplateProps<T>) {
    const [file, setFile] = useState<File | null>(null);
    const [classeur, setClasseur] = useState<ClasseurLu | null>(null);
    const [feuille, setFeuille] = useState(0);
    const [lecture, setLecture] = useState<'attente' | 'en cours' | 'faite' | 'echec'>('attente');

    /* La feuille, l'en-tête et la correspondance des colonnes — puis les lignes, lues par nom. */
    const tableau = useMemo<
        (TableauImporte & { ligneEntete: number; ignorees: string[] }) | null
    >(() => {
        const lue = classeur?.feuilles[feuille];
        if (!lue) return null;
        const c = correspondre(lue.lignes, columns);
        const trouvees: Record<string, string | undefined> = {};
        for (const col of columns) {
            const i = c.indices[col.key];
            trouvees[col.key] = i === undefined ? undefined : c.entetes[i] || `colonne ${i + 1}`;
        }
        const utilisees = new Set(Object.values(c.indices).filter((i) => i !== undefined));
        const ignorees = c.entetes.filter((e, i) => e && !utilisees.has(i));
        /* Le numéro du tableur : la plage peut ne pas commencer en ligne 1. */
        const ligneEntete = lue.debut + c.ligneEntete + 1;
        const lignes = lue.lignes
            .slice(c.ligneEntete + 1)
            .map((cellules, k) => ({
                line: ligneEntete + k + 1,
                cellules,
                get: (key: string) => {
                    const i = c.indices[key];
                    return i === undefined ? '' : (cellules[i] ?? '').trim();
                },
            }))
            .filter((ligne) => ligne.cellules.some((v) => v.trim()));
        return { feuille: lue.nom, lignes, trouvees, ligneEntete, ignorees };
    }, [classeur, feuille, columns]);

    /* L'analyse suit la feuille et les réglages de l'appelant : elle se refait à chaque rendu. */
    /* Tant que le parc et le catalogue arrivent de la base, rien ne se juge. */
    const enAttente = useOptionalData()?.isHydrating ?? false;
    const candidates = tableau && !enAttente ? parse(tableau) : [];
    const previewMode = lecture === 'faite' && tableau !== null;

    const accepted = candidates.filter((row) => !row.error && !row.ecartee);
    const rejected = candidates.filter((row) => Boolean(row.error));
    const ecartees = candidates.filter((row) => !row.error && row.ecartee);
    /** Les lignes à juger : ce qui entre, et ce qui est refusé. */
    const jugees = accepted.length + rejected.length;
    const remarques = accepted.filter((row) => row.remarque);

    /** Les refus **par cause** : la même cause, une rangée ; ses lignes, nommées. */
    const regrouper = (rangees: ImportCandidate<T>[], cle: (r: ImportCandidate<T>) => string) => {
        const groupes = new Map<string, number[]>();
        for (const r of rangees) {
            const k = cle(r);
            groupes.set(k, [...(groupes.get(k) ?? []), r.line]);
        }
        return [...groupes.entries()]
            .map(([cause, lignes]) => ({ cause, lignes }))
            .sort((a, b) => b.lignes.length - a.lignes.length);
    };
    const causes = regrouper(rejected, (r) => r.error as string);
    const aVerifier = regrouper(remarques, (r) => r.remarque as string);
    const deCote = regrouper(ecartees, (r) => r.ecartee as string);

    const processFile = async (uploadedFile: File) => {
        setFile(uploadedFile);
        setLecture('en cours');
        try {
            const lu = await lireClasseur(uploadedFile);
            /* La feuille qui reconnaît le plus de colonnes du contrat — « Ordinateurs »
               plutôt qu'une feuille de notes. */
            let meilleure = 0;
            let score = -1;
            lu.feuilles.forEach((f, i) => {
                const c = correspondre(f.lignes, columns);
                const s = Object.values(c.indices).filter((x) => x !== undefined).length;
                if (s > score) {
                    score = s;
                    meilleure = i;
                }
            });
            setClasseur(lu);
            setFeuille(meilleure);
            setLecture(lu.feuilles.length ? 'faite' : 'echec');
        } catch (erreur) {
            console.warn('[import] lecture impossible', erreur);
            setClasseur(null);
            setLecture('echec');
        }
    };

    const reset = () => {
        setFile(null);
        setClasseur(null);
        setFeuille(0);
        setLecture('attente');
    };

    const telecharger = (nom: string, contenu: string) => {
        const blob = new Blob([`\uFEFF${contenu}`], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nom;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    };

    /** Le fichier d'exemple, fabriqué depuis le contrat qu'il illustre. */
    const downloadSample = () => telecharger(sample.fileName, sample.content);

    /**
     * **Les lignes refusées, à reprendre dans le tableur** (09/10) — leurs cellules telles
     * qu'elles étaient, et le motif en dernière colonne. Point-virgule : Excel en français
     * l'ouvre en colonnes.
     */
    const telechargerRefus = () => {
        const lue = classeur?.feuilles[feuille];
        if (!lue || !tableau) return;
        const entetes = lue.lignes[tableau.ligneEntete - lue.debut - 1] ?? [];
        const parLigne = new Map(tableau.lignes.map((l) => [l.line, l.cellules]));
        const contenu = [
            buildCsvLine(['Ligne', ...entetes, 'Motif du refus']),
            ...rejected.map((r) =>
                buildCsvLine([r.line, ...(parLigne.get(r.line) ?? []), r.error]),
            ),
        ].join('\r\n');
        telecharger(`${(file?.name ?? 'import').replace(/\.[^.]+$/, '')}-refus.csv`, contenu);
    };

    const acceptedCount = accepted.length;
    const premiereRetenue = accepted[0];
    const canWrite = previewMode && acceptedCount > 0;
    const requisesAbsentes = columns.filter(
        (c) => c.required && !c.remplacee && !tableau?.trouvees[c.key],
    );

    const saveLabel =
        !previewMode || enAttente
            ? `Importer des ${noun.many}`
            : acceptedCount === 0
              ? rejected.length === 0
                  ? 'Choisir un autre fichier'
                  : 'Corriger le fichier'
              : acceptedCount === 1
                ? `Importer le ${noun.one}`
                : `Importer les ${acceptedCount}`;

    /* Un réglage peut n'avoir rien à dire — toutes les lignes portent leur site : pas de carte vide. */
    const contenuDesReglages =
        reglages && tableau
            ? typeof reglages === 'function'
                ? reglages(tableau)
                : reglages
            : null;
    const reconnues = columns.filter((c) => tableau?.trouvees[c.key]).length;

    /** Requise, absente du fichier, et rien ne la remplace. */
    const manque = (column: ImportColumn) => Boolean(column.required && !column.remplacee);

    const lignesEnMots = (lignes: number[]) =>
        `ligne${lignes.length > 1 ? 's' : ''} ${lignes.slice(0, 6).join(', ')}${lignes.length > 6 ? '…' : ''}`;

    return (
        <FullScreenFormLayout
            title={title}
            onCancel={onCancel}
            onSave={() => {
                if (!previewMode || enAttente) return;
                if (acceptedCount === 0) {
                    reset();
                    return;
                }
                onImport(accepted.map((row) => row.value as T));
            }}
            saveLabel={saveLabel}
            isSaving={!previewMode || enAttente}
            /* `.pfoot` — un bouton, pleine largeur. Le pied portait aussi « Annuler »,
               grisé tant qu'aucun fichier n'était lu : on ne pouvait pas renoncer à
               l'import avant de l'avoir commencé, sinon par la flèche de retour — qui
               est justement la sortie que la planche garde, seule. */
            submitButtonLocation="footer-full"
            mesure="double"
        >
            {/* Au bureau, le contrat et le dépôt côte à côte ; après lecture, le fichier
                et ce qui sera créé (24/09). Une colonne de 560 sous une barre de 1 440. */}
            {!previewMode ? (
                <div className="deux:grid deux:grid-cols-2 deux:items-stretch flex flex-col gap-4">
                    {/* LE CONTRAT — `.cols` : chaque colonne, ce qu'elle porte, si elle
                        est requise. Avant le dépôt, pas après. */}
                    <section className="rounded-card bg-surface flex flex-col gap-4 p-4">
                        <div className="flex items-center gap-3">
                            <span className="bg-tint-vert text-on-tint-vert flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px]">
                                <Icon glyph={FileCsv} size={18} />
                            </span>
                            <p className="text-on-surface text-ts-head leading-ts-head flex-1 font-medium">
                                Le fichier
                            </p>
                        </div>

                        {/* `.chips` — **les colonnes sont des jetons**, pas des rangées :
                            le contrat se lit d'un coup d'œil et les requises portent la
                            teinte bleue. */}
                        <div>
                            <p className="text-on-surface-variant mb-2 text-[0.75rem] leading-4 font-medium">
                                Colonnes attendues
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {columns.map((column) => (
                                    <span
                                        key={column.key}
                                        className={cn(
                                            'text-ts-sub leading-ts-sub inline-flex min-h-8 items-center rounded-[4px] px-3 font-mono',
                                            column.required
                                                ? 'bg-tint-bleu text-on-tint-bleu'
                                                : 'bg-surface-container text-on-surface',
                                        )}
                                    >
                                        {column.key}
                                    </span>
                                ))}
                            </div>
                            {contractNote && (
                                <p className="text-on-surface-variant text-ts-sub leading-ts-sub mt-2">
                                    {contractNote}
                                </p>
                            )}
                            <p className="text-on-surface-variant text-ts-sub leading-ts-sub mt-2">
                                Dans n'importe quel ordre, et sous leur nom français aussi : «
                                Numéro de série », « Modèle », « Date d'achat »…
                            </p>
                        </div>
                        <Button
                            variant="text"
                            onClick={downloadSample}
                            /* `whitespace-normal` : texte agrandi, le libellé sortait de la carte
                               de 34 px à 360 (07/10). */
                            className="border-outline-variant text-on-surface hover:text-text-secondary text-ts-sub mt-2 flex min-h-12 w-full items-center justify-start gap-2.5 rounded-none border-t px-1 pt-2 text-left font-medium whitespace-normal transition-colors"
                        >
                            <Icon
                                glyph={CaretRight}
                                size={20}
                                className="text-text-secondary shrink-0"
                            />
                            Télécharger un fichier d'exemple
                        </Button>
                    </section>

                    <div className="flex flex-col gap-3">
                        <FileDropzone
                            onFileSelect={(f) => void processFile(f)}
                            accept=".csv,.txt,.xlsx,.xls,.ods"
                            label={
                                lecture === 'en cours'
                                    ? 'Lecture du fichier…'
                                    : 'Déposer le fichier'
                            }
                            subLabel={dropSubLabel}
                            className="deux:h-full p-6"
                        />
                        {lecture === 'echec' && (
                            <p className="bg-tint-danger text-on-tint-danger text-ts-sub leading-ts-sub rounded-[4px] px-4 py-3">
                                « {file?.name} » ne se lit pas : ni CSV, ni classeur Excel, ou vide.
                                Enregistrez-le en .xlsx ou en .csv, puis déposez-le à nouveau.
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="deux:grid deux:grid-cols-12 deux:items-start flex flex-col gap-4">
                    {/* **L'ordre de lecture** (09/10) : le fichier, ce qui entre, le réglage qui
                        en décide, puis le détail des colonnes. La liste des quatorze colonnes
                        précédait le décompte au téléphone et le réglage au bureau : il fallait
                        défiler pour savoir combien de lignes entraient. Au bureau, deux colonnes
                        indépendantes — une grille à rangées étirait les cartes de gauche à la
                        hauteur de celle de droite ; au téléphone, la colonne de gauche se défait
                        (`contents`) et `order` range les cartes. */}
                    <div className="deux:col-span-5 deux:flex deux:flex-col deux:gap-4 contents">
                        {/* LE FICHIER LU — ce qui a été compris : la feuille, l'en-tête, les
                        colonnes reconnues et sous quel nom. */}
                        <section className="rounded-card bg-surface order-1 flex flex-col gap-4 p-4">
                            <div className="flex items-center gap-3">
                                <span className="bg-tint-vert text-on-tint-vert flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px]">
                                    <Icon glyph={FileCsv} size={18} />
                                </span>
                                <p className="text-on-surface text-ts-head leading-ts-head flex-1 font-medium">
                                    Le fichier
                                </p>
                            </div>

                            <div className="bg-surface-container flex min-h-14 items-center gap-3 rounded-[4px] px-3.5 py-2">
                                <span className="bg-tint-vert text-on-tint-vert flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]">
                                    <Icon glyph={Check} size={20} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="text-on-surface text-ts-body leading-ts-body block truncate font-medium">
                                        {file?.name}
                                    </span>
                                    <span className="text-on-surface-variant text-ts-sub leading-ts-sub block">
                                        {classeur?.format} · {tableau?.lignes.length ?? 0} ligne
                                        {(tableau?.lignes.length ?? 0) > 1 ? 's' : ''} · en-tête
                                        ligne {tableau?.ligneEntete}
                                    </span>
                                </span>
                                <Button
                                    variant="text"
                                    onClick={reset}
                                    className="text-ts-control h-auto !min-h-0 shrink-0 !px-0 !py-0 font-medium"
                                >
                                    Changer
                                </Button>
                            </div>

                            {/* Un classeur à plusieurs feuilles : laquelle importer. */}
                            {(classeur?.feuilles.length ?? 0) > 1 && (
                                <div>
                                    <p className="text-on-surface-variant mb-2 text-[0.75rem] leading-4 font-medium">
                                        La feuille
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {classeur?.feuilles.map((f, i) => (
                                            <FacetChip
                                                key={f.nom}
                                                label={f.nom}
                                                count={Math.max(
                                                    0,
                                                    f.lignes.filter((l) => l.length > 0).length - 1,
                                                )}
                                                selected={i === feuille}
                                                onClick={() => setFeuille(i)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>

                        {contenuDesReglages && (
                            <section className="rounded-card bg-surface order-3 flex flex-col gap-4 p-4">
                                {contenuDesReglages}
                            </section>
                        )}

                        <section className="rounded-card bg-surface order-4 flex flex-col gap-4 p-4">
                            <div className="flex items-center gap-3">
                                <span className="bg-surface-container text-on-surface-variant flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px]">
                                    <Icon glyph={Columns} size={18} />
                                </span>
                                <p className="text-on-surface text-ts-head leading-ts-head flex-1 font-medium">
                                    Les colonnes
                                </p>
                                <span className="text-on-surface-variant text-ts-sub leading-ts-sub tabular-nums">
                                    {reconnues} sur {columns.length}
                                </span>
                            </div>
                            {/* Les colonnes du contrat, et ce que le fichier leur a répondu. */}
                            <div>
                                <ul>
                                    {columns.map((column) => {
                                        const trouvee = tableau?.trouvees[column.key];
                                        return (
                                            <li
                                                key={column.key}
                                                className="border-outline-variant flex min-h-10 items-center gap-3 border-t py-1.5 first:border-t-0"
                                            >
                                                <Icon
                                                    glyph={
                                                        trouvee
                                                            ? Check
                                                            : manque(column)
                                                              ? X
                                                              : CaretRight
                                                    }
                                                    size={18}
                                                    className={cn(
                                                        'shrink-0',
                                                        trouvee
                                                            ? 'text-[var(--tk-color-st-vert)]'
                                                            : manque(column)
                                                              ? 'text-error'
                                                              : 'text-text-tertiary',
                                                    )}
                                                />
                                                <span className="text-on-surface text-ts-sub leading-ts-sub w-28 shrink-0 font-mono">
                                                    {column.key}
                                                </span>
                                                <span
                                                    className={cn(
                                                        'text-ts-sub leading-ts-sub min-w-0 flex-1 truncate',
                                                        trouvee
                                                            ? 'text-on-surface-variant'
                                                            : manque(column)
                                                              ? 'text-error'
                                                              : 'text-text-tertiary',
                                                    )}
                                                >
                                                    {trouvee
                                                        ? normaliseEgal(trouvee, column.key)
                                                            ? 'trouvée'
                                                            : `« ${trouvee} »`
                                                        : column.remplacee
                                                          ? `absente — ${column.remplacee}`
                                                          : column.required
                                                            ? 'absente — requise'
                                                            : 'absente'}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                                {(tableau?.ignorees.length ?? 0) > 0 && (
                                    <p className="text-text-tertiary text-ts-sub leading-ts-sub mt-1.5">
                                        Non lues : {tableau?.ignorees.slice(0, 8).join(', ')}
                                        {(tableau?.ignorees.length ?? 0) > 8 ? '…' : ''}
                                    </p>
                                )}
                            </div>
                        </section>

                        {!canWrite && !enAttente && (
                            <p className="text-text-secondary text-ts-sub leading-ts-sub order-5 px-0.5">
                                {rejected.length === 0 && ecartees.length > 0
                                    ? 'Rien de nouveau : tout ce que porte ce fichier est déjà là.'
                                    : 'Aucune ligne ne peut entrer. Corrigez le fichier dans votre tableur, puis déposez-le à nouveau.'}
                            </p>
                        )}
                    </div>

                    {/* `.cgroup` — **le décompte avant l'écriture**, puis les refus par cause. */}
                    <section className="rounded-card bg-surface deux:order-none deux:col-span-7 order-2 flex flex-col gap-4 p-4">
                        <div className="flex items-center gap-3">
                            <span className="bg-tint-bleu text-on-tint-bleu flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px]">
                                <Icon glyph={ListChecks} size={18} />
                            </span>
                            <p className="text-on-surface text-ts-head leading-ts-head flex-1 font-medium">
                                Ce qui sera créé
                            </p>
                        </div>

                        {enAttente ? (
                            /* **Le référentiel se charge encore** (09/10) : jugées contre un
                               catalogue vide, toutes les lignes seraient refusées « modèle
                               inconnu ». On attend, et l'analyse suit d'elle-même. */
                            <div className="flex flex-col gap-3" aria-busy="true">
                                <p className="text-on-surface-variant text-ts-sub leading-ts-sub">
                                    Le parc et le catalogue se chargent : l’analyse du fichier suit.
                                </p>
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-2 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col gap-2">
                                    <p className="flex items-baseline gap-2">
                                        <b className="font-brand text-on-surface text-ts-page leading-ts-page font-semibold tracking-[-0.01em] tabular-nums">
                                            {acceptedCount}
                                        </b>
                                        <span className="text-on-surface-variant text-ts-sub leading-ts-sub">
                                            {acceptedCount > 1 ? noun.many : noun.one} sur {jugees}{' '}
                                            ligne
                                            {jugees > 1 ? 's' : ''}
                                            {ecartees.length > 0 &&
                                                ` · ${ecartees.length} laissée${ecartees.length > 1 ? 's' : ''} de côté`}
                                        </span>
                                    </p>
                                    <span
                                        className={cn(
                                            'bg-surface-container block overflow-hidden',
                                            JAUGE,
                                        )}
                                    >
                                        <i
                                            className="block h-full bg-[var(--tk-color-st-vert)]"
                                            style={{
                                                width: `${jugees > 0 ? Math.round((acceptedCount / jugees) * 100) : 0}%`,
                                            }}
                                        />
                                    </span>
                                </div>

                                {requisesAbsentes.length > 0 && (
                                    <p className="bg-tint-danger text-on-tint-danger text-ts-sub leading-ts-sub flex gap-3 rounded-[4px] px-4 py-3">
                                        <Icon
                                            glyph={Warning}
                                            size={18}
                                            className="mt-0.5 shrink-0"
                                        />
                                        <span>
                                            {requisesAbsentes.length > 1
                                                ? 'Les colonnes'
                                                : 'La colonne'}{' '}
                                            <b className="font-medium">
                                                {requisesAbsentes.map((c) => c.key).join(', ')}
                                            </b>{' '}
                                            {requisesAbsentes.length > 1 ? 'manquent' : 'manque'} :
                                            nommez l'en-tête dans le tableur, ou choisissez une
                                            autre feuille.
                                        </span>
                                    </p>
                                )}

                                {/* La première retenue prouve la lecture. */}
                                {premiereRetenue && (
                                    <div className="border-outline-variant flex min-h-14 items-center gap-3 border-y py-2">
                                        <span className="text-text-tertiary w-8 shrink-0 text-[0.75rem] leading-4 tabular-nums">
                                            {String(premiereRetenue.line).padStart(2, '0')}
                                        </span>
                                        <span className="text-on-surface text-ts-body leading-ts-body min-w-0 flex-1 truncate">
                                            {premiereRetenue.label}
                                        </span>
                                        <span className="bg-tint-vert text-on-tint-vert flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px]">
                                            <Icon glyph={Check} size={18} />
                                        </span>
                                    </div>
                                )}

                                {/* **Les refus, par cause** (09/10) : trente lignes au même modèle
                            inconnu sont une seule chose à corriger. */}
                                {causes.length > 0 && (
                                    <div>
                                        <p className="text-on-surface-variant mb-1 text-[0.75rem] leading-4 font-medium">
                                            {rejected.length} refusée
                                            {rejected.length > 1 ? 's' : ''}, par cause
                                        </p>
                                        <ul>
                                            {causes.slice(0, 8).map((groupe) => (
                                                <li
                                                    key={groupe.cause}
                                                    className="border-outline-variant flex min-h-14 items-start gap-3 border-t py-2.5 first:border-t-0"
                                                >
                                                    <span className="bg-tint-danger text-on-tint-danger flex h-7 min-w-7 shrink-0 items-center justify-center rounded-[4px] px-1.5 text-[0.8125rem] leading-4 font-medium tabular-nums">
                                                        {groupe.lignes.length}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="text-on-surface text-ts-body leading-ts-body block">
                                                            {groupe.cause}
                                                        </span>
                                                        <span className="text-text-secondary text-ts-sub leading-ts-sub block tabular-nums">
                                                            {lignesEnMots(groupe.lignes)}
                                                        </span>
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                        {causes.length > 8 && (
                                            <p className="text-text-secondary text-ts-sub leading-ts-sub mt-1">
                                                Et {causes.length - 8} autre
                                                {causes.length - 8 > 1 ? 's' : ''} cause
                                                {causes.length - 8 > 1 ? 's' : ''}, dans le fichier
                                                des refus.
                                            </p>
                                        )}
                                        <Button
                                            variant="text"
                                            onClick={telechargerRefus}
                                            icon={<Icon glyph={DownloadSimple} size={20} />}
                                            className="border-outline-variant text-on-surface text-ts-sub mt-2 flex min-h-12 w-full items-center justify-start gap-2.5 rounded-none border-t px-1 pt-2 text-left font-medium whitespace-normal"
                                        >
                                            Télécharger les lignes refusées, avec leur motif
                                        </Button>
                                    </div>
                                )}

                                {/* Ce qui entre, mais mérite un regard. */}
                                {aVerifier.length > 0 && (
                                    <div>
                                        <p className="text-on-surface-variant mb-1 text-[0.75rem] leading-4 font-medium">
                                            À vérifier — elles entrent quand même
                                        </p>
                                        <ul>
                                            {aVerifier.slice(0, 5).map((groupe) => (
                                                <li
                                                    key={groupe.cause}
                                                    className="border-outline-variant flex min-h-12 items-start gap-3 border-t py-2 first:border-t-0"
                                                >
                                                    <span className="bg-tint-ambre text-on-tint-ambre flex h-7 min-w-7 shrink-0 items-center justify-center rounded-[4px] px-1.5 text-[0.8125rem] leading-4 font-medium tabular-nums">
                                                        {groupe.lignes.length}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="text-on-surface text-ts-sub leading-ts-sub block">
                                                            {groupe.cause}
                                                        </span>
                                                        <span className="text-text-secondary text-ts-sub leading-ts-sub block tabular-nums">
                                                            {lignesEnMots(groupe.lignes)}
                                                        </span>
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Laissées de côté — rien à corriger : la cause, le compte, les lignes. */}
                                {deCote.length > 0 && (
                                    <div>
                                        <p className="text-on-surface-variant mb-1 text-[0.75rem] leading-4 font-medium">
                                            Laissées de côté — rien à corriger
                                        </p>
                                        <ul>
                                            {deCote.slice(0, 5).map((groupe) => (
                                                <li
                                                    key={groupe.cause}
                                                    className="border-outline-variant flex min-h-12 items-start gap-3 border-t py-2 first:border-t-0"
                                                >
                                                    <span className="bg-surface-container text-on-surface-variant flex h-7 min-w-7 shrink-0 items-center justify-center rounded-[4px] px-1.5 text-[0.8125rem] leading-4 font-medium tabular-nums">
                                                        {groupe.lignes.length}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="text-on-surface text-ts-sub leading-ts-sub block">
                                                            {groupe.cause}
                                                        </span>
                                                        <span className="text-text-secondary text-ts-sub leading-ts-sub block tabular-nums">
                                                            {lignesEnMots(groupe.lignes)}
                                                        </span>
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {rejectionNote && rejected.length > 0 && (
                                    <div className="bg-tint-ambre text-on-tint-ambre text-ts-sub leading-ts-sub flex gap-3 rounded-[4px] px-4 py-3">
                                        {rejectionNote}
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                </div>
            )}
        </FullScreenFormLayout>
    );
}

/** « Serial » trouvée sous « serial » : rien à dire de plus que « trouvée ». */
const normaliseEgal = (a: string, b: string) =>
    a.toLowerCase().replace(/[^a-z0-9]/g, '') === b.toLowerCase().replace(/[^a-z0-9]/g, '');

export default ReferentialImportTemplate;
