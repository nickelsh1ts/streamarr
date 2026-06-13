import axios from 'axios';
import Bowser from 'bowser';

export type PlexPinStatus = 'pending' | 'authorized' | 'expired';

interface PlexPinSession {
  id: string;
  authUrl: string;
  expiresAt: string;
}

/**
 * Client side of the server-driven Plex sign-in flow.
 *
 * The server owns the entire pin lifecycle (creation, plex.tv polling, token
 * exchange); this class only manages the popup and polls streamarr for the
 * pin status. `login()` resolves with an opaque pin session id, which the
 * caller passes to the relevant endpoint (`/auth/plex`, `/signup/plexauth`,
 * `/user/:id/settings/linked-accounts/plex`) as `pinId`. The Plex auth token
 * itself never reaches the browser.
 */
class PlexOAuth {
  private pin?: PlexPinSession;
  private popup?: Window;

  public preparePopup(): void {
    // Close any popup left over from a previous attempt before opening a new
    // one, so repeated sign-ins on the shared instance don't leak a window.
    this.closePopup();
    this.openPopup({ title: 'Plex Auth', w: 600, h: 700 });
  }

  public async login(): Promise<string> {
    const browser = Bowser.getParser(window.navigator.userAgent);
    const response = await axios.post<PlexPinSession>('/api/v1/auth/plex/pin', {
      client: {
        platform: browser.getBrowserName(),
        platformVersion: browser.getBrowserVersion(),
        device: browser.getOSName(),
        screenResolution: window.screen.width + 'x' + window.screen.height,
      },
    });
    this.pin = response.data;

    if (!this.popup || this.popup.closed) {
      throw new Error(
        'Unable to open the Plex login window. Please allow popups for this site and try again.'
      );
    }

    this.popup.location.href = this.pin.authUrl;

    return this.pinPoll();
  }

  private async pinPoll(): Promise<string> {
    // popup.closed can be unreliable after cross-origin navigations, so poll until Plex PIN expires.
    // However, we still check popup.closed to catch manual popup closures before navigation.
    const deadline = Date.now() + 15 * 60 * 1000;

    const executePoll = async (
      resolve: (pinId: string) => void,
      reject: (e: Error) => void
    ) => {
      try {
        if (!this.pin) {
          throw new Error('Unable to poll when pin is not initialized.');
        }

        const response = await axios.get<{ status: PlexPinStatus }>(
          `/api/v1/auth/plex/pin/${this.pin.id}`
        );

        if (response.data.status === 'authorized') {
          this.closePopup();
          resolve(this.pin.id);
          return;
        }

        if (this.popup?.closed) {
          reject(new Error('Popup closed without completing login'));
          return;
        }

        if (response.data.status === 'expired' || Date.now() >= deadline) {
          this.closePopup();
          reject(new Error('Plex sign-in expired before login completed.'));
        } else {
          setTimeout(executePoll, 2000, resolve, reject);
        }
      } catch (e) {
        this.closePopup();
        reject(e);
      }
    };

    return new Promise(executePoll);
  }

  private closePopup(): void {
    this.popup?.close();
    this.popup = undefined;
  }

  private openPopup({
    title,
    w,
    h,
  }: {
    title: string;
    w: number;
    h: number;
  }): Window | void {
    if (typeof window === 'undefined') {
      throw new Error(
        'Window is undefined. Are you running this in the browser?'
      );
    }
    // Fixes dual-screen position
    const dualScreenLeft =
      window.screenLeft != undefined ? window.screenLeft : window.screenX;
    const dualScreenTop =
      window.screenTop != undefined ? window.screenTop : window.screenY;
    const width = window.innerWidth
      ? window.innerWidth
      : document.documentElement.clientWidth
        ? document.documentElement.clientWidth
        : screen.width;
    const height = window.innerHeight
      ? window.innerHeight
      : document.documentElement.clientHeight
        ? document.documentElement.clientHeight
        : screen.height;
    const left = width / 2 - w / 2 + dualScreenLeft;
    const top = height / 2 - h / 2 + dualScreenTop;

    //Set url to signin/plex/loading so browser doesn't block popup
    const newWindow = window.open(
      '/signin/plex/loading',
      title,
      'scrollbars=yes, width=' +
        w +
        ', height=' +
        h +
        ', top=' +
        top +
        ', left=' +
        left
    );
    if (newWindow) {
      newWindow.focus();
      this.popup = newWindow;
      return this.popup;
    }
  }
}

export default PlexOAuth;
