import Image from "next/image";

export default function AboutPage() {
  return (
    <div>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-primary text-4xl font-bold mb-12">
          About J9 Legacy Foundation
        </h1>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2">
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
            <h2 className="text-xl text-accent font-semibold mt-6 mb-4">
              Our Impact
            </h2>
            <p className="text-lg text-accent mb-4">
              Through our initiatives, we aim to:
            </p>
            <ul className="list-disc list-inside text-accent space-y-2 mb-6">
              <li>Sponsor youth and families to attend camps</li>
              <li>Host community events supporting educational access</li>
              <li>Create opportunities for recreational activities</li>
              <li>Foster personal growth and development</li>
            </ul>
          </div>
          <div className="md:w-1/2">
            <Image
              src="/j9.png"
              alt="J9 Legacy Foundation Team"
              width={600}
              height={400}
              className="rounded-lg shadow-lg mb-6"
            />
          </div>
        </div>
      </div>
      <section className="w-full bg-primary-lighter">
        <div className="px-4 py-16">
          <p className="max-w-screen-lg mx-auto text-xl text-primary-darker text-center font-medium">
            Join us in our mission to create lasting positive impacts on the
            lives of youth and families in our community.
          </p>
        </div>
      </section>
    </div>
  );
}
