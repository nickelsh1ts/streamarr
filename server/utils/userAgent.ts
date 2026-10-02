import { getAppVersion } from '@server/utils/appVersion';
import type { InternalAxiosRequestConfig } from 'axios';

export const USER_AGENT = `Streamarr/${getAppVersion()}`;

export const userAgentRequestInterceptor = (
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
  if (!config.headers.has('User-Agent')) {
    config.headers.set('User-Agent', USER_AGENT);
  }
  return config;
};
