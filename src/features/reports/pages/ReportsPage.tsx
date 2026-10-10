import React, { useMemo, useState } from 'react';
import {
    ClockCountdown,
    DownloadSimple,
    Laptop,
    ShieldWarning,
    UsersThree,
    Warning,
} from '@phosphor-icons/react';
import { PageContainer } from '../../../components/layout/PageContainer';
import Reading from '../../../components/layout/Reading';
import { GLOSSARY } from '../../../constants/glossary';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import { useJournalComplet } from '../../../hooks/useJournalComplet';
import Button from '../../../components/ui/Button';
import FlecheDeRetour from '../../../components/ui/FlecheDeRetour';
import Icon from '../../../components/ui/Icon';
import { MEDIA } from '../../../constants/breakpoints';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { IconGestureSizeContext } from '../../../hooks/useIconGestureSize';
import { cn } from '../../../lib/utils';
import SelectField from '../../../components/ui/SelectField';
import Modal from '../../../components/ui/Modal';
import { FormWarn, Segmented } from '../../../components/ui/FormParts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { APP_CONFIG } from '../../../config';
import { buildCsvLine } from '../../../lib/csv';
import { formatDate } from '../../../lib/financial';
import { useEntree } from '../../../hooks/useEntree';
import {
    buildAgingReportRows,
    buildInventoryReportRows,
    buildUserMovementReportRows,
    buildWarrantyReportRows,
} from '../../../lib/reports';

type ReportId = '1' | '2' | '3' | '4';

/** CSV ou PDF — le format que l'aperçu prépare, et que son geste de pied exécute. */
type ExportFormat = 'csv' | 'pdf';

const slugify = (value: string) => value.replace(/\s+/g, '_').toLowerCase();

const formatFrenchDate = (date: Date): string => {
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
};

/**
 * `.exp` — **le pied d'une carte de rapport, et il porte deux gestes égaux.**
 *
 * La planche pose `.exp{display:flex;gap:10px}` avec `.exp>.btn{flex:1}`, en `.btn-o`
 * — le creux de la page pour fond, pas de surface inversée, pas de jaune. Le code en
 * mettait trois, de trois tailles : un « Aperçu » sombre qui écrasait la carte, puis
 * deux boutons contournés au rabais. Trois poids pour des gestes qui n'en ont qu'un.
 *
 * **Un rapport sans lignes n'a pas de bouton d'export** — la carte le dit à la place,
 * avant le clic. Et sans la permission, les deux gestes sont **absents** : reste
 * l'aperçu seul, pour que la lecture d'un rapport ne dépende pas du droit de
 * l'emporter.
 */

interface ReportsPageProps {
    /** `.tb` du `.top` — la page s'atteint depuis « Plus ». */
    onBack?: () => void;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ onBack }) => {
    const entree = useEntree();
    const isCompact = useMediaQuery(MEDIA.compact);
    const { showToast } = useToast();
    const { equipment, users, events } = useData();
    useJournalComplet();
    const { permissions } = useAccessControl();
    const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || '');
    /**
     * **Le rapport qu'on regarde avant de l'exporter**, et dans quel format.
     *
     * La planche 15.1 ne met que **deux gestes** sur une carte de rapport — `CSV` et
     * `PDF`, à parts égales — et dessine à côté un écran entier, « un rapport avant
     * l'export », dont le pied dit *Exporter*. Les deux se répondent : le geste de la
     * carte ne télécharge pas, il **ouvre le rapport sur le format demandé**, et c'est
     * là qu'on voit cinq lignes avant d'engager le fichier. C'est ce qui donne son
     * emploi à la colonne 4 — sinon elle ne serait atteignable par rien.
     */
    const [preview, setPreview] = useState<{ id: ReportId; format: ExportFormat } | null>(null);

    const canExport = permissions.canExportReports;

    const userOptions = useMemo(
        () =>
            [...users]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((user) => ({ value: user.id, label: user.name })),
        [users],
    );

    const selectedUser = users.find((user) => user.id === selectedUserId);

    // Données des rapports
    const inventoryRows = useMemo(() => buildInventoryReportRows(equipment), [equipment]);
    const userMovementRows = useMemo(
        () => (selectedUser ? buildUserMovementReportRows(events, selectedUser.id) : []),
        [events, selectedUser],
    );
    const agingRows = useMemo(() => buildAgingReportRows(equipment, new Date()), [equipment]);
    /* Le nombre de colonnes de l'inventaire — **compté sur la donnée**, jamais écrit en dur :
       la sous-ligne de sa rangée l'annonce (15.5). */
    const inventoryColumnCount =
        inventoryRows.length > 0 ? Object.keys(inventoryRows[0]).length : 0;
    const warrantyRows = useMemo(() => buildWarrantyReportRows(equipment, new Date()), [equipment]);

    const dateIn90Days = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 90);
        return formatFrenchDate(d);
    }, []);

    const getReportDetails = (reportId: ReportId) => {
        switch (reportId) {
            case '1':
                return {
                    id: '1' as ReportId,
                    title: 'Inventaire complet',
                    description: 'Tous les équipements et leurs détails, à la date d’aujourd’hui.',
                    rows: inventoryRows,
                    slug: 'inventaire',
                    columns: [
                        'Réf.',
                        'Modèle',
                        'N° de série',
                        'Statut',
                        'Détenteur',
                        'Emplacement',
                        '+5',
                    ],
                };
            case '2':
                return {
                    id: '2' as ReportId,
                    title: 'Historique par personne',
                    description: 'Toutes les remises et restitutions d’une personne.',
                    rows: userMovementRows,
                    slug: `historique_${slugify(selectedUser?.name || 'utilisateur')}`,
                    columns: ['Date', 'Type de mouvement', 'Équipement', 'Réf.', 'Opérateur'],
                };
            case '3':
                return {
                    id: '3' as ReportId,
                    title: 'Équipement vieillissant',
                    description:
                        'Plus de trois ans de service — pour la planification de l’amortissement.',
                    rows: agingRows,
                    slug: 'equipement_vieillissant',
                    columns: [
                        'Réf.',
                        'Modèle',
                        'Date d’acquisition',
                        'Âge (ans)',
                        'Statut',
                        'Détenteur',
                    ],
                };
            case '4':
                return {
                    id: '4' as ReportId,
                    title: 'Garanties qui expirent',
                    description: 'Dans les 90 prochains jours.',
                    rows: warrantyRows,
                    slug: 'expiration_garanties',
                    columns: [
                        'Réf.',
                        'Modèle',
                        'Date d’expiration',
                        'Jours restants',
                        'Fournisseur',
                    ],
                };
        }
    };

    const handleExportCSV = (reportId: ReportId) => {
        const report = getReportDetails(reportId);
        if (report.rows.length === 0) {
            showToast('Aucune donnée à exporter pour ce rapport.', 'info');
            return;
        }

        const filename = `${report.slug}_${new Date().toISOString().split('T')[0]}.csv`;
        const headers = Object.keys(report.rows[0]);
        const csvContent = [
            buildCsvLine(headers, ','),
            ...report.rows.map((row) => buildCsvLine(Object.values(row), ',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast(`Export CSV « ${filename} » téléchargé`, 'success');
    };

    const handleExportPDF = (reportId: ReportId) => {
        const report = getReportDetails(reportId);
        if (report.rows.length === 0) {
            showToast('Aucune donnée à exporter pour ce rapport.', 'info');
            return;
        }

        showToast('Génération du PDF en cours...', 'info');

        try {
            const doc = new jsPDF();
            const date = formatDate();
            const filename = `${report.slug}_${new Date().toISOString().split('T')[0]}.pdf`;
            const fullTitle =
                reportId === '2' && selectedUser
                    ? `${report.title} — ${selectedUser.name}`
                    : report.title;

            // En-tête
            doc.setFontSize(20);
            doc.setTextColor(33, 37, 41);
            doc.text(fullTitle, 14, 22);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Généré le : ${date} | ${APP_CONFIG.appName}`, 14, 28);

            autoTable(doc, {
                head: [Object.keys(report.rows[0])],
                body: report.rows.map((row) => Object.values(row).map(String)),
                startY: 35,
                theme: 'grid',
                headStyles: {
                    fillColor: [253, 201, 16],
                    textColor: [26, 25, 23],
                    fontStyle: 'bold',
                },
                styles: { fontSize: 8, cellPadding: 3 },
                alternateRowStyles: { fillColor: [244, 242, 239] },
            });

            /* `jspdf` ne déclare pas `getNumberOfPages` sur `internal` : la conversion
               passe donc par `unknown`, comme TypeScript le demande entre deux formes
               qui ne se recouvrent pas. La méthode existe bien à l'exécution. */
            const pageCount = (
                doc.internal as unknown as { getNumberOfPages: () => number }
            ).getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(
                    `Page ${i} sur ${pageCount}`,
                    doc.internal.pageSize.width - 20,
                    doc.internal.pageSize.height - 10,
                    { align: 'right' },
                );
            }

            doc.save(filename);
            showToast(`PDF « ${filename} » téléchargé avec succès`, 'success');
        } catch (error) {
            console.error(error);
            showToast('Erreur lors de la génération du PDF', 'error');
        }
    };

    /**
     * Les quatre rapports de 15.5, dans l'ordre de la planche. Ce que chacun contient se lit
     * dans sa sous-ligne — le compte et les colonnes —, et celui qui n'a rien à exporter le
     * dit **là**, plutôt qu'en message après le clic.
     */
    const rapports = [
        {
            id: '1' as ReportId,
            glyph: Laptop,
            titre: 'Inventaire complet',
            contenu: 'Chaque actif, son état, son porteur et son lieu.',
            sousLigne: `${inventoryRows.length} ligne${inventoryRows.length > 1 ? 's' : ''} · ${inventoryColumnCount} colonnes`,
            vide: inventoryRows.length === 0,
        },
        {
            id: '2' as ReportId,
            glyph: UsersThree,
            titre: 'Historique par personne',
            contenu: 'Ce qu’une personne a reçu, rendu et signé.',
            sousLigne: selectedUser
                ? `${userMovementRows.length} mouvement${userMovementRows.length > 1 ? 's' : ''} · ${selectedUser.name}`
                : 'la personne se choisit dans l’aperçu',
            vide: userMovementRows.length === 0,
        },
        {
            id: '3' as ReportId,
            glyph: ClockCountdown,
            titre: 'Équipement vieillissant',
            contenu: 'Les actifs à prévoir au renouvellement.',
            sousLigne: `${agingRows.length} actif${agingRows.length > 1 ? 's' : ''} de plus de trois ans`,
            vide: agingRows.length === 0,
        },
        {
            id: '4' as ReportId,
            glyph: ShieldWarning,
            titre: 'Garanties qui expirent',
            contenu: 'Ce qu’il faut faire réparer tant que c’est couvert.',
            sousLigne:
                warrantyRows.length > 0
                    ? `${warrantyRows.length} équipement${warrantyRows.length > 1 ? 's' : ''} d’ici au ${dateIn90Days}`
                    : 'aucune dans les 90 jours · rien à exporter',
            vide: warrantyRows.length === 0,
        },
    ];

    const activePreview = preview ? getReportDetails(preview.id) : null;
    const previewSampleRows = activePreview?.rows.slice(0, 5) || [];
    /** Le nombre de colonnes du fichier — la planche le pose a cote du nombre de lignes :
     *  « 1 284 lignes · 11 colonnes · separateur virgule ». Il se compte sur la donnee. */
    const previewColumnCount =
        previewSampleRows.length > 0 ? Object.keys(previewSampleRows[0]).length : 0;
    return (
        <PageContainer>
            {/*
              **Le `.top` des destinations**, celui des douze listes : fond de surface, un
              filet dessous, intérieur `8 / 16 / 12`, titre en **28 sur 32**.

              La page portait le seul en-tête à trois étages du produit — un fil d'Ariane
              « Rapports » au-dessus d'un titre « Rapports » de 30, lui-même sous une barre
              du haut qui écrivait « Rapports » en 18. Trois fois le même mot, à trois
              mesures dont deux que l'échelle ne déclare pas.
            */}
            {/* Au-delà de 600, **l'en-tête du bureau** (17.11) : sur le canevas, sans filet, les
                gestes d'icône en carrés de 40. Le bloc blanc du téléphone y faisait une seconde
                surface au-dessus des cartes (13/09). */}
            <IconGestureSizeContext.Provider value={isCompact ? 48 : 40}>
                <div
                    className={cn(
                        /* L'en-tête **reste** quand les rapports défilent (17.8) ; au
                           bureau il reprend la marge du haut en padding, comme Finances. */
                        'sticky top-0 z-20 mb-4 flex flex-col',
                        isCompact
                            ? 'border-outline-variant bg-surface -mx-page-sm -mt-page-sm border-b px-4 pt-2 pb-3'
                            : 'bg-background -mt-page pt-5',
                    )}
                >
                    {/* Le titre suit la colonne centrée des rapports (23/09). */}
                    <div
                        className={cn(
                            'large:mx-auto large:w-full large:max-w-[63rem] flex items-center gap-1',
                            isCompact ? 'min-h-12' : 'min-h-[52px]',
                        )}
                    >
                        {/* Au bureau, pas de flèche : le titre s'y pose au bord, et la
                            barre latérale mène déjà partout. */}
                        {onBack && (
                            <FlecheDeRetour
                                onBack={onBack}
                                compact={isCompact}
                                /* 8 jusqu'au titre, comme les listes : la rangée n'en met que 4. */
                                className={isCompact ? undefined : 'mr-1'}
                            />
                        )}
                        <h1 className="font-brand text-on-surface text-ts-page leading-ts-page min-w-0 shrink font-semibold tracking-[-0.02em]">
                            {GLOSSARY.REPORTS}
                        </h1>
                        {/* Le compte à côté du titre, comme toutes les listes (24/09). */}
                        <span
                            className={cn(
                                'text-text-muted min-w-0 flex-1 truncate pt-1.5 leading-4 tabular-nums',
                                isCompact ? 'text-[0.75rem]' : 'ml-3 text-[0.8125rem]',
                            )}
                        >
                            {rapports.length} exports fixes
                        </span>
                    </div>
                </div>
            </IconGestureSizeContext.Provider>

            {/*
              `.card` de 15.5 — **une rangée par rapport, pas une carte** : la vignette, le nom,
              puis le compte et les colonnes en sous-ligne, et l'export au bout, 44 sur le creux.
              Celui qui n'a rien à exporter le dit dans sa sous-ligne et perd son bouton
              (`.lrow.void` : titre et vignette en encre secondaire). Le pied rappelle le format.

              **Ce que la planche ne dessine pas reste joignable par la rangée** : elle ouvre
              l'aperçu, où vivent le PDF et le choix de la personne. 15.5 ne connaît ni l'un ni
              l'autre — elle date d'avant le rapport par personne —, et une planche ne retire pas
              une fonction qu'elle n'a jamais eue à dessiner (arbitrage du 16/09).
            */}
            <Reading desk>
                {/* **Un rapport est une carte, à toutes les largeurs** (23/09). La liste de 15.5
                posait quatre rangées de 64 dans une carte de 1 008, avec un seul geste —
                télécharger le CSV — et renvoyait le PDF « depuis la rangée ». Les quatre rapports
                passent en grille de deux : ce qu'il contient, en une ligne, son compte, puis **les
                deux gestes de 15.1 à parts égales**, CSV et PDF, qui ouvrent l'aperçu sur le format
                demandé. Celui qui n'a rien à exporter s'éteint et le dit à la place des gestes. */}
                <ul
                    className={cn(
                        'medium:grid-cols-2 grid grid-cols-1 gap-4',
                        entree && 'mvt-cascade-cartes',
                    )}
                >
                    {rapports.map((rapport) => (
                        <li
                            key={rapport.id}
                            className="rounded-card bg-surface flex min-h-44 flex-col gap-4 p-4"
                        >
                            <div className="flex items-start gap-3">
                                <span
                                    className={cn(
                                        'rounded-vignette bg-surface-container flex h-10 w-10 shrink-0 items-center justify-center',
                                        rapport.vide
                                            ? 'text-text-muted'
                                            : 'text-on-surface-variant',
                                    )}
                                >
                                    <Icon glyph={rapport.glyph} size={20} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <h3
                                        className={cn(
                                            'text-ts-head leading-ts-head truncate font-medium',
                                            rapport.vide ? 'text-text-muted' : 'text-on-surface',
                                        )}
                                    >
                                        {rapport.titre}
                                    </h3>
                                    <p className="text-on-surface-variant text-ts-sub leading-ts-sub mt-0.5">
                                        {rapport.contenu}
                                    </p>
                                </div>
                            </div>
                            <p className="text-text-muted mt-auto text-[0.75rem] leading-4 tabular-nums">
                                {rapport.sousLigne}
                            </p>
                            {canExport && !rapport.vide && (
                                <div className="grid grid-cols-2 gap-3">
                                    {(['csv', 'pdf'] as ExportFormat[]).map((format) => (
                                        <Button
                                            key={format}
                                            variant="ghost"
                                            icon={<Icon glyph={DownloadSimple} size={20} />}
                                            onClick={() => setPreview({ id: rapport.id, format })}
                                            aria-label={`Exporter « ${rapport.titre} » en ${format.toUpperCase()}`}
                                        >
                                            {format.toUpperCase()}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </Reading>

            {/* Modal d'aperçu d'un rapport (Planche 15.1 Colonne 4) */}
            {activePreview && (
                /* **L'aperçu d'un export, un seul geste** (24/09). La boîte répétait l'acte
                   trois fois — « Exporter en PDF », « Exporter en CSV », puis « Exporter » au
                   pied — et gardait les styles d'avant le système (13/600, en-têtes gras).
                   Le format se choisit en deux crans, le pied porte le seul verbe, et
                   l'aperçu s'élargit au bureau pour que ses colonnes tiennent sans glisser. */
                <Modal
                    isOpen={Boolean(preview)}
                    onClose={() => setPreview(null)}
                    title={activePreview.title}
                    maxWidth="max-w-4xl"
                    footer={
                        <>
                            <Button variant="outlined" onClick={() => setPreview(null)}>
                                Fermer
                            </Button>
                            {canExport && activePreview.rows.length > 0 && (
                                <Button
                                    variant="filled"
                                    icon={<Icon glyph={DownloadSimple} size={20} />}
                                    onClick={() =>
                                        preview?.format === 'pdf'
                                            ? handleExportPDF(activePreview.id)
                                            : handleExportCSV(activePreview.id)
                                    }
                                >
                                    Exporter en {(preview?.format ?? 'csv').toUpperCase()}
                                </Button>
                            )}
                        </>
                    }
                >
                    <div className="flex flex-col gap-5">
                        {/* Le rapport par personne se lit d'abord : on choisit qui, et l'aperçu
                            se refait sous le choix. */}
                        {preview?.id === '2' && (
                            <SelectField
                                name="report-user"
                                label="Personne"
                                options={userOptions}
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                            />
                        )}

                        <div>
                            <div className="mb-2 flex items-baseline justify-between gap-3">
                                <p className="text-on-surface text-ts-sub leading-ts-sub font-medium">
                                    Aperçu
                                </p>
                                <span className="text-text-muted text-[0.75rem] leading-4 tabular-nums">
                                    {Math.min(5, activePreview.rows.length)} des{' '}
                                    {activePreview.rows.length} lignes
                                </span>
                            </div>
                            <div className="border-outline-variant overflow-x-auto rounded-md border">
                                <table className="w-full border-collapse text-left text-[0.8125rem] leading-5">
                                    <thead className="bg-surface-container text-on-surface-variant border-outline-variant border-b text-[0.75rem] leading-4 font-medium">
                                        <tr>
                                            {previewSampleRows.length > 0 &&
                                                Object.keys(previewSampleRows[0]).map((h) => (
                                                    <th
                                                        key={h}
                                                        className="px-3 py-2.5 whitespace-nowrap"
                                                    >
                                                        {h}
                                                    </th>
                                                ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-outline-variant divide-y">
                                        {previewSampleRows.map((row, idx) => (
                                            <tr key={idx}>
                                                {Object.values(row).map((val, cIdx) => (
                                                    <td
                                                        key={cIdx}
                                                        className="text-on-surface px-3 py-2 whitespace-nowrap tabular-nums"
                                                    >
                                                        {String(val || '—')}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="medium:flex-row medium:items-center flex flex-col gap-3">
                            <div className="min-w-0 flex-1">
                                <p className="text-on-surface text-ts-body leading-ts-body truncate font-medium">
                                    {activePreview.slug}_{new Date().toISOString().split('T')[0]}.
                                    {preview?.format ?? 'csv'}
                                </p>
                                <p className="text-on-surface-variant text-ts-sub leading-ts-sub tabular-nums">
                                    {activePreview.rows.length} lignes · {previewColumnCount}{' '}
                                    colonnes
                                    {preview?.format === 'pdf' ? '' : ' · séparateur virgule'}
                                </p>
                            </div>
                            {canExport && activePreview.rows.length > 0 && (
                                <div className="medium:w-56 w-full shrink-0">
                                    <Segmented
                                        label="Format"
                                        value={preview?.format ?? 'csv'}
                                        onChange={(format) =>
                                            preview && setPreview({ ...preview, format })
                                        }
                                        options={[
                                            { value: 'csv', label: 'CSV' },
                                            { value: 'pdf', label: 'PDF' },
                                        ]}
                                    />
                                </div>
                            )}
                        </div>

                        {!canExport && (
                            <FormWarn glyph={Warning}>
                                L’export est réservé aux gestionnaires.
                            </FormWarn>
                        )}
                    </div>
                </Modal>
            )}
        </PageContainer>
    );
};

export default ReportsPage;
