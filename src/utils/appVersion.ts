export const getAppVersion = (): string => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { version } = require('../../package.json');

  let finalVersion = version;

  if (version === '0.00.1') {
    finalVersion = `develop-${version}`;
  }

  return finalVersion;
};
