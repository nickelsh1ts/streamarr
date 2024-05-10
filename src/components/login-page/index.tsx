
import PlexLogin from '@app/components/plex-login';
import './LoginPage.css';

const LoginPage = () => (
    <div className="login-page">
        <div className="card login-card">
            <PlexLogin />
        </div>
    </div>
);

export default LoginPage;
