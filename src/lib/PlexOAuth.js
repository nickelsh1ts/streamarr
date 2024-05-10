import Cookie from './Cookie';
import { sleep } from './utils';

const PlexHeaders = {
    'Accept': 'application/json',
    'X-Plex-Product': 'PlexSSO',
    'X-Plex-Version': 'Plex OAuth',
    'X-Plex-Client-Identifier': 'PlexSSOv2'
};

const CsrfHeaderName = 'X-PlexSSO-CSRF-Token';

class EventEmitter {
    constructor() {
        this._listeners = {};
    }

    on(event, callback) {
        if (!this._listeners[event]) {
            this._listeners[event] = new Set();
        }
        this._listeners[event].add(callback);
    }

    emit(event, ...data) {
        if (this._listeners[event]) {
            for (let listener of this._listeners[event]) {
                listener(...data);
            }
        }
    }
}

class PlexLoginWindow {
    constructor() {
        this._window = null;
    }

    show() {
        const width = window.innerWidth || document.documentElement.clientWidth || window.screen.width;
        const height = window.innerHeight || document.documentElement.clientHeight || window.screen.height;
        const left = ((width / 2) - 300) + (window.screenLeft || window.screenX);
        const top = ((height / 2) - 350) + (window.screenTop || window.screenY);
        this._window = window.open('', 'PlexSSO', `scrollbars=yes, width=${600}, height=${700}, top=${top}, left=${left}`);
        if (window.focus) {
            this._window.focus();
        }
    }

    hide() {
        if (this._window) {
            this._window.close();
        }
    }

    goTo(url) {
        if (this._window) {
            this._window.location = url;
        }
    }

    isHidden() {
        return this._window && this._window.closed;
    }
}

class PlexOAuth extends EventEmitter {
    constructor() {
        super();
        this._window = new PlexLoginWindow();
        this._loggedInStatus = null;
    }

    _setLoggedInStatus(status) {
        if (this._loggedInStatus !== status) {
            this._loggedInStatus = status;
            this.emit('loggedInStatus', status);
        }
    }

    async _getPlexToken() {
        try {
            this._window.show();

            const {pin, code} = await this._getPlexOAuthPin();
            this._window.goTo(`https://app.plex.tv/auth/#!?clientID=${PlexHeaders['X-Plex-Client-Identifier']}&code=${code}`);

            let token = null;
            // eslint-disable-next-line no-constant-condition
            while(true) {
                const response = await fetch(`https://plex.tv/api/v2/pins/${pin}`, {
                    headers: PlexHeaders
                });

                const jsonData = await response.json();
                if (jsonData.authToken || this._window.isHidden()) {
                    token = jsonData.authToken;
                    break;
                }
                await sleep(1000);
            }
            this._window.hide();
            return token;
        }
        catch(e) {
            this._window.hide();
            console.error(e);
            return null;
        }
    }

    async _getPlexOAuthPin() {
        const response = await fetch('https://plex.tv/api/v2/pins?strong=true', {
            method: 'POST',
            headers: PlexHeaders
        });
        const jsonData = await response.json();
        return {
            pin: jsonData.id,
            code: jsonData.code
        };
    }

    async login(rememberMe, service, location, existingToken = null) {
        const token = existingToken || await this._getPlexToken();
        const csrfCookie = Cookie.getCookiesForString(document.cookie)
            .filter(cookie => cookie.getName() === CsrfHeaderName)
            .map(cookie => cookie.getValue())[0] || '';
        const response = await fetch('/api/v2/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-PlexSSO-For': service || '',
                'X-PlexSSO-Original-URI': location || '',
                [CsrfHeaderName]: csrfCookie
            },
            body: JSON.stringify({
                token: token,
            })
        });
        const json = await response.json();

        if (json.loggedIn && token && rememberMe) {
            localStorage.setItem('plex_token', token);
        }
        this._setLoggedInStatus(json);
        return json;
    }

    async logout() {
        await fetch('/api/v2/logout');
        localStorage.removeItem('plex_token');
        this._setLoggedInStatus({
            success: true,
            loggedIn: false,
            tier: 'NoAccess',
            accessBlocked: false,
            message: ''
        });
        return this._loggedInStatus;
    }

    async isLoggedIn(service, location) {
        if (this._loggedInStatus !== null) {
            return this._loggedInStatus;
        }

        const response = await fetch('/api/v2/sso', {
            headers: {
                'X-PlexSSO-For': service || '',
                'X-PlexSSO-Original-URI': location || ''
            }
        });
        const json = await response.json();
        if (json.loggedIn) {
            this._setLoggedInStatus(json);
            return this._loggedInStatus;
        }

        // remember me
        const storedToken = localStorage.getItem('plex_token');
        if (storedToken) {
            return await this.login(true, service, location, storedToken);
        }

        this._setLoggedInStatus({
            success: true,
            loggedIn: false,
            tier: 'NoAccess',
            accessBlocked: false,
            message: ''
        });
        return this._loggedInStatus;
    }
}

const singletonInstance = new PlexOAuth();
export default singletonInstance;
