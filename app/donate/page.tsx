import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Link from "next/link";
import { Banknote, CreditCard, Wallet } from "lucide-react"; // icons, can be swapped to diff library

export default function DonatePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6 text-orange-700">
          Support Our Cause
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          Your donation helps us continue our mission to support youth
          athletics. Every contribution, no matter the size, makes a difference.
        </p>
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-orange-600">
            Donation Options
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <DonationOption
              title="Venmo"
              icon={<Wallet className="h-6 w-6" />}
              link="https://venmo.com/j9legacyfoundation"
              description="Quick and easy mobile payments"
            />
            <DonationOption
              title="PayPal"
              icon={<CreditCard className="h-6 w-6" />}
              link="https://paypal.me/j9legacyfoundation"
              description="Secure online payments"
            />
            <DonationOption
              title="Zelle"
              icon={<Banknote className="h-6 w-6" />}
              link="https://www.zellepay.com/go/j9legacyfoundation"
              description="Direct bank-to-bank transfers"
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function DonationOption({ title, icon, link, description }) {
  return (
    <div className="flex flex-col items-center p-4 border rounded-lg shadow-sm">
      <div className="text-primary mb-2">{icon}</div>
      <h3 className="text-xl font-medium mb-2 text-orange-700">{title}</h3>
      <p className="text-accent text-center mb-4">{description}</p>
      <Link
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-primary text-white px-4 py-2 rounded hover:bg-orange-600 transition duration-300 flex items-center"
      >
        Donate with {title}
      </Link>
    </div>
  );
}
