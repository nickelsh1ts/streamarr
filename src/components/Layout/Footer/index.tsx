'use client';
import BackToTopBtn from '@app/components/Common/BackToTopBtn';
import Link from 'next/link';
import { useState } from 'react';

function Footer() {
  const [currentYear] = useState(() => new Date().getFullYear());
  return (
    <footer
      id="footer"
      className="footer grid-flow-row gap-2 py-6 px-10 print:hidden bg-brand-dark max-sm:pb-16"
    >
      <div className="place-self-center mb-4">
        <BackToTopBtn full />
      </div>
      <div className="md:grid-flow-col grid-flow-row mb-4 container md:px-20 mx-auto">
        <div className="grid grid-flow-row me-3">
          <div className="flex place-items-center gap-4">
            <a
              className="link-neutral"
              target="_blank"
              href="https://github.com/nickelsh1ts/streamarr"
              rel="noreferrer"
            >
              <svg
                className="h-7"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                  fill="currentColor"
                />
              </svg>
            </a>
            <a
              className="link-neutral"
              target="_blank"
              href="https://discord.gg/streamarr"
              rel="noreferrer"
            >
              <svg
                className="h-10"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18.59 5.88997C17.36 5.31997 16.05 4.89997 14.67 4.65997C14.5 4.95997 14.3 5.36997 14.17 5.69997C12.71 5.47997 11.26 5.47997 9.83001 5.69997C9.69001 5.36997 9.49001 4.95997 9.32001 4.65997C7.94001 4.89997 6.63001 5.31997 5.40001 5.88997C2.92001 9.62997 2.25001 13.28 2.58001 16.87C4.23001 18.1 5.82001 18.84 7.39001 19.33C7.78001 18.8 8.12001 18.23 8.42001 17.64C7.85001 17.43 7.31001 17.16 6.80001 16.85C6.94001 16.75 7.07001 16.64 7.20001 16.54C10.33 18 13.72 18 16.81 16.54C16.94 16.65 17.07 16.75 17.21 16.85C16.7 17.16 16.15 17.42 15.59 17.64C15.89 18.23 16.23 18.8 16.62 19.33C18.19 18.84 19.79 18.1 21.43 16.87C21.82 12.7 20.76 9.08997 18.61 5.88997H18.59ZM8.84001 14.67C7.90001 14.67 7.13001 13.8 7.13001 12.73C7.13001 11.66 7.88001 10.79 8.84001 10.79C9.80001 10.79 10.56 11.66 10.55 12.73C10.55 13.79 9.80001 14.67 8.84001 14.67ZM15.15 14.67C14.21 14.67 13.44 13.8 13.44 12.73C13.44 11.66 14.19 10.79 15.15 10.79C16.11 10.79 16.87 11.66 16.86 12.73C16.86 13.79 16.11 14.67 15.15 14.67Z"
                  fill="currentColor"
                ></path>
              </svg>
            </a>
            <a
              className="link-neutral"
              target="_blank"
              href="https://www.youtube.com/channel/UCV6I_2eeiaq1R6aiwRvHWKA"
              rel="noreferrer"
            >
              <svg
                className="h-8"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                  fill="currentColor"
                />
              </svg>
            </a>
          </div>
          <div className="col-span-2">
            <a
              className="hover:brightness-75"
              target="_blank"
              href="https://www.nickelsh1ts.com"
              rel="noreferrer"
            >
              <img
                alt="logo"
                className="h-auto w-64"
                src="/nickelsh1ts-full.png"
              />
            </a>
          </div>
        </div>
        <nav className="grid grid-flow-col grid-rows-4 gap-y-5 gap-x-20 mt-10 md:ms-auto">
          <Link
            className="link-neutral text-decoration-none"
            href="/help/legal/termsofuse"
          >
            Terms of Use
          </Link>
          <Link
            className="link-neutral text-decoration-none"
            href="/help/legal/privacy"
          >
            Privacy Policy
          </Link>
          <Link
            className="link-neutral text-decoration-none"
            href="/help/legal/privacy#cookies"
          >
            Cookie Preferences
          </Link>
          <div></div>
          <Link className="link-neutral text-decoration-none" href="/help/">
            Help Centre
          </Link>
          <Link
            className="link-neutral text-decoration-none"
            href={`//status.${process.env.NEXT_PUBLIC_APP_NAME?.toLowerCase() || 'streamarr'}.com/status/services`}
          >
            Status
          </Link>
          <Link
            className="link-neutral text-decoration-none"
            href={`mailto:info@${process.env.NEXT_PUBLIC_APP_NAME?.toLowerCase() || 'streamarr'}.com`}
          >
            Contact Us
          </Link>
          <Link className="link-neutral text-decoration-none" href="/admin">
            Admin Centre
          </Link>
        </nav>
      </div>
      <p
        className="place-self-start container md:px-20 mx-auto"
        style={{ fontSize: '0.8rem' }}
      >
        © {currentYear} nickelsh1ts
      </p>
    </footer>
  );
}

export default Footer;
