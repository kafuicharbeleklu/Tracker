import React, { forwardRef } from 'react';

import { getImportLimitBytes, partitionBySize, rejectionMessage } from '../../lib/fileImport';

/**
 * **Le champ de fichier caché**, et rien d'autre.
 *
 * Un `<input type="file">` n'a pas de dessin : il est déclenché par un bouton, et
 * c'est le bouton qu'on voit. Mais c'est un **contrôle natif**, et le registre veut
 * que les contrôles vivent parmi les primitives — sinon chaque écran qui joint une
 * pièce en pose un de plus, avec sa propre manière de lire `FileList` et de se
 * réinitialiser. Les deux pièges sont ici, une fois :
 *
 * - `FileList` n'est pas un tableau, et sous `strict: false` `Array.from` le rend en
 *   `unknown[]` : la lecture passe par `item(i)` ;
 * - sans remise à zéro de `value`, **rechoisir le même fichier ne déclenche rien** —
 *   l'événement `change` n'a rien changé.
 *
 * **La borne de 17.10 s'applique ici aussi** : 5 Mo par fichier. Un fichier au-delà
 * n'est pas remis à l'appelant, et `onReject` dit lequel et pourquoi — un refus muet
 * laisserait croire à une pièce jointe qui n'existe pas.
 */
interface FilePickerProps {
    accept?: string;
    multiple?: boolean;
    /** Les noms des fichiers choisis. Le produit ne stocke pas les fichiers eux-mêmes. */
    onFiles: (names: string[], files: File[]) => void;
    /** Ce que la borne a écarté, en une phrase prête à lire. */
    onReject?: (message: string) => void;
    /** La borne de 17.10 — 5 Mo par défaut. */
    maxSize?: number;
}

const FilePicker = forwardRef<HTMLInputElement, FilePickerProps>(
    ({ accept, multiple = false, onFiles, onReject, maxSize = getImportLimitBytes() }, ref) => (
        <input
            ref={ref}
            type="file"
            accept={accept}
            multiple={multiple}
            className="hidden"
            onChange={(event) => {
                const picked = event.target.files;
                const files: File[] = [];
                for (let index = 0; index < (picked?.length || 0); index += 1) {
                    const file = picked?.item(index);
                    if (file) files.push(file);
                }
                const { accepted, rejected } = partitionBySize(files, maxSize);
                const refus = rejectionMessage(rejected, maxSize);
                if (refus) onReject?.(refus);
                if (accepted.length > 0) {
                    onFiles(
                        accepted.map((file) => file.name),
                        accepted,
                    );
                }
                event.target.value = '';
            }}
        />
    ),
);

FilePicker.displayName = 'FilePicker';

export default FilePicker;
