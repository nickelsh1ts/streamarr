import ImageFader from '@app/components/Common/ImageFader';
import axios from 'axios';
import { useEffect } from 'react';

const scrollToSection = (id: string) => {
  const element = document.getElementById(id)
  element?.scrollIntoView({ behavior: "smooth"});
};

export default function Hero({forRef}) {
  const ImageArray = [
    {
      url: '/wNAhuOZ3Zf84jCIlrcI6JhgmY5q.jpg',
      i: '1223',
    },
    {
      url: "/xg27NrXi7VXCGUr7MG75UqLl6Vg.jpg",
      i: '32445',
    }
  ];
  const options = {
    method: 'GET',
    url: 'https://api.themoviedb.org/3/trending/all/week?language=en-US',
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5ZWYwZGYxOGZjNDMwZTc3Y2VhNTczMGIwNWUyNTM0NSIsIm5iZiI6MTcyMDMyNzkwMy40NDMzOTksInN1YiI6IjYyMWIwZWE5ZDE4NTcyMDAxZGYwZGVhYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.3QCfPqrIfBERjkTpNAI67p7fW9Y37NAmZYRsbxd-yZY'
    }
  };

  useEffect(() => {
    axios
      .request(options)
      .then(res => {
        console.log(res)
        const data = res.data.results.map(x=>({
          url: x.backdrop_path,
          i: x.id,
        }))
        ImageArray.push(data)
        })
      },)
      console.log(ImageArray)
  return (
    <section id="promo" className="min-h-lvh -mt-20" ref={forRef}>
      <ImageFader rotationSpeed={8000} backgroundImages={ImageArray?.map(
            (backdrop) => `https://image.tmdb.org/t/p/original${backdrop.url}`
          ) ?? []} />
				<div className="grid grid-flow-row min-h-lvh md:ps-12 md:text-start text-center relative">
				  <div className="md:ps-4 mt-auto pt-24">
					<img src="/logo_full.png" alt="logo" className="mb-10 mt-5 h-auto w-82 mx-auto md:mx-0" />
					<h1 className="text-xl md:text-3xl font-extrabold mb-2">Unlimited movies and TV shows</h1>
					<p className="text-sm md:text-base tracking-wide mb-12">Watch anywhere, anytime for free. The future is now.</p>
					<form action="" className="w-fit mx-auto md:mx-0" method="post">
              <div className="label"><label htmlFor="icode" className="label-text mb-2 text-sm md:text-base">Currently by invite only. Enter an invite code to join us!</label></div>
                  <div className="flex items-end mb-3">
                      <div className="flex place-items-center w-full max-w-md mb-3">
                          <div className="relative w-full me-0 max-w-48">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-7 md:size-9">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
                              </svg>
                              </div>
                              <input id="icode" className="input text-xl rounded-none rounded-l-lg w-full pl-12 md:pl-14 p-2.5 uppercase border-warning focus:border-warning focus:ring-warning" name="icode" aria-label="Invite Code" placeholder="Invite code" maxLength={6} required />
                          </div>
                          <button type="submit" className="btn btn-warning rounded-none rounded-r-lg">
                              <span className="text-lg text-center rounded-lg cursor-pointe font-bold">Let&apos;s Get Started!</span>
                          </button>
                      </div>
                  </div>
              </form>
					 <div className="p-0 mt-3 md:mt-7 mb-3">
							<span className="font-bold">Movies: </span>613 <span className="text-accent">&#124;</span>
					 </div>
				  </div>
				<div className="md:ps-3 mt-auto mb-20 mx-auto md:mx-0">
			 		<button className=''  onClick={()=>scrollToSection("requesting")}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3.5} stroke="currentColor" className="size-9 fa-bounce">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
				</div>
			  </div>
			</section>
  )
}
