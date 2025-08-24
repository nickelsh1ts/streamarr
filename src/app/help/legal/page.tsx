'use client';
import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import Privacy from '@app/components/Help/Legal/Privacy';
import TermsOfUse from '@app/components/Help/Legal/TermsOfUse';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const LegalPage = () => {
  return (
    <>
      <div className="py-5 bg-zinc-100 text-neutral" style={null}>
        <Breadcrumbs paths="/legal" homeElement={'Help Centre'} names="Legal" />
      </div>
      <section className="py-5 my-auto bg-zinc-100">
        <main className=" container max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl mx-auto place-content-center p-4 space-y-5">
          <div role="tablist" className="tabs tabs-lifted">
            <input
              defaultChecked
              type="radio"
              name="my_tabs_2"
              role="tab"
              className="tab checked:!bg-secondary checked:text-white text-primary font-extrabold !w-32 !border-none"
              aria-label="Terms of Use"
            />
            <div
              role="tabpanel"
              className="tab-content bg-zinc-200 rounded-box p-2 md:p-6"
            >
              <div className="print:hidden">
                <Link
                  className="link-neutral font-semibold flex place-items-center max-md:m-2"
                  href="/help/legal/termsofuse"
                >
                  Hyperlink{' '}
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 ms-1" />
                </Link>
              </div>
              <TermsOfUse />
            </div>
            <input
              type="radio"
              name="my_tabs_2"
              role="tab"
              className="tab checked:!bg-secondary checked:text-white text-primary font-extrabold !w-44 !border-none"
              aria-label="Privacy Statement"
            />
            <div
              role="tabpanel"
              className="tab-content bg-zinc-200 rounded-box p-2 md:p-6"
            >
              <div className="print:hidden">
                <Link
                  className="link-neutral font-semibold flex place-items-center max-md:m-2"
                  href="/help/legal/privacy"
                >
                  Hyperlink{' '}
                  <ArrowTopRightOnSquareIcon className="w-4 h-4 ms-1" />
                </Link>
              </div>
              <Privacy />
            </div>
          </div>
        </main>
      </section>
    </>
  );
};

export default LegalPage;
