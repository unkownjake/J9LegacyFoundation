const Events: React.FC = () => {
  /* Structure for event is as follows:
    id: 1,
    title: "Title",
    date: "Date",
    description:
      "Desc",
  */
  const events = [
    {
      id: 1,
      title: "Title",
      date: "Date",
      description:
        "Desc",
    },
  ]
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-6">Upcoming Events</h1>
          <p className="text-lg text-gray-700 mb-8">
            Join us in our mission to create a sustainable future. Check out our upcoming events and get involved!
          </p>
          <div className="space-y-8">
            {events.map((event) => (
              <div key={event.id} className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-2">{event.title}</h2>
                <p className="text-blue-600 mb-4">{event.date}</p>
                <p className="text-gray-700">{event.description}</p>
                <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300">
                  Learn More
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  export default Events;