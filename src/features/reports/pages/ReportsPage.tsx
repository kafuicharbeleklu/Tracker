import React from 'react';
import { mockReports, mockAllEquipment, mockAllUsersExtended } from '../../../data/mockData';
import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { GLOSSARY } from '../../../constants/glossary';
import { useToast } from '../../../context/ToastContext';
import Button from '../../../components/ui/Button';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { APP_CONFIG } from '../../../config';
import { buildCsvLine } from '../../../lib/csv';

type CsvExportRow = Record<string, string | number | null | undefined>;

const ReportsPage = () => {
    const { showToast } = useToast();

    const handleExportCSV = (reportId: string) => {
        // Logique simplifiée pour générer un CSV basé sur les données mockées
        let dataToExport: CsvExportRow[] = [];
        let filename = 'export.csv';

        if (reportId === '1') { // Inventaire Complet
            dataToExport = mockAllEquipment.map(e => ({
                ID: e.assetId,
                Nom: e.name,
                Type: e.type,
                Modele: e.model,
                Statut: e.status,
                Utilisateur: e.user?.name || 'N/A'
            }));
            filename = `inventaire_${new Date().toISOString().split('T')[0]}.csv`;
        } else if (reportId === '2') { // Historique Utilisateur
            dataToExport = mockAllUsersExtended.map(u => ({
                Nom: u.name,
                Email: u.email,
                Role: u.role,
                Departement: u.department,
                DerniereConnexion: u.lastLogin
            }));
            filename = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
        } else {
            // Fallback generic data
            dataToExport = [{ info: "Rapport générique", date: new Date().toISOString() }];
            filename = `rapport_${reportId}.csv`;
        }

        if (dataToExport.length === 0) {
            showToast("Aucune donnée à exporter", "error");
            return;
        }

        // Création du CSV
        const headers = Object.keys(dataToExport[0]);
        const rows = dataToExport.map((row) => Object.values(row));
        const csvContent = [
            buildCsvLine(headers, ','),
            ...rows.map((row) => buildCsvLine(row, ',')),
        ].join('\n');

        // Déclenchement du téléchargement
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

    const handleExportPDF = (reportTitle: string, reportId: string) => {
        showToast("Génération du PDF en cours...", "info");

        try {
            const doc = new jsPDF();
            const date = new Date().toLocaleDateString();
            const filename = `${reportTitle.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.pdf`;

            // En-tête
            doc.setFontSize(20);
            doc.setTextColor(33, 37, 41); // text-on-surface
            doc.text(reportTitle, 14, 22);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Généré le : ${date} | ${APP_CONFIG.appName}`, 14, 28);

            // Données du tableau
            let head = [];
            let body = [];

            if (reportId === '1') { // Inventaire
                head = [['Asset ID', 'Nom', 'Type', 'Modèle', 'Statut', 'Utilisateur']];
                body = mockAllEquipment.map(e => [
                    e.assetId,
                    e.name,
                    e.type,
                    e.model,
                    e.status,
                    e.user?.name || '-'
                ]);
            } else if (reportId === '2') { // Utilisateurs
                head = [['Nom', 'Email', 'Rôle', 'Département', 'Dernière Connexion']];
                body = mockAllUsersExtended.map(u => [
                    u.name,
                    u.email,
                    u.role,
                    u.department,
                    u.lastLogin || '-'
                ]);
            } else {
                // Rapport générique
                head = [['Information', 'Détails']];
                body = [
                    ['Type de rapport', reportTitle],
                    ['Statut', 'Généré automatiquement'],
                    ['Note', 'Ceci est un rapport de démonstration généré par jsPDF.']
                ];
            }

            // Génération du tableau
            autoTable(doc, {
                head: head,
                body: body,
                startY: 35,
                theme: 'grid',
                headStyles: { fillColor: [253, 201, 16], textColor: [26, 25, 23], fontStyle: 'bold' }, // Jaune marque CAT + texte noir chaud
                styles: { fontSize: 8, cellPadding: 3 },
                alternateRowStyles: { fillColor: [244, 242, 239] } // neutral-100 (chaud)
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
            showToast(`PDF "${filename}" téléchargé avec succès`, "success");

        } catch (error) {
            console.error(error);
            showToast("Erreur lors de la génération du PDF", "error");
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
                {mockReports.map(report => (
                    <div key={report.id} className="bg-surface p-card rounded-card shadow-elevation-1 border border-outline-variant hover:shadow-elevation-2 transition-shadow flex flex-col h-full">
                        <div className="mb-3 text-on-surface-variant shrink-0">
                            {report.icon}
                        </div>
                        <h3 className="font-bold text-on-surface text-title-medium mb-2">{report.title}</h3>
                        <p className="text-body-medium text-on-surface-variant mb-6 flex-1">
                            {report.description}
                        </p>
                        <div className="flex items-center gap-4 mt-auto">
                            <Button
                                onClick={() => handleExportCSV(report.id)}
                                variant="tonal"
                                className="flex-1 rounded-lg"
                            >
                                Exporter en CSV
                            </Button>
                            <Button
                                onClick={() => handleExportPDF(report.title, report.id)}
                                variant="outlined"
                                className="flex-1 text-primary hover:text-primary-dark hover:bg-primary-container rounded-lg border-transparent"
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





