import ImageFader from "@app/components/Common/ImageFader";
import Footer from "@app/components/Layout/Footer";
import Header from "@app/components/Layout/Header"
import SignUpForm from "@app/components/SignUp/Form";


const Join = () => {
  const ImageArray = [
    {
      url: '/wNAhuOZ3Zf84jCIlrcI6JhgmY5q.jpg',
      i: '1223',
    },
    {
      url: '/etj8E2o0Bud0HkONVQPjyCkIvpv.jpg',
      i: '94997',
    },
    {
      url: '/xg27NrXi7VXCGUr7MG75UqLl6Vg.jpg',
      i: '32445',
    },
    {
      url: "/7cqKGQMnNabzOpi7qaIgZvQ7NGV.jpg",
      i: '76479',
    },
    {
      url: "/rrwt0u1rW685u9bJ9ougg5HJEHC.jpg",
      i: "280180",
    },
    {
      url: "/ybn3jCia5XBD0ZgEM07gcUPuRNh.jpg",
      i: "508883",
    },
    {
      url: "/fDmci71SMkfZM8RnCuXJVDPaSdE.jpg",
      i: '519182',
    },
    {
      url: "/6XjMwQTvnICBz6TguiDKkDVHvgS.jpg",
      i: 762441,
    },
    {
      url: "/nxxCPRGTzxUH8SFMrIsvMmdxHti.jpg",
      i: 639720,
    },
    {
      url: "/3GQKYh6Trm8pxd2AypovoYQf4Ay.jpg",
      i: 85937,
    },
    {
      url: "/5Aks5cCqHG8xFLoUSLsfGdVfIC.jpg",
      i: 1086747,
    },
    {
      url: "/kwronSXO1ogMqHHFvY2eBxfFLdn.jpg",
      i: 114479,
    },
    {
      url: "/jvPMJ2zM92jfXxVEFsqP1MMrLaO.jpg",
      i: 823464,
    },
    {
      url: "/dvBCdCohwWbsP5qAaglOXagDMtk.jpg",
      i: 533535,
    },
    {
      url: "/2rmK7mnchw9Xr3XdiTFSxTTLXqv.jpg",
      i: 37854,
    },
    {
      url: "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
      i: 693134,
    },
    {
      url: "/5fWxvjOUvtUoSmiMEpFl77V6KZV.jpg",
      i: 196322,
    }
  ];

  return (
    <>
      <Header />
      <main className="min-h-[93vh] relative">
        <ImageFader
          rotationSpeed={6000}
          backgroundImages={
            ImageArray?.map(
              (backdrop) => `https://image.tmdb.org/t/p/original${backdrop.url}`
            ) ?? []
          } />
        <div className="container max-w-lg mx-auto py-14 px-4">
          <div className="text-start px-2 mb-4 relative">
            <p className="text-2xl font-extrabold mb-2">Welcome!</p>
            <p className="text-sm">Joining <span className="text-primary font-semibold">Streamarr</span> is currently by invite only. Enter a valid invite code below to get started.</p>
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
      </main>
      <Footer />
    </>
  )
}

export default Join
