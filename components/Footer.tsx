import Link from "next/link";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-accent py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch space-y-4 md:space-y-0 md:h-20">
          <div className="flex-1 flex items-center justify-center md:justify-center">
            <a
              href="mailto:info@j9legacy.org"
              className="text-accent-foreground hover:text-primary transition duration-300"
            >
              info@j9legacy.org
            </a>
          </div>
          <div className="hidden md:block w-px self-stretch bg-accent-foreground mx-4"></div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-accent-foreground text-center">
              &copy; {new Date().getFullYear()} J9 Legacy Foundation. All rights
              reserved.
            </div>
          </div>
          <div className="hidden md:block w-px self-stretch bg-accent-foreground mx-4"></div>
          <div className="flex-1 flex items-center justify-center md:justify-center">
            <Link
              href="/donate"
              className="bg-white text-accent flex items-center gap-2 px-6 py-2 rounded-lg font-semibold hover:bg-accent-lighter transition duration-300"
            >
              <Heart className="fill-accent w-4 h-4" />
              Donate
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
