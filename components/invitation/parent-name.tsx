import { Flower } from 'lucide-react';

interface ParentNameProps {
  name: string;
  deceased: boolean;
  showDeceasedMark: boolean;
}

export function ParentName({ name, deceased, showDeceasedMark }: ParentNameProps) {
  if (!name) return null;
  if (!deceased) return <>{name}</>;
  return (
    <span className="inline-flex items-center gap-0.5">
      {showDeceasedMark ? <Flower className="h-3 w-3 shrink-0" /> : '故'}
      {name}
    </span>
  );
}
