import React from 'react';
import { ArrowLeft } from '@phosphor-icons/react';

import Icon from '../ui/Icon';
import Button from '../ui/Button';
import { SkeletonDetail } from '../ui/Skeleton';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useData } from '../../context/DataContext';
import { MEDIA } from '../../constants/breakpoints';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useDelayedPending } from '../../hooks/useDelayedPending';
import { IconGestureSizeContext } from '../../hooks/useIconGestureSize';
import { AddGesturePlacementContext } from '../../hooks/useAddGesturePlacement';
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
 *
 * ## Au bureau, la barre devient un en-tête — 17.11
 *
 * 17.11 consolide le chrome des neuf écrans de bureau et donne à la fiche sa forme
 * d'en-tête (`.dhead.fiche`) : **le retour, le nom en 28 sur 32 avec son fil dessous,
 * puis les actes** — sans filet, et sans la barre de 56 qui appartient au téléphone.
 * Le nom d'un objet n'est pas une étiquette de barre au bureau : c'est le titre de la
 * page, à la même marche que « Équipe » ou « Historique ».
 *
 * Et la bascule à deux colonnes prend les proportions de la planche — **7/12 et
 * 5/12**, sujet à gauche. Elle posait 440 px fixes à gauche : à 1512 la référence
 * recevait 760 px, soit une colonne de consultation plus large que le sujet.
 */

interface DetailTemplateProps {
    /** Le code de l'objet — l'identité, écrite ici et nulle part ailleurs. */
    code: React.ReactNode;
    /**
     * `.crumb` — **le fil, et seulement au bureau** (17.11) : « Inventaire physique ›
     * campagne en cours ». Il dit d'où l'on vient quand l'écran est un second niveau ;
     * au téléphone, le retour et le titre suffisent, et la barre de 56 n'a qu'un étage
     * (R16).
     */
    crumb?: React.ReactNode;
    /**
     * Les actes nommés de l'en-tête du bureau — `.hbtn.g` de 17.11, à gauche du ⋮.
     * Au téléphone ils restent dans le menu : la barre de 56 n'a pas la place, et un
     * acte nommé y vaut mieux qu'un glyphe de plus.
     */
    actions?: React.ReactNode;
    /*
     * **La barre n'a pas de sous-titre** — R16 : *« un seul étage, jamais de sous-titre »*,
     * et 17.8 l'écrit pour son premier slot. La fente `reference` en était un : elle
     * portait, sur les quatre fiches qui l'employaient, un fait que le héro écrit déjà
     * trois centimètres plus bas — le numéro d'actif, le rôle, le nom du type, la
     * catégorie de la demande. Deux étages faisaient aussi flotter le titre hors de l'axe
     * de la barre de 56. La fente est retirée pour qu'un cinquième appelant ne la
     * rouvre pas.
     */
    onBack?: () => void;
    /** Le menu de débordement : les actes nommés, l'irréversible en dernier. */
    menu?: React.ReactNode;
    /**
     * Le geste d'ajout d'une fiche — **le bouton flottant de 17.6**. Une fiche qui
     * contient une liste (les modèles d'un type, les unités d'un modèle) a un acte de
     * création, et cet acte ne se range pas en pied de carte : il flotte, comme sur les
     * listes.
     */
    fab?: React.ReactNode;

    /**
     * Le héro — un `DetailHero`. C'est la seule zone inversée de l'écran.
     *
     * **Optionnel : une fiche n'en a pas toujours une.** La fiche d'un type de
     * catalogue (09.1, colonne 2) enchaîne la barre d'identité et ses cartes sans
     * héro — parce qu'elle n'a pas de stock à énoncer : *« les actifs ne sont pas
     * listés ici, ils sont dans 04.1, et un second inventaire est une seconde
     * vérité »*. Sans héro, la bascule à deux colonnes n'a plus de sujet à tenir à
     * gauche : la fiche revient à **une colonne** de la mesure de lecture.
     */
    hero?: React.ReactNode;
    /**
     * L'échec d'un acte engagé depuis le héro (17.1, règle 1) : il se pose **sous le
     * héro**, là où le geste a été engagé, et l'état de l'objet ne change pas.
     */
    error?: React.ReactNode;
    /**
     * **L'accusé de clôture** (06.3) — il se pose **au-dessus du héro**, dans le fil de
     * la page : ce qui vient de se produire se lit avant l'état qui en résulte, et
     * l'écran ne le porte qu'un moment.
     */
    banner?: React.ReactNode;
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
/* La requête vit dans `MEDIA` : une constante privée échappe à la table des réponses
   du régime mobile, et c'est ce qui posait deux colonnes dans un cadre de 393. */

const DetailTemplate: React.FC<DetailTemplateProps> = ({
    code,
    crumb,
    actions,
    fab,
    onBack,
    menu,
    hero,
    error,
    banner,
    aside,
    loading = false,
    children,
    className,
}) => {
    const twoColumnCapable = useMediaQuery(MEDIA.twoColumn);
    /* La barre de 56 est une forme de téléphone ; au-delà, l'en-tête de 17.11. */
    const isCompact = useMediaQuery(MEDIA.compact);
    /*
     * **Le squelette se déclenche à l'hydratation, pas sur demande de la page.**
     * 17.3 pose trois formes pour vingt-huit écrans ; elles étaient définies et
     * **aucun écran ne les montrait**, parce que chaque page aurait dû penser à
     * passer `loading`, et aucune ne le faisait. L'attente est un fait de la couche
     * de données : le gabarit la lit lui-même. A5 tient toujours — `useDelayedPending`
     * ne montre rien avant 300 ms.
     */
    const { isHydrating } = useData();
    const showSkeleton = useDelayedPending(loading || isHydrating);
    /* 17.1, règle 2 : hors ligne, le geste qui écrit **disparaît**. Sur une fiche,
       c'est le bouton flottant — « Remettre », « Déclarer un incident ». Le bandeau
       qui vivait ici est retiré : la planche dit l'état par la forme de l'état vide,
       pas par une bande au-dessus du contenu. */
    const horsLigne = !useOnlineStatus();
    /* La colonne de gauche n'existe que si quelque chose la remplit. Vide, elle
       laissait 440 px de blanc à côté des cartes au-delà de 1280. */
    const twoColumn = twoColumnCapable && Boolean(hero || error || aside || banner);

    return (
        <div className={cn('flex min-h-0 w-full min-w-0 flex-1 flex-col', className)}>
            {/*
              `.tbar` — **la barre de 56 du composant partagé 17.8**, et ses trois
              mesures : intérieur `0 8 0 4` (asymétrique : le retour est un carré de 48
              qui porte déjà son air à gauche, le ⋮ à droite n'en a pas), gouttière 4, et
              un seul filet dessous.

              Elle tenait `px-2 py-1` et une gouttière de 4 en classe `gap-1` : 8 à
              gauche comme à droite, plus 4 de padding vertical qui poussaient la barre
              au-delà de 56 dès que la seconde ligne apparaissait.
            */}
            {isCompact ? (
                <div className="border-outline-variant bg-surface flex min-h-14 items-center gap-1 border-b pr-2 pl-1">
                    {onBack && (
                        <Button
                            variant="text"
                            iconOnly
                            aria-label="Retour"
                            onClick={onBack}
                            className="shrink-0"
                        >
                            <Icon glyph={ArrowLeft} />
                        </Button>
                    )}
                    <div className="min-w-0 flex-1 px-1">
                        {/* `.tid .code` de 17.8 — **17 sur 24**, Archivo 600, `-.01em`,
                            coupé à l'ellipse. Il valait 15/20, puis 16/20 : 04.2 écrit
                            bien 16, mais c'est la seule des quatre planches à barre —
                            05.2, 09.2 et 16.2 écrivent 17/24, et **17.8 le déclare pour
                            les huit écrans**. */}
                        <p className="font-brand text-on-surface truncate text-[17px] leading-6 font-semibold tracking-[-0.01em]">
                            {code}
                        </p>
                    </div>
                    {menu}
                </div>
            ) : (
                /*
                  `.dhead.fiche` — **le nom devient le titre de la page** : 28 sur 32,
                  le retour à sa gauche en carré de 40, les actes et le ⋮ à sa droite.
                  Pas de filet : le chrome du bureau n'en pose ni sous l'en-tête ni au
                  bord de la barre latérale (17.11).
                */
                <div className="px-page flex min-h-10 items-center gap-2 pt-5">
                    {onBack && (
                        <Button
                            variant="text"
                            iconOnly
                            aria-label="Retour"
                            onClick={onBack}
                            className="text-on-surface-variant hover:bg-surface-container hover:text-on-surface -ml-2.5 h-10 max-h-10 min-h-10 w-10 max-w-10 min-w-10 shrink-0 rounded-md"
                        >
                            <Icon glyph={ArrowLeft} size={20} />
                        </Button>
                    )}
                    <div className="min-w-0 flex-1">
                        <h1 className="font-brand text-on-surface truncate text-[28px] leading-8 font-semibold tracking-[-0.02em]">
                            {code}
                        </h1>
                        {crumb && (
                            <span className="text-text-muted block truncate text-[13px] leading-4">
                                {crumb}
                            </span>
                        )}
                    </div>
                    {/* Au bureau, les gestes d'en-tête sont des carrés de 40 (17.11). */}
                    <IconGestureSizeContext.Provider value={40}>
                        {actions}
                        {/* Le geste d'ajout monte dans l'en-tête, avant le ⋮ (17.11). */}
                        {!horsLigne && fab && (
                            <AddGesturePlacementContext.Provider value="header">
                                {fab}
                            </AddGesturePlacementContext.Provider>
                        )}
                        {menu}
                    </IconGestureSizeContext.Provider>
                </div>
            )}

            {showSkeleton ? (
                <SkeletonDetail />
            ) : (
                /* `.page` des fiches (04.2, 05.2, 09.2) : 16 d'écart, 16 de côté, 24 en
                   bas — remesuré le 10/09, le code portait 20 partout. Au bureau les
                   colonnes gardent le même 16 (`.zones{gap:16}`). */
                <div className="medium:px-page flex flex-1 flex-col gap-4 px-4 pt-4 pb-6">
                    <div
                        className={cn(
                            'mx-auto flex w-full gap-4',
                            twoColumn
                                ? 'max-w-[1280px] items-start'
                                : 'large:max-w-none max-w-[960px] flex-col',
                        )}
                    >
                        {/* Le sujet, et tout ce qui appelle un geste — **7 douzièmes**
                            (17.11). Il tenait 440 px fixes, ce qui laissait 760 px à la
                            référence : la colonne qu'on consulte était plus large que
                            celle où l'on agit. */}
                        {(hero || error || aside) && (
                            <div
                                className={cn(
                                    'flex flex-col gap-4',
                                    twoColumn && 'min-w-0 shrink grow-[7] basis-0',
                                )}
                            >
                                {banner}
                                {hero}
                                {error}
                                {aside}
                            </div>
                        )}

                        {/* La référence — bornée, jamais parcourue : **5 douzièmes**. */}
                        <div
                            className={cn(
                                'flex min-w-0 flex-col gap-4',
                                twoColumn ? 'shrink grow-[5] basis-0' : 'flex-1',
                            )}
                        >
                            {children}
                        </div>
                    </div>
                </div>
            )}

            {!horsLigne && isCompact && fab}
        </div>
    );
};

export default DetailTemplate;
