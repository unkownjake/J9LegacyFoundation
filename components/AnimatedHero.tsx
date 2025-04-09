import { useEffect, useState } from "react";

function AnimatedHero() {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger animation when the component loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100); // Make component visible after 100ms

    return () => clearTimeout(timer); // Clear timer after animation end
  }, []);

  return (
    <div>
      <h1
        className={`lg:text-6xl sm:text-5xl text-4xl font-bold mb-4 text-white transform transition-all duration-1000 ease-out ${
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-24"
        }`}
      >
        Welcome to <span className="block pt-2">J9 Legacy Foundation</span>
      </h1>

      <p
        className={`text-lg text-secondary pt-4 max-w-2xl transform transition-all duration-1000 ease-out ${
          isVisible
            ? "opacity-100 translate-x-0 delay-200"
            : "opacity-0 translate-x-24"
        }`}
      >
        Empowering youth and families to attend camps through community events
        that support access to educational and recreational opportunities.
      </p>
    </div>
  );
}

export default AnimatedHero;
