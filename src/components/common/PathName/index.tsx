'use client';
import { usePathname } from 'next/navigation';

export default function PathName() {
  const location = usePathname();
  return location;
}
