import {
  RoadIcon, DeleteIcon, FlashIcon, AlertCircleIcon, MagicWand01Icon,
  EyeIcon, Shield01Icon, CheckmarkCircle02Icon, ChampionIcon,
  Fire03Icon, StarIcon, MapPinIcon, UserIcon, Add01Icon, Logout01Icon,
  Cancel01Icon, Location01Icon, Mail01Icon, SecurityCheckIcon,
  Home01Icon, UserCircleIcon, Camera01Icon, AwardIcon,
} from '@hugeicons/core-free-icons';

const ICONS: Record<string, any> = {
  road: RoadIcon,
  trash: DeleteIcon,
  bolt: FlashIcon,
  alert: AlertCircleIcon,
  sparkles: MagicWand01Icon,
  eye: EyeIcon,
  shield: Shield01Icon,
  check: CheckmarkCircle02Icon,
  trophy: AwardIcon,
  flame: Fire03Icon,
  star: StarIcon,
  pin: MapPinIcon,
  user: UserIcon,
  plus: Add01Icon,
  logout: Logout01Icon,
  close: Cancel01Icon,
  location: Location01Icon,
  mail: Mail01Icon,
  otp: SecurityCheckIcon,
  home: Home01Icon,
  leaderboard: ChampionIcon,
  profile: UserCircleIcon,
  camera: Camera01Icon,
};

export function iconFor(key: string | undefined | null) {
  if (!key) return AlertCircleIcon;
  return ICONS[key] || AlertCircleIcon;
}
