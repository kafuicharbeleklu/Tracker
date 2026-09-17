import React, { useMemo, useState } from 'react';
import { CaretRight, DotsThreeVertical, FolderOpen, Info, Warning } from '@phosphor-icons/react';
import { useData } from '../../../context/DataContext';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import DetailTemplate from '../../../components/layout/DetailTemplate';
import DetailHero from '../../../components/ui/DetailHero';
import Thumbnail from '../../../components/ui/Thumbnail';
import ScreenState from '../../../components/ui/ScreenState';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import ListRow from '../../../components/ui/ListRow';
import { CATEGORY_LABELS, getCategoryLabel } from '../../../constants/glossary';
import AddModelPage from './AddModelPage';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { useToast } from '../../../context/ToastContext';
import AddCategoryPage from './AddCategoryPage';
import Menu from '../../../components/ui/Menu';
import ListActionFab from '../../../components/ui/ListActionFab';

/**
 * « on ne peut pas créer **de serveur** », « **d'écran** » — la conséquence se dit
 * avec le nom du type, pas avec « un équipement de ce type » (09.1, colonne 3).
 */
const indefiniteArticle = (label: string): string =>
    /^[aeiouyéèêàâîïôûh]/i.test(label) ? `d'${label}` : `de ${label}`;

interface CategoryDetailsPageProps {
    categoryId: string;
    onBack: () => void;
    onModelClick: (id: string) => void;
}

const CategoryDetailsPage: React.FC<CategoryDetailsPageProps> = ({
    categoryId,
    onBack,
    onModelClick,
}) => {
    const { equipment, categories, models, deleteCategory } = useData();
    const { navigateToView } = useAppNavigation();
    const { requestConfirmation } = useConfirmation();
    const { showToast } = useToast();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isAddModelOpen, setIsAddModelOpen] = useState(false);

    const category = categories.find((c) => c.id === categoryId);

    const categoryModels = useMemo(
        () => (category ? models.filter((m) => m.type === category.name) : []),
        [category, models],
    );
    const categoryEquipment = useMemo(
        () => (category ? equipment.filter((e) => e.type === category.name) : []),
        [equipment, category],
    );

    if (!category) {
        return (
            <ScreenState
                icon={FolderOpen}
                title="Catégorie introuvable"
                description="La catégorie demandée n'existe pas ou a été retirée du catalogue."
                actions={
                    <Button variant="filled" onClick={onBack}>
                        Revenir au catalogue
                    </Button>
                }
            />
        );
    }

    // B1 — la clé de la donnée **est** le nom porté par le type ; le français est un
    // libellé. Cet écran la montre, les autres ne la montrent jamais (09.1). La famille
    // se lit sur le type (A2) : elle était déduite du nom par un `switch` de trente
    // lignes, qui se trompait sur tout type créé après lui.
    /* La famille ne se **replie** pas sur une famille réelle : un type persisté avant
       l'ajout du champ se retrouvait affiché « Mobilier et divers » sans que rien ne
       le distingue d'un type effectivement rangé là. Le manque se dit, comme la clé
       manquante juste en dessous. */
    const family = category.family;
    const dataKey = category.name;
    /**
     * Une clé est **relevée** quand le nom du type est l'une des clés techniques que
     * la logique métier et les imports savent lire — celles de `CATEGORY_LABELS`.
     * Un type créé par un administrateur porte son libellé français en guise de nom :
     * il n'a alors **aucune clé**, et un import ne sait pas le nommer.
     *
     * C'est le second manque de la colonne 3 de 09.1, dit à part du premier. Il valait
     * `true` en dur, ce qui rendait l'état inatteignable.
     */
    const isDataKeyReleve = Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, category.name);
    /* B1 — la clé se lit **une fois**, à sa ligne. Le titre portait `category.name`,
       donc « Laptop » : la clé deux fois et le libellé français nulle part, sur l'écran
       même qui titre « Ordinateur portable » dans la planche. */
    const displayName = getCategoryLabel(category.name);
    const typeLabel = displayName.toLowerCase();
    const isAssignable = category.assignable !== false;
    const assignedEquipmentCount = categoryEquipment.filter((item) =>
        Boolean(item.user?.name),
    ).length;
    const depreciationYears = category.defaultDepreciation?.years ?? 3;
    const depreciationMethod =
        category.defaultDepreciation?.method === 'degressive' ? 'Dégressif' : 'Linéaire';

    return (
        <DetailTemplate
            code="Type"
            onBack={onBack}
            /* **Les deux actes du type sont au ⋮**, comme sur la fiche d'un modèle : une
               fiche n'aligne pas ses actes en boutons au bas de son contenu, où ils se
               découvrent après trois cartes. Le destructeur est le dernier, derrière un
               filet, en encre de danger. */
            menu={
                <Menu
                    align="end"
                    items={[
                        {
                            id: 'edit',
                            label: 'Modifier le type',
                            description: 'nom, famille, amortissement, pictogramme',
                            onSelect: () => setIsEditOpen(true),
                        },
                        {
                            id: 'delete',
                            label: 'Supprimer le type',
                            description:
                                categoryEquipment.length > 0
                                    ? `${categoryEquipment.length} actif${categoryEquipment.length > 1 ? 's' : ''} le portent encore`
                                    : 'aucun actif ne le porte',
                            destructive: true,
                            dividerBefore: true,
                            onSelect: () =>
                                requestConfirmation({
                                    title: `Supprimer « ${displayName} » du catalogue ?`,
                                    message:
                                        categoryEquipment.length > 0
                                            ? `${categoryEquipment.length} actif(s) portent ce type. Ils ne sont pas supprimés, mais plus rien ne définira ce qu'ils sont.`
                                            : 'Aucun actif ne porte ce type. Les modèles qui en dépendent perdent leur rattachement.',
                                    confirmText: 'Supprimer le type',
                                    tone: 'destructive',
                                    irreversible: true,
                                    onConfirm: () => {
                                        deleteCategory(category.id);
                                        showToast(
                                            `« ${displayName} » supprimé du catalogue.`,
                                            'success',
                                        );
                                        onBack();
                                    },
                                }),
                        },
                    ]}
                    trigger={
                        <Button
                            variant="text"
                            iconOnly
                            aria-label="Actes du type"
                            className="text-on-surface hover:bg-surface-container rounded-md"
                        >
                            <Icon glyph={DotsThreeVertical} size={20} />
                        </Button>
                    }
                />
            }
            /* `.fab` — **le geste d'ajout est flottant** (17.6) : « Ajouter un modèle »
               vivait en pied de carte, sous la liste des modèles, où il se découvrait
               après avoir défilé. Un acte de création ne se cherche pas. */
            fab={
                <ListActionFab
                    label="modèle"
                    actions={[
                        {
                            id: 'add-model',
                            label: 'Ajouter un modèle',
                            icon: 'add',
                            onSelect: () => setIsAddModelOpen(true),
                        },
                    ]}
                />
            }
            /*
             * **La passe sobre du 03/09 redonne un héro à la fiche d'un type.** Le
             * portage précédent l'avait retiré, sur une lecture antérieure de 09.1 ; la
             * planche courante le dessine, et lui donne exactement deux mesures : les
             * modèles et les actifs au parc. *« Le héro dit l'identité et les deux
             * comptes. »*
             *
             * Le compte d'actifs n'est pas une liste : *« les actifs ne sont pas listés
             * ici, ils sont dans 04.1, et un second inventaire est une seconde
             * vérité »*. Un chiffre n'est pas un inventaire.
             */
            hero={
                <DetailHero
                    label={family || 'Sans famille'}
                    subject={displayName}
                    metrics={[
                        {
                            value: categoryModels.length,
                            label: categoryModels.length > 1 ? 'modèles' : 'modèle',
                        },
                        { value: categoryEquipment.length, label: 'actifs au parc' },
                    ]}
                    metricsStyle="boxes"
                />
            }
        >
            {/*
              `.card` de 09.1, « Référence » — trois rangées `.rrow` : la clé à gauche sur
              l'encre secondaire, la valeur à droite sans graisse, 48 de haut, 16 sur 24, un
              filet au-dessus de chacune. La famille n'y est plus : le héro la porte déjà en
              surtitre (« Sans famille » quand elle manque). Les sous-lignes qui expliquaient
              chaque rangée non plus (R15) ; une clé non relevée se dit dans la valeur, en
              encre tertiaire (relevé du 13/09).
            */}
            <section className="bg-surface rounded-lg px-4 py-1">
                <div className="flex min-h-12 items-center pt-2 pb-1">
                    <h3 className="text-on-surface text-[17px] leading-6 font-medium">Référence</h3>
                </div>
                <div className="border-outline-variant flex min-h-12 items-center justify-between gap-4 border-t py-3 text-[16px] leading-6">
                    <span className="text-text-muted">Clé de la donnée</span>
                    {isDataKeyReleve ? (
                        <span className="text-on-surface font-mono text-[14px] leading-5 whitespace-nowrap">
                            {dataKey}
                        </span>
                    ) : (
                        <span className="text-text-tertiary whitespace-nowrap">à relever</span>
                    )}
                </div>
                <div className="border-outline-variant flex min-h-12 items-center justify-between gap-4 border-t py-3 text-[16px] leading-6">
                    <span className="text-text-muted">Attribuable</span>
                    <span className="text-on-surface whitespace-nowrap">
                        {isAssignable ? 'Oui' : 'Non'}
                    </span>
                </div>
                <div className="border-outline-variant flex min-h-12 items-center justify-between gap-4 border-t py-3 text-[16px] leading-6">
                    <span className="text-text-muted">Amortissement</span>
                    <span className="text-on-surface whitespace-nowrap">
                        {depreciationMethod} · {depreciationYears} ans
                    </span>
                </div>
            </section>

            {/* Section 2 : Modèles référencés */}
            <section className="bg-surface rounded-lg p-4">
                {/* `.ch` de 09.1 — le titre en 17 sur 24 et 500, le compte en 14 sur l'encre
                    secondaire, sans graisse : les deux étaient en 13 et en 600. */}
                <div className="mb-2 flex min-h-6 items-center justify-between gap-3">
                    <h3 className="text-on-surface text-[17px] leading-6 font-medium">Modèles</h3>
                    <span className="text-text-muted text-[14px] leading-5 tabular-nums">
                        {categoryModels.length}
                    </span>
                </div>

                {categoryModels.length > 0 ? (
                    /* La rangée du système (`ListRow`, 72 px, vignette 40) — c'est ce que
                       09.1 dessine sous « Modèles » : **la photo du modèle** à gauche, la
                       marque à droite de la ligne 1, le nombre d'unités en dessous. La
                       liste était une rangée maison de 56 px, sans vignette : un modèle se
                       reconnaît d'abord à sa photo, c'est ce qui le distingue de son voisin
                       de même marque (09.2). Sans photo, la rangée porte **l'initiale de la
                       marque** — jamais un cadre vide. */
                    <>
                        <div>
                            {categoryModels.map((model) => (
                                <ListRow
                                    key={model.id}
                                    vignette={
                                        <Thumbnail
                                            src={model.image}
                                            alt=""
                                            className="h-full w-full object-cover"
                                            fallback={
                                                <span className="text-[15px] font-medium">
                                                    {(model.brand || model.name)
                                                        .trim()
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </span>
                                            }
                                        />
                                    }
                                    title={model.name}
                                    type={model.brand || undefined}
                                    holder={`${model.count} actif${model.count > 1 ? 's' : ''} dans le parc`}
                                    onOpen={() => onModelClick(model.id)}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    /* Un type inutilisable **ne s'excuse pas et ne clignote pas** (09.1,
                       colonne 3) : il dit la conséquence exacte, nommée sur ce type-ci,
                       et met à portée le geste qui la lève. L'avertissement seul laissait
                       la situation entière au lecteur. */
                    <div className="flex flex-col gap-3">
                        <div className="bg-surface-container text-body-small text-on-surface flex items-start gap-2.5 rounded-md p-3">
                            <Icon
                                glyph={Warning}
                                size={18}
                                className="mt-0.5 shrink-0 text-[var(--tk-color-st-ambre)]"
                            />
                            <span>
                                <strong>Aucun modèle.</strong> Tant qu'il n'y en a pas un, ce type
                                n'apparaît pas dans la création d'équipement : on ne peut pas créer{' '}
                                {indefiniteArticle(typeLabel)}.
                            </span>
                        </div>
                        <Button variant="filled" onClick={() => setIsAddModelOpen(true)}>
                            Ajouter le premier modèle
                        </Button>
                    </div>
                )}
            </section>

            {/* L'actif orphelin — la carte que 09.1 pose sous « Modèles » quand un type
                sans modèle porte pourtant des actifs. Ils ont été créés avant leur modèle,
                ou hors du catalogue : **leur fiche reste valide, c'est le référentiel qui
                est en retard sur elle**. Sans cette carte, le vide de la liste des modèles
                laisse croire que le type ne sert à rien. */}
            {categoryModels.length === 0 && categoryEquipment.length > 0 && (
                <section className="bg-surface rounded-lg p-4">
                    <div className="bg-surface-container text-body-small text-text-secondary flex items-start gap-2.5 rounded-md p-3">
                        <Icon
                            glyph={Info}
                            size={18}
                            className="text-text-secondary mt-0.5 shrink-0"
                        />
                        <span>
                            <strong className="text-on-surface font-medium">
                                {categoryEquipment.length === 1
                                    ? 'Un actif porte pourtant ce type'
                                    : `${categoryEquipment.length} actifs portent pourtant ce type`}
                            </strong>{' '}
                            —{' '}
                            {categoryEquipment
                                .slice(0, 2)
                                .map((item) => item.assetId)
                                .join(', ')}
                            {categoryEquipment.length > 2 &&
                                `, et ${categoryEquipment.length - 2} autre${categoryEquipment.length - 2 > 1 ? 's' : ''}`}
                            .
                            {categoryEquipment.length === 1
                                ? ' Il a été créé'
                                : ' Ils ont été créés'}{' '}
                            avant {categoryEquipment.length === 1 ? 'son modèle' : 'leur modèle'},
                            ou hors du catalogue.{' '}
                            {categoryEquipment.length === 1
                                ? 'Sa fiche reste valide'
                                : 'Leurs fiches restent valides'}{' '}
                            ; c'est le référentiel qui est en retard sur{' '}
                            {categoryEquipment.length === 1 ? 'elle' : 'elles'}.
                        </span>
                    </div>
                </section>
            )}

            {/* Section 3 : Note d'amortissement et actions */}
            <section className="bg-surface flex flex-col gap-3 rounded-lg p-4">
                <div className="bg-surface-container text-body-small text-text-secondary flex items-start gap-2.5 rounded-md p-3">
                    <Icon glyph={Info} size={18} className="text-text-secondary mt-0.5 shrink-0" />
                    <span>
                        Changer l'amortissement <strong>ne recalcule pas le passé</strong> : la
                        valeur des {categoryEquipment.length} actifs déjà créés suit le paramètre en
                        vigueur à leur acquisition.
                    </span>
                </div>

                {/* La même règle, sur l'autre paramètre du type — **un paramètre de type ne
                    réécrit pas le passé** (09.1, colonne 3). Le retrait du sélecteur ne
                    défait aucune attribution déjà faite ; sans cette phrase, un
                    gestionnaire qui bascule le type croit avoir repris les objets. */}
                {!isAssignable && assignedEquipmentCount > 0 && (
                    <div className="bg-surface-container text-body-small text-text-secondary flex items-start gap-2.5 rounded-md p-3">
                        <Icon
                            glyph={Warning}
                            size={18}
                            className="mt-0.5 shrink-0 text-[var(--tk-color-st-ambre)]"
                        />
                        <span>
                            <strong className="text-on-surface font-medium">
                                Le retrait du sélecteur ne défait pas les attributions faites.
                            </strong>{' '}
                            {assignedEquipmentCount === 1
                                ? 'Un actif de ce type reste attribué'
                                : `${assignedEquipmentCount} actifs de ce type restent attribués`}{' '}
                            ; seules les{' '}
                            <strong className="text-on-surface font-medium">prochaines</strong>{' '}
                            attributions ne le proposeront plus.
                        </span>
                    </div>
                )}

                {categoryEquipment.length > 0 && (
                    <Button
                        variant="text"
                        onClick={() => navigateToView('equipment')}
                        className="border-outline-variant text-body-medium text-on-surface hover:text-text-secondary flex min-h-12 w-full items-center justify-start gap-2.5 rounded-none border-t px-1 pt-2 text-left font-medium transition-colors"
                    >
                        <Icon glyph={CaretRight} size={18} className="text-text-secondary" />
                        <span>Voir les {categoryEquipment.length} actifs dans l'inventaire</span>
                    </Button>
                )}
            </section>

            <AddCategoryPage
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                categoryToEdit={category}
            />

            <AddModelPage
                isOpen={isAddModelOpen}
                onClose={() => setIsAddModelOpen(false)}
                initialType={category.name}
            />
        </DetailTemplate>
    );
};

export default CategoryDetailsPage;
