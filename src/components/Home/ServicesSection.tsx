import useSettings from '@app/hooks/useSettings';

const ServicesSection = () => {
  const settings = useSettings();
  const messages = {
    AppTitle: `${settings.currentSettings.applicationTitle}`,
  };

  return (
    <>
      <section id="favs" className="min-vh-100 pt-5">
        <div className="container-fluid p-lg-5 text-light p-3 text-center">
          <h1 className="p-2">
            <span className="text-purple">{messages.AppTitle}</span> has all
            your favourites in one place
          </h1>
          <p className="lead py-2">
            An ever evolving collection of the world&apos;s most beloved movies
            and TV shows.
          </p>
          <div className="row row-cols-2 row-cols-lg-3 g-4 px-lg-5">
            <div className="col">
              <img
                alt="provider"
                src="/img/netflix.png"
                className="img img-fluid"
                width="100%"
                height="auto"
                loading="lazy"
              ></img>
            </div>
            <div className="col">
              <img
                alt="provider"
                src="/img/disneyplus.png"
                className="img img-fluid"
                width="100%"
                height="auto"
                loading="lazy"
              ></img>
            </div>
            <div className="col">
              <img
                alt="provider"
                src="/img/primevideo.png"
                className="img img-fluid"
                width="100%"
                height="auto"
                loading="lazy"
              ></img>
            </div>
            <div className="col">
              <img
                alt="provider"
                src="/img/appletv.png"
                className="img img-fluid"
                width="100%"
                height="auto"
                loading="lazy"
              ></img>
            </div>
            <div className="col">
              <img
                alt="provider"
                src="/img/hulu.png"
                className="img img-fluid"
                width="100%"
                height="auto"
                loading="lazy"
              ></img>
            </div>
            <div className="col">
              <img
                alt="provider"
                src="/img/hbomax.png"
                className="img img-fluid"
                width="100%"
                height="auto"
                loading="lazy"
              ></img>
            </div>
            <div className="col">
              <img
                alt="provider"
                src="/img/paramountplus.png"
                className="img img-fluid"
                width="100%"
                height="auto"
                loading="lazy"
              ></img>
            </div>
            <div className="col">
              <img
                alt="provider"
                src="/img/peacock.png"
                className="img img-fluid"
                width="100%"
                height="auto"
                loading="lazy"
              ></img>
            </div>
            <div className="col mx-auto">
              <img
                alt="provider"
                src="/img/evenmore.png"
                className="img img-fluid"
                width="100%"
                height="auto"
                loading="lazy"
              ></img>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ServicesSection;
