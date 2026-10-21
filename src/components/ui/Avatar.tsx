import { useState } from 'react';
import { cx } from '../../lib/cx';
import s from './Avatar.module.css';

export interface AvatarProps {
  name: string;
  photoURL?: string | null;
  size?: number;
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/[\s@._-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + second).toUpperCase();
}

export function Avatar({ name, photoURL, size = 48, className }: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const showPhoto = Boolean(photoURL) && !broken;
  return (
    <span className={cx(s.avatar, className)} style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}>
      {showPhoto ? (
        <img
          className={s.img}
          src={photoURL ?? undefined}
          alt={name}
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
        />
      ) : (
        <span role="img" aria-label={name}>
          {initials(name)}
        </span>
      )}
    </span>
  );
}
