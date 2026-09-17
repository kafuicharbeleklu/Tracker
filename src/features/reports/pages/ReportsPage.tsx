import React, { useMemo, useState } from 'react';
import {
    ArrowLeft,
    CaretDown,
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
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { MEDIA } from '../../../constants/breakpoints';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { IconGestureSizeContext } from '../../../hooks/useIconGestureSize';
import { cn } from '../../../lib/utils';
import SelectField from '../../../components/ui/SelectField';
import Modal from '../../../components/ui/Modal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { APP_CONFIG } from '../../../config';
import { buildCsvLine } from '../../../lib/csv';
import { formatDate } from '../../../lib/financial';
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
const REPORT_ACTION_CLASS =
    'bg-surface-container text-on-surface hover:bg-surface-container-high min-h-12 flex-1 justify-center rounded-sm';

interface ReportsPageProps {
    /** `.tb` du `.top` — la page s'atteint depuis « Plus ». */
    onBack?: () => void;
}

const ReportsPage: React.FC<ReportsPageProps> = ({ onBack }) => {
    const isCompact = useMediaQuery(MEDIA.compact);
    const { showToast } = useToast();
    const { equipment, users, events } = useData();
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
            sousLigne: `${inventoryRows.length} ligne${inventoryRows.length > 1 ? 's' : ''} · ${inventoryColumnCount} colonnes`,
            vide: inventoryRows.length === 0,
        },
        {
            id: '2' as ReportId,
            glyph: UsersThree,
            titre: 'Historique par personne',
            sousLigne: selectedUser
                ? `${userMovementRows.length} mouvement${userMovementRows.length > 1 ? 's' : ''} · ${selectedUser.name}`
                : 'la personne se choisit dans l’aperçu',
            vide: userMovementRows.length === 0,
        },
        {
            id: '3' as ReportId,
            glyph: ClockCountdown,
            titre: 'Équipement vieillissant',
            sousLigne: `${agingRows.length} actif${agingRows.length > 1 ? 's' : ''} de plus de trois ans`,
            vide: agingRows.length === 0,
        },
        {
            id: '4' as ReportId,
            glyph: ShieldWarning,
            titre: 'Garanties qui expirent',
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
    /**
     * Le format demandé passe en tête : c'est lui qui portera le jaune, l'autre reste
     * à portée en neutre. Un ordre, pas deux boutons de même poids — on est venu pour
     * un format, on l'a dit sur la carte.
     */
    const orderedFormats: ExportFormat[] =
        preview?.format === 'pdf' ? ['pdf', 'csv'] : ['csv', 'pdf'];
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
                        'mb-4 flex flex-col',
                        isCompact
                            ? 'border-outline-variant bg-surface -mx-page-sm -mt-page-sm border-b px-4 pt-2 pb-3'
                            : '-mt-1',
                    )}
                >
                    <div className="flex min-h-12 items-center gap-1">
                        {/* Au bureau, pas de flèche : le titre s'y pose au bord, et la
                            barre latérale mène déjà partout. */}
                        {onBack && isCompact && (
                            <Button
                                variant="text"
                                iconOnly
                                aria-label="Retour"
                                onClick={onBack}
                                className="text-on-surface hover:bg-surface-container -ml-3 shrink-0 rounded-md"
                            >
                                <Icon glyph={ArrowLeft} size={24} />
                            </Button>
                        )}
                        <h1 className="font-brand text-on-surface min-w-0 flex-1 text-[28px] leading-8 font-semibold tracking-[-0.02em]">
                            {GLOSSARY.REPORTS}
                        </h1>
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
            <Reading>
                <section className="bg-surface rounded-lg px-5 py-2">
                    <div className="flex min-h-12 items-center justify-between gap-3 pt-2 pb-1">
                        <h3 className="text-on-surface text-[17px] leading-6 font-medium">
                            Les rapports
                        </h3>
                        <span className="text-text-muted text-[14px] leading-5 tabular-nums">
                            {rapports.length}
                        </span>
                    </div>

                    {rapports.map((rapport) => (
                        <div
                            key={rapport.id}
                            className="border-outline-variant flex min-h-16 items-center gap-3 border-t py-2"
                        >
                            <Button
                                variant="text"
                                onClick={() => setPreview({ id: rapport.id, format: 'csv' })}
                                className="flex h-auto min-h-0 min-w-0 flex-1 items-center justify-start gap-3 px-0 py-0 text-left font-normal hover:bg-transparent"
                            >
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
                                <span className="min-w-0 flex-1">
                                    <span
                                        className={cn(
                                            'block truncate text-[16px] leading-6',
                                            rapport.vide ? 'text-text-muted' : 'text-on-surface',
                                        )}
                                    >
                                        {rapport.titre}
                                    </span>
                                    <span className="text-text-muted block truncate text-[14px] leading-5">
                                        {rapport.sousLigne}
                                    </span>
                                </span>
                            </Button>

                            {canExport && !rapport.vide && (
                                <Button
                                    variant="text"
                                    iconOnly
                                    aria-label={`Exporter « ${rapport.titre} » en CSV`}
                                    onClick={() => handleExportCSV(rapport.id)}
                                    className="bg-surface-container text-on-surface hover:bg-surface-container-high -mr-1 h-11 max-h-11 min-h-11 w-11 shrink-0 rounded-[4px]"
                                >
                                    <Icon glyph={DownloadSimple} size={20} />
                                </Button>
                            )}
                        </div>
                    ))}

                    {/* `.emp` — le pied dit le format, et où trouver le reste. */}
                    <p className="border-outline-variant text-text-muted border-t pt-1 pb-3 text-[14px] leading-5">
                        Chaque export part en CSV ; le PDF et le choix de la personne s'ouvrent
                        depuis la rangée.
                    </p>
                </section>
            </Reading>

            {/* Modal d'aperçu d'un rapport (Planche 15.1 Colonne 4) */}
            {activePreview && (
                <Modal
                    isOpen={Boolean(preview)}
                    onClose={() => setPreview(null)}
                    title={activePreview.title}
                    /* `Modal` n'expose pas `className` : la largeur passe par `maxWidth`,
                       et le `max-w-2xl` posé ici n'a jamais rien borné. */
                    maxWidth="max-w-2xl"
                    footer={
                        <>
                            <Button variant="text" onClick={() => setPreview(null)}>
                                Fermer
                            </Button>
                            {canExport && activePreview.rows.length > 0 && (
                                <Button
                                    variant="filled"
                                    onClick={() =>
                                        preview?.format === 'pdf'
                                            ? handleExportPDF(activePreview.id)
                                            : handleExportCSV(activePreview.id)
                                    }
                                >
                                    Exporter
                                </Button>
                            )}
                        </>
                    }
                >
                    <div className="flex flex-col gap-4">
                        {/* Le rapport par personne se lit d'abord : on choisit qui, et l'aperçu
                            se refait sous le choix. La rangée de 15.5 n'a pas de place pour un
                            sélecteur, et c'est ici qu'il sert. */}
                        {preview?.id === '2' && (
                            <SelectField
                                name="report-user"
                                label="Personne"
                                options={userOptions}
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                            />
                        )}
                        <section className="bg-surface rounded-lg p-4">
                            <div className="mb-2 flex items-baseline justify-between gap-3">
                                <h3 className="text-body-medium text-on-surface font-semibold">
                                    Aperçu
                                </h3>
                                <span className="font-brand text-body-small text-on-surface-variant font-semibold tabular-nums">
                                    5 des {activePreview.rows.length} lignes
                                </span>
                            </div>

                            <div className="border-outline-variant overflow-x-auto rounded-md border">
                                <table className="text-body-small w-full border-collapse text-left">
                                    <thead className="bg-surface-container text-on-surface border-outline-variant border-b font-semibold">
                                        <tr>
                                            {previewSampleRows.length > 0 &&
                                                Object.keys(previewSampleRows[0]).map((h) => (
                                                    <th
                                                        key={h}
                                                        className="px-3 py-2 whitespace-nowrap"
                                                    >
                                                        {h}
                                                    </th>
                                                ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-outline-variant divide-y">
                                        {previewSampleRows.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-surface-container/50">
                                                {Object.values(row).map((val, cIdx) => (
                                                    <td
                                                        key={cIdx}
                                                        className="text-on-surface-variant px-3 py-2 whitespace-nowrap"
                                                    >
                                                        {String(val || '—')}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-body-small text-on-surface-variant mt-2">
                                Cinq lignes suffisent à vérifier qu’on exporte le bon rapport. Le
                                tableau glisse horizontalement si nécessaire.
                            </p>
                        </section>

                        <section className="bg-surface flex flex-col gap-3 rounded-lg p-4">
                            <h3 className="text-body-medium text-on-surface font-semibold">
                                Le fichier
                            </h3>
                            {/* `.arow` de la planche : le nom du fichier sur sa ligne, ce
                                qu'il pèse en dessous. Côte à côte, les deux se disputaient
                                la largeur et le nom se tronquait le premier. */}
                            <div className="flex flex-col gap-0.5">
                                <span className="text-body-medium text-on-surface font-medium">
                                    {activePreview.slug}_{new Date().toISOString().split('T')[0]}.
                                    {preview?.format ?? 'csv'}
                                </span>
                                <span className="text-body-small text-on-surface-variant tabular-nums">
                                    {activePreview.rows.length} lignes · {previewColumnCount}{' '}
                                    colonnes
                                    {preview?.format === 'pdf' ? '' : ' · séparateur virgule'}
                                </span>
                            </div>

                            {/* Sans la permission, les deux gestes sont **absents** — pas grisés :
                                une action qu'on ne peut pas faire n'a pas à occuper la place (15.1). */}
                            {/* Le format demandé depuis la carte porte le jaune ; l'autre reste
                                à portée, en neutre. Un seul jaune, et il suit ce qu'on est venu
                                chercher. */}
                            {canExport && activePreview.rows.length > 0 && (
                                <div className="border-outline-variant flex flex-col gap-2.5 border-t pt-2">
                                    {orderedFormats.map((format, index) => (
                                        <Button
                                            key={format}
                                            variant={index === 0 ? 'filled' : 'text'}
                                            className={
                                                index === 0
                                                    ? 'w-full justify-center'
                                                    : REPORT_ACTION_CLASS + ' w-full flex-none'
                                            }
                                            onClick={() =>
                                                format === 'pdf'
                                                    ? handleExportPDF(activePreview.id)
                                                    : handleExportCSV(activePreview.id)
                                            }
                                        >
                                            <Icon glyph={CaretDown} size={18} /> Exporter en{' '}
                                            {format.toUpperCase()}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </section>

                        {!canExport && (
                            <div className="bg-surface-container text-body-small text-on-surface-variant flex items-start gap-2 rounded-md p-3">
                                <Icon
                                    glyph={Warning}
                                    size={18}
                                    className="mt-0.5 shrink-0 text-[var(--tk-color-st-ambre)]"
                                />
                                <span>
                                    <strong>L’export est réservé.</strong> Sans la permission, les
                                    deux boutons sont absents — une action qu’on ne peut pas faire
                                    n’a pas à occuper la place.
                                </span>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </PageContainer>
    );
};

export default ReportsPage;
