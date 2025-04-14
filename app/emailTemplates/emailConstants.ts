import {
  DONATION_THANK_YOU_PARAGRAPHS,
  DONATION_THANK_YOU_SIGNATURE,
  DONATION_THANK_YOU_STYLES,
  DONATION_THANK_YOU_SIGNOFF,
} from "./constants/donationThankYou";

export enum EmailType {
  DONATION_THANK_YOU = "DONATION_THANK_YOU",
}

export function getEmailParagraphs(type: EmailType): string[] {
  switch (type) {
    case EmailType.DONATION_THANK_YOU:
      return DONATION_THANK_YOU_PARAGRAPHS;
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

export function getEmailSignoff(type: EmailType): string {
  switch (type) {
    case EmailType.DONATION_THANK_YOU:
      return DONATION_THANK_YOU_SIGNOFF;
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

export function getEmailSignature(type: EmailType) {
  switch (type) {
    case EmailType.DONATION_THANK_YOU:
      return DONATION_THANK_YOU_SIGNATURE;
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}

export function getEmailStyles(type: EmailType) {
  switch (type) {
    case EmailType.DONATION_THANK_YOU:
      return DONATION_THANK_YOU_STYLES;
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}
