export interface ImpactCard {
  icon: string;
  text: string;
  link: string;
}

export interface AboutPageContent {
  title: string;
  missionSectionText: string;
  image: string;
  impactHeader: string;
  impactSubheader: string;
  impactCards: ImpactCard[];
  impactFooter: string;
}
