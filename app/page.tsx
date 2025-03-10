"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import Header from "@/components/Header"
import Footer from "@/components/Footer"
import { Info, Calendar, Heart, ChevronLeft, ChevronRight } from "lucide-react"
import Slider from "react-slick"
import "slick-carousel/slick/slick.css"
import "slick-carousel/slick/slick-theme.css"

export default function Home() {
  const [isMobile, setIsMobile] = useState(false)
  const sliderRef = useRef(null)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const CustomArrow = ({ direction, onClick }) => (
    <button
      onClick={onClick}
      className={`bg-orange-500 text-white p-2 rounded-full shadow-md hover:bg-orange-600 transition-colors duration-300 ${
        direction === "prev" ? "mr-2" : "ml-2"
      }`}
      aria-label={direction === "prev" ? "Previous slide" : "Next slide"}
    >
      {direction === "prev" ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
    </button>
  )

  const carouselSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
  }

  const quickLinks = [
    {
      title: "About Us",
      description: "Learn about our mission and the impact we're making in the community.",
      icon: <Info className="h-6 w-6" />,
      link: "/about",
      image: "/founders.JPG",
    },
    {
      title: "Our Events",
      description: "Discover upcoming events and how you can get involved.",
      icon: <Calendar className="h-6 w-6" />,
      link: "/events",
      image: "/camp.JPG",
    },
    {
      title: "Support Our Cause",
      description: "Find out how you can contribute to our mission and make a difference.",
      icon: <Heart className="h-6 w-6" />,
      link: "/donate",
      image: "/team.JPG",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <section className="bg-gray-100 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-orange-700">Welcome to J9 Legacy Foundation</h1>
            <p className="text-lg text-gray-700 mb-6">
              Empowering youth and families to attend camps through community events that support access to educational
              and recreational opportunities.
            </p>
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
                  <CustomArrow direction="prev" onClick={() => sliderRef.current.slickPrev()} />
                  <CustomArrow direction="next" onClick={() => sliderRef.current.slickNext()} />
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
      </main>
      <Footer />
    </div>
  )
}

function QuickLinkCard({ title, description, icon, link, image }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col text-left">
      <div className="relative h-48 w-full">
        <Image src={image} alt={title} fill className="object-cover" />
      </div>
      <div className="p-6 flex flex-col flex-grow justify-between">
        <div>
          <div className="flex items-center mb-3">
            <div className="text-orange-500 mr-3 flex-shrink-0">{icon}</div>
            <h3 className="text-xl font-semibold text-orange-700">{title}</h3>
          </div>
          <p className="text-gray-600 mb-4">{description}</p>
        </div>
        <Link href={link} className="block">
          <span className="text-orange-500 font-semibold">Learn More &rarr;</span>
        </Link>
      </div>
    </div>
  )
}