// Feel free to edit these with whatever content we want to send in the email. Remember:
// - ${amount} will be replaced with the amount of the donation
// - ${date} will be replaced with the date of the donation
// - ${name} will be replaced with the name of the donor

export const DONATION_THANK_YOU_PARAGRAPHS = [
  "Thank you for your generous donation of $${amount} to the J9 Legacy Foundation on ${date}.",
  `The J9 Legacy Foundation was started to honor the memory of Jacob Eshenbaugh, who passed away in May of 2024. 
  As a child, summer camps were an important and impactful part of his life, therefore, to continue his legacy the Foundation is working to help youth, 
  and their families experience things that were so meaningful to him. 
  Your support helps the Foundation empower youth and families by providing financial support for camp attendance
  and organizing community events that enhance access to educational and recreational opportunities.`,
  `No goods of services were provided in exchange, making your contribution fully taxed deductible.
  Thank you for your support in keeping Jacob’s spirit alive and helping kids and families in need.`,
];

export const DONATION_THANK_YOU_SIGNOFF = "With gratitude,";

export const DONATION_THANK_YOU_SIGNATURE = {
  name: "Naomi Maxey",
  position: "President",
};

export const DONATION_THANK_YOU_STYLES = {
  fontFamily: "Arial, sans-serif",
  lineHeight: 1.6,
  textColor: "#333",
  logoHeight: "50px",
};
