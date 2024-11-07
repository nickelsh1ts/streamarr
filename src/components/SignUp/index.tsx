import SignUpForm from '@app/components/SignUp/Form';

const Join = () => {
  return (
    <div className="container max-w-lg mx-auto py-14 px-4">
      <div className="text-start px-2 mb-4 relative">
        <p className="text-2xl font-extrabold mb-2">Welcome!</p>
        <p className="text-sm">
          Joining <span className="text-primary font-semibold">Streamarr</span>{' '}
          is currently by invite only. Enter a valid invite code below to get
          started.
        </p>
      </div>
      <div className="w-full backdrop-blur-md">
        <div className="collapse rounded-md mb-[1px]">
          <input type="radio" name="icode" defaultChecked />
          <div className="collapse-title bg-slate-600/40">
            Enter your invite code
          </div>
          <div className="collapse-content pt-2 place-content-center bg-brand-dark/50">
            <div className="pt-4">
              <SignUpForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Join;
