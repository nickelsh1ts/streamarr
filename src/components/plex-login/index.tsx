import { Component } from 'react';
import PlexOAuth from '@app/lib//PlexOAuth';
import { LoginForm, LogoutForm } from '@app/components/login-logout-form';
import LoadingPlaceholder from '@app/components/common/loading-placeholder';
import AccessDeniedPage from '@app/components/access-denied-page';

class PlexLogin extends Component {
    state = {
        loggedInStatus: null,
        failedLogin: false,
        tier: '',
        message: ''
    };

    async componentDidMount() {
        const pathParams = this.getRedirectParams() || {
            service: '',
            path: '/'
        };
        const loggedInState = await PlexOAuth.isLoggedIn(pathParams.service, pathParams.path);
        this.setState({
            loggedInStatus: loggedInState.accessBlocked ? 'blocked' : loggedInState.loggedIn,
            failedLogin: loggedInState.success === false,
            tier: loggedInState.tier,
            message: loggedInState.message
        });
    }

    async login(rememberMe) {
        this.setState({
            loggedInStatus: 'transition'
        });

        const pathParams = this.getRedirectParams() || {
            service: '',
            path: '/'
        };
        const loginResult = await PlexOAuth.login(rememberMe, pathParams.service, pathParams.path);
        this.setState({
            loggedInStatus: loginResult.accessBlocked ? 'blocked' : loginResult.loggedIn,
            failedLogin: loginResult.loggedIn === false || loginResult.success === false,
            tier: loginResult.tier,
            message: loginResult.message
        });
    }

    async logout() {
        await PlexOAuth.logout();
        this.setState({
            loggedInStatus: false,
            failedLogin: false,
            tier: '',
            message: null
        });
    }

    getRedirectParams() {
        if (window.location.pathname !== '/' &&
            !!window.location.pathname &&
            !window.location.pathname.startsWith('/redirect/') &&
            !window.location.pathname.startsWith('/sso/')) {

            const location = window.location.pathname;
            const pathSplit = location.split('/');
            const service = pathSplit[1];
            const path = pathSplit.length < 2 ? '/' : location.substr(service.length + 1) + window.location.search;

            return {
                service,
                path,
                redirectPath: `/redirect/${service}${path}`
            };
        }
        return null;
    }

    checkRedirect() {
        const result = this.getRedirectParams();
        if (result && this.state.loggedInStatus !== 'blocked') {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => {
                    location.pathname = result.redirectPath;
                }, {
                    timeout: 1000
                });
            } else {
                setTimeout(() => {
                    location.pathname = result.redirectPath;
                  }, 1000);
            }
            return result.redirectPath;
        }
        return null;
    }

    render() {
        switch (this.state.loggedInStatus) {
            case 'blocked': return (<AccessDeniedPage message={this.state.message} />);
            case 'transition': return (<LoadingPlaceholder />);
            case true: return (<LogoutForm logout={this.logout.bind(this)} tier={this.state.tier} redirectTo={this.checkRedirect()} />);
            case false: return (<LoginForm login={this.login.bind(this)} failure={this.state.failedLogin} />);
            default: return (<LoadingPlaceholder />);
        }
    }
}

export default PlexLogin;
