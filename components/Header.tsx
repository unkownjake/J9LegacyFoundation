"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Heart } from "lucide-react";
import { J9Logo } from "@/components/J9Logo";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { href: "/", text: "Home" },
    { href: "/about", text: "About" },
    { href: "/events", text: "Events" },
    { href: "/sponsorship-application", text: "Sponsorship Application" },
    { href: "/faq", text: "FAQ" },
    { href: "/donate", text: "Donate" },
  ];

  // Trigger animation when the component loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100); // Make component visible after 100ms

    return () => clearTimeout(timer); // Clear timer after animation end
  }, []);

  return (
    <header className="bg-white shadow-md border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link
          href="/"
          aria-label="Go to homepage"
          className="transition-opacity hover:opacity-80"
        >
          <J9Logo
            width="300"
            height="auto"
            className={`transform transition-all duration-1000 ease-out ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          />
        </Link>
        {isMobile ? (
          <button
            onClick={toggleMenu}
            className="text-primary-darker focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        ) : (
          <nav>
            <ul className="flex space-x-12 items-center">
              {navItems
                .filter((item) => item.text !== "Donate")
                .map((item) => (
                  <NavItem key={item.href} href={item.href} text={item.text} />
                ))}
              <li>
                <Link
                  href="/donate"
                  className="bg-accent text-white flex items-center gap-2 px-6 py-2 rounded-lg font-semibold hover:bg-accent-lighter transition duration-300"
                >
                  <Heart className="fill-white w-4 h-4" />
                  Donate
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
      {isMobile && isMenuOpen && (
        <nav className="bg-white py-4">
          <ul className="flex flex-col items-center space-y-4">
            {navItems.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                text={item.text}
                onClick={toggleMenu}
              />
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

function NavItem({
  href,
  text,
  onClick,
}: {
  href: string;
  text: string;
  onClick?: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-primary-darker font-semibold hover:text-primary transition duration-300"
        onClick={onClick}
      >
        {text}
      </Link>
    </li>
  );
}
