interface useDeepLinksProps {
  plexUrl?: string;
  plexUrl4k?: string;
  iOSPlexUrl?: string;
  iOSPlexUrl4k?: string;
}

const useDeepLinks = ({
  plexUrl,
  plexUrl4k,
  iOSPlexUrl,
  iOSPlexUrl4k,
}: useDeepLinksProps) => {
  const isIOS =
    typeof navigator !== 'undefined' &&
    (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes('Mac') && navigator.maxTouchPoints > 1));

  const returnedPlexUrl = isIOS ? iOSPlexUrl : plexUrl;
  const returnedPlexUrl4k = isIOS ? iOSPlexUrl4k : plexUrl4k;

  return { plexUrl: returnedPlexUrl, plexUrl4k: returnedPlexUrl4k };
};

export default useDeepLinks;
