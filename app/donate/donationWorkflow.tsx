import React, { useState } from "react";

// Payment method configuration
const PAYMENT_CONFIG = {
  venmo: {
    enabled: false,
    link: "https://venmo.com/yourusername?txn=pay&amount={amount}&note={note}",
  },
  paypal: {
    enabled: false,
    link: "https://www.paypal.me/j9%20legacy%20foundation/{amount}",
  },
  zelle: {
    enabled: true,
    email: "nmaxey@j9legacy.org",
  },
};

function ComingSoonModal({
  isOpen,
  onClose,
  method,
}: {
  isOpen: boolean;
  onClose: () => void;
  method: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Coming Soon</h3>
        <p className="mb-4">
          {method.charAt(0).toUpperCase() + method.slice(1)} donations will be
          available soon. In the meantime, please use Zelle for your donation.
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-accent text-accent-foreground px-4 py-2 rounded hover:bg-primary-darker"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DonationWorkflow() {
  const [method, setMethod] = useState("venmo");
  const [amount, setAmount] = useState("25");
  const [customAmount, setCustomAmount] = useState("50");
  const [coverFees, setCoverFees] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const finalAmount = () => {
    let base =
      amount === "custom" ? parseFloat(customAmount) || 0 : parseFloat(amount);
    if (coverFees) base = +(base * 1.0199).toFixed(2);
    return base.toFixed(2);
  };

  const getLink = () => {
    const note = encodeURIComponent(
      "Donation via website. Please include name & email in message."
    );
    const amountValue = finalAmount();

    if (method === "venmo") {
      return PAYMENT_CONFIG.venmo.link
        .replace("{amount}", amountValue)
        .replace("{note}", note);
    }
    if (method === "paypal") {
      return PAYMENT_CONFIG.paypal.link.replace("{amount}", amountValue);
    }
    return "#";
  };

  const handleDonate = () => {
    if (method === "zelle") {
      window.open("https://www.zellepay.com/", "_blank");
    } else {
      setShowModal(true);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto rounded-2xl shadow-lg border">
      <style jsx>{`
        input[type="radio"] {
          -webkit-appearance: none;
          appearance: none;
          background-color: #fff;
          margin: 0;
          font: inherit;
          color: currentColor;
          width: 1.15em;
          height: 1.15em;
          border: 0.15em solid #d1d5db;
          border-radius: 50%;
          transform: translateY(-0.075em);
          display: grid;
          place-content: center;
        }

        input[type="radio"]::before {
          content: "";
          width: 0.65em;
          height: 0.65em;
          border-radius: 50%;
          transform: scale(0);
          transition: 120ms transform ease-in-out;
          box-shadow: inset 1em 1em hsl(213, 44%, 24%);
        }

        input[type="radio"]:checked::before {
          transform: scale(1);
        }

        input[type="radio"]:focus {
          outline: max(2px, 0.15em) solid hsl(213, 44%, 24%);
          outline-offset: max(2px, 0.15em);
        }
      `}</style>

      <h2 className="text-2xl font-bold mb-4 text-center text-primary-darker">
        Make a Donation
      </h2>

      {/* Method Selection */}
      <div className="mb-4">
        <label className="block font-semibold mb-2">
          Choose a payment method:
        </label>
        <div className="flex gap-4">
          {["venmo", "paypal", "zelle"].map((m) => (
            <label key={m} className="flex items-center gap-2">
              <input
                type="radio"
                name="method"
                value={m}
                checked={method === m}
                onChange={(e) => setMethod(e.target.value)}
              />
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </label>
          ))}
        </div>
      </div>

      {method === "zelle" ? (
        <div className="mb-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Donate via Zelle</h3>
          <p className="mb-1">Find us on Zelle at:</p>
          <p className="font-mono mb-3 text-accent">
            <strong>nmaxey@j9legacy.org</strong>
          </p>
          <p className="text-sm text-gray-600">
            Please leave your <strong>name</strong> and <strong>email</strong>{" "}
            in the note so we can send you a receipt.
          </p>
        </div>
      ) : (
        <>
          {/* Amount Selection */}
          <div className="mb-4">
            <label className="block font-semibold mb-2">
              Choose your donation amount:
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {["5", "10", "25", "50", "custom"].map((amt) => (
                <button
                  key={amt}
                  className={`px-4 py-2 rounded-lg border ${
                    amount === amt
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-white text-black border-gray-300 hover:bg-accent/10"
                  }`}
                  onClick={() => setAmount(amt)}
                >
                  {amt === "custom" ? "Custom" : `$${amt}`}
                </button>
              ))}
            </div>
            {amount === "custom" && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded focus:ring-accent focus:border-accent pl-7"
                />
              </div>
            )}
          </div>

          {/* Cover Fees */}
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={coverFees}
                onChange={(e) => setCoverFees(e.target.checked)}
                className="h-4 w-4 border-gray-300 text-accent focus:ring-accent"
              />
              I would like to cover the transaction fees (adds 1.99%)
            </label>
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-600 mb-4">
            Please leave your <strong>name</strong> and <strong>email</strong>{" "}
            in the note so we can send you a receipt.
          </div>
        </>
      )}

      {/* Donate Now Button */}
      <button
        onClick={handleDonate}
        className="w-full bg-accent text-accent-foreground px-4 py-3 rounded-lg hover:bg-primary-darker focus:ring-2 focus:ring-accent focus:ring-offset-2"
      >
        {method === "zelle"
          ? "Take me to Zelle"
          : `Donate Now ($${finalAmount()})`}
      </button>

      <ComingSoonModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        method={method}
      />
    </div>
  );
}

export default DonationWorkflow;
