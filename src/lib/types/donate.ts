export interface DonationProvider {
  enabled: boolean;
}
export interface PaypalCheckoutConfig extends DonationProvider {
  /** Public Client ID (publishable — safe in code). */
  clientId: string;
}
export interface ZelleConfig extends DonationProvider {
  email: string;
}

export interface DonatePageContent {
  title: string;
  subtitle: string;
  impactTitle: string;
  impactText: string;
  amounts: string[];
  defaultAmount: string;
  feePercent: number;
  /** In-app PayPal/Venmo Smart Buttons flow. */
  paypalCheckout: PaypalCheckoutConfig;
  zelle: ZelleConfig;
}

export const emptyDonateContent: DonatePageContent = {
  title: "Support Our Cause",
  subtitle: "",
  impactTitle: "Building Our Impact",
  impactText: "",
  amounts: ["5", "10", "25", "50"],
  defaultAmount: "25",
  feePercent: 1.99,
  paypalCheckout: { enabled: true, clientId: "" },
  zelle: { enabled: true, email: "" },
};
