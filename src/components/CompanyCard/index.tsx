import CachedImage from '@app/components/Common/CachedImage';
import Link from 'next/link';
import { useState } from 'react';

interface CompanyCardProps {
  name: string;
  image: string;
  url: string;
}

const CompanyCard = ({ image, url, name }: CompanyCardProps) => {
  const [isHovered, setHovered] = useState(false);

  return (
    <Link href={url}>
      <a
        className={`relative flex h-32 w-56 transform-gpu cursor-pointer items-center justify-center p-8 shadow ring-1 transition duration-300 ease-in-out sm:h-36 sm:w-72 ${
          isHovered
            ? 'scale-105 bg-purple-700 ring-purple-500'
            : 'scale-100 bg-purple-800 ring-purple-700'
        } rounded-xl`}
        onMouseEnter={() => {
          setHovered(true);
        }}
        onMouseLeave={() => setHovered(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setHovered(true);
          }
        }}
        role="link"
        tabIndex={0}
      >
        <div className="relative h-full w-full">
          <CachedImage
            src={image}
            alt={name}
            className="relative z-40 h-full w-full"
            layout="fill"
            objectFit="contain"
          />
        </div>
        <div
          className={`absolute bottom-0 left-0 right-0 z-0 h-12 rounded-b-xl bg-gradient-to-t ${
            isHovered ? 'from-purple-800' : 'from-purple-900'
          }`}
        />
      </a>
    </Link>
  );
};

export default CompanyCard;
