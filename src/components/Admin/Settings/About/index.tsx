import Alert from '@app/components/Common/Alert';
import Badge from '@app/components/Common/Badge';
import List from '@app/components/Common/List';
import { ArrowRightIcon } from '@heroicons/react/24/solid';

const AboutSettings = () => {
  return (
    <div>
      <Alert type="primary">
        <div className="ml-3 flex-1 md:flex md:justify-between">
          <p className="text-sm leading-5">
            This is PRE-ALPHA software and currently under active development.
            Features may be broken and/or unstable. Please check GitHub for
            status updates.
          </p>
          <p className="mt-3 text-sm leading-5 md:mt-0 md:ml-6">
            <a
              href="http://github.com/nickelsh1ts/streamarr"
              className="whitespace-nowrap font-medium transition duration-150 ease-in-out hover:text-white"
              target="_blank"
              rel="noreferrer"
            >
              GitHub <ArrowRightIcon className="size-4 inline-flex" />
            </a>
          </p>
        </div>
      </Alert>
      <div className="mt-6 mb-10 bg-secondary bg-opacity-30 backdrop-blur rounded-md p-4 border border-primary">
        <Alert>
          <p className="ml-3 text-sm leading-5">
            You are running the <code>develop</code> branch of Streamarr, which
            is only recommended for those contributing to development or
            assisting with bleeding-edge testing.
          </p>
        </Alert>
        <List title={'About Streamarr'}>
          <List.Item
            title={'Version'}
            className="flex flex-row items-center truncate"
          >
            <code>0.00.1</code>
            <a
              href="https://github.com/nickelsh1ts/streamarr/releases"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Badge
                badgeType="success"
                className="ml-2 !cursor-pointer transition hover:bg-opacity-70 text-white"
              >
                Up to Date
              </Badge>
            </a>
          </List.Item>
          <List.Item title="Total Libraries">10</List.Item>
          <List.Item title="Total Users">82</List.Item>
          <List.Item title="Total Invites">36</List.Item>
          <List.Item title="Data Directory">
            <code>/app/config</code>
          </List.Item>
          <List.Item title="Time Zone">
            <code>America/Toronto</code>
          </List.Item>
        </List>
      </div>
      <div className="mt-6 mb-10 bg-secondary bg-opacity-30 backdrop-blur rounded-md p-4 border border-primary">
        <List title="Getting Support">
          <List.Item title="Documentation">
            <a
              href="https://docs.streamarr.dev"
              target="_blank"
              rel="noreferrer"
              className="text-primary transition duration-300 hover:underline"
            >
              https://docs.streamarr.dev
            </a>
          </List.Item>
          <List.Item title="GitHub Discussions">
            <a
              href="https://github.com/nickelsh1ts/streamarr/discussions"
              target="_blank"
              rel="noreferrer"
              className="text-primary transition duration-300 hover:underline"
            >
              https://github.com/nickelsh1ts/streamarr/discussions
            </a>
          </List.Item>
          <List.Item title="Discord">
            <a
              href="https://discord.gg/streamarr"
              target="_blank"
              rel="noreferrer"
              className="text-primary transition duration-300 hover:underline"
            >
              https://discord.gg/streamarr
            </a>
          </List.Item>
        </List>
      </div>
      <div className="mt-6 mb-10 bg-secondary bg-opacity-30 backdrop-blur rounded-md p-4 border border-primary">
        <List title="Support Streamarr">
          <List.Item title="Help Pay for Coffee ☕️">
            <a
              href="https://github.com/sponsors/nickelsh1ts"
              target="_blank"
              rel="noreferrer"
              className="text-primary transition duration-300 hover:underline"
            >
              https://github.com/sponsors/nickelsh1ts
            </a>
            <Badge className="ml-2">Preferred</Badge>
          </List.Item>
          <List.Item title="">
            <a
              href="https://patreon.com/nickelsh1ts"
              target="_blank"
              rel="noreferrer"
              className="text-primary transition duration-300 hover:underline"
            >
              https://patreon.com/nickelsh1ts
            </a>
          </List.Item>
        </List>
      </div>
    </div>
  );
};
export default AboutSettings;
