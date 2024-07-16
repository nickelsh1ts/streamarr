import Breadcrumbs from '@app/components/Help/Breadcrumbs';
import HelpCard from '@app/components/Help/HelpCard';

const HelpContent = () => {
  return (
    <>
      <div className="mt-5 font-extrabold" id="inviteafriend">
        How to invite a friend:
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li>Sign in to Streamarr from your preferred device</li>
        <li>Look for and select the options menu</li>
        <li>Choose &quot;Invite a friend&quot;</li>
        <li>Select the &quot;generate code&quot; button</li>
        <li>
          Either select &quot;share&quot; or copy the generated code and provide
          this to your friend
        </li>
      </ul>
      <p className="italic text-sm my-4">Important Information</p>
      <ul className="list list-disc ms-14 my-4">
        <li>Normal users may currently invite up to 5 of their friends</li>
        <li>Normal users may only generate 1 invite code per day</li>
        <li>Generated invite codes expire after 48 hours</li>
      </ul>
      <p className="mb-16">
        In some cases where a user has exceeded their 5 invites, an extra
        allotment may be provided. This is at the sole discretion of the admin
        team and is not guaranteed.
      </p>
      <div className="mt-5 font-extrabold" id="joinstreamarr">
        How to join Streamarr:
      </div>
      <ul className="list list-decimal ms-14 my-4">
        <li>
          Navigate to the &quot;Home&quot; or &quot;Sign Up&quot; page on
          Streamarr
        </li>
        <li>In the provided text input, enter the invite code</li>
        <li>Select the &quot;Let&apos;s Get Started&quot; button to begin</li>
        <li>
          If the code is valid, proceed to enter your information in the
          provided form
        </li>
        <li>
          If the information provided is valid and sign up is successful, you
          will need to accept your invite via email before you can access
          Streamarr services
        </li>
      </ul>
      <p className="italic text-sm my-4">Important Information</p>
      <ul className="list list-disc ms-14 my-4">
        <li>In order to access Streamarr services a Ple<span className='text-accent'>x</span>&trade; account is required</li>
        <li>Once you have successfully joined Streamarr, you may not invite your own friends until the 7 day trial period has ended</li>
        <li>Failure to accept the invite email sent after registration will result in an inability to access most of Streamarr&apos;s services</li>
      </ul>
      <p className="mb-16">
        In some cases where failure to complete the sign up form after entering the invite code can result in an invalid code for future attempts. Either ensure you complete registration at the time or request a new code from your friend.
      </p>
    </>
  );
};

const anchors = [
  {
    href: '#inviteafriend',
    title: 'Invite a Friend',
  },
  {
    href: '#joinstreamarr',
    title: 'Joining Streamarr',
  },
];

const BecomeMember = () => {
  return (
    <section className="text-neutral bg-zinc-100 py-5">
      <Breadcrumbs
        paths="/getting-started/become-a-member"
        homeElement={'Help Centre'}
        names="Getting Started,how to become a member of Streamarr"
      />
      <HelpCard
        anchors={anchors}
        content={<HelpContent />}
        heading="How to become a member of Streamarr"
        subheading="Streamarr is a private members access streaming service. Currently members can only be invited by an already active member of Streamarr. Please reach out to a friend and ask them to send you an invite."
      />
    </section>
  );
};

export default BecomeMember;
