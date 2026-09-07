import React, { useEffect, useState } from 'react';

/**
 * **Une image de donnée, et ce qui la remplace quand elle manque.**
 *
 * Les planches disent la règle pour chaque emploi — *« sans photo, la rangée porte
 * l'initiale de la marque »* (09.2), *« jamais un cadre vide »* — et le code la tenait :
 * quand `image` est absente, la vignette porte son repli.
 *
 * **Mais une image qui échoue n'est pas une image absente**, et c'est là que la règle
 * cédait. Une adresse qui ne répond plus — une photo d'illustration hébergée ailleurs,
 * un réseau coupé, un fichier supprimé — laissait le navigateur poser son icône d'image
 * cassée : un pictogramme que le produit ne dessine nulle part, au milieu d'une rangée
 * par ailleurs juste. Relevé le 06/09 sur la fiche d'un type, dont un modèle sur deux
 * s'affichait ainsi.
 *
 * Pour le lecteur, les deux cas sont **le même fait** : il n'y a pas d'image. Ce
 * composant les traite donc pareil.
 */
interface ThumbnailProps {
    /** L'adresse de l'image. Absente, le repli s'affiche directement. */
    src?: string | null;
    /** Le texte de remplacement. Vide pour une image purement décorative. */
    alt: string;
    /** Ce que la vignette porte sans image : une initiale, un glyphe. */
    fallback: React.ReactNode;
    /** La classe de l'image elle-même — le cadre appartient à l'appelant. */
    className?: string;
}

const Thumbnail: React.FC<ThumbnailProps> = ({ src, alt, fallback, className }) => {
    const [echec, setEchec] = useState(false);

    /* Une nouvelle adresse mérite un nouvel essai : la précédente a pu échouer pour
       une raison qui ne concerne pas celle-ci. */
    useEffect(() => {
        setEchec(false);
    }, [src]);

    if (!src || echec) return <>{fallback}</>;

    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            onError={() => setEchec(true)}
            className={className}
        />
    );
};

export default Thumbnail;
