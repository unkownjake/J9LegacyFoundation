import { useEffect, useState } from "react";

interface AnimatedHeroProps {
  title: string;
  subtitle?: string;
  description: string;
}

export default function AnimatedHero({ title, subtitle, description }: AnimatedHeroProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      <h1
        className={`lg:text-6xl text-4xl font-bold mb-4 text-white transform transition-all duration-1000 ease-out ${
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-24"
        }`}
      >
        {title}
        {subtitle && <span className="block pt-2">{subtitle}</span>}
      </h1>
      <p
        className={`text-lg text-secondary pt-4 max-w-2xl transform transition-all duration-1000 ease-out ${
          isVisible ? "opacity-100 translate-x-0 delay-200" : "opacity-0 translate-x-24"
        }`}
      >
        {description}
      </p>
    </div>
  );
}
