import React, { useId, useState } from 'react';
import { cn } from '../../lib/utils';
import BottomSheet from './BottomSheet';
import Button from './Button';
import { FabContainer } from './FabContainer';
import FloatingActionButton from './FloatingActionButton';
import MaterialIcon from './MaterialIcon';

/**
 * Un acte du geste d'ajout — une rangée de 48 px dans la feuille.
 *
 * `disabledReason` est le seul ajout de la planche : **un acte impossible reste
 * visible et dit pourquoi**, en quatre à six mots à droite de son libellé. Le
 * retirer laisse chercher un geste dont on sait qu'il existe.
 */
interface ListActionFabItem {
    id: string;
    label: string;
    icon: string;
    onSelect: () => void;
    disabled?: boolean;
    /** La condition, en quatre à six mots : « Une session tourne déjà ». */
    disabledReason?: string;
}

interface ListActionFabProps {
    /** Le sujet du geste — « équipement », « compte ». Sert aux libellés d'accès. */
    label: string;
    sheetTitle?: string;
    actions: ListActionFabItem[];
    className?: string;
}

/**
 * Le geste d'ajout — **planche 17.6, composant partagé, 6 emplois**.
 *
 * ## Un seul ancrage, et il se calcule
 *
 * **56 px de barre du bas + 20 px de gouttière = 76 px du bas, 20 px à droite.**
 * Il ne se choisit pas par page, parce que la barre ne change pas de hauteur d'une
 * page à l'autre. Le produit en portait **quatre** pour la même barre — 88 (le défaut
 * de ce composant, `calc(safe-area + 5.5rem)`), 80 (une correction manuelle), 76 (les
 * deux copies écrites à la main, la seule juste), et 24 (le défaut de `FabContainer`,
 * qui pose le bouton **sur** la case « Plus »).
 *
 * **La zone sûre s'ajoute aux 76 px ; elle ne les remplace pas** — c'est exactement ce
 * que faisait `calc(safe-area + 5.5rem)`, en écrasant le calcul par une constante.
 *
 * ## La feuille commence à deux
 *
 * **Sur un acte unique, le bouton fait l'acte directement.** Ouvrir un voile, monter
 * une feuille et écrire un titre pour y trouver un seul bouton, c'est deux gestes là
 * où un suffit. Son `aria-label` porte alors l'acte, pas « ouvrir les actions ».
 *
 * **Le premier acte est plein, les suivants bordés** : dans un ajout il y a toujours
 * un chemin ordinaire — on saisit — et des variantes — on importe, on scanne. Le code
 * faisait l'inverse par défaut (`variant ?? 'outlined'` : tout bordé sauf si la page
 * pensait à demander autre chose), et deux pages sur six y pensaient.
 *
 * ## Ce que le bouton ne fait jamais
 *
 * **Il n'est pas désactivable en bloc.** Un bouton flottant grisé est un rond gris
 * sans rien à côté de lui pour dire pourquoi. Si tous les actes sont impossibles, ce
 * sont **les actes** qui le disent — ils ont une rangée entière pour cela. La prop
 * `disabled` du composant est donc sortie ; l'interdit du brief §4 porte sur le
 * bouton, pas sur les actes de sa feuille.
 *
 * **Il ne cohabite pas avec la sélection** — la barre d'actes groupés de 17.2 prend le
 * bas de l'écran. C'est à la page de ne pas le poser dans ce régime.
 */
const ListActionFab: React.FC<ListActionFabProps> = ({ label, sheetTitle, actions, className }) => {
    const [open, setOpen] = useState(false);
    const sheetId = `list-action-sheet-${useId().replace(/:/g, '')}`;

    /* Une page qui n'a aucun acte n'a pas de geste d'ajout : elle ne pose pas le
       bouton. Ce n'est pas le cas interdit par la planche — celui-là est le bouton
       qui **s'évapore selon la donnée**, une liste qui rétrécit jusqu'à zéro. */
    if (actions.length === 0) return null;

    /** L'acte unique se fait au bouton ; la feuille commence à deux. */
    const soleAction = actions.length === 1 ? actions[0] : null;

    return (
        <>
            <FabContainer description={`Actions ${label}`} className={className}>
                <FloatingActionButton
                    icon="add"
                    size="medium"
                    variant="primary"
                    className="bg-primary text-on-primary"
                    aria-label={soleAction ? soleAction.label : `Ouvrir les actions ${label}`}
                    aria-controls={soleAction ? undefined : sheetId}
                    aria-expanded={soleAction ? undefined : open}
                    onClick={() => (soleAction ? soleAction.onSelect() : setOpen(true))}
                />
            </FabContainer>

            {!soleAction && (
                <BottomSheet
                    id={sheetId}
                    open={open}
                    onClose={() => setOpen(false)}
                    title={sheetTitle ?? `Actions ${label}`}
                >
                    <div className="flex flex-col gap-2.5">
                        {actions.map((action, index) => (
                            <Button
                                key={action.id}
                                /* Le chemin ordinaire d'abord, plein ; les variantes
                                   bordées. La position décide, pas la page. */
                                variant={index === 0 ? 'filled' : 'outlined'}
                                className={cn(
                                    'min-h-12 w-full justify-start',
                                    action.disabledReason && 'gap-2.5',
                                )}
                                icon={<MaterialIcon name={action.icon} size={20} />}
                                disabled={action.disabled}
                                onClick={() => {
                                    setOpen(false);
                                    action.onSelect();
                                }}
                            >
                                {action.label}
                                {action.disabled && action.disabledReason && (
                                    <span className="text-text-muted ml-auto text-right text-[11px] leading-[15px] font-normal">
                                        {action.disabledReason}
                                    </span>
                                )}
                            </Button>
                        ))}
                    </div>
                </BottomSheet>
            )}
        </>
    );
};

export default ListActionFab;
