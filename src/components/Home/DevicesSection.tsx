const DevicesSection = () => {
  return (
    <>
      <section id="devices" className="min-vh-100">
        <div className="container-fluid col-xxl-11 min-vh-100 px-4">
          <div className="row align-items-center text-light min-vh-100 pt-5 text-center">
            <div className="container">
              <div className="row pb-5">
                <h1>Available on all your favourite devices</h1>
              </div>
              <div className="row row-cols-2 row-cols-lg-4 g-4 px-lg-5">
                <div className="col">
                  <img
                    alt="provider"
                    src="https://cnbl-cdn.bamgrid.com/assets/00fb59319fa715222100d8a84d11bc7e23a42970b4f413c9e85166d0cfba9346/original"
                    className="img img-fluid"
                    loading="lazy"
                    width="100%"
                    height="auto"
                  ></img>
                  <h3 className="py-4">TV</h3>
                  <p className="mb-0">Amazon Fire TV</p>
                  <p className="mb-0">Android TV devices</p>
                  <p className="mb-0">Apple TV</p>
                  <p className="mb-0">Chromecast</p>
                  <p className="mb-0">Roku</p>
                  <p className="mb-0">Samsung</p>
                </div>
                <div className="col">
                  <img
                    alt="provider"
                    src="https://cnbl-cdn.bamgrid.com/assets/d73b7c534afd2af2a454dbd47bd6c766c70e334ce8137084e9cd25c2644dd267/original"
                    className="img img-fluid"
                    loading="lazy"
                    width="100%"
                    height="auto"
                  ></img>
                  <h3 className="py-4">Computer</h3>
                  <p className="mb-0">Windows PC</p>
                  <p className="mb-0">MacOS</p>
                  <p className="mb-0">Chrome OS</p>
                </div>
                <div className="col">
                  <img
                    alt="provider"
                    src="https://cnbl-cdn.bamgrid.com/assets/66475056e769443ef9a491a48dfa44059c8964890ae9ef7c4f69f322693c59d8/original"
                    className="img img-fluid"
                    loading="lazy"
                    width="100%"
                    height="auto"
                  ></img>
                  <h3 className="py-4">Mobile & Tablet</h3>
                  <p className="mb-0">Android Phones & Tablets</p>
                  <p className="mb-0">iPhones & iPads</p>
                  <p className="mb-0">Amazon Fire Tablets</p>
                </div>
                <div className="col">
                  <img
                    alt="provider"
                    src="https://cnbl-cdn.bamgrid.com/assets/51b639d2ebe97ee175975c29d42a90b0e043713856db8e5d6d9fb87b2b3a48c0/original"
                    className="img img-fluid"
                    loading="lazy"
                    style={{ width: '24em' }}
                  ></img>
                  <h3 className="py-4">Game Consoles</h3>
                  <p className="mb-0">Xbox One</p>
                  <p className="mb-0">Xbox X/S</p>
                  <p className="mb-0">Playstation 4/5</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default DevicesSection;
