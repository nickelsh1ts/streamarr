
import LoginRedirectLink from '@app/components/login-redirect-link';

const LogoutForm = ({ logout, redirectTo, tier }) => {
    return (
        <form id="logoutForm" onSubmit={(e) => {e.preventDefault(); logout()}}>
            <div className="alert alert-danger" role="alert" style={{display: tier === 'NoAccess' ? 'block' : 'none'}}>
                You are logged in but do not have access.<br/>
                Please ask for access and try again.
            </div>
            <br />
            {
                redirectTo ? (<LoginRedirectLink redirectTo={redirectTo} />) : (void(0))
            }
            <button type="submit" className="btn btn-danger" onClick={logout}>Logout</button>
        </form>
    );
};

export default LogoutForm;
