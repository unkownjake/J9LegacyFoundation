import AnimatedHero from "@/components/AnimatedHero";
import { getIconComponent } from "@/lib/iconMapper";
import { HeroContent, HomePageCardContent } from "@/lib/types/home";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export const HomePage = ({
  hero,
  homepageCards = [],
}: {
  hero?: HeroContent;
  homepageCards?: HomePageCardContent[];
}) => {
  const sliderRef = useRef<Slider | null>(null);
  const [isMobile, setIsMobile] = useState(false);

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

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-b from-orange-600 via-[#FBAC67_55%] to-[#f0f0f0_10%] py-8">
        {hero && (
          <div className="container mx-auto mt-28 mb-32 px-4 text-left">
            <AnimatedHero title={hero.title} description={hero.description} />
          </div>
        )}

        {/* Homepage Cards Section - only render if cards exist */}
        {homepageCards && homepageCards.length > 0 && (
          <div className="container mx-auto p-8 text-center">
            {isMobile ? (
              <div>
                <Slider ref={sliderRef} {...carouselSettings}>
                  {homepageCards.map((card) => (
                    <div key={card.id} className="px-2">
                      <HomePageCard {...card} />
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
                {homepageCards.map((card) => (
                  <HomePageCard key={card.id} {...card} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Fallback message if no content */}
      {!hero && (!homepageCards || homepageCards.length === 0) && (
        <div className="flex flex-col min-h-screen">
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <p className="text-gray-600">
                No content available for this page.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function HomePageCard({
  title,
  description,
  icon,
  link,
  image,
  verticalPosition = "center",
}: HomePageCardContent) {
  const IconComponent = getIconComponent(icon);

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
            <div className="text-primary mr-3 flex-shrink-0">
              <IconComponent className="h-6 w-6" />
            </div>
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
