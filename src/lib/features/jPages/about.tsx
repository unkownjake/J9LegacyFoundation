const About: React.FC = () => {
    return (
      <div className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6">About EcoHope Foundation</h1>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/2">
            <p className="text-lg text-gray-700 mb-4">
              EcoHope Foundation is dedicated to creating a sustainable future through education, conservation, and
              innovative environmental solutions. Founded in 2010, we've been at the forefront of environmental advocacy
              and action.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              Our mission is to empower communities to take meaningful action against climate change and environmental
              degradation. We believe that by working together, we can create a more sustainable and equitable world for
              all.
            </p>
            <h2 className="text-2xl font-semibold mt-6 mb-4">Our Core Values</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Environmental Stewardship</li>
              <li>Community Empowerment</li>
              <li>Innovation and Sustainability</li>
              <li>Education and Awareness</li>
            </ul>
          </div>
          <div className="md:w-1/2">
            {/* <Image
              src="/"
              alt=""
              width={600}
              height={400}
              className="rounded-lg shadow-lg"
            /> */}
          </div>
        </div>
      </div>
    );
  };
  
  export default About;