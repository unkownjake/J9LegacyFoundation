import React, { useState } from "react";
import getIcon from "../donate/DonationIcons";

// Payment method configuration
const PAYMENT_CONFIG = {
  venmo: {
    enabled: true,
    link: "https://venmo.com/j9legacy?txn=pay&amount={amount}&note={note}",
  },
  paypal: {
    enabled: true,
    link: "https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=6E6ZPWVH5ZL22&item_name=Web+Donation&amount={amount}&currency_code=USD&custom=website_donation&return={return_url}",
  },
  zelle: {
    enabled: true,
    email: "nmaxey@j9legacy.org",
  },
};

function DonationWorkflow() {
  const [method, setMethod] = useState("paypal");
  const [amount, setAmount] = useState("25");
  const [customAmount, setCustomAmount] = useState("50");
  const [coverFees, setCoverFees] = useState(true);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [wantsReceipt, setWantsReceipt] = useState(true);
  const [showError, setShowError] = useState(false);
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setDonorEmail(newEmail);
    setShowError(false);

    if (newEmail && !validateEmail(newEmail)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

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
      let returnUrl = encodeURIComponent(
        `${process.env.NEXT_PUBLIC_BASE_URL}/donate/thank-you`
      );
      if (wantsReceipt) {
        returnUrl = encodeURIComponent(
          `${
            process.env.NEXT_PUBLIC_BASE_URL
          }/api/paypal/return?name=${encodeURIComponent(
            donorName
          )}&email=${encodeURIComponent(donorEmail)}&amount=${amountValue}`
        );
      }
      return PAYMENT_CONFIG.paypal.link
        .replace("{amount}", amountValue)
        .replace("{return_url}", returnUrl);
    }
    return "#";
  };

  const handleDonate = () => {
    if (method === "zelle") {
      window.open("https://www.zellepay.com/", "_blank");
      return;
    } else if (method === "paypal" && wantsReceipt) {
      if (!donorName || !donorEmail) {
        setShowError(true);
        return;
      }
      if (!validateEmail(donorEmail)) {
        setEmailError("Please enter a valid email address");
        return;
      }
    }
    setShowError(false);
    setEmailError("");
    window.open(getLink(), "_blank");
  };

  return (
    <div className="p-6 bg-white max-w-3xl md:w-1/2 rounded-xl shadow-lg border">
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
          {["paypal", "venmo", "zelle"].map((m) => (
            <label key={m} className="flex items-center gap-3">
              <input
                type="radio"
                name="method"
                value={m}
                checked={method === m}
                onChange={(e) => setMethod(e.target.value)}
              />
              <div className="flex justify-center items-center mx-auto border border-accent text-accent rounded-md py-2 px-4 gap-2">
                {getIcon(m)} {/* Retrieve icon */}
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </div>
            </label>
          ))}
        </div>
      </div>

      {method === "zelle" ? (
        <div className="mb-4 rounded-lg">
          <label className="block font-semibold mb-2">Donate via Zelle</label>
          <p className="mb-1">Find us on Zelle at:</p>
          <p className="font-mono mb-4 text-accent">
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
            <label className="flex items-center text-accent gap-2">
              <input
                type="checkbox"
                checked={coverFees}
                onChange={(e) => setCoverFees(e.target.checked)}
                className="h-4 w-4 border-gray-300 focus:ring-accent"
              />
              I would like to cover the transaction fees (adds 1.99%)
            </label>
          </div>

          {/* Instructions */}
          {method !== "paypal" && (
            <div className="text-sm text-gray-600 mb-4">
              Please leave your <strong>name</strong> and <strong>email</strong>{" "}
              in the note so we can send you a receipt.
            </div>
          )}

          {method === "paypal" && (
            <div className="mb-4">
              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={wantsReceipt}
                    onChange={(e) => {
                      setWantsReceipt(e.target.checked);
                      setShowError(false);
                      setEmailError("");
                    }}
                    className="h-4 w-4 border-gray-300 text-accent focus:ring-accent"
                  />
                  I would like to receive a donation receipt via email
                </label>
              </div>

              {wantsReceipt && (
                <>
                  <div className="mb-2">
                    <label className="block font-semibold mb-1">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={donorName}
                      onChange={(e) => {
                        setDonorName(e.target.value);
                        setShowError(false);
                      }}
                      className={`w-full border px-3 py-2 rounded focus:ring-accent focus:border-accent ${
                        showError && !donorName
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your name"
                      required
                    />
                    {showError && !donorName && (
                      <p className="text-red-500 text-sm mt-1">
                        Name is required for receipt
                      </p>
                    )}
                  </div>
                  <div className="mb-2">
                    <label className="block font-semibold mb-1">
                      Your Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={donorEmail}
                      onChange={handleEmailChange}
                      className={`w-full border px-3 py-2 rounded focus:ring-accent focus:border-accent ${
                        (showError && !donorEmail) || emailError
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your email"
                      required
                    />
                    {showError && !donorEmail && (
                      <p className="text-red-500 text-sm mt-1">
                        Email is required for receipt
                      </p>
                    )}
                    {emailError && (
                      <p className="text-red-500 text-sm mt-1">{emailError}</p>
                    )}
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      <strong>Note:</strong> After payment, either wait to be
                      redirected or click the "Return to J9 Legacy Foundation"
                      button to receive your receipt.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Donate Now Button */}
      <button
        onClick={handleDonate}
        disabled={
          method === "paypal" &&
          wantsReceipt &&
          (!donorName || !donorEmail || !!emailError)
        }
        className={`w-full bg-accent text-accent-foreground px-4 py-3 rounded-lg hover:bg-accent-lighter duration-300 focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
          method === "paypal" &&
          wantsReceipt &&
          (!donorName || !donorEmail || !!emailError)
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
      >
        {method === "zelle"
          ? "Take me to Zelle"
          : `Donate Now ($${finalAmount()})`}
      </button>
    </div>
  );
}

export default DonationWorkflow;
