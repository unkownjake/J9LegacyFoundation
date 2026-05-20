import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AnimatedHero from "@/components/site/AnimatedHero";
import { getPageContent } from "@/lib/cms";
import { HomePageContent, HomePageCardContent } from "@/lib/types/cms";
import { getIconComponent } from "@/lib/iconMapper";

export default function HomePage() {
  const [content, setContent] = useState<HomePageContent | null>(null);

  useEffect(() => {
    getPageContent<HomePageContent>("home").then(setContent);
  }, []);


  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  const { hero, homepageCards } = content;

  return (
    <div className="flex flex-col">
      <section className="bg-gradient-to-b from-primary-darker via-primary-lighter to-[hsl(0_0%_98%)] py-8">
        <div className="container mx-auto mt-20 mb-24 px-4 text-left">
          <AnimatedHero title={hero.title} description={hero.description} />
        </div>

        {homepageCards?.length > 0 && (
          <div className="container mx-auto p-4 md:p-8 text-center">
            <CardsCarousel cards={homepageCards} />
          </div>
        )}
      </section>
    </div>
  );
}

function CardsCarousel({ cards }: { cards: HomePageCardContent[] }) {
  const [isMobile, setIsMobile] = useState(false);
  const [idx, setIdx] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!isMobile) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {cards.map((card) => (
          <Card key={card.id} {...card} />
        ))}
      </div>
    );
  }

  const prev = () => setIdx((i) => (i - 1 + cards.length) % cards.length);
  const next = () => setIdx((i) => (i + 1) % cards.length);

  return (
    <div>
      <div className="overflow-hidden" ref={trackRef}>
        <div
          className="flex transition-transform duration-500"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {cards.map((card) => (
            <div key={card.id} className="w-full shrink-0 px-2">
              <Card {...card} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center mt-6 gap-2">
        <CarouselArrow direction="prev" onClick={prev} />
        <CarouselArrow direction="next" onClick={next} />
      </div>
    </div>
  );
}

function CarouselArrow({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-primary text-primary-foreground p-2 rounded-full shadow-md hover:bg-primary-darker transition-colors duration-300"
      aria-label={direction === "prev" ? "Previous slide" : "Next slide"}
    >
      {direction === "prev" ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
    </button>
  );
}

function Card({ title, description, icon, link, image, verticalPosition = "center" }: HomePageCardContent) {
  const Icon = getIconComponent(icon);
  return (
    <div className="bg-card flex flex-col text-left rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:scale-[1.01] transition duration-300">
      <div className="relative aspect-[4/3] w-full bg-muted overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: `center ${verticalPosition}` }}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-lighter to-accent-lighter">
            <Icon className="h-16 w-16 text-white/80" />
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow justify-between">
        <div>
          <div className="flex items-center mb-3">
            <div className="text-primary mr-3 flex-shrink-0">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold text-primary-darker">{title}</h3>
          </div>
          <p className="text-accent mb-4">{description}</p>
        </div>
        <Link to={link} className="block">
          <span className="text-primary hover:text-primary-lighter duration-300 font-semibold">
            Learn More &rarr;
          </span>
        </Link>
      </div>
    </div>
  );
}
