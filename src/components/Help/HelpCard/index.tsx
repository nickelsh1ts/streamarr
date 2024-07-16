import Link from 'next/link';
import type React from 'react';

type Anchors = {
  href: string;
  title: string;
};

type CardProps = {
  heading?: React.ReactNode;
  subheading?: React.ReactNode;
  anchors?: Anchors[];
  content?: React.ReactNode;
};

const HelpCard = ({ heading, subheading, anchors, content }: CardProps) => {
  return (
    <div className="mx-2 my-7 text-black">
      <div className="container mx-auto md:max-w-screen-md lg:max-w-screen-lg p-10 border border-primary shadow-xl rounded-md print:border-none print:shadow-none">
        <div className="text-2xl font-extrabold">{heading}</div>
        <div className="my-2">{subheading}</div>
        <ul className="list mt-4 mb-10">
          {anchors &&
            anchors.map((anchor, i) => {
              return (
                <li key={i}>
                  <Link
                    href={anchor.href}
                    className="link-primary scroll-smooth"
                    title={anchor.title}
                  >
                    {anchor.title}
                  </Link>
                </li>
              );
            })}
        </ul>
        <div className="">{content}</div>
      </div>
    </div>
  );
};

export default HelpCard;
