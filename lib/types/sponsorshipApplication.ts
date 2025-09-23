export interface ApplicationRequirement {
  text: string;
}

export interface ImportantInfo {
  text: string;
}

export interface SponsorshipApplicationContent {
  title: string;
  subtitle: string;
  applicationHeader: string;
  applicationDescription: string;
  applicationRequirements: ApplicationRequirement[];
  sponsorshipLimit: string;
  importantInfoHeader: string;
  importantInfoItems: ImportantInfo[];
  ctaText: string;
  ctaLink: string;
}
