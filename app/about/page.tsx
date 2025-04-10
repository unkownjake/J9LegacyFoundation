import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="bg-secondary">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-primary text-4xl font-bold mb-12">
          About J9 Legacy Foundation
        </h1>

        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="lg:w-1/2">
            <div className="border rounded-md bg-white shadow-lg p-6">
              <h2 className="text-xl text-accent font-semibold mb-4">
                Our Mission
              </h2>
              <p className="text-lg text-accent mb-6">
                {`The J9 Legacy Foundation was started to honor the memory of our
              son, brother, cousin, and friend, Jacob Eshenbaugh, who passed
              away on May 23, 2024. As a child, summer camps were an important
              and impactful part of Jacob's life, so we thought it was fitting
              to try and help children experience something that was so
              meaningful to him.`}
                <br />
                <br />
                {`The Foundation is dedicated to empowering youth
              and families by providing financial support for camp attendance
              and organizing community events that enhance access to educational
              and recreational opportunities. We believe that every child
              deserves the chance to grow, learn, and explore in a nurturing and
              supportive environment.`}
                <br />
                <br />
                {`Through our efforts, we honor Jacob's
              legacy by opening doors to opportunities that create cherished
              memories for children in need. Together, we strive to transform
              lives and make a lasting impact, one experience at a time.`}
              </p>
            </div>
          </div>
          <div className="relative lg:w-1/2 w-full aspect-[16/9] rounded-md shadow-lg overflow-hidden">
            <Image
              src="/j9.png"
              alt="J9 Legacy Foundation Team"
              fill
              className="object-cover"
            />
          </div>
        </div>
        <div className="border rounded-md bg-white shadow-lg p-6">
          <h2 className="text-xl text-accent font-semibold mb-4">Our Impact</h2>
          <p className="text-lg text-accent mb-4">
            Through our initiatives, we aim to:
          </p>
          <ul className="flex flex-col lg:flex-row mx-auto gap-6 list-inside text-accent">
            <li className="rounded-md bg-orange-100 p-4">
              Sponsor youth and families to attend camps
            </li>
            <li className="rounded-md bg-orange-100 p-4">
              Host community events supporting educational access
            </li>
            <li className="rounded-md bg-orange-100 p-4">
              Create opportunities for recreational activities
            </li>
            <li className="rounded-md bg-orange-100 p-4">
              Foster personal growth and development
            </li>
          </ul>
          <hr className="border-t border-secondary my-4" />

          <div className="mx-auto my-10">
            <p className="mx-auto text-xl text-accent text-center font-semibold">
              Join us in our mission to create lasting positive impacts on the
              lives of youth and families in our community.
            </p>
          </div>
        </div>
        {/* <div className="mx-auto my-12">
          <p className="max-w-screen-lg mx-auto text-xl text-accent text-center font-medium">
            Join us in our mission to create lasting positive impacts on the
            lives of youth and families in our community.
          </p>
        </div> */}
      </div>
    </div>
  );
}
