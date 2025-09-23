export interface CommunityEvent {
  name: string;
  description: string;
  url?: string;
}

export interface CommunityEventsContent {
  title: string;
  imageA: string;
  imageB: string;
  infoTitle: string;
  infoText: string;
  annualEventsHeader: string;
  annualEvents: CommunityEvent[];
  ongoingInitiativesHeader: string;
  ongoingInitiatives: CommunityEvent[];
  conclusion: string;
}
