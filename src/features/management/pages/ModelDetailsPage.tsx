import React, { useCallback, useMemo, useState } from 'react';
import {
    CaretRight,
    DotsThreeVertical,
    Handshake,
    PencilSimple,
    Plus,
} from '@phosphor-icons/react';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { useData } from '../../../context/DataContext';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import { useToast } from '../../../context/ToastContext';
import DetailTemplate from '../../../components/layout/DetailTemplate';
import DetailHero from '../../../components/ui/DetailHero';
import { getCategoryLabel } from '../../../constants/glossary';
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
    const { equipment, models, categories, deleteModel } = useData();
    const { navigateToItem, navigateToView } = useAppNavigation();
    const { showToast } = useToast();
    const { requestConfirmation } = useConfirmation();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const model = models.find((m) => m.id === modelId);

    /**
     * **Le retour rend la catégorie, pas la racine du catalogue.** On descend famille →
     * type → modèle ; remonter d'un modèle au sommet fait refaire deux pas à qui n'en
     * avait fait qu'un. Relevé au rapport d'écarts du 05/09, planche 09.2.
     *
     * Un modèle nomme sa famille (`type`), la fiche de catégorie s'adresse par
     * identifiant : la correspondance se fait ici, et à défaut le retour reste celui que
     * la coque a donné.
     */
    const parentCategory = useMemo(
        () => (model ? categories.find((c) => c.name === model.type) : undefined),
        [categories, model],
    );
    const retour = useCallback(() => {
        if (parentCategory) navigateToItem('category_details', parentCategory.id);
        else onBack();
    }, [parentCategory, navigateToItem, onBack]);

    // Filter equipment by model name
    const modelEquipment = useMemo(() => {
        if (!model) return [];
        return equipment.filter((e) => e.model === model.name);
    }, [equipment, model]);

    /**
     * **Le geste du modèle porte sur une de ses unités.** *« Un modèle n'est pas un
     * objet : c'est ce dont on a plusieurs exemplaires, et la question qu'on lui pose est
     * combien puis-je en attribuer maintenant »* (09.2). Le héro répond au chiffre ;
     * « Remettre » répond au geste, sur la première unité disponible.
     */
    const premiereDisponible = useMemo(
        () => modelEquipment.find((e) => e.status === 'Disponible') ?? null,
        [modelEquipment],
    );
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
            /* C2 — la conséquence, et ce qui est conservé. L'irréversibilité en
               sortait : elle a sa ligne, en rouge, sous le corps (C4). La dire deux
               fois dans deux formes différentes ne la rend pas plus lisible. */
            message:
                "Aucun actif n'y est rattaché. Le modèle disparaît du catalogue et de la création d'équipement.",
            tone: 'destructive',
            irreversible: true,
            /* **Le dernier mot-clé à recopier du produit.** Il exigeait de taper
               « SUPPRIMER ». C7 de la planche 16.2 l'a déjà tranché pour la clôture
               d'audit : *ce n'est pas la friction qui manque à cet acte, c'est la
               conséquence chiffrée*. Recopier un mot ne fait relire personne — et
               17.2 ne dessine que deux gestes, jamais un champ. */
            confirmText: 'Supprimer le modèle',
            cancelText: 'Annuler',
            onConfirm: () => {
                if (deleteModel(model.id)) {
                    showToast(`Modèle « ${model.name} » supprimé.`, 'success');
                    retour();
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
                /* `.tid .code` de 09.2 — **« Modèle »**, le nom commun. La barre portait
                   le nom du modèle *et* sa marque et son type, c'est-à-dire exactement
                   les deux lignes que le héro écrit trois centimètres plus bas. R3 :
                   *« ce que le héro porte, les cartes ne le reprennent pas »* — la barre
                   non plus. */
                code="Modèle"
                onBack={retour}
                menu={
                    <Menu
                        align="end"
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
                    /*
                     * **Le même héro que la fiche de type** (09.2 le dit : *« même héro que
                     * la fiche de type (09.1) »*) : l'identité, puis **le parc en barre et
                     * trois comptes, le disponible en premier**. Ils vivaient dans une carte
                     * séparée, sous le héro, avec une phrase d'explication : le lecteur
                     * devait descendre pour répondre à la seule question qu'on pose à un
                     * modèle — *« combien puis-je en attribuer maintenant »*.
                     *
                     * L'étiquette dit le **libellé** du type et non sa clé : la fiche
                     * annonçait « Laptop » là où tout le produit écrit « Ordinateur
                     * portable ».
                     */
                    <DetailHero
                        label={[model.brand, getCategoryLabel(model.type)]
                            .filter(Boolean)
                            .join(' · ')}
                        subject={model.name}
                        image={model.image || undefined}
                        meter={
                            totalUnits > 0 ? (
                                <span className="flex h-2 gap-0.5 overflow-hidden rounded-[4px]">
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
                                </span>
                            ) : undefined
                        }
                        metrics={[
                            {
                                value: availableCount,
                                label: (
                                    <span className="flex items-center gap-1.5">
                                        <i className="h-2 w-2 shrink-0 rounded-[2px] bg-[var(--tk-color-st-vert)]" />
                                        disponibles
                                    </span>
                                ),
                            },
                            {
                                value: assignedCount,
                                label: (
                                    <span className="flex items-center gap-1.5">
                                        <i className="h-2 w-2 shrink-0 rounded-[2px] bg-[var(--tk-color-st-bleu)]" />
                                        attribués
                                    </span>
                                ),
                            },
                            {
                                value: repairCount,
                                label: (
                                    <span className="flex items-center gap-1.5">
                                        <i className="h-2 w-2 shrink-0 rounded-[2px] bg-[var(--tk-color-st-orange)]" />
                                        réparation
                                    </span>
                                ),
                            },
                        ]}
                        metricsStyle="boxes"
                        /* `.hact` de 09.2 — **deux gestes, deux colonnes égales** : le
                           jaune remet une unité, le second modifie la fiche. Le héro n'en
                           portait aucun : « Remettre » n'existait nulle part sur cet
                           écran, et « Modifier » ne vivait que dans le ⋮ — un geste
                           courant à deux taps derrière un glyphe. */
                        actions={
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="filled"
                                    icon={<Icon glyph={Handshake} size={20} />}
                                    disabled={!premiereDisponible}
                                    onClick={() =>
                                        premiereDisponible &&
                                        navigateToItem('assignment_wizard', premiereDisponible.id)
                                    }
                                >
                                    Remettre
                                </Button>
                                <Button
                                    variant="tonal"
                                    className="text-inverse-on-surface bg-white/[0.12] hover:bg-white/[0.18]"
                                    icon={<Icon glyph={PencilSimple} size={20} />}
                                    onClick={() => setIsEditModalOpen(true)}
                                >
                                    Modifier
                                </Button>
                            </div>
                        }
                    />
                }
            >
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
                                    onClick={() => navigateToItem('equipment_details', item.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            navigateToItem('equipment_details', item.id);
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
