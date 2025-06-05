function Favourites() {
  return (
    <section id="favs" className="min-h-lvh place-content-center py-16">
      <div className="mx-auto px-5 text-center text-light">
        <p className="p-2 text-4xl font-extrabold">
          <span className="text-primary">
            {process.env.NEXT_PUBLIC_APP_NAME}
          </span>{' '}
          has all your favourites in one place
        </p>
        <p className="text-lg py-4">
          An ever evolving collection of the world&apos;s most beloved movies
          and TV shows.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-4 lg:mx-5">
          <img
            alt="provider"
            src="/img/netflix.png"
            className="h-auto w-2/5 md:w-1/4"
            loading="lazy"
          />
          <img
            alt="provider"
            src="/img/disneyplus.png"
            className="h-auto w-2/5 md:w-1/4"
            loading="lazy"
          />
          <img
            alt="provider"
            src="/img/primevideo.png"
            className="h-auto w-2/5 md:w-1/4"
            loading="lazy"
          />
          <img
            alt="provider"
            src="/img/appletv.png"
            className="h-auto w-2/5 md:w-1/4"
            loading="lazy"
          />
          <img
            alt="provider"
            src="/img/hulu.png"
            className="h-auto w-2/5 md:w-1/4"
            loading="lazy"
          />
          <img
            alt="provider"
            src="/img/hbomax.png"
            className="h-auto w-2/5 md:w-1/4"
            loading="lazy"
          />
          <img
            alt="provider"
            src="/img/paramountplus.png"
            className="h-auto w-2/5 md:w-1/4"
            loading="lazy"
          />
          <img
            alt="provider"
            src="/img/peacock.png"
            className="h-auto w-2/5 md:w-1/4"
            loading="lazy"
          />
          <img
            alt="provider"
            src="/img/evenmore.png"
            className="h-auto w-2/5 md:w-1/4"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}

export default Favourites;
