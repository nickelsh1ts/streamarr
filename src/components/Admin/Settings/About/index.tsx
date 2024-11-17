import Alert from '@app/components/Common/Alert';
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
      <h3 className="text-2xl font-extrabold">About Streamarr</h3>
    </div>
  );
};
export default AboutSettings;
