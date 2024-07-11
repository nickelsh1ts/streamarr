import { TicketIcon } from '@heroicons/react/24/outline';

const SignUpForm = () => {
  return (
    <form method="post">
      <div className={`text-center text-error mb-2 hidden`}>
        Invalid invite code!
      </div>
      <div className="flex items-end mb-3">
        <div className="flex place-content-center w-full max-w-md">
          <div className="relative w-full me-0 max-w-48">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <TicketIcon className="size-7 md:size-9" />
            </div>
            <input
              id="icode"
              className="input text-xl rounded-none rounded-l-lg w-full pl-12 md:pl-14 p-2.5 uppercase border-warning focus:border-warning focus:outline-warning/30"
              name="icode"
              aria-label="Invite Code"
              placeholder="Invite code"
              maxLength={6}
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-warning rounded-none rounded-r-lg"
          >
            <span className="text-lg text-center rounded-lg cursor-pointe font-bold">
              Let&apos;s Get Started!
            </span>
          </button>
        </div>
      </div>
    </form>
  );
};

export default SignUpForm;
