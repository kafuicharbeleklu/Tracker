import React from 'react';
import { ArrowLeft } from '@phosphor-icons/react';

import Icon from '../ui/Icon';
import Button from '../ui/Button';
import { SkeletonDetail } from '../ui/Skeleton';
import { OfflineBanner } from '../ui/ContextBanner';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useDelayedPending } from '../../hooks/useDelayedPending';
import { cn } from '../../lib/utils';

/**
 * Gabarit **fiche** — planche **04.2**, régime **00.3** / registre §2.43. Il porte
 * cinq écrans : équipement, utilisateur, modèle, catégorie, rôle.
 *
 * ## Le principe qui gouverne l'écran
 *
 * Une fiche répond d'abord à **« quel objet, dans quel état, chez qui, et quoi
 * faire »** — et cela tient sur le premier écran, **sans défilement**. Tout le reste
 * est de la **référence**, et la référence se consulte : elle est bornée, jamais
 * parcourue.
 *
 * Deux conséquences, et elles sont structurelles :
 *
 * - **Aucune zone ne défile à l'intérieur de la page.** L'« historique de vie » de
 *   l'écran actuel a son propre ascenseur ; il est borné à trois événements et
 *   renvoie vers l'écran d'Audit filtré, qui fait déjà ce travail — le dupliquer
 *   créerait une seconde source de vérité.
 * - **Aucune information n'est écrite deux fois.** Le porteur était annoncé en tête
 *   *et* répété en pied, avec deux libellés pour une seule destination.
 *
 * ## Un seul en-tête, et il porte l'identité
 *
 * « Détail équipement » ne dit rien qu'on ne sache déjà et coûte 56 px avant le
 * contenu. La barre porte **le code, l'identifiant et le menu** — c'est le seul
 * endroit où l'identité est écrite. Le crayon et le triangle deviennent des entrées
 * **nommées** dans ce menu : un triangle sans libellé peut vouloir dire « signaler
 * un problème » comme « il y a un problème ».
 *
 * **L'acte irréversible quitte le rang primaire** : il ne se tient pas à côté
 * d'« Attribuer », il descend au menu, derrière un séparateur, en danger.
 *
 * ## Deux colonnes, et une seule condition
 *
 * §2.43 n'accorde la bascule qu'à **une fiche, à partir de 1280 px** : le **sujet à
 * gauche** — héro et tout ce qui appelle un geste —, la **référence bornée à
 * droite**. En deçà, une colonne : à 768 px moins le rail il reste 632 px, et deux
 * colonnes y feraient 306 px, sous le plancher de 360 où une rangée
 * « étiquette · valeur » se casse en deux lignes.
 *
 * **Ce qui appelle un geste reste à gauche avec le sujet** — sinon deux colonnes
 * deviennent deux écrans.
 */

interface DetailTemplateProps {
    /** Le code de l'objet — l'identité, écrite ici et nulle part ailleurs. */
    code: React.ReactNode;
    /** L'identifiant technique, sous le code. Chiffres tabulaires. */
    reference?: React.ReactNode;
    onBack?: () => void;
    /** Le menu de débordement : les actes nommés, l'irréversible en dernier. */
    menu?: React.ReactNode;

    /** Le héro — un `DetailHero`. C'est la seule zone inversée de l'écran. */
    hero: React.ReactNode;
    /**
     * L'échec d'un acte engagé depuis le héro (17.1, règle 1) : il se pose **sous le
     * héro**, là où le geste a été engagé, et l'état de l'objet ne change pas.
     */
    error?: React.ReactNode;
    /**
     * Ce qui appelle un geste et reste donc **à gauche** en deux colonnes : une carte
     * d'incident en cours, un rappel d'action.
     */
    aside?: React.ReactNode;

    loading?: boolean;
    /** Les cartes de référence. */
    children?: React.ReactNode;
    className?: string;
}

/**
 * La bascule à deux colonnes de §2.43 — **une fiche, et à partir de 1280 px**.
 *
 * 1280 n'est **pas** un point de rupture du produit (600 · 840 · 1200 · 1600), et
 * c'est voulu : les seuils de `breakpoints.ts` décident du **régime de navigation**,
 * celui-ci décide d'une **mise en page de contenu**. Le registre le dérive du
 * plancher de 360 px sous lequel une rangée « étiquette · valeur » se casse en deux
 * lignes ; le reprendre à 1200 ferait basculer 80 px trop tôt sans que rien ne le
 * demande.
 */
const TWO_COLUMN = '(min-width: 1280px)';

const DetailTemplate: React.FC<DetailTemplateProps> = ({
    code,
    reference,
    onBack,
    menu,
    hero,
    error,
    aside,
    loading = false,
    children,
    className,
}) => {
    const twoColumn = useMediaQuery(TWO_COLUMN);
    const showSkeleton = useDelayedPending(loading);

    return (
        <div className={cn('flex min-h-0 min-w-0 w-full flex-1 flex-col', className)}>
            {/* L'identité n'est écrite qu'ici. */}
            <div className="flex min-h-14 items-center gap-1 border-b border-outline-variant bg-surface px-2 py-1">
                {onBack && (
                    <Button variant="text" iconOnly aria-label="Retour" onClick={onBack} className="shrink-0">
                        <Icon glyph={ArrowLeft} />
                    </Button>
                )}
                <div className="min-w-0 flex-1 px-1">
                    <p className="truncate font-brand text-base font-semibold leading-5 tracking-tight text-on-surface">
                        {code}
                    </p>
                    {reference && (
                        <p className="truncate text-label-small tabular-nums tracking-wide text-text-secondary">
                            {reference}
                        </p>
                    )}
                </div>
                {menu}
            </div>

            <OfflineBanner />

            {showSkeleton ? (
                <SkeletonDetail />
            ) : (
                <div className="flex flex-1 flex-col gap-5 px-5 py-4 medium:px-page">
                    <div
                        className={cn(
                            'mx-auto flex w-full gap-5',
                            twoColumn ? 'max-w-[1280px] items-start' : 'max-w-[960px] flex-col'
                        )}
                    >
                        {/* Le sujet, et tout ce qui appelle un geste. */}
                        <div className={cn('flex flex-col gap-5', twoColumn && 'w-[440px] shrink-0')}>
                            {hero}
                            {error}
                            {aside}
                        </div>

                        {/* La référence — bornée, jamais parcourue. */}
                        <div className="flex min-w-0 flex-1 flex-col gap-5">{children}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DetailTemplate;
