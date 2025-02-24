import { Box } from "@mui/material"

const Home: React.FC = () => {
    return (
      <Box>
        <section className="container mx-auto px-4 py-12 md:py-24 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to J9 Legacy Foundation</h1>
              <p className="text-lg text-gray-700 mb-6">
                Empowering youth and families who lack financial means to attend camps and host community events
                that support access to educational and recreational opportunities
              </p>
              <a
                href="/donate"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
              >
                Donate Now
              </a>
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
        </section>
      </Box>
    );
  };
  
  export default Home;