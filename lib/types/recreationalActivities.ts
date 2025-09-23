export interface RecreationalInitiative {
  name: string;
  description: string;
}

export interface RecreationalActivitiesContent {
  title: string;
  image: string;
  infoText: string;
  currentInitiativesHeader: string;
  currentInitiatives: RecreationalInitiative[];
  futureOutlook: string;
}
