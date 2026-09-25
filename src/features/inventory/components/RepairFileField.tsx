import React, { useRef } from 'react';
import { FileText, Paperclip } from '@phosphor-icons/react';

import Button from '../../../components/ui/Button';
import FilePicker from '../../../components/ui/FilePicker';
import Icon from '../../../components/ui/Icon';
import { FieldLabel } from '../../../components/ui/FormParts';
import { cn } from '../../../lib/utils';

/**
 * **Une pièce de réparation — devis, bon d'enlèvement, facture** (24/09).
 *
 * La forme du `.pick` : vide, la rangée appelle le fichier (« Joindre le devis ») ; choisi,
 * elle porte son nom et le verbe « Changer ». Le fichier ne part nulle part ici : la page
 * le garde au magasin local au moment du geste, comme le justificatif d'une dépense.
 */
interface RepairFileFieldProps {
    label: string;
    note?: string;
    /** Le verbe de la rangée vide : « Joindre le devis ». */
    appel: string;
    file: File | null;
    onChange: (file: File | null) => void;
    onReject?: (message: string) => void;
    /** Le champ manque encore alors qu'il est requis. */
    manquant?: boolean;
}

const RepairFileField: React.FC<RepairFileFieldProps> = ({
    label,
    note,
    appel,
    file,
    onChange,
    onReject,
    manquant = false,
}) => {
    const input = useRef<HTMLInputElement>(null);
    return (
        <div>
            <FieldLabel note={note}>{label}</FieldLabel>
            <FilePicker
                ref={input}
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onFiles={(_, files) => onChange(files[0] ?? null)}
                onReject={onReject}
            />
            <Button
                variant="text"
                layout="card"
                onClick={() => input.current?.click()}
                className={cn(
                    'bg-surface-container hover:bg-surface-container-high flex min-h-14 w-full items-center justify-start gap-3 rounded-[4px] px-3.5 py-2 text-left font-normal',
                    manquant && 'shadow-[inset_0_0_0_1.5px_var(--tk-color-st-ambre)]',
                )}
            >
                <span
                    className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]',
                        file ? 'bg-tint-bleu text-on-tint-bleu' : 'bg-surface text-text-tertiary',
                    )}
                >
                    <Icon glyph={file ? FileText : Paperclip} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                    <span
                        className={cn(
                            'text-ts-body leading-ts-body block truncate',
                            file ? 'text-on-surface font-medium' : 'text-text-tertiary',
                        )}
                    >
                        {file ? file.name : appel}
                    </span>
                    <span className="text-on-surface-variant text-ts-sub leading-ts-sub block truncate">
                        {file
                            ? `${Math.max(1, Math.round(file.size / 1024))} Ko`
                            : 'PDF ou photo, 5 Mo au plus'}
                    </span>
                </span>
                <span className="text-on-surface text-ts-control shrink-0 font-medium">
                    {file ? 'Changer' : 'Choisir'}
                </span>
            </Button>
        </div>
    );
};

export default RepairFileField;
