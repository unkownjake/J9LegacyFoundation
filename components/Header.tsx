"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { J9Logo } from "@/components/J9Logo";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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
    { href: "/donate", text: "Donate" },
  ];

  return (
    <header className="bg-white shadow-md border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link
          href="/"
          aria-label="Go to homepage"
          className="transition-opacity hover:opacity-80"
        >
          <J9Logo width="auto" height="auto" />
        </Link>
        {/* <h2 className="text-2xl font-bold text-primary-darker">
          J9 Legacy Foundation
        </h2> */}
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
            <ul className="flex space-x-12">
              {navItems.map((item) => (
                <NavItem key={item.href} href={item.href} text={item.text} />
              ))}
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

function NavItem({ href, text, onClick }) {
  return (
    <li>
      <Link
        href={href}
        className="text-primary-darker hover:text-primary transition duration-300"
        onClick={onClick}
      >
        {text}
      </Link>
    </li>
  );
}
