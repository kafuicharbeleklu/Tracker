import React, { useMemo, useState } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { GLOSSARY } from '../../../constants/glossary';
import { useToast } from '../../../context/ToastContext';
import { useData } from '../../../context/DataContext';
import { useAccessControl } from '../../../hooks/useAccessControl';
import Button from '../../../components/ui/Button';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import SelectField from '../../../components/ui/SelectField';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { APP_CONFIG } from '../../../config';
import { buildCsvLine } from '../../../lib/csv';
import { formatDate } from '../../../lib/financial';
import {
    ReportRow,
    buildAgingReportRows,
    buildInventoryReportRows,
    buildUserMovementReportRows,
    buildWarrantyReportRows,
} from '../../../lib/reports';

type ReportId = '1' | '2' | '3' | '4';

// Méta des cartes (présentation pure) — les données, elles, viennent du DataContext.
const REPORT_CARDS: Array<{ id: ReportId; title: string; description: string; icon: string }> = [
    {
        id: '1',
        title: 'Inventaire Complet',
        description: 'Exporter la liste complète de tous les équipements et leurs détails.',
        icon: 'package_2',
    },
    {
        id: '2',
        title: 'Historique par Utilisateur',
        description:
            'Générer un rapport de toutes les attributions et retours pour un utilisateur spécifique.',
        icon: 'manage_accounts',
    },
    {
        id: '3',
        title: 'Équipement Vieillissant',
        description:
            "Lister tous les équipements de plus de 3 ans pour la planification de l'amortissement.",
        icon: 'history',
    },
    {
        id: '4',
        title: 'Expiration des Garanties',
        description: 'Voir les équipements dont la garantie expire dans les 90 prochains jours.',
        icon: 'gpp_maybe',
    },
];

const slugify = (value: string) => value.replace(/\s+/g, '_').toLowerCase();

const ReportsPage = () => {
    const { showToast } = useToast();
    const { equipment, users, events } = useData();
    const { permissions } = useAccessControl();
    const [selectedUserId, setSelectedUserId] = useState('');

    const canExport = permissions.canExportReports;
    const exportHint = canExport ? undefined : 'Permission requise : export des rapports';

    const userOptions = useMemo(
        () =>
            [...users]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((user) => ({ value: user.id, label: user.name })),
        [users],
    );

    const selectedUser = users.find((user) => user.id === selectedUserId);

    // null = export impossible (message déjà affiché)
    const getReportRows = (reportId: ReportId): { rows: ReportRow[]; slug: string } | null => {
        if (reportId === '1') {
            return { rows: buildInventoryReportRows(equipment), slug: 'inventaire' };
        }
        if (reportId === '2') {
            if (!selectedUser) {
                showToast('Sélectionnez un utilisateur pour ce rapport.', 'error');
                return null;
            }
            return {
                rows: buildUserMovementReportRows(events, selectedUser.id),
                slug: `historique_${slugify(selectedUser.name)}`,
            };
        }
        if (reportId === '3') {
            return { rows: buildAgingReportRows(equipment, new Date()), slug: 'equipement_vieillissant' };
        }
        return { rows: buildWarrantyReportRows(equipment, new Date()), slug: 'expiration_garanties' };
    };

    const handleExportCSV = (reportId: ReportId) => {
        const report = getReportRows(reportId);
        if (!report) return;

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

        showToast(`Export CSV "${filename}" téléchargé`, 'success');
    };

    const handleExportPDF = (reportTitle: string, reportId: ReportId) => {
        const report = getReportRows(reportId);
        if (!report) return;

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
                reportId === '2' && selectedUser ? `${reportTitle} — ${selectedUser.name}` : reportTitle;

            // En-tête
            doc.setFontSize(20);
            doc.setTextColor(33, 37, 41); // text-on-surface
            doc.text(fullTitle, 14, 22);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Généré le : ${date} | ${APP_CONFIG.appName}`, 14, 28);

            autoTable(doc, {
                head: [Object.keys(report.rows[0])],
                body: report.rows.map((row) => Object.values(row).map(String)),
                startY: 35,
                theme: 'grid',
                headStyles: { fillColor: [253, 201, 16], textColor: [26, 25, 23], fontStyle: 'bold' }, // Jaune marque CAT + texte noir chaud
                styles: { fontSize: 8, cellPadding: 3 },
                alternateRowStyles: { fillColor: [244, 242, 239] }, // neutral-100 (chaud)
            });

            // Pied de page (numéros de page)
            const pageCount = (doc.internal as { getNumberOfPages: () => number }).getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text('Page ' + i + ' sur ' + pageCount, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
            }

            doc.save(filename);
            showToast(`PDF "${filename}" téléchargé avec succès`, 'success');
        } catch (error) {
            console.error(error);
            showToast('Erreur lors de la génération du PDF', 'error');
        }
    };

    return (
        <PageContainer>
            <PageHeader
                title={GLOSSARY.REPORTS}
                subtitle="Générez et exportez des rapports détaillés sur votre parc informatique."
                breadcrumb={GLOSSARY.REPORTS}
            />

            <div className="grid grid-cols-1 medium:grid-cols-2 expanded:grid-cols-3 gap-6">
                {REPORT_CARDS.map(report => (
                    <div key={report.id} className="bg-surface p-card rounded-card shadow-elevation-1 border border-outline-variant hover:shadow-elevation-2 transition-shadow flex flex-col h-full">
                        <div className="mb-3 text-on-surface-variant shrink-0">
                            <MaterialIcon name={report.icon} size={24} />
                        </div>
                        <h3 className="font-bold text-on-surface text-title-medium mb-2">{report.title}</h3>
                        <p className="text-body-medium text-on-surface-variant mb-6 flex-1">
                            {report.description}
                        </p>
                        {report.id === '2' && (
                            <div className="mb-4">
                                <SelectField
                                    name="report-user"
                                    label="Utilisateur"
                                    placeholder="Choisir un utilisateur..."
                                    options={userOptions}
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="flex items-center gap-4 mt-auto">
                            <Button
                                onClick={() => handleExportCSV(report.id)}
                                variant="tonal"
                                className="flex-1 rounded-lg"
                                disabled={!canExport}
                                title={exportHint}
                            >
                                Exporter en CSV
                            </Button>
                            <Button
                                onClick={() => handleExportPDF(report.title, report.id)}
                                variant="filled"
                                className="flex-1 rounded-lg"
                                disabled={!canExport}
                                title={exportHint}
                            >
                                Exporter en PDF
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
};

export default ReportsPage;
