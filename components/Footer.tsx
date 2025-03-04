import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-orange-800 text-white py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch space-y-4 md:space-y-0 md:h-20">
          <div className="flex-1 flex items-center justify-center md:justify-center">
            <a
              href="mailto:info@j9legacy.org"
              className="text-orange-200 hover:text-orange-100 transition duration-300"
            >
              info@j9legacy.org
            </a>
          </div>
          <div className="hidden md:block w-px self-stretch bg-orange-300 mx-4"></div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-orange-200 text-center">
              &copy; {new Date().getFullYear()} J9 Legacy Foundation. All rights reserved.
            </div>
          </div>
          <div className="hidden md:block w-px self-stretch bg-orange-300 mx-4"></div>
          <div className="flex-1 flex items-center justify-center md:justify-center">
            <Link
              href="/donate"
              className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition duration-300 inline-block"
            >
              Donate Now
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

