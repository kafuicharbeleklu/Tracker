/**
 * **La région d'un groupe de pays** — le titre d'un cartouche de la carte d'Emplacements
 * (10/10) : « Afrique de l'Ouest », « Europe ».
 *
 * Le référentiel ne porte que des noms de pays. Les régions sont celles de l'usage courant,
 * par code ISO ; un pays qui n'y figure pas ne reçoit pas de région inventée — son cartouche
 * prend son nom.
 */
const REGIONS: Record<string, string> = {
    'Afrique de l’Ouest': 'BJ BF CV CI GM GH GN GW LR ML MR NE NG SN SL TG',
    'Afrique du Nord': 'DZ EG LY MA TN SD EH',
    'Afrique centrale': 'AO CM CF TD CG CD GQ GA ST',
    'Afrique de l’Est': 'BI KM DJ ER ET KE MG MW MU MZ RW SC SO SS TZ UG ZM ZW',
    'Afrique australe': 'BW SZ LS NA ZA',
    Europe: 'AL AD AT BY BE BA BG HR CY CZ DK EE FI FR DE GR HU IS IE IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH UA GB VA',
    'Moyen-Orient': 'BH IR IQ IL JO KW LB OM PS QA SA SY TR AE YE',
    Asie: 'AF AM AZ BD BT BN KH CN GE IN ID JP KZ KG LA MY MV MN MM NP KP KR PK PH SG LK TW TJ TH TL TM UZ VN HK MO',
    'Amérique du Nord': 'CA US MX GL BM',
    'Amérique centrale et Caraïbes':
        'BZ CR SV GT HN NI PA CU DO HT JM BS BB TT AG DM GD KN LC VC PR',
    'Amérique du Sud': 'AR BO BR CL CO EC GY PY PE SR UY VE',
    Océanie: 'AU NZ FJ PG SB VU WS TO KI FM MH NR PW TV NC PF',
};

const REGION_DU_CODE = new Map<string, string>(
    Object.entries(REGIONS).flatMap(([region, codes]) =>
        codes.split(' ').map((code) => [code, region] as const),
    ),
);

/**
 * La région commune à ces pays ; « Afrique » quand ils en couvrent plusieurs du continent ;
 * rien s'ils n'ont pas de région commune.
 */
export const regionDesPays = (codes: readonly string[]): string | null => {
    const regions = new Set(codes.map((code) => REGION_DU_CODE.get(code) ?? null));
    if (regions.has(null) || regions.size === 0) return null;
    if (regions.size === 1) return [...regions][0];
    if ([...regions].every((region) => region?.startsWith('Afrique'))) return 'Afrique';
    return null;
};
