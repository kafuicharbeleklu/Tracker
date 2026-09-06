/**
 * La force d'un mot de passe — planche 02.2, écran 2 : *« 12 caractères minimum. Une
 * phrase vaut mieux qu'un mot compliqué. »*
 *
 * La jauge a **quatre segments**, et c'est tout ce que l'écran dit : pas de mot
 * (« faible », « fort ») — un mot de plus serait une note sous le champ (R15). Ce qui
 * remplit un segment : la longueur (12, puis 16), la variété (deux familles de signes,
 * puis trois), et le fait de ne pas contenir l'adresse ni le nom de la personne. Le
 * plancher de 12 est le seul critère **bloquant** ; le reste guide.
 */

export const PASSWORD_MIN_LENGTH = 12;

export interface PasswordStrength {
    /** 0 à 4 segments remplis. */
    score: number;
    /** Vrai dès que le plancher de longueur est tenu. */
    acceptable: boolean;
}

const classesOf = (value: string): number =>
    [/[a-zà-ÿ]/i, /[A-ZÀ-Ý]/, /\d/, /[^A-Za-zÀ-ÿ0-9]/].filter((re) => re.test(value)).length;

const containsIdentity = (value: string, identity: string[]): boolean => {
    const lower = value.toLowerCase();
    return identity
        .flatMap((part) => part.toLowerCase().split(/[\s@.]+/))
        .filter((part) => part.length >= 3)
        .some((part) => lower.includes(part));
};

/**
 * @param value le mot de passe saisi
 * @param identity l'adresse et le nom de la personne — un mot de passe qui les
 *   contient perd un segment, jamais son acceptabilité.
 */
export const measurePasswordStrength = (
    value: string,
    identity: string[] = [],
): PasswordStrength => {
    if (!value) return { score: 0, acceptable: false };
    const longEnough = value.length >= PASSWORD_MIN_LENGTH;
    if (!longEnough) return { score: value.length >= 8 ? 1 : 0, acceptable: false };

    let score = 2;
    if (value.length >= 16) score += 1;
    if (classesOf(value) >= 3) score += 1;
    if (containsIdentity(value, identity)) score -= 1;
    return { score: Math.max(1, Math.min(4, score)), acceptable: true };
};
