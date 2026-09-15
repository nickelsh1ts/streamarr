import AdminPrerolls from '@app/components/Admin/Prerolls';
import { generatePageMetadata } from '@app/utils/serverFetchHelpers';

export const generateMetadata = () => generatePageMetadata('Admin - Prerolls');

const PrerollsPage = () => <AdminPrerolls />;

export default PrerollsPage;
