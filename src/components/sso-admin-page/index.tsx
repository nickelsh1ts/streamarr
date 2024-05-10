import { useState } from 'react';
import PlexOAuth from '@app/lib/PlexOAuth';
import LoginPage from '@app/components/login-page';

const AdminPage = () => (
    <div>Placeholder</div>
);

const AdminPageAuthChecker = () => {
    const [loggedIn, updateLoggedIn] = useState(false);
    PlexOAuth.on('loggedInStatus', updateLoggedIn);
    return loggedIn ? (<AdminPage />) : (<LoginPage />);
};

export default AdminPageAuthChecker;
