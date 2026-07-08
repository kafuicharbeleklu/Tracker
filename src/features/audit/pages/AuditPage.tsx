import React from 'react';
import { ViewType } from '../../../types';
import { PageContainer } from '../../../components/layout/PageContainer';
import { PageHeader } from '../../../components/layout/PageHeader';
import { GLOSSARY } from '../../../constants/glossary';
import { PhysicalAuditView } from '../components/PhysicalAuditView';
import { PageTabs } from '../../../components/ui/PageTabs';

interface AuditPageProps {
    onViewChange: (view: ViewType) => void;
}

const AuditPage: React.FC<AuditPageProps> = ({ onViewChange }) => {
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
                    { id: 'details', label: 'Détails campagne' },
                ]}
            />

            <div className="min-h-[500px]">
                <PhysicalAuditView onViewChange={onViewChange} />
            </div>
        </PageContainer>
    );
};

export default AuditPage;
