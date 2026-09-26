import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Trash, X } from '@phosphor-icons/react';

import Button from './Button';
import FilePicker from './FilePicker';
import Icon from './Icon';
import { ShotBox } from './FormParts';
import { cn } from '../../lib/utils';
import { usePresence } from '../../hooks/usePresence';
import { useDerniereValeur } from '../../hooks/useDerniereValeur';

/**
 * **Les photos jointes à un acte** (25/09) — « Déclarer un incident », « Réceptionner le
 * retour ».
 *
 * Le champ ne gardait que le **nom** du fichier : la case montrait un appareil photo au lieu
 * de l'image, rien ne permettait de la regarder, et un toucher sur la case la **retirait**
 * sans prévenir — on la croyait ouverte, elle disparaissait. Le champ garde maintenant
 * l'image elle-même, le temps de l'acte :
 * - **la miniature** de chaque photo, à la taille de la case ;
 * - **un toucher l'ouvre en grand**, sur fond sombre, avec « Retirer la photo » ;
 * - **la croix du coin** la retire d'un geste, qui est cette fois un geste voulu.
 *
 * Les adresses locales (`URL.createObjectURL`) sont libérées au retrait, au vidage et au
 * démontage (`usePhotosJointes`). L'acte, lui, n'enregistre toujours que les noms.
 */
export interface PhotoJointe {
    id: string;
    nom: string;
    url: string;
}

let compteur = 0;

/** L'état des photos d'un formulaire, et la libération de leurs adresses locales. */
export const usePhotosJointes = () => {
    const [photos, setPhotos] = useState<PhotoJointe[]>([]);
    const courantes = useRef<PhotoJointe[]>([]);
    courantes.current = photos;

    useEffect(() => () => courantes.current.forEach((photo) => URL.revokeObjectURL(photo.url)), []);

    const ajouter = useCallback((fichiers: File[]) => {
        const nouvelles = fichiers.map((fichier) => {
            compteur += 1;
            return {
                id: `photo-${compteur}`,
                nom: fichier.name,
                url: URL.createObjectURL(fichier),
            };
        });
        setPhotos((prev) => [...prev, ...nouvelles]);
    }, []);

    const retirer = useCallback((id: string) => {
        const photo = courantes.current.find((entry) => entry.id === id);
        if (photo) URL.revokeObjectURL(photo.url);
        setPhotos((prev) => prev.filter((entry) => entry.id !== id));
    }, []);

    const vider = useCallback(() => {
        courantes.current.forEach((photo) => URL.revokeObjectURL(photo.url));
        setPhotos([]);
    }, []);

    return { photos, ajouter, retirer, vider };
};

interface PhotosJointesProps {
    photos: PhotoJointe[];
    onAjouter: (fichiers: File[]) => void;
    onRetirer: (id: string) => void;
    /** Ce que la case d'ajout dit à qui ne la voit pas : « Ajouter une photo de l'incident ». */
    labelAjout: string;
    /** Ce que la borne de taille a écarté, en une phrase prête à lire. */
    onRefus?: (message: string) => void;
}

const PhotosJointes: React.FC<PhotosJointesProps> = ({
    photos,
    onAjouter,
    onRetirer,
    labelAjout,
    onRefus,
}) => {
    const champ = useRef<HTMLInputElement>(null);
    const fermer = useRef<HTMLButtonElement>(null);
    const [ouverteId, setOuverteId] = useState<string | null>(null);
    const ouverte = photos.find((photo) => photo.id === ouverteId) ?? null;
    /* L'aperçu s'éclaircit en partant, sur la photo qu'il montrait (26/09). */
    const presence = usePresence(ouverte !== null);
    const montree = useDerniereValeur(ouverte);

    const clore = useCallback(() => setOuverteId(null), []);

    useEffect(() => {
        if (!ouverte) return;
        fermer.current?.focus();
        const touche = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                /* La feuille dessous écoute aussi Échap : l'aperçu se ferme seul. */
                event.stopPropagation();
                clore();
            }
        };
        window.addEventListener('keydown', touche, true);
        return () => window.removeEventListener('keydown', touche, true);
    }, [ouverte, clore]);

    return (
        <>
            <div className="flex flex-wrap gap-2">
                {photos.map((photo) => (
                    <div key={photo.id} className="relative h-14 w-14 shrink-0">
                        <button
                            type="button"
                            onClick={() => setOuverteId(photo.id)}
                            title={photo.nom}
                            aria-label={`Voir la photo ${photo.nom}`}
                            className="bg-surface-container focus-visible:ring-focus-ring block h-full w-full cursor-zoom-in overflow-hidden rounded-md outline-none focus-visible:ring-2"
                        >
                            <img
                                src={photo.url}
                                alt=""
                                className="block h-full w-full object-cover"
                            />
                        </button>
                        <button
                            type="button"
                            onClick={() => onRetirer(photo.id)}
                            aria-label={`Retirer la photo ${photo.nom}`}
                            className="bg-inverse-surface text-inverse-on-surface focus-visible:ring-focus-ring absolute -top-2 -right-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2"
                        >
                            <Icon glyph={X} size={18} />
                        </button>
                    </div>
                ))}
                <ShotBox
                    glyph={Camera}
                    label="ajouter"
                    aria-label={labelAjout}
                    onClick={() => champ.current?.click()}
                />
                <FilePicker
                    ref={champ}
                    accept="image/*"
                    multiple
                    onFiles={(_, fichiers) => {
                        if (fichiers.length > 0) onAjouter(fichiers);
                    }}
                    onReject={onRefus}
                />
            </div>

            {presence.monte &&
                montree &&
                createPortal(
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Photo ${montree.nom}`}
                        onAnimationEnd={presence.finDeSortie}
                        className={cn(
                            'bg-scrim/[0.94] fixed inset-0 z-[120] flex flex-col',
                            presence.sortant
                                ? 'mvt-voile-sortie pointer-events-none'
                                : 'mvt-voile-entree',
                        )}
                        onClick={(event) => {
                            if (event.target === event.currentTarget) clore();
                        }}
                    >
                        <header className="flex shrink-0 items-center gap-3 px-4 pt-3 pb-2 text-white">
                            <span className="min-w-0 flex-1 truncate text-[0.9375rem] leading-6 font-medium">
                                {montree.nom}
                            </span>
                            <Button
                                ref={fermer}
                                variant="text"
                                iconOnly
                                aria-label="Fermer l'aperçu"
                                onClick={clore}
                                className="bg-white/10 text-white hover:bg-white/20 hover:text-white"
                            >
                                <Icon glyph={X} size={20} />
                            </Button>
                        </header>
                        <div
                            className="flex min-h-0 flex-1 items-center justify-center p-4"
                            onClick={(event) => {
                                if (event.target === event.currentTarget) clore();
                            }}
                        >
                            <img
                                src={montree.url}
                                alt={`Photo ${montree.nom}`}
                                className="mvt-dialogue-entree block h-auto max-h-full w-auto max-w-full object-contain"
                            />
                        </div>
                        <footer className="flex shrink-0 justify-center px-4 pt-1 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
                            <Button
                                variant="text"
                                icon={<Icon glyph={Trash} size={20} />}
                                onClick={() => {
                                    onRetirer(montree.id);
                                    clore();
                                }}
                                className="bg-white/10 text-white hover:bg-white/20 hover:text-white"
                            >
                                Retirer la photo
                            </Button>
                        </footer>
                    </div>,
                    document.body,
                )}
        </>
    );
};

export default PhotosJointes;
