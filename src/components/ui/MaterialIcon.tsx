import React from 'react';
import type { Icon as PhosphorGlyph } from '@phosphor-icons/react';
import {
    Armchair,
    ArrowCounterClockwise,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowsClockwise,
    ArrowsOutCardinal,
    ArrowUUpLeft,
    CalendarBlank,
    Camera,
    CaretDown,
    CaretLeft,
    CaretRight,
    CaretUpDown,
    ChartBar,
    ChartLine,
    ChatTeardropText,
    Check,
    CheckCircle,
    CircleNotch,
    ClipboardText,
    ClockCountdown,
    ClockCounterClockwise,
    CornersOut,
    Cpu,
    Crosshair,
    CursorClick,
    Database,
    Desktop,
    DeviceMobile,
    Devices,
    DeviceTablet,
    DotsThree,
    DotsThreeVertical,
    DownloadSimple,
    EnvelopeSimple,
    Eye,
    FileText,
    Flask,
    FloppyDisk,
    Gear,
    HardDrive,
    HardDrives,
    Headphones,
    Hourglass,
    House,
    IdentificationBadge,
    Image,
    Info,
    Keyboard,
    Laptop,
    Layout,
    Lightning,
    List,
    ListChecks,
    Lock,
    LockKeyOpen,
    MagnifyingGlass,
    MagnifyingGlassMinus,
    MapPin,
    MapTrifold,
    Minus,
    Money,
    Monitor,
    Mouse,
    Network,
    Package,
    Palette,
    PencilSimple,
    Percent,
    Phone,
    PiggyBank,
    Play,
    Plus,
    Printer,
    Prohibit,
    QrCode,
    Question,
    Scroll,
    SealCheck,
    Shapes,
    ShieldCheck,
    ShieldStar,
    ShieldWarning,
    SignIn,
    SignOut,
    SlidersHorizontal,
    SpeakerHigh,
    SquaresFour,
    Stack,
    Star,
    Television,
    Translate,
    Trash,
    Tray,
    TreeStructure,
    TrendDown,
    UploadSimple,
    User,
    UserCheck,
    UserGear,
    UserPlus,
    Users,
    UsersThree,
    VideoCamera,
    Wallet,
    WarningCircle,
    WifiHigh,
    Wrench,
    X,
    XCircle,
} from '@phosphor-icons/react';

import { cn } from '../../lib/utils';

interface MaterialIconProps {
    /** Material Symbols icon name (e.g. 'dashboard', 'search', 'settings') */
    name: string;
    /** Size in pixels (default: 24) */
    size?: number;
    /** Whether icon should be filled (active state for nav, etc.) */
    filled?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Weight of the icon (100-700, default: 400) */
    weight?: number;
}

/**
 * **La table de `CORRESPONDANCE-ICONES.md`, appliquée à la source.**
 *
 * Les planches dessinent tous leurs glyphes en Phosphor (00.1, I1 à I3). Le produit en
 * portait encore en Material Symbols par ce composant — le geste d'ajout, la flèche d'une
 * liste déroulante, le dépôt de fichier, le formulaire d'un type — relevés sur 53 écrans
 * le 13/09. Plutôt que de retoucher chaque appel, le composant rend désormais le glyphe
 * Phosphor que la table désigne pour ce nom : tous les écrans basculent en une fois, et
 * la table reste la seule source du choix.
 *
 * Deux écarts assumés à la table, parce que le code les demande :
 * `fact_check` prend `ListChecks` (la table écrit un glyphe que Phosphor ne livre pas), et
 * `group_add` prend `UsersThree`, le glyphe de `groups`, faute d'entrée propre.
 */
const PHOSPHOR: Record<string, PhosphorGlyph> = {
    // Navigation et direction
    arrow_back: ArrowLeft,
    arrow_forward: ArrowRight,
    arrow_right_alt: ArrowRight,
    chevron_right: CaretRight,
    chevron_left: CaretLeft,
    arrow_drop_down: CaretDown,
    expand_more: CaretDown,
    unfold_more: CaretUpDown,
    south: ArrowDown,
    home: House,
    dashboard: SquaresFour,
    grid_view: SquaresFour,
    space_dashboard: Layout,
    more_vert: DotsThreeVertical,
    more_horiz: DotsThree,
    menu: List,
    list: List,
    // Gestes et acquittements
    add: Plus,
    remove: Minus,
    check: Check,
    check_circle: CheckCircle,
    task_alt: CheckCircle,
    close: X,
    cancel: XCircle,
    do_not_disturb_on: Prohibit,
    save: FloppyDisk,
    refresh: ArrowsClockwise,
    restart_alt: ArrowCounterClockwise,
    visibility: Eye,
    play_arrow: Play,
    login: SignIn,
    logout: SignOut,
    search: MagnifyingGlass,
    search_off: MagnifyingGlassMinus,
    tune: SlidersHorizontal,
    open_with: ArrowsOutCardinal,
    fit_screen: CornersOut,
    center_focus_strong: Crosshair,
    ads_click: CursorClick,
    edit: PencilSimple,
    delete: Trash,
    download: DownloadSimple,
    upload: UploadSimple,
    cloud_upload: UploadSimple,
    qr_code_scanner: QrCode,
    // États, alertes, attente
    error: WarningCircle,
    gpp_maybe: ShieldWarning,
    info: Info,
    help: Question,
    progress_activity: CircleNotch,
    hourglass_empty: Hourglass,
    pending_actions: ClockCountdown,
    history: ClockCounterClockwise,
    calendar_today: CalendarBlank,
    lock: Lock,
    lock_reset: LockKeyOpen,
    shield: ShieldCheck,
    security: ShieldCheck,
    verified: SealCheck,
    shield_person: ShieldStar,
    admin_panel_settings: ShieldStar,
    bolt: Lightning,
    science: Flask,
    star: Star,
    // Personnes et rôles
    person: User,
    person_add: UserPlus,
    manage_accounts: UserGear,
    how_to_reg: UserCheck,
    assignment_ind: IdentificationBadge,
    groups: UsersThree,
    group: Users,
    group_add: UsersThree,
    mail: EnvelopeSimple,
    email: EnvelopeSimple,
    comment: ChatTeardropText,
    phone: Phone,
    // Catégories d'actifs
    laptop: Laptop,
    monitor: Monitor,
    desktop_windows: Desktop,
    devices: Devices,
    keyboard: Keyboard,
    mouse: Mouse,
    smartphone: DeviceMobile,
    tablet: DeviceTablet,
    headphones: Headphones,
    speaker: SpeakerHigh,
    tv: Television,
    print: Printer,
    dns: HardDrives,
    storage: Database,
    router: WifiHigh,
    wifi: WifiHigh,
    lan: Network,
    photo_camera: Camera,
    videocam: VideoCamera,
    hard_drive: HardDrive,
    memory: Cpu,
    chair: Armchair,
    image: Image,
    // Métier
    inventory: Package,
    category: Shapes,
    assignment_return: ArrowUUpLeft,
    fact_check: ListChecks,
    task: ClipboardText,
    description: FileText,
    inbox: Tray,
    settings: Gear,
    account_balance_wallet: Wallet,
    payments: Money,
    savings: PiggyBank,
    build: Wrench,
    layers: Stack,
    translate: Translate,
    policy: Scroll,
    map: MapTrifold,
    pin_drop: MapPin,
    location_on: MapPin,
    account_tree: TreeStructure,
    palette: Palette,
    trending_down: TrendDown,
    show_chart: ChartLine,
    bar_chart: ChartBar,
    percent: Percent,
};

/** I2 — les quatre tailles du registre : 18 en ligne, 20 geste de rangée, 24 barre, 32 état vide. */
const registre = (size: number): 18 | 20 | 24 | 32 =>
    size <= 18 ? 18 : size <= 20 ? 20 : size <= 24 ? 24 : 32;

/**
 * Material Symbols Outlined icon component — **now an adapter to Phosphor.**
 *
 * A mapped name renders its Phosphor glyph at the nearest registry size, `filled`
 * becoming the `fill` weight. An unmapped name keeps the Material Symbols glyph, so
 * nothing disappears while the last names are migrated.
 *
 * @example
 * <MaterialIcon name="dashboard" />
 * <MaterialIcon name="home" filled size={20} />
 */
const MaterialIcon: React.FC<MaterialIconProps> = ({
    name,
    size = 24,
    filled = false,
    className,
    weight = 400,
}) => {
    const Glyph = PHOSPHOR[name];
    if (Glyph) {
        return (
            <Glyph
                size={registre(size)}
                weight={filled ? 'fill' : 'regular'}
                aria-hidden="true"
                focusable="false"
                className={cn('flex-none', className)}
            />
        );
    }

    return (
        <span
            className={cn('material-symbols-outlined select-none', className)}
            style={{
                fontSize: size,
                fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' ${size}`,
                lineHeight: 1,
                width: size,
                height: size,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            aria-hidden="true"
        >
            {name}
        </span>
    );
};

export default MaterialIcon;
