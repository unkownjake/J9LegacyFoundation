import {
  Info,
  Calendar,
  Heart,
  Users,
  GraduationCap,
  Award,
  HandHeart,
  HelpCircle,
  Sparkles,
  Tent,
  Volleyball,
  UmbrellaIcon,
  TreePine,
  Star,
  Navigation,
  Mail,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  info: Info,
  calendar: Calendar,
  heart: Heart,
  users: Users,
  "graduation-cap": GraduationCap,
  award: Award,
  "hand-heart": HandHeart,
  help: HelpCircle,
  sparkles: Sparkles,
  tent: Tent,
  volleyball: Volleyball,
  umbrella: UmbrellaIcon,
  tree: TreePine,
  star: Star,
  compass: Navigation,
  mail: Mail,
  alert: AlertCircle,
};

export function getIconComponent(name?: string): LucideIcon {
  if (!name) return Info;
  return ICONS[name] ?? Info;
}

export const iconChoices = Object.keys(ICONS);
