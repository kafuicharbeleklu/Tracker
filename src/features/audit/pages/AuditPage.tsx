import React from 'react';
import { ViewType } from '../../../types';
import { MEDIA } from '../../../constants/breakpoints';
import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { GLOSSARY } from '../../../constants/glossary';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { PhysicalAuditView } from '../components/PhysicalAuditView';
import { PageTabs } from '../../../components/ui/PageTabs';

interface AuditPageProps {
    onViewChange: (view: ViewType) => void;
}

const AuditPage: React.FC<AuditPageProps> = ({ onViewChange }) => {
    const isCompact = useMediaQuery(MEDIA.compact);

    // Compact : écran passé à l'ADN mobile v1 (DESIGN_BRIEF.md). En-tête, onglets et
    // rythme vertical sont portés par la vue elle-même — le padding de page vaut 20 px
    // (§3) au lieu des 16 px canoniques, d'où `padding="none"` puis `p-5`.
    // `pt-[calc(...)]` : la barre d'application ne rend plus sur cette vue (AppLayout),
    // c'est donc à la page de dégager l'encoche / la barre d'état.
    if (isCompact) {
        return (
            <PageContainer
                padding="none"
                className="p-5 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] space-y-0"
            >
                <PhysicalAuditView onViewChange={onViewChange} />
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <PageHeader
                title={GLOSSARY.AUDIT}
                subtitle="Lancez et suivez les campagnes d'audit de votre parc informatique."
                breadcrumb={GLOSSARY.AUDIT}
            />

            <PageTabs
                activeId="overview"
                onChange={(tabId) => {
                    if (tabId === 'details') {
                        onViewChange('audit_details');
                    }
                }}
                items={[
                    { id: 'overview', label: 'Vue globale' },
                    { id: 'details', label: 'Détails campagne', shortLabel: 'Détails' },
                ]}
            />

            <div className="min-h-[500px]">
                <PhysicalAuditView onViewChange={onViewChange} />
            </div>
        </PageContainer>
    );
};

export default AuditPage;
