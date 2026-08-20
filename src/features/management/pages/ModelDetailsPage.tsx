import React, { useMemo, useState } from 'react';
import { CaretRight, DotsThreeVertical, PencilSimple, Plus } from '@phosphor-icons/react';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { useData } from '../../../context/DataContext';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { useToast } from '../../../context/ToastContext';
import DetailTemplate from '../../../components/layout/DetailTemplate';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import Menu from '../../../components/ui/Menu';
import ScreenState from '../../../components/ui/ScreenState';
import AddModelPage from './AddModelPage';
import { buildCsvLine } from '../../../lib/csv';

interface ModelDetailsPageProps {
    modelId: string;
    onBack: () => void;
}

const ModelDetailsPage: React.FC<ModelDetailsPageProps> = ({ modelId, onBack }) => {
    const { equipment, models, deleteModel } = useData();
    const { navigateToItem, navigateToView } = useAppNavigation();
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const model = models.find((m) => m.id === modelId);

    // Filter equipment by model name
    const modelEquipment = useMemo(() => {
        if (!model) return [];
        return equipment.filter((e) => e.model === model.name);
    }, [equipment, model]);

    const availableCount = useMemo(
        () => modelEquipment.filter((e) => e.status === 'Disponible').length,
        [modelEquipment],
    );
    const assignedCount = useMemo(
        () => modelEquipment.filter((e) => e.status === 'Attribué').length,
        [modelEquipment],
    );
    const repairCount = useMemo(
        () => modelEquipment.filter((e) => e.status === 'En réparation').length,
        [modelEquipment],
    );

    // Distinct sites where this model is located
    const sitesSummary = useMemo(() => {
        const set = new Set<string>();
        modelEquipment.forEach((item) => {
            if (item.site) set.add(item.site);
        });
        const arr = Array.from(set);
        if (arr.length === 0) return '';
        if (arr.length === 1) return `au ${arr[0]}`;
        if (arr.length === 2) return `au ${arr[0]} et à ${arr[1]}`;
        return `au ${arr[0]}, ${arr[1]} et ${arr.length - 2} autre(s) site(s)`;
    }, [modelEquipment]);

    const handleExportUnits = () => {
        if (modelEquipment.length === 0) {
            showToast('Aucune unité à exporter.', 'info');
            return;
        }
        const headers = [
            'Asset ID',
            'Nom',
            'Numéro de série',
            'Statut',
            'Utilisateur',
            'Site',
            'Type',
        ];
        const rows = modelEquipment.map((item) => [
            item.assetId,
            item.name,
            item.serialNumber || '',
            item.status,
            item.user?.name || '',
            item.site || '',
            item.type,
        ]);
        const csvContent = [buildCsvLine(headers), ...rows.map(buildCsvLine)].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `unites-${model?.name || 'modele'}.csv`;
        link.click();
        showToast('Export CSV des unités téléchargé.', 'success');
    };

    if (!model) {
        return (
            <ScreenState
                title="Modèle introuvable"
                description="Le modèle demandé a peut-être été supprimé du catalogue."
                actions={
                    <Button variant="filled" onClick={onBack}>
                        Revenir au catalogue
                    </Button>
                }
            />
        );
    }

    const totalUnits = modelEquipment.length;
    const availablePercent = totalUnits > 0 ? (availableCount / totalUnits) * 100 : 0;
    const assignedPercent = totalUnits > 0 ? (assignedCount / totalUnits) * 100 : 0;
    const repairPercent = totalUnits > 0 ? (repairCount / totalUnits) * 100 : 0;

    const brandInitials = (model.brand || model.name)
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

    /**
     * **Une suppression se décide devant l'objet** — au menu de sa fiche, pas en le
     * survolant (§04.1, `ListRow`). Le geste vivait sur la rangée du catalogue, en
     * corbeille rouge apparue au survol : sans repli tactile, et à l'endroit exact
     * où passe le pouce qui fait défiler. Il est ici, comme « Supprimer le type »
     * l'est sur la fiche d'un type, et il refuse tant que des unités subsistent :
     * un modèle supprimé sous ses actifs laisse des fiches sans référence.
     */
    const handleDeleteModel = () => {
        if (!model) return;

        if (totalUnits > 0) {
            showToast(`Impossible : ${totalUnits} actif(s) sont encore liés à ce modèle.`, 'error');
            return;
        }

        requestConfirmation({
            title: `Supprimer « ${model.name} » du catalogue ?`,
            message:
                "Aucun actif n'y est rattaché. Le modèle disparaît du catalogue et de la création d'équipement ; cette action est irréversible.",
            variant: 'danger',
            confirmKeyword: 'SUPPRIMER',
            confirmText: 'Supprimer le modèle',
            cancelText: 'Annuler',
            onConfirm: () => {
                if (deleteModel(model.id)) {
                    showToast(`Modèle « ${model.name} » supprimé.`, 'success');
                    onBack();
                    return;
                }
                showToast('Suppression impossible.', 'error');
            },
        });
    };

    const menuItems = [
        {
            id: 'edit',
            label: 'Modifier le modèle',
            description: 'nom, type, marque, spécifications',
            onSelect: () => setIsEditModalOpen(true),
        },
        {
            id: 'export',
            label: 'Exporter les unités',
            description: `${totalUnits} unité(s) au format CSV`,
            dividerBefore: true,
            onSelect: handleExportUnits,
        },
        {
            id: 'delete',
            label: 'Supprimer le modèle',
            description:
                totalUnits > 0
                    ? `${totalUnits} unité(s) encore rattachée(s)`
                    : 'aucun actif rattaché',
            destructive: true,
            disabled: totalUnits > 0,
            dividerBefore: true,
            onSelect: handleDeleteModel,
        },
    ];

    const firstThreeUnits = modelEquipment.slice(0, 3);

    return (
        <>
            <AddModelPage
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                modelToEdit={model}
            />

            <DetailTemplate
                code={model.name}
                reference={`${model.brand ? `${model.brand} · ` : ''}${model.type}`}
                onBack={onBack}
                menu={
                    <Menu
                        align="end"
                        className="w-[262px]"
                        items={menuItems}
                        trigger={
                            <Button
                                variant="text"
                                iconOnly
                                size="sm"
                                aria-label="Autres actions"
                                className="text-on-surface hover:bg-surface-container flex h-12 w-12 items-center justify-center rounded-md p-0 transition-colors"
                            >
                                <Icon glyph={DotsThreeVertical} size={20} />
                            </Button>
                        }
                    />
                }
                hero={
                    <section className="bg-inverse-surface text-inverse-on-surface flex flex-col gap-3 rounded-lg p-4">
                        <div className="flex items-start gap-3.5">
                            {model.image ? (
                                <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-md bg-white/10 p-1">
                                    <img
                                        src={model.image}
                                        alt={model.name}
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                            ) : (
                                <span className="text-inverse-on-surface flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-md bg-white/12 font-['Archivo',sans-serif] text-[19px] font-semibold">
                                    {brandInitials}
                                </span>
                            )}
                            <div className="min-w-0 flex-1 pt-0.5">
                                <h1 className="truncate font-['Archivo',sans-serif] text-[20px] font-semibold tracking-[-0.01em] text-white">
                                    {model.name}
                                </h1>
                                <p className="text-text-secondary mt-0.5 text-[13px]">
                                    {model.brand ? `${model.brand} · ` : ''}
                                    {model.type}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-baseline gap-2.5 border-t border-white/14 pt-3.5">
                            <b className="font-['Archivo',sans-serif] text-[32px] font-semibold tracking-[-0.01em] text-white tabular-nums">
                                {availableCount}
                            </b>
                            <span className="text-text-secondary text-[13px] leading-[19px]">
                                disponible{availableCount > 1 ? 's' : ''} sur {totalUnits} unité
                                {totalUnits > 1 ? 's' : ''}
                                {sitesSummary ? (
                                    <>
                                        <br />
                                        {sitesSummary}
                                    </>
                                ) : null}
                            </span>
                        </div>
                    </section>
                }
            >
                {/* Carte 1 : Le parc de ce modèle */}
                <section className="bg-surface shadow-elevation-1 rounded-lg p-4">
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                        <h3 className="text-on-surface text-[13px] font-medium">
                            Le parc de ce modèle
                        </h3>
                        <span className="text-text-secondary font-['Archivo',sans-serif] text-[13px] font-semibold tabular-nums">
                            {totalUnits}
                        </span>
                    </div>

                    <div className="bg-surface-container my-2.5 flex h-1.5 overflow-hidden rounded-[2px]">
                        {availablePercent > 0 && (
                            <i
                                className="block h-full bg-[var(--tk-color-st-vert)]"
                                style={{ width: `${availablePercent}%` }}
                            />
                        )}
                        {assignedPercent > 0 && (
                            <i
                                className="block h-full bg-[var(--tk-color-st-bleu)]"
                                style={{ width: `${assignedPercent}%` }}
                            />
                        )}
                        {repairPercent > 0 && (
                            <i
                                className="block h-full bg-[var(--tk-color-st-orange)]"
                                style={{ width: `${repairPercent}%` }}
                            />
                        )}
                    </div>

                    <div className="text-text-secondary flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
                        <span className="inline-flex items-center gap-1.5">
                            <i className="h-1.5 w-1.5 shrink-0 rounded-[2px] bg-[var(--tk-color-st-vert)]" />
                            Disponibles{' '}
                            <b className="text-on-surface font-medium tabular-nums">
                                {availableCount}
                            </b>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <i className="h-1.5 w-1.5 shrink-0 rounded-[2px] bg-[var(--tk-color-st-bleu)]" />
                            Attribués{' '}
                            <b className="text-on-surface font-medium tabular-nums">
                                {assignedCount}
                            </b>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <i className="h-1.5 w-1.5 shrink-0 rounded-[2px] bg-[var(--tk-color-st-orange)]" />
                            En réparation{' '}
                            <b className="text-on-surface font-medium tabular-nums">
                                {repairCount}
                            </b>
                        </span>
                    </div>

                    <p className="text-text-secondary mt-2 text-[12px] leading-[17px]">
                        La barre porte les trois états décisionnels du parc (disponible, attribué,
                        en réparation).
                    </p>
                </section>

                {/* Carte 2 : Les unités */}
                <section className="bg-surface shadow-elevation-1 rounded-lg p-4">
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                        <h3 className="text-on-surface text-[13px] font-medium">Les unités</h3>
                        <span className="text-text-secondary text-[13px] tabular-nums">
                            {firstThreeUnits.length} sur {totalUnits}
                        </span>
                    </div>

                    <div className="divide-outline-variant mt-1 divide-y">
                        {firstThreeUnits.length > 0 ? (
                            firstThreeUnits.map((item) => (
                                <div
                                    key={item.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => navigateToItem('equipment', item.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            navigateToItem('equipment', item.id);
                                        }
                                    }}
                                    className="hover:bg-surface-container flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-md px-1 py-2 text-left transition-colors"
                                >
                                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                        <span className="text-on-surface font-['Archivo',sans-serif] text-[14px] font-semibold">
                                            {item.assetId}
                                        </span>
                                        <span className="text-text-secondary truncate text-[12px] leading-[17px]">
                                            {item.user?.name ? `${item.user.name} · ` : ''}
                                            {item.status}
                                            {item.site ? ` · ${item.site}` : ''}
                                        </span>
                                    </div>
                                    <Icon
                                        glyph={CaretRight}
                                        size={18}
                                        className="text-text-secondary shrink-0"
                                    />
                                </div>
                            ))
                        ) : (
                            <p className="text-text-secondary py-3 text-[13px]">
                                Aucune unité enregistrée pour ce modèle.
                            </p>
                        )}
                    </div>

                    {totalUnits > 0 && (
                        <Button
                            variant="text"
                            onClick={() => navigateToView('equipment')}
                            className="border-outline-variant text-on-surface hover:text-text-secondary mt-2 flex min-h-12 w-full items-center justify-start gap-2.5 rounded-none border-t px-1 pt-2 text-left text-[14px] font-medium transition-colors"
                        >
                            <Icon glyph={CaretRight} size={18} className="text-text-secondary" />
                            <span>Voir les {totalUnits} unités dans l'inventaire</span>
                        </Button>
                    )}
                </section>

                {/* Carte 3 : Spécifications honnêtes (Planche 09.2) */}
                <section className="bg-surface shadow-elevation-1 rounded-lg p-4">
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                        <h3 className="text-on-surface text-[13px] font-medium">Spécifications</h3>
                    </div>

                    {model.specs ? (
                        <p className="text-on-surface mt-1 text-[13px] leading-[19px] whitespace-pre-wrap">
                            {model.specs}
                        </p>
                    ) : (
                        <p className="text-text-secondary mt-1 text-[12px] leading-[17px]">
                            Aucune spécification n'a été saisie pour ce modèle.
                        </p>
                    )}

                    <div className="border-outline-variant mt-3 border-t pt-3">
                        <Button
                            variant="tonal"
                            className="w-full justify-center"
                            icon={<Icon glyph={model.specs ? PencilSimple : Plus} size={18} />}
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            {model.specs
                                ? 'Modifier les spécifications'
                                : 'Ajouter les spécifications'}
                        </Button>
                    </div>
                </section>
            </DetailTemplate>
        </>
    );
};

export default ModelDetailsPage;
