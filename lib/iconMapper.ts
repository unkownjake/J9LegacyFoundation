import { Info, Calendar, Heart, Users, Star, Gift } from "lucide-react";

export const iconMap = {
  info: Info,
  calendar: Calendar,
  heart: Heart,
  users: Users,
  star: Star,
  gift: Gift,
};

export function getIconComponent(iconName: string) {
  return iconMap[iconName as keyof typeof iconMap] || Info;
}
