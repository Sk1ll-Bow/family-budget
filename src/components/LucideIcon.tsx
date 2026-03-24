import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface IIconProps extends LucideProps {
  name: string;
}

/**
 * Dynamically renders a Lucide icon by name.
 * Fallbacks to 'Circle' if the icon is not found.
 */
export function LucideIcon({ name, ...props }: IIconProps) {
  // @ts-ignore - Dynamic access to Icons
  const Icon = Icons[name] || Icons.Circle;
  return <Icon {...props} />;
}
