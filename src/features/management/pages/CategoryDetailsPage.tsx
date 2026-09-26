import React, { useMemo, useState } from 'react';
import {
    ChartLineDown,
    Cube,
    DotsThreeVertical,
    FolderOpen,
    Info,
    UserCheck,
    UserMinus,
    Warning,
} from '@phosphor-icons/react';
import FactRow from '../../../components/ui/FactRow';
import ListeBornee from '../../../components/ui/ListeBornee';
import { FormWarn } from '../../../components/ui/FormParts';
import { useData } from '../../../context/DataContext';
import { useAppNavigation } from '../../../hooks/useAppNavigation';
import DetailTemplate from '../../../components/layout/DetailTemplate';
import DetailHero from '../../../components/ui/DetailHero';
import ScreenState from '../../../components/ui/ScreenState';
import CardEmptyState from '../../../components/ui/CardEmptyState';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { MEDIA } from '../../../constants/breakpoints';
import { CATEGORY_LABELS, getCategoryLabel } from '../../../constants/glossary';
import AddModelPage from './AddModelPage';
import { useConfirmation } from '../../../context/ConfirmationContext';
import { useToast } from '../../../context/ToastContext';
import AddCategoryPage from './AddCategoryPage';
import Menu from '../../../components/ui/Menu';
import ListActionFab from '../../../components/ui/ListActionFab';
import { NOM_SUR_UNE_LIGNE } from '../../../lib/nomLong';
import { cn } from '../../../lib/utils';

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

    /* Du plus utilisé au moins utilisé (25/09) : la liste est bornée, les premiers visibles
       sont ceux qui comptent. */
    const categoryModels = useMemo(
        () =>
            category
                ? models
                      .filter((m) => m.type === category.name)
                      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'))
                : [],
        [category, models],
    );
    /* Les modèles en cartes quand la fiche a ses deux colonnes (≥ 1280, 23/09). */
    /* Les modèles en cartes dès 840 (24/09) : sous 1 280, la rangée courait sur 700 px
       pour porter un nom et un compte. */
    const enGrille = useMediaQuery(MEDIA.expandedUp);
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
                            <Icon glyph={DotsThreeVertical} size="geste" />
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
                        {
                            value: categoryEquipment.length,
                            label: 'actifs au parc',
                            /* Le renvoi vers la liste monte dans le héro (24/09) : il
                               vivait en petit lien au pied de la page. */
                            onClick:
                                categoryEquipment.length > 0
                                    ? () => navigateToView('equipment')
                                    : undefined,
                        },
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
            {/* **Les réglages du type, en rangées** (24/09). Trois rangées clé / valeur,
                dont une clé technique en police machine (« Laptop »), et la règle de
                l'amortissement exilée dans une carte d'avertissement au pied de la page.
                Chaque réglage dit maintenant ce qu'il fait, sa règle en dessous ; la clé de
                donnée, utile à l'import seulement, descend en pied de carte. */}
            <section className="bg-surface rounded-lg px-4 pb-3">
                <div className="flex min-h-12 items-center pt-2 pb-1">
                    <h3 className="text-on-surface text-ts-head leading-ts-head font-medium">
                        Réglages
                    </h3>
                </div>
                <FactRow
                    glyph={isAssignable ? UserCheck : UserMinus}
                    tint={isAssignable ? 'vert' : undefined}
                    title={isAssignable ? 'Attribuable à une personne' : 'Non attribuable'}
                    subtitle={
                        isAssignable
                            ? 'proposé dans le sélecteur d’attribution'
                            : 'reste en stock ou dans un lieu'
                    }
                />
                <FactRow
                    glyph={ChartLineDown}
                    tint="bleu"
                    title={`${depreciationMethod} sur ${depreciationYears} ans`}
                    subtitle={
                        categoryEquipment.length > 0
                            ? `ne recalcule pas les ${categoryEquipment.length} actifs existants`
                            : 'amortissement des prochains actifs'
                    }
                />
                <p className="text-text-muted border-outline-variant border-t pt-3 text-[0.75rem] leading-4">
                    Clé de donnée ·{' '}
                    {isDataKeyReleve ? (
                        <span className="text-text-secondary font-mono">{dataKey}</span>
                    ) : (
                        'à relever'
                    )}
                </p>
            </section>

            {/* Section 2 : Modèles référencés — sous le héro au bureau (23/09). */}
            <section data-colonne="gauche" className="bg-surface rounded-lg p-4">
                {/* `.ch` de 09.1 — le titre en 17 sur 24 et 500, le compte en 14 sur l'encre
                    secondaire, sans graisse : les deux étaient en 13 et en 600. */}
                <div className="mb-2 flex min-h-6 items-center justify-between gap-3">
                    <h3 className="text-on-surface text-ts-head leading-ts-head font-medium">
                        Modèles
                    </h3>
                    <span className="text-text-muted text-ts-sub leading-ts-sub tabular-nums">
                        {categoryModels.length}
                    </span>
                </div>

                {categoryModels.length > 0 ? (
                    /* La rangée du système (`ListRow`, 72 px, vignette 40) — c'est ce que
                       09.1 dessine sous « Modèles » : **la photo du modèle** à gauche, la
                       marque à droite de la ligne 1, le nombre d'unités en dessous. La
                       liste était une rangée maison de 56 px, sans vignette : un modèle se
                       reconnaît à sa marque et à son nom. Depuis le 23/09 la rangée porte
                       **l'initiale de la marque** et plus la photo, que l'aperçu de la fiche
                       du modèle ouvre en grand. */
                    <>
                        {enGrille ? (
                            /*
                              **Au bureau, un modèle est une carte** (23/09), comme un type dans
                              le catalogue et un local dans la fiche d'un site : l'initiale de la
                              marque, le nom, la marque, puis ce qu'il compte au parc. Par trois
                              dans la colonne de la fiche — deux rangées de 72 y faisaient une
                              liste de 140 px sous un héro de 180.
                            */
                            /* **Bornée** (25/09) : trois rangées de tuiles et demie (une de plus à la
                               demande), la suite défile dans la carte — elle grandissait avec
                               chaque modèle. */
                            <ListeBornee
                                hauteur={25.75}
                                pleineLargeur
                                label={`Les ${categoryModels.length} modèles`}
                            >
                                <ul className="large:grid-cols-3 grid grid-cols-2 gap-3">
                                    {categoryModels.map((model) => (
                                        <li key={model.id}>
                                            <Button
                                                variant="text"
                                                onClick={() => onModelClick(model.id)}
                                                className="bg-surface-container hover:bg-surface-container-high h-full min-h-28 w-full flex-col items-stretch justify-between gap-3 rounded-md p-3 text-left font-normal whitespace-normal"
                                            >
                                                <span className="flex items-center gap-3">
                                                    <span className="bg-surface text-on-surface-variant text-ts-control flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-semibold">
                                                        {(model.brand || model.name)
                                                            .trim()
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span
                                                            title={model.name}
                                                            className={cn(
                                                                'text-on-surface text-ts-body leading-ts-body font-medium',
                                                                NOM_SUR_UNE_LIGNE,
                                                            )}
                                                        >
                                                            {model.name}
                                                        </span>
                                                        {model.brand && (
                                                            <span className="text-on-surface-variant block truncate text-[0.75rem] leading-4">
                                                                {model.brand}
                                                            </span>
                                                        )}
                                                    </span>
                                                </span>
                                                <span>
                                                    <span className="font-brand text-on-surface text-ts-head leading-ts-head block font-semibold tabular-nums">
                                                        {model.count}
                                                    </span>
                                                    <span className="text-on-surface-variant block text-[0.75rem] leading-4">
                                                        actif{model.count > 1 ? 's' : ''} au parc
                                                    </span>
                                                </span>
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </ListeBornee>
                        ) : (
                            /* Bornée à six rangées et demie au téléphone (25/09, une de plus à la demande). */
                            <ListeBornee
                                hauteur={26}
                                pleineLargeur
                                label={`Les ${categoryModels.length} modèles`}
                            >
                                {categoryModels.map((model) => (
                                    <FactRow
                                        key={model.id}
                                        vignetteText={(model.brand || model.name)
                                            .trim()
                                            .charAt(0)
                                            .toUpperCase()}
                                        tint="bleu"
                                        title={model.name}
                                        subtitle={model.brand || undefined}
                                        figure={{
                                            value: model.count,
                                            unit: model.count > 1 ? 'actifs' : 'actif',
                                        }}
                                        onOpen={() => onModelClick(model.id)}
                                    />
                                ))}
                            </ListeBornee>
                        )}
                    </>
                ) : (
                    /* Un type inutilisable **ne s'excuse pas et ne clignote pas** (09.1,
                       colonne 3) : il dit la conséquence exacte, nommée sur ce type-ci.
                       **Dans la forme des vides de carte, et sans bouton** (25/09) : « Ajouter
                       le premier modèle » doublait le geste d'ajout de la page, flottant au
                       téléphone et dans l'en-tête au bureau. */
                    <CardEmptyState
                        glyph={Cube}
                        title="Aucun modèle"
                        description={`Tant qu'il n'y en a pas un, on ne peut pas créer ${indefiniteArticle(typeLabel)}.`}
                    />
                )}
            </section>

            {/* L'actif orphelin — la carte que 09.1 pose sous « Modèles » quand un type
                sans modèle porte pourtant des actifs. Ils ont été créés avant leur modèle,
                ou hors du catalogue : **leur fiche reste valide, c'est le référentiel qui
                est en retard sur elle**. Sans cette carte, le vide de la liste des modèles
                laisse croire que le type ne sert à rien. */}
            {categoryModels.length === 0 && categoryEquipment.length > 0 && (
                <section data-colonne="gauche" className="bg-surface rounded-lg p-4">
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

            {/* La règle du sélecteur, seule restante de la carte d'avertissements : celle
                de l'amortissement vit sous sa rangée, et le renvoi aux actifs dans le héro. */}
            {!isAssignable && assignedEquipmentCount > 0 && (
                <FormWarn glyph={Warning} tint="ambre">
                    <span>
                        <strong className="font-medium">
                            Le retrait du sélecteur ne défait pas les attributions faites.
                        </strong>{' '}
                        {assignedEquipmentCount === 1
                            ? 'Un actif de ce type reste attribué.'
                            : `${assignedEquipmentCount} actifs de ce type restent attribués.`}
                    </span>
                </FormWarn>
            )}

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
