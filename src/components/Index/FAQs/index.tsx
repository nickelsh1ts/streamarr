import Link from "next/link"

function FAQs() {
  return (
    <div className="min-h-lvh place-content-center py-16">
      <div className="container mx-auto">
        <div className="pb-10">
          <p className="text-2xl md:text-4xl text-center font-extrabold">
            Frequently Asked Questions
          </p>
        </div>
        <div className="join join-vertical w-full gap-3 rounded-none px-4">
        <div className="collapse collapse-arrow join-item bg-brand-dark ">
          <input type="radio" name="faqs" />
          <div className="collapse-title text-xl font-medium">What is <span className="text-primary">Streamarr</span>?</div>
          <div className="collapse-content">
          <p><span className="text-primary">Streamarr</span> allows you to watch all your favourites in one place. With entertainment from Netflix, Disney+, Prime Video, HBO Max, and more, there&apos;s always something exciting to watch. Watch the latest releases before anyone else.</p>
          </div>
        </div>
        <div className="collapse collapse-arrow join-item bg-brand-dark ">
          <input type="radio" name="faqs" />
          <div className="collapse-title text-xl font-medium">What is Ple<span className="link-accent">x</span>&trade;?</div>
          <div className="collapse-content">
          <p className="mb-4">Plex gives you one place to find and access all the media that matters to you. From personal media on your own server, to free and on-demand Movies &amp; Shows, live TV, podcasts, and web shows, to streaming music, you can enjoy it all in one app, on any device.</p>
          <p className="mb-4">If you are streaming only third-party content (<span className="text-primary">Streamarr</span>, live TV, web shows), then you are good to go as soon as you have an account, just install an app on your phone, Smart TV, computer, or simply open up our web app on your browser!</p>
          <p className="mb-4">Watch thousands of free, on-demand Movies &amp; Shows streaming service or over 100 channels of live TV. Listen to your favorite podcasts at home or on your commute. Watch your favorite web shows from talented creators around the world. You can even access over 60 million streaming music tracks and videos, provided by TIDAL!</p>
          <p>Find more feature information <Link href="https://plex.tv" target="_blank" className="link-accent">on their website.</Link></p>
          </div>
        </div>
        <div className="collapse collapse-arrow join-item bg-brand-dark ">
          <input type="radio" name="faqs" />
          <div className="collapse-title text-xl font-medium">How can I join <span className="text-primary ms-1">Streamarr</span></div>
          <div className="collapse-content">
          <p className="mb-4">Joining <span className="text-primary">Stremarr</span> is by invite only. Current active members can invite up to 5 of their friends.</p>
          <p>To invite a friend simply log into your account, select options from the menu and click invite a friend. Share the generated code with your friend and send them to <span className="text-primary">Streamarr</span>.com/join or click the share button!</p>
          </div>
        </div>
        <div className="collapse collapse-arrow join-item bg-brand-dark ">
          <input type="radio" name="faqs" />
          <div className="collapse-title text-xl font-medium">Where can I watch <span className="text-primary ms-1">Streamarr</span>?</div>
          <div className="collapse-content">
          <p><span className="text-primary">Streamarr</span> is available via the Plex app on compatible mobile devices, web browsers, game consoles, set-top boxes, and smart TVs or at <span className="text-purple">Nickflix</span>TV.com. For a complete list of supported and compatible devices, click <Link href="/help/devices" className="link-warning">here.</Link></p>
          </div>
        </div>
        <div className="collapse collapse-arrow join-item bg-brand-dark ">
          <input type="radio" name="faqs" />
          <div className="collapse-title text-xl font-medium">What can I watch on <span className="text-primary ms-1">Streamarr</span>?</div>
          <div className="collapse-content">
            <p>With <span className="text-primary">Streamarr</span>, you can choose from an ever-evolving collection of movies and TV shows. From new releases and timeless classics to nostalgic throwbacks available on <span className="text-primary">Streamarr</span> Retro.</p>
            <p>Using Overseerr, you can request almost anything that&apros;s not already available and watch it within minutes.</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default FAQs
