import React, { useEffect, useMemo } from 'react';
import { PageHeader, useHasMobileTopBar } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { useRouter } from '../../../hooks/useRouter';
import RbacManagementPanel, { RbacSection } from '../components/RbacManagementPanel';

const RBAC_SECTIONS: RbacSection[] = ['roles', 'permissions', 'workflows', 'assignments'];

const RbacPage: React.FC = () => {
    const { routeSegments, navigate } = useRouter();
    const hasMobileTopBar = useHasMobileTopBar();
    const routeSection = routeSegments[1];

    const activeSection = useMemo<RbacSection>(() => {
        if (routeSection && RBAC_SECTIONS.includes(routeSection as RbacSection)) {
            return routeSection as RbacSection;
        }
        return 'roles';
    }, [routeSection]);

    useEffect(() => {
        if (routeSegments[0] !== 'rbac') return;
        if (!routeSection || !RBAC_SECTIONS.includes(routeSection as RbacSection)) {
            navigate('/rbac/roles');
        }
    }, [routeSegments, routeSection, navigate]);

    return (
        <div className="flex flex-col h-full bg-surface">
            {/* Enveloppe non rendue quand le PageHeader n'affiche rien (compact portrait, X11) */}
            {!hasMobileTopBar && (
                <div className="bg-surface border-b border-outline-variant pt-page-sm medium:pt-page pb-0 px-0 sticky top-0 z-20">
                    <div className="px-page-sm medium:px-page mb-6">
                        <PageHeader
                            sticky={false}
                            title="Rôles & accès"
                            subtitle="Configurez les permissions, affectations et workflows d'approbation."
                            breadcrumb="Rôles & accès"
                        />
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                <PageContainer>
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-medium2 pb-12">
                        <RbacManagementPanel
                            section={activeSection}
                            onSectionChange={(section) => navigate(`/rbac/${section}`)}
                        />
                    </div>
                </PageContainer>
            </div>
        </div>
    );
};

export default RbacPage;
