import { animer, mouvementReduit } from './mouvement';

/**
 * **Une célébration, une fois par campagne** (11/10).
 *
 * Valider un inventaire où tout a été retrouvé : quatorze formes partent du bouton, 700 ms,
 * puis plus rien. Ce sont les quatre signes LIVE de Neemba, chacun dans sa teinte : l'angle
 * (vert), le losange (jaune), le cercle (orange), le triangle (bleu).
 *
 * Elle ne paraît qu'à cet endroit : un aboutissement rare, que trois semaines de comptage
 * ont préparé. Sous « réduire les animations », rien ne part.
 */
const SIGNES: Array<(forme: HTMLElement) => void> = [
    /* L'angle : deux filets en équerre. */
    (forme) => {
        Object.assign(forme.style, {
            width: '9px',
            height: '9px',
            borderLeft: '3px solid var(--tk-color-live-vert)',
            borderBottom: '3px solid var(--tk-color-live-vert)',
        });
    },
    /* Le losange : un carré, que le vol fait tourner sur sa pointe. */
    (forme) => {
        Object.assign(forme.style, {
            width: '9px',
            height: '9px',
            background: 'var(--tk-color-live-ambre)',
        });
    },
    /* Le cercle : un anneau. */
    (forme) => {
        Object.assign(forme.style, {
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            border: '3px solid var(--tk-color-live-orange)',
        });
    },
    /* Le triangle : la moitié d'un carré, comme ceux du moulin. */
    (forme) => {
        Object.assign(forme.style, {
            width: '11px',
            height: '11px',
            background: 'var(--tk-color-live-bleu)',
            clipPath: 'polygon(0 0, 0 100%, 100% 100%)',
        });
    },
];

const NOMBRE = 14;

/** Le centre de ce qu'on vient d'actionner, ou celui de la fenêtre. */
export const origineDuGesteCourant = (): { x: number; y: number } => {
    const actif = document.activeElement;
    if (actif instanceof HTMLElement && actif !== document.body) {
        const cadre = actif.getBoundingClientRect();
        if (cadre.width > 0 && cadre.height > 0) {
            return { x: cadre.left + cadre.width / 2, y: cadre.top + cadre.height / 2 };
        }
    }
    return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
};

export const celebrer = (origine: { x: number; y: number }) => {
    if (mouvementReduit()) return;
    const scene = document.createElement('div');
    scene.setAttribute('aria-hidden', 'true');
    Object.assign(scene.style, {
        position: 'fixed',
        left: `${origine.x}px`,
        top: `${origine.y}px`,
        width: '0',
        height: '0',
        pointerEvents: 'none',
        zIndex: '130',
    });
    document.body.append(scene);

    let enVol = NOMBRE;
    for (let i = 0; i < NOMBRE; i += 1) {
        const forme = document.createElement('i');
        Object.assign(forme.style, {
            position: 'absolute',
            left: '0',
            top: '0',
            boxSizing: 'border-box',
            opacity: '0',
        });
        SIGNES[i % SIGNES.length](forme);
        scene.append(forme);

        const angle = (i / NOMBRE) * Math.PI * 2 + Math.random() * 0.4;
        const portee = 70 + Math.random() * 46;
        const x = Math.cos(angle) * portee;
        const y = Math.sin(angle) * portee;
        const vol = animer(
            forme,
            [
                { transform: 'translate(-50%, -50%) scale(0.4) rotate(0deg)', opacity: 1 },
                {
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y - 18}px)) scale(1) rotate(${140 + i * 20}deg)`,
                    opacity: 1,
                    offset: 0.6,
                },
                {
                    transform: `translate(calc(-50% + ${x * 1.08}px), calc(-50% + ${y + 26}px)) scale(0.8) rotate(${220 + i * 20}deg)`,
                    opacity: 0,
                },
            ],
            { duration: 700, easing: 'cubic-bezier(0.1, 0.7, 0.2, 1)' },
        );
        const finir = () => {
            enVol -= 1;
            if (enVol === 0) scene.remove();
        };
        if (vol) void vol.finished.then(finir, finir);
        else finir();
    }
};
