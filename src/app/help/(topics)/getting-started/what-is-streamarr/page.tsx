import WhatIsStreamarr from '@app/components/Help/Topics/GettingStarted/WhatIsStreamarr';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Help Centre');

const WhatIsStreamarrPage = () => {
  return <WhatIsStreamarr />;
};
export default WhatIsStreamarrPage;
