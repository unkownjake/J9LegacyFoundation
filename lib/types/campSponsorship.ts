export interface CampSponsorship {
  name: string;
  description: string;
  url?: string;
}

export interface CampSponsorshipContent {
  title: string;
  imageA: string;
  imageB: string;
  infoTitle: string;
  infoText: string;
  campSponsorships: CampSponsorship[];
  conclusion: string;
}
