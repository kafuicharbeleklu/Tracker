import React from 'react';
import { Password, Signature, type Icon as PhosphorGlyph } from '@phosphor-icons/react';

import Badge from './Badge';
import Icon from './Icon';
import { codeDAttestation } from '../../lib/attestation';
import type { AttestationMethod } from '../../types';

/**
 * **Par quoi une étape a été attestée** — un badge, une icône (09/10).
 *
 * Sous chaque parcours, une section « Les signatures » posait un bloc de deux phrases par
 * étape signée : *« Signature tracée par Kofi Mensah — tracée sur l'appareil au moment de
 * l'acte ; l'image n'est pas conservée »*. Le commanditaire : *« ça vient surcharger
 * inutilement les pages »*. Ce qu'il faut savoir tient en un mot posé sur l'étape elle-même :
 * signée, validée par le code, ou les deux.
 */
const BADGE: Record<AttestationMethod, { glyph: PhosphorGlyph; libelle: string }> = {
    pin: { glyph: Password, libelle: 'Code PIN' },
    signature: { glyph: Signature, libelle: 'Signature' },
    'pin+signature': { glyph: Signature, libelle: 'Signature · PIN' },
};

const BadgeDAttestation: React.FC<{ methode?: string; className?: string }> = ({
    methode,
    className,
}) => {
    const code = codeDAttestation(methode);
    if (!code) return null;
    const { glyph, libelle } = BADGE[code];
    return (
        <Badge variant="neutral" className={className}>
            <Icon glyph={glyph} size={18} className="mr-1 shrink-0" />
            {libelle}
        </Badge>
    );
};

export default BadgeDAttestation;
