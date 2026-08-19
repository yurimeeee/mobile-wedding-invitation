import { Flower } from 'lucide-react';

interface ParentNameProps {
  name: string;
  deceased: boolean;
  showDeceasedMark: boolean;
}

function ParentName({ name, deceased, showDeceasedMark }: ParentNameProps) {
  if (!name) return null;
  if (!deceased) return <>{name}</>;
  return (
    <>
      {showDeceasedMark ? (
        <Flower className="inline-block mr-0.5 align-[-0.1em]" style={{ width: '0.8em', height: '0.8em' }} strokeWidth={1.5} />
      ) : (
        '故 '
      )}
      {name}
    </>
  );
}

interface ParentsNamesProps {
  fatherName: string;
  fatherDeceased: boolean;
  motherName: string;
  motherDeceased: boolean;
  showDeceasedMark: boolean;
}

export function ParentsNames({ fatherName, fatherDeceased, motherName, motherDeceased, showDeceasedMark }: ParentsNamesProps) {
  const hasFather = !!fatherName;
  const hasMother = !!motherName;
  return (
    <>
      {hasFather && <ParentName name={fatherName} deceased={fatherDeceased} showDeceasedMark={showDeceasedMark} />}
      {hasFather && hasMother && ' · '}
      {hasMother && <ParentName name={motherName} deceased={motherDeceased} showDeceasedMark={showDeceasedMark} />}
    </>
  );
}
