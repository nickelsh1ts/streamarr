import ImageFader from "@app/components/Common/ImageFader";
import Footer from "@app/components/Layout/Footer";
import Header from "@app/components/Layout/Header";

export default function SignInLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
    <section className="bg-gradient-to-b from-brand-dark from-5% via-brand-light via-20% to-brand-dark to-55%">
      <ImageFader
        rotationSpeed={6000}
        backgroundImages={
          ImageArray?.map(
            (backdrop) => `https://image.tmdb.org/t/p/original${backdrop.url}`
          ) ?? []
        }
      />
      <Header />
      {children}
      <Footer />
    </section>
  );
}
