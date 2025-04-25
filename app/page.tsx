"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnimatedHero from "@/components/AnimatedHero";
import { Info, Calendar, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const sliderRef = useRef<Slider | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const CustomArrow = ({
    direction,
    onClick,
  }: {
    direction: "prev" | "next";
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`bg-primary text-white p-2 rounded-full shadow-md hover:bg-primary-darker transition-colors duration-300 ${
        direction === "prev" ? "mr-2" : "ml-2"
      }`}
      aria-label={direction === "prev" ? "Previous slide" : "Next slide"}
    >
      {direction === "prev" ? (
        <ChevronLeft className="h-6 w-6" />
      ) : (
        <ChevronRight className="h-6 w-6" />
      )}
    </button>
  );

  const carouselSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
  };

  const quickLinks = [
    {
      title: "About Us",
      description:
        "Learn about our mission and the impact we're making in the community.",
      icon: <Info className="h-6 w-6" />,
      link: "/about",
      image: "/family.jpg",
      verticalPosition: "center",
    },
    {
      title: "Our Events",
      description: "Discover upcoming events and how you can get involved.",
      icon: <Calendar className="h-6 w-6" />,
      link: "/events",
      image: "/camp.JPG",
      verticalPosition: "center",
    },
    {
      title: "Support Our Cause",
      description:
        "Find out how you can contribute to our mission and make a difference.",
      icon: <Heart className="h-6 w-6" />,
      link: "/donate",
      image: "/support_our_cause.jpg",
      verticalPosition: "20%",
    },
  ];

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-b from-orange-600 via-[#FBAC67_40%] to-[#FFF_70%] py-8">
        <div className="container mx-auto mt-28 mb-32 px-4 text-left">
          <AnimatedHero></AnimatedHero>
          {/* <p className="text-lg text-secondary pt-4 max-w-2xl">
            Empowering youth and families to attend camps through community
            events that support access to educational and recreational
            opportunities.
          </p> */}
        </div>
        <div className="container mx-auto p-8 text-center">
          {isMobile ? (
            <div>
              <Slider ref={sliderRef} {...carouselSettings}>
                {quickLinks.map((link, index) => (
                  <div key={index} className="px-2">
                    <QuickLinkCard {...link} />
                  </div>
                ))}
              </Slider>
              <div className="flex justify-center mt-6">
                <CustomArrow
                  direction="prev"
                  onClick={() => sliderRef.current?.slickPrev()}
                />
                <CustomArrow
                  direction="next"
                  onClick={() => sliderRef.current?.slickNext()}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {quickLinks.map((link, index) => (
                <QuickLinkCard key={index} {...link} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function QuickLinkCard({
  title,
  description,
  icon,
  link,
  image,
  verticalPosition = "center",
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  image: string;
  verticalPosition?: string;
}) {
  return (
    <div className="bg-white flex flex-col text-left rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:scale-[1.01] duration-300">
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover object-center"
          style={{ objectPosition: `center ${verticalPosition}` }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
        />
      </div>
      <div className="p-6 flex flex-col flex-grow justify-between">
        <div>
          <div className="flex items-center mb-3">
            <div className="text-primary mr-3 flex-shrink-0">{icon}</div>
            <h3 className="text-xl font-semibold text-primary-darker">
              {title}
            </h3>
          </div>
          <p className="text-accent mb-4">{description}</p>
        </div>
        <Link href={link} className="block">
          <span className="text-primary hover:text-primary-lighter duration-300 font-semibold">
            Learn More &rarr;
          </span>
        </Link>
      </div>
    </div>
  );
}
