import type { NotificationAgentEmail } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import Email from 'email-templates';
import net from 'node:net';
import tls from 'node:tls';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { URL } from 'url';
import { openpgpEncrypt } from './openpgpEncrypt';

const PUBLIC_LOGO_URL =
  'https://raw.githubusercontent.com/nickelsh1ts/streamarr/refs/heads/develop/public/logo_full.png';
const SMTP_CONNECTION_TIMEOUT = 30_000;

export const getEmailLogo = (
  usePublicLogo = getSettings().notifications.agents.email.options
    .usePublicLogo ?? false
): string => {
  const { applicationUrl, customLogo } = getSettings().main;

  return usePublicLogo
    ? PUBLIC_LOGO_URL
    : `${applicationUrl}${customLogo || '/logo_full.png'}`;
};

const getSocket: SMTPTransport.Options['getSocket'] = (options, callback) => {
  if (!options.host || typeof options.port !== 'number') {
    callback(new Error('SMTP host and port are required'), undefined);
    return;
  }

  const socket = options.secure
    ? tls.connect({
        host: options.host,
        port: options.port,
        servername: options.host,
        ...options.tls,
      })
    : net.connect({ host: options.host, port: options.port });
  let settled = false;
  const connectionTimeout = setTimeout(() => {
    if (settled) {
      return;
    }

    settled = true;
    cleanup();
    socket.destroy();
    callback(new Error('SMTP connection timed out'), undefined);
  }, options.connectionTimeout ?? SMTP_CONNECTION_TIMEOUT);

  const cleanup = () => {
    clearTimeout(connectionTimeout);
    socket.removeListener('error', onError);
    socket.removeListener('connect', onConnect);
  };
  const onError = (error: Error) => {
    if (settled) {
      return;
    }

    settled = true;
    cleanup();
    callback(error, undefined);
  };
  const onConnect = () => {
    if (settled) {
      return;
    }

    settled = true;
    cleanup();
    callback(null, { connection: socket });
  };

  socket.once('error', onError);
  socket.once('connect', onConnect);
};

class PreparedEmail {
  private email: Email;
  public constructor(settings: NotificationAgentEmail, pgpKey?: string) {
    const { applicationUrl } = getSettings().main;

    const transport = nodemailer.createTransport({
      name: applicationUrl ? new URL(applicationUrl).hostname : undefined,
      host: settings.options.smtpHost,
      port: settings.options.smtpPort,
      connectionTimeout: SMTP_CONNECTION_TIMEOUT,
      secure: settings.options.secure,
      ignoreTLS: settings.options.ignoreTls,
      requireTLS: settings.options.requireTls,
      tls: settings.options.allowSelfSigned
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
      auth:
        settings.options.authUser && settings.options.authPass
          ? {
              user: settings.options.authUser,
              pass: settings.options.authPass,
            }
          : undefined,
      getSocket: net.isIP(settings.options.smtpHost) ? undefined : getSocket,
    });

    if (pgpKey) {
      transport.use(
        'stream',
        openpgpEncrypt({
          signingKey: settings.options.pgpPrivateKey,
          password: settings.options.pgpPassword,
          encryptionKeys: [pgpKey],
        })
      );
    }

    this.email = new Email({
      message: {
        from: {
          name: settings.options.senderName,
          address: settings.options.emailFrom,
        },
      },
      send: true,
      transport: transport,
    });
  }

  send(options) {
    return this.email.send(options);
  }

  render(view: string, locals?: Record<string, unknown>): Promise<string> {
    return this.email.render(view, locals);
  }
}

export default PreparedEmail;
