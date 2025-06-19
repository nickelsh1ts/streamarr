'use client';
import CachedImage from '@app/components/Common/CachedImage';

function Devices() {
  return (
    <section id="devices" className="min-h-lvh place-content-center py-16">
      <div className="container mx-auto text-center">
        <p className="text-3xl font-extrabold pb-10 px-5">
          Available on all your favourite devices
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-5">
          <div>
            <CachedImage
              alt="provider"
              src="https://cnbl-cdn.bamgrid.com/assets/00fb59319fa715222100d8a84d11bc7e23a42970b4f413c9e85166d0cfba9346/original"
              className="h-auto w-auto"
              width={200}
              height={120}
            />
            <p className="py-6 text-2xl font-extrabold">TV</p>
            <p>Amazon Fire TV</p>
            <p>Android TV devices</p>
            <p>Apple TV</p>
            <p>Chromecast</p>
            <p>Roku</p>
            <p>Samsung</p>
          </div>
          <div>
            <CachedImage
              alt="provider"
              src="https://cnbl-cdn.bamgrid.com/assets/d73b7c534afd2af2a454dbd47bd6c766c70e334ce8137084e9cd25c2644dd267/original"
              className="h-auto w-auto"
              width={200}
              height={120}
            />
            <p className="py-6 text-2xl font-extrabold">Computer</p>
            <p>Windows PC</p>
            <p>MacOS</p>
            <p>Chrome OS</p>
          </div>
          <div>
            <CachedImage
              alt="provider"
              src="https://cnbl-cdn.bamgrid.com/assets/66475056e769443ef9a491a48dfa44059c8964890ae9ef7c4f69f322693c59d8/original"
              className="h-auto w-auto"
              width={200}
              height={120}
            />
            <p className="py-6 text-2xl font-extrabold">Mobile & Tablet</p>
            <p>Android Phones & Tablets</p>
            <p>iPhones & iPads</p>
            <p>Amazon Fire Tablets</p>
          </div>
          <div>
            <CachedImage
              alt="provider"
              src="https://cnbl-cdn.bamgrid.com/assets/51b639d2ebe97ee175975c29d42a90b0e043713856db8e5d6d9fb87b2b3a48c0/original"
              className="h-auto w-auto"
              width={200}
              height={120}
            />
            <p className="py-6 text-2xl font-extrabold">Game Consoles</p>
            <p>Xbox One</p>
            <p>Xbox X/S</p>
            <p>Playstation 4/5</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Devices;
