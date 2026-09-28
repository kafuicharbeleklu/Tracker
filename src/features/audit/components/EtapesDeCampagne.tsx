import React from 'react';
import { ArrowUUpLeft, Check, CheckCircle, Lock } from '@phosphor-icons/react';

import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/Icon';
import { cn } from '../../../lib/utils';

type EtatDEtape = 'fait' | 'en_cours' | 'a_venir' | 'a_vous';

interface Signature {
    acteur: string;
    quand: string;
}

interface EtapesDeCampagneProps {
    etat: 'en_cours' | 'cloturee' | 'validee';
    lancee?: string;
    total: number;
    retrouves: number;
    scannes: number;
    manuels: number;
    ecartsATrancher: number;
    manquants: number;
    corrigees: number;
    /** Le modèle de la fiche corrigée, quand il n'y en a qu'une : la validation la nomme. */
    premiereCorrigee?: string;
    cloture?: Signature;
    validation?: Signature;
    renvoi?: Signature & { motif: string };
    peutCloturer: boolean;
    peutValider: boolean;
    onCloturer?: () => void;
    onValider?: () => void;
    onRenvoyer?: () => void;
}

const Pastille: React.FC<{ etat: EtatDEtape }> = ({ etat }) =>
    etat === 'fait' ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--tk-color-st-vert)] text-white">
            <Icon glyph={Check} size={18} className="scale-[0.7]" />
        </span>
    ) : etat === 'a_venir' ? (
        <span className="border-outline-variant h-5 w-5 shrink-0 rounded-full border-2" />
    ) : (
        <span
            className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                etat === 'a_vous'
                    ? 'border-[var(--tk-color-st-ambre)]'
                    : 'border-[var(--tk-color-st-bleu)]',
            )}
        >
            <span
                className={cn(
                    'h-2 w-2 rounded-full',
                    etat === 'a_vous'
                        ? 'bg-[var(--tk-color-st-ambre)]'
                        : 'bg-[var(--tk-color-st-bleu)]',
                )}
            />
        </span>
    );

const Etape: React.FC<{
    etat: EtatDEtape;
    titre: string;
    detail: React.ReactNode;
    derniere?: boolean;
    children?: React.ReactNode;
}> = ({ etat, titre, detail, derniere = false, children }) => (
    <li className="flex gap-3">
        <span className="flex flex-col items-center">
            <Pastille etat={etat} />
            {!derniere && (
                <span
                    className={cn(
                        'min-h-3 w-0.5 flex-1',
                        etat === 'fait' ? 'bg-[var(--tk-color-st-vert)]' : 'bg-outline-variant',
                    )}
                />
            )}
        </span>
        <span className={cn('min-w-0 flex-1', !derniere && 'pb-2.5')}>
            <span
                className={cn(
                    'block text-[0.875rem] leading-5',
                    etat === 'a_venir' ? 'text-text-secondary font-medium' : 'font-medium',
                    etat === 'en_cours' && 'font-semibold text-[var(--tk-color-on-tint-bleu)]',
                    etat === 'a_vous' && 'font-semibold text-[var(--tk-color-on-tint-ambre)]',
                )}
            >
                {titre}
            </span>
            <span className="text-text-secondary block text-[0.75rem] leading-4">{detail}</span>
            {children}
        </span>
    </li>
);

/**
 * **Les étapes de la campagne** (28/09) — lancée, comptage, clôture, validation, avec qui
 * et quand. Le bloc sombre disait « en cours » ; il ne disait pas ce qui venait ensuite, ni
 * qui devait le faire. Les gestes vivent à l'étape qu'ils font avancer : « Clôturer » au
 * comptage terminé, « Renvoyer » et « Valider » à la validation, pour le responsable — avec
 * ce que la validation va écrire, dit avant qu'elle l'écrive.
 */
const EtapesDeCampagne: React.FC<EtapesDeCampagneProps> = ({
    etat,
    lancee,
    total,
    retrouves,
    scannes,
    manuels,
    ecartsATrancher,
    manquants,
    corrigees,
    premiereCorrigee,
    cloture,
    validation,
    renvoi,
    peutCloturer,
    peutValider,
    onCloturer,
    onValider,
    onRenvoyer,
}) => {
    const comptage = `${retrouves} sur ${total}${
        scannes + manuels > 0 && etat !== 'en_cours'
            ? ` · ${scannes} scanné${scannes > 1 ? 's' : ''}, ${manuels} à la main`
            : ''
    }`;
    return (
        <section aria-label="La campagne" className="bg-surface rounded-xl px-[18px] py-4">
            <h2 className="text-on-surface mb-3 text-[1rem] leading-6 font-semibold">
                La campagne
            </h2>
            <ol className="flex flex-col">
                <Etape
                    etat="fait"
                    titre="Lancée"
                    detail={[
                        lancee ?? 'aucun comptage encore',
                        `${total} attendu${total > 1 ? 's' : ''}`,
                    ].join(' · ')}
                />
                <Etape
                    etat={etat === 'en_cours' ? 'en_cours' : 'fait'}
                    titre="Comptage"
                    detail={
                        etat === 'en_cours' && ecartsATrancher > 0
                            ? `${comptage} · ${ecartsATrancher} écart${ecartsATrancher > 1 ? 's' : ''} à trancher`
                            : comptage
                    }
                >
                    {etat === 'en_cours' && renvoi && (
                        <span className="mt-1 flex items-start gap-1.5 text-[0.75rem] leading-4 text-[var(--tk-color-on-tint-orange)]">
                            <Icon glyph={ArrowUUpLeft} size={18} className="-my-px shrink-0" />
                            <span>
                                Renvoyée par {renvoi.acteur}, {renvoi.quand} : « {renvoi.motif} »
                            </span>
                        </span>
                    )}
                </Etape>
                <Etape
                    etat={etat === 'en_cours' ? 'a_venir' : 'fait'}
                    titre="Clôture"
                    detail={
                        cloture
                            ? `${cloture.acteur} · ${cloture.quand}`
                            : ecartsATrancher > 0
                              ? 'une fois les écarts tranchés'
                              : 'par qui compte, quand tout est vu'
                    }
                >
                    {etat === 'en_cours' && peutCloturer && onCloturer && (
                        <Button
                            variant="outlined"
                            size="sm"
                            onClick={onCloturer}
                            className="mt-2 h-9 min-h-9 gap-1.5 px-3 text-[0.8125rem]"
                        >
                            <Icon glyph={Lock} size={18} />
                            Clôturer la campagne
                        </Button>
                    )}
                </Etape>
                <Etape
                    derniere
                    etat={etat === 'validee' ? 'fait' : etat === 'cloturee' ? 'a_vous' : 'a_venir'}
                    titre={
                        etat === 'cloturee'
                            ? peutValider
                                ? 'Validation — à vous'
                                : 'Validation — en attente'
                            : 'Validation'
                    }
                    detail={
                        validation
                            ? `${validation.acteur} · ${validation.quand}`
                            : 'par un responsable d’inventaire'
                    }
                />
            </ol>

            {etat === 'cloturee' && (
                <>
                    <div className="bg-surface-container mt-3.5 rounded-md px-3.5 py-3">
                        <p className="text-text-secondary mb-1.5 text-[0.75rem] leading-4 font-semibold">
                            Ce que la validation fera
                        </p>
                        <ul className="text-on-surface list-disc pl-4 text-[0.8125rem] leading-[1.1875rem]">
                            <li>
                                {manquants > 0 ? (
                                    <>
                                        <b className="font-semibold">
                                            {manquants} actif{manquants > 1 ? 's' : ''}
                                        </b>{' '}
                                        passe{manquants > 1 ? 'nt' : ''} manquant
                                        {manquants > 1 ? 's' : ''} et quitte
                                        {manquants > 1 ? 'nt' : ''} le lieu
                                    </>
                                ) : (
                                    'aucun actif ne passe manquant'
                                )}
                            </li>
                            {corrigees === 1 && premiereCorrigee ? (
                                <li>
                                    la fiche corrigée du{' '}
                                    <b className="font-semibold">{premiereCorrigee}</b> est gardée
                                </li>
                            ) : (
                                corrigees > 0 && (
                                    <li>
                                        les {corrigees} fiches corrigées pendant le comptage sont
                                        gardées
                                    </li>
                                )
                            )}
                            <li>le relevé devient définitif</li>
                        </ul>
                    </div>
                    {peutValider && (
                        <div className="mt-3.5 flex gap-2">
                            <Button
                                variant="outlined"
                                onClick={onRenvoyer}
                                className="h-10 min-h-10 flex-1 gap-1.5 px-3 text-[0.875rem]"
                            >
                                <Icon glyph={ArrowUUpLeft} size={18} />
                                Renvoyer
                            </Button>
                            <Button
                                variant="filled"
                                onClick={onValider}
                                className="h-10 min-h-10 flex-[1.4] gap-1.5 px-3 text-[0.875rem]"
                            >
                                <Icon glyph={CheckCircle} size={18} />
                                Valider l’inventaire
                            </Button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default EtapesDeCampagne;
