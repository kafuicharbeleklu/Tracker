import React, { useMemo, useState } from 'react';
import { CaretDown, Warning } from '@phosphor-icons/react';
import { PageContainer } from '../../../components/layout/PageContainer';
import Reading from '../../../components/layout/Reading';
import { PageHeader } from '../../../components/layout/PageHeader';
import { GLOSSARY } from '../../../constants/glossary';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
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

const ReportExports: React.FC<{
    canExport: boolean;
    onOpen: (format: ExportFormat) => void;
}> = ({ canExport, onOpen }) => (
    <div className="flex items-center gap-2.5 pt-1">
        {canExport ? (
            (['csv', 'pdf'] as const).map((format) => (
                <Button
                    key={format}
                    variant="text"
                    className={REPORT_ACTION_CLASS}
                    onClick={() => onOpen(format)}
                >
                    <Icon glyph={CaretDown} size={18} />
                    {format.toUpperCase()}
                </Button>
            ))
        ) : (
            <Button variant="text" className={REPORT_ACTION_CLASS} onClick={() => onOpen('csv')}>
                Aperçu
            </Button>
        )}
    </div>
);

const ReportsPage = () => {
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
    const warrantyRows = useMemo(() => buildWarrantyReportRows(equipment, new Date()), [equipment]);

    const dateIn90Days = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 90);
        return formatFrenchDate(d);
    }, []);

    const oldestAgingYears = useMemo(() => {
        if (agingRows.length === 0) return 0;
        const now = Date.now();
        let maxYears = 3;
        equipment.forEach((item) => {
            if (item.purchaseDate) {
                const age = (now - new Date(item.purchaseDate).getTime()) / (365.25 * 86400000);
                if (age > maxYears) maxYears = Math.floor(age);
            }
        });
        return maxYears;
    }, [agingRows, equipment]);

    const userOldestEventDate = useMemo(() => {
        if (!selectedUser || userMovementRows.length === 0) return null;
        const userEvents = events.filter((e) => e.userId === selectedUser.id);
        if (userEvents.length === 0) return null;
        const dates = userEvents
            .map((e) => new Date(e.timestamp || '').getTime())
            .filter((t) => !Number.isNaN(t));
        if (dates.length === 0) return null;
        const minDate = new Date(Math.min(...dates));
        return formatFrenchDate(minDate);
    }, [selectedUser, userMovementRows, events]);

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

            const pageCount = (
                doc.internal as { getNumberOfPages: () => number }
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
    /*
      Le nombre de colonnes de la carte d'inventaire — **compté sur la donnée**, comme
      celui de l'aperçu. Il était écrit « 11 colonnes » en dur, à deux lignes d'un
      commentaire qui affirmait le contraire : la carte aurait continué d'annoncer 11
      si le rapport en gagnait une douzième.
      Les six premières colonnes sont nommées ; le reste tient dans un « +N » qui se
      compte lui aussi.
    */
    const INVENTORY_NAMED_COLUMNS = [
        'Réf.',
        'Modèle',
        'N° de série',
        'Statut',
        'Détenteur',
        'Emplacement',
    ];
    const inventoryColumnCount =
        inventoryRows.length > 0 ? Object.keys(inventoryRows[0]).length : 0;
    const inventoryExtraColumns = Math.max(
        0,
        inventoryColumnCount - INVENTORY_NAMED_COLUMNS.length,
    );

    return (
        <PageContainer>
            <PageHeader
                title={GLOSSARY.REPORTS}
                subtitle="Consultez et exportez les rapports opérationnels du parc."
                breadcrumb={GLOSSARY.REPORTS}
            />

            {/* Les cartes de rapport tiennent dans la mesure de lecture (960 px, §2.43) :
                deux colonnes de 468 px au-dela de 840, une seule en deca - `medium` reste
                a une colonne, le rail ne laisse pas la place. */}
            <Reading>
                <div className="expanded:grid-cols-2 grid grid-cols-1 gap-5">
                    {/* Carte 1 : Inventaire complet */}
                    <section className="bg-surface shadow-elevation-1 flex flex-col justify-between gap-3 rounded-lg p-4">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-body-medium text-on-surface font-medium">
                                Inventaire complet
                            </span>
                            <span className="text-body-small text-on-surface-variant">
                                Tous les équipements et leurs détails, à la date d’aujourd’hui.
                            </span>
                            <div className="mt-1 flex items-baseline gap-2">
                                <b className="font-brand text-on-surface text-[20px] font-semibold tabular-nums">
                                    {inventoryRows.length}
                                </b>
                                <span className="text-body-small text-on-surface-variant">
                                    lignes · {inventoryColumnCount} colonnes
                                </span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                                {[
                                    ...INVENTORY_NAMED_COLUMNS,
                                    ...(inventoryExtraColumns > 0
                                        ? [`+${inventoryExtraColumns}`]
                                        : []),
                                ].map((col) => (
                                    <code
                                        key={col}
                                        className="bg-surface-container text-on-surface-variant rounded-xs px-1.5 py-0.5 font-mono text-[11px]"
                                    >
                                        {col}
                                    </code>
                                ))}
                            </div>
                        </div>

                        {inventoryRows.length > 0 && (
                            <ReportExports
                                canExport={canExport}
                                onOpen={(format) => setPreview({ id: '1', format })}
                            />
                        )}
                    </section>

                    {/* Carte 2 : Historique par personne */}
                    <section className="bg-surface shadow-elevation-1 flex flex-col justify-between gap-3 rounded-lg p-4">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-body-medium text-on-surface font-medium">
                                Historique par personne
                            </span>
                            <span className="text-body-small text-on-surface-variant">
                                Toutes les remises et restitutions d’une personne.
                            </span>
                            <div className="mt-1">
                                <SelectField
                                    name="report-user"
                                    label="Personne"
                                    options={userOptions}
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                />
                            </div>
                            <div className="mt-1 flex items-baseline gap-2">
                                <b className="font-brand text-on-surface text-[20px] font-semibold tabular-nums">
                                    {userMovementRows.length}
                                </b>
                                <span className="text-body-small text-on-surface-variant">
                                    {userOldestEventDate
                                        ? `mouvements depuis le ${userOldestEventDate}`
                                        : 'mouvements enregistrés'}
                                </span>
                            </div>
                        </div>

                        {userMovementRows.length > 0 && (
                            <ReportExports
                                canExport={canExport}
                                onOpen={(format) => setPreview({ id: '2', format })}
                            />
                        )}
                    </section>

                    {/* Carte 3 : Équipement vieillissant */}
                    <section className="bg-surface shadow-elevation-1 flex flex-col justify-between gap-3 rounded-lg p-4">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-body-medium text-on-surface font-medium">
                                Équipement vieillissant
                            </span>
                            <span className="text-body-small text-on-surface-variant">
                                Plus de trois ans de service — pour la planification de
                                l’amortissement.
                            </span>
                            <div className="mt-1 flex items-baseline gap-2">
                                <b className="font-brand text-on-surface text-[20px] font-semibold tabular-nums">
                                    {agingRows.length}
                                </b>
                                <span className="text-body-small text-on-surface-variant">
                                    {oldestAgingYears > 0
                                        ? `équipements · le plus ancien a ${oldestAgingYears} ans`
                                        : 'équipements identifiés'}
                                </span>
                            </div>
                        </div>

                        {agingRows.length > 0 && (
                            <ReportExports
                                canExport={canExport}
                                onOpen={(format) => setPreview({ id: '3', format })}
                            />
                        )}
                    </section>

                    {/* Carte 4 : Garanties qui expirent */}
                    <section className="bg-surface shadow-elevation-1 flex flex-col justify-between gap-3 rounded-lg p-4">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-body-medium text-on-surface font-medium">
                                Garanties qui expirent
                            </span>
                            <span className="text-body-small text-on-surface-variant">
                                Dans les 90 prochains jours.
                            </span>
                            <div className="mt-1 flex items-baseline gap-2">
                                <b
                                    className={`font-brand text-[20px] font-semibold tabular-nums ${
                                        warrantyRows.length === 0
                                            ? 'text-on-surface-variant'
                                            : 'text-on-surface'
                                    }`}
                                >
                                    {warrantyRows.length}
                                </b>
                                <span className="text-body-small text-on-surface-variant">
                                    équipement{warrantyRows.length > 1 ? 's' : ''} concerné
                                    {warrantyRows.length > 1 ? 's' : ''} d’ici au {dateIn90Days}
                                </span>
                            </div>
                            {warrantyRows.length === 0 && (
                                <p className="text-body-small text-on-surface-variant mt-1">
                                    Rien à exporter. La carte le dit <strong>avant</strong> le clic,
                                    plutôt qu’un message après.
                                </p>
                            )}
                        </div>

                        {warrantyRows.length > 0 && (
                            <ReportExports
                                canExport={canExport}
                                onOpen={(format) => setPreview({ id: '4', format })}
                            />
                        )}
                    </section>
                </div>
            </Reading>

            {/* Modal d'aperçu d'un rapport (Planche 15.1 Colonne 4) */}
            {activePreview && (
                <Modal
                    isOpen={Boolean(preview)}
                    onClose={() => setPreview(null)}
                    title={activePreview.title}
                    className="max-w-2xl"
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
                        <section className="bg-surface shadow-elevation-1 rounded-lg p-4">
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

                        <section className="bg-surface shadow-elevation-1 flex flex-col gap-3 rounded-lg p-4">
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
