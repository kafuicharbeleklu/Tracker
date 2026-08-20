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

const slugify = (value: string) => value.replace(/\s+/g, '_').toLowerCase();

const formatFrenchDate = (date: Date): string => {
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
};

const ReportsPage = () => {
    const { showToast } = useToast();
    const { equipment, users, events } = useData();
    const { permissions } = useAccessControl();
    const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || '');
    const [previewReportId, setPreviewReportId] = useState<ReportId | null>(null);

    const canExport = permissions.canExportReports;

    const userOptions = useMemo(
        () =>
            [...users]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((user) => ({ value: user.id, label: user.name })),
        [users]
    );

    const selectedUser = users.find((user) => user.id === selectedUserId);

    // Données des rapports
    const inventoryRows = useMemo(() => buildInventoryReportRows(equipment), [equipment]);
    const userMovementRows = useMemo(
        () => (selectedUser ? buildUserMovementReportRows(events, selectedUser.id) : []),
        [events, selectedUser]
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
                    columns: ['Réf.', 'Modèle', 'N° de série', 'Statut', 'Détenteur', 'Emplacement', '+5'],
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
                    description: 'Plus de trois ans de service — pour la planification de l’amortissement.',
                    rows: agingRows,
                    slug: 'equipement_vieillissant',
                    columns: ['Réf.', 'Modèle', 'Date d’acquisition', 'Âge (ans)', 'Statut', 'Détenteur'],
                };
            case '4':
                return {
                    id: '4' as ReportId,
                    title: 'Garanties qui expirent',
                    description: 'Dans les 90 prochains jours.',
                    rows: warrantyRows,
                    slug: 'expiration_garanties',
                    columns: ['Réf.', 'Modèle', 'Date d’expiration', 'Jours restants', 'Fournisseur'],
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
                reportId === '2' && selectedUser ? `${report.title} — ${selectedUser.name}` : report.title;

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
                headStyles: { fillColor: [253, 201, 16], textColor: [26, 25, 23], fontStyle: 'bold' },
                styles: { fontSize: 8, cellPadding: 3 },
                alternateRowStyles: { fillColor: [244, 242, 239] },
            });

            const pageCount = (doc.internal as { getNumberOfPages: () => number }).getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(
                    `Page ${i} sur ${pageCount}`,
                    doc.internal.pageSize.width - 20,
                    doc.internal.pageSize.height - 10,
                    { align: 'right' }
                );
            }

            doc.save(filename);
            showToast(`PDF « ${filename} » téléchargé avec succès`, 'success');
        } catch (error) {
            console.error(error);
            showToast('Erreur lors de la génération du PDF', 'error');
        }
    };

    const activePreview = previewReportId ? getReportDetails(previewReportId) : null;
    const previewSampleRows = activePreview?.rows.slice(0, 5) || [];
    /** Le nombre de colonnes du fichier — la planche le pose a cote du nombre de lignes :
     *  « 1 284 lignes · 11 colonnes · separateur virgule ». Il se compte sur la donnee. */
    const previewColumnCount = previewSampleRows.length > 0 ? Object.keys(previewSampleRows[0]).length : 0;
    /*
      Le nombre de colonnes de la carte d'inventaire — **compté sur la donnée**, comme
      celui de l'aperçu. Il était écrit « 11 colonnes » en dur, à deux lignes d'un
      commentaire qui affirmait le contraire : la carte aurait continué d'annoncer 11
      si le rapport en gagnait une douzième.
      Les six premières colonnes sont nommées ; le reste tient dans un « +N » qui se
      compte lui aussi.
    */
    const INVENTORY_NAMED_COLUMNS = ['Réf.', 'Modèle', 'N° de série', 'Statut', 'Détenteur', 'Emplacement'];
    const inventoryColumnCount = inventoryRows.length > 0 ? Object.keys(inventoryRows[0]).length : 0;
    const inventoryExtraColumns = Math.max(0, inventoryColumnCount - INVENTORY_NAMED_COLUMNS.length);

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
            <div className="grid grid-cols-1 expanded:grid-cols-2 gap-5">
                {/* Carte 1 : Inventaire complet */}
                <section className="rounded-lg bg-surface p-4 shadow-elevation-1 flex flex-col justify-between gap-3">
                    <div className="flex flex-col gap-1.5">
                        <span className="font-brand text-body-large font-semibold text-on-surface">
                            Inventaire complet
                        </span>
                        <span className="text-body-small text-on-surface-variant">
                            Tous les équipements et leurs détails, à la date d’aujourd’hui.
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <b className="font-brand text-[20px] font-semibold tabular-nums text-on-surface">
                                {inventoryRows.length}
                            </b>
                            <span className="text-body-small text-on-surface-variant">
                                lignes · {inventoryColumnCount} colonnes
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {[
                                ...INVENTORY_NAMED_COLUMNS,
                                ...(inventoryExtraColumns > 0 ? [`+${inventoryExtraColumns}`] : []),
                            ].map(
                                (col) => (
                                    <code
                                        key={col}
                                        className="rounded-xs bg-surface-container px-1.5 py-0.5 font-mono text-[11px] text-on-surface-variant"
                                    >
                                        {col}
                                    </code>
                                )
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-outline-variant">
                        <Button
                            variant="tonal"
                            size="sm"
                            className="flex-1"
                            onClick={() => setPreviewReportId('1')}
                        >
                            Aperçu
                        </Button>
                        {canExport && inventoryRows.length > 0 && (
                            <>
                                <Button variant="outlined" size="sm" onClick={() => handleExportCSV('1')}>
                                    <Icon glyph={CaretDown} size={18} /> CSV
                                </Button>
                                <Button variant="outlined" size="sm" onClick={() => handleExportPDF('1')}>
                                    <Icon glyph={CaretDown} size={18} /> PDF
                                </Button>
                            </>
                        )}
                    </div>
                </section>

                {/* Carte 2 : Historique par personne */}
                <section className="rounded-lg bg-surface p-4 shadow-elevation-1 flex flex-col justify-between gap-3">
                    <div className="flex flex-col gap-1.5">
                        <span className="font-brand text-body-large font-semibold text-on-surface">
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
                        <div className="flex items-baseline gap-2 mt-1">
                            <b className="font-brand text-[20px] font-semibold tabular-nums text-on-surface">
                                {userMovementRows.length}
                            </b>
                            <span className="text-body-small text-on-surface-variant">
                                {userOldestEventDate
                                    ? `mouvements depuis le ${userOldestEventDate}`
                                    : 'mouvements enregistrés'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-outline-variant">
                        <Button
                            variant="tonal"
                            size="sm"
                            className="flex-1"
                            onClick={() => setPreviewReportId('2')}
                            disabled={userMovementRows.length === 0}
                        >
                            Aperçu
                        </Button>
                        {canExport && userMovementRows.length > 0 && (
                            <>
                                <Button variant="outlined" size="sm" onClick={() => handleExportCSV('2')}>
                                    <Icon glyph={CaretDown} size={18} /> CSV
                                </Button>
                                <Button variant="outlined" size="sm" onClick={() => handleExportPDF('2')}>
                                    <Icon glyph={CaretDown} size={18} /> PDF
                                </Button>
                            </>
                        )}
                    </div>
                </section>

                {/* Carte 3 : Équipement vieillissant */}
                <section className="rounded-lg bg-surface p-4 shadow-elevation-1 flex flex-col justify-between gap-3">
                    <div className="flex flex-col gap-1.5">
                        <span className="font-brand text-body-large font-semibold text-on-surface">
                            Équipement vieillissant
                        </span>
                        <span className="text-body-small text-on-surface-variant">
                            Plus de trois ans de service — pour la planification de l’amortissement.
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <b className="font-brand text-[20px] font-semibold tabular-nums text-on-surface">
                                {agingRows.length}
                            </b>
                            <span className="text-body-small text-on-surface-variant">
                                {oldestAgingYears > 0
                                    ? `équipements · le plus ancien a ${oldestAgingYears} ans`
                                    : 'équipements identifiés'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-outline-variant">
                        <Button
                            variant="tonal"
                            size="sm"
                            className="flex-1"
                            onClick={() => setPreviewReportId('3')}
                            disabled={agingRows.length === 0}
                        >
                            Aperçu
                        </Button>
                        {canExport && agingRows.length > 0 && (
                            <>
                                <Button variant="outlined" size="sm" onClick={() => handleExportCSV('3')}>
                                    <Icon glyph={CaretDown} size={18} /> CSV
                                </Button>
                                <Button variant="outlined" size="sm" onClick={() => handleExportPDF('3')}>
                                    <Icon glyph={CaretDown} size={18} /> PDF
                                </Button>
                            </>
                        )}
                    </div>
                </section>

                {/* Carte 4 : Garanties qui expirent */}
                <section className="rounded-lg bg-surface p-4 shadow-elevation-1 flex flex-col justify-between gap-3">
                    <div className="flex flex-col gap-1.5">
                        <span className="font-brand text-body-large font-semibold text-on-surface">
                            Garanties qui expirent
                        </span>
                        <span className="text-body-small text-on-surface-variant">
                            Dans les 90 prochains jours.
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <b
                                className={`font-brand text-[20px] font-semibold tabular-nums ${
                                    warrantyRows.length === 0 ? 'text-on-surface-variant' : 'text-on-surface'
                                }`}
                            >
                                {warrantyRows.length}
                            </b>
                            <span className="text-body-small text-on-surface-variant">
                                équipement{warrantyRows.length > 1 ? 's' : ''} concerné{warrantyRows.length > 1 ? 's' : ''} d’ici au {dateIn90Days}
                            </span>
                        </div>
                        {warrantyRows.length === 0 && (
                            <p className="mt-1 text-body-small text-on-surface-variant">
                                Rien à exporter. La carte le dit <strong>avant</strong> le clic, plutôt qu’un message après.
                            </p>
                        )}
                    </div>

                    {warrantyRows.length > 0 ? (
                        <div className="flex items-center gap-2 pt-2 border-t border-outline-variant">
                            <Button
                                variant="tonal"
                                size="sm"
                                className="flex-1"
                                onClick={() => setPreviewReportId('4')}
                            >
                                Aperçu
                            </Button>
                            {canExport && (
                                <>
                                    <Button variant="outlined" size="sm" onClick={() => handleExportCSV('4')}>
                                        <Icon glyph={CaretDown} size={18} /> CSV
                                    </Button>
                                    <Button variant="outlined" size="sm" onClick={() => handleExportPDF('4')}>
                                        <Icon glyph={CaretDown} size={18} /> PDF
                                    </Button>
                                </>
                            )}
                        </div>
                    ) : null}
                </section>
            </div>
            </Reading>

            {/* Modal d'aperçu d'un rapport (Planche 15.1 Colonne 4) */}
            {activePreview && (
                <Modal
                    isOpen={Boolean(previewReportId)}
                    onClose={() => setPreviewReportId(null)}
                    title={activePreview.title}
                    className="max-w-2xl"
                    footer={(
                        <>
                            <Button variant="outlined" onClick={() => setPreviewReportId(null)}>
                                Fermer
                            </Button>
                            {canExport && activePreview.rows.length > 0 && (
                                <Button variant="filled" onClick={() => handleExportCSV(activePreview.id)}>
                                    Exporter
                                </Button>
                            )}
                        </>
                    )}
                >
                    <div className="flex flex-col gap-4">
                        <section className="rounded-lg bg-surface p-4 shadow-elevation-1">
                            <div className="mb-2 flex items-baseline justify-between gap-3">
                                <h3 className="text-body-medium font-semibold text-on-surface">Aperçu</h3>
                                <span className="font-brand text-body-small font-semibold tabular-nums text-on-surface-variant">
                                    5 des {activePreview.rows.length} lignes
                                </span>
                            </div>

                            <div className="overflow-x-auto rounded-md border border-outline-variant">
                                <table className="w-full text-left text-body-small border-collapse">
                                    <thead className="bg-surface-container text-on-surface font-semibold border-b border-outline-variant">
                                        <tr>
                                            {previewSampleRows.length > 0 &&
                                                Object.keys(previewSampleRows[0]).map((h) => (
                                                    <th key={h} className="px-3 py-2 whitespace-nowrap">
                                                        {h}
                                                    </th>
                                                ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-outline-variant">
                                        {previewSampleRows.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-surface-container/50">
                                                {Object.values(row).map((val, cIdx) => (
                                                    <td key={cIdx} className="px-3 py-2 whitespace-nowrap text-on-surface-variant">
                                                        {String(val || '—')}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-2 text-body-small text-on-surface-variant">
                                Cinq lignes suffisent à vérifier qu’on exporte le bon rapport. Le tableau glisse horizontalement si nécessaire.
                            </p>
                        </section>

                        <section className="rounded-lg bg-surface p-4 shadow-elevation-1 flex flex-col gap-3">
                            <h3 className="text-body-medium font-semibold text-on-surface">Le fichier</h3>
                            <div className="flex items-center justify-between text-body-small">
                                <span className="font-mono text-on-surface font-medium">
                                    {activePreview.slug}_{new Date().toISOString().split('T')[0]}.csv
                                </span>
                                <span className="text-on-surface-variant">
                                    {activePreview.rows.length} lignes · {previewColumnCount} colonnes · séparateur virgule
                                </span>
                            </div>

                            {/* Sans la permission, les deux gestes sont **absents** — pas grisés :
                                une action qu'on ne peut pas faire n'a pas à occuper la place (15.1). */}
                            {canExport && activePreview.rows.length > 0 && (
                                <div className="flex flex-col gap-2.5 pt-2 border-t border-outline-variant">
                                    <Button
                                        variant="filled"
                                        className="w-full justify-center"
                                        onClick={() => handleExportCSV(activePreview.id)}
                                    >
                                        <Icon glyph={CaretDown} size={18} /> Exporter en CSV
                                    </Button>
                                    <Button
                                        variant="tonal"
                                        className="w-full justify-center"
                                        onClick={() => handleExportPDF(activePreview.id)}
                                    >
                                        <Icon glyph={CaretDown} size={18} /> Exporter en PDF
                                    </Button>
                                </div>
                            )}
                        </section>

                        {!canExport && (
                            <div className="flex items-start gap-2 rounded-md bg-surface-container p-3 text-body-small text-on-surface-variant">
                                <Icon glyph={Warning} size={18} className="text-[var(--tk-color-st-ambre)] shrink-0 mt-0.5" />
                                <span>
                                    <strong>L’export est réservé.</strong> Sans la permission, les deux boutons sont absents — une action qu’on ne peut pas faire n’a pas à occuper la place.
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
