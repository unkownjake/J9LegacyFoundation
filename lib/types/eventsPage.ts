export interface EventsPageContent {
  title: string;
  subtitle: string;
  showUpcomingSection: boolean;
  showPastSection: boolean;
  upcomingSectionTitle: string;
  pastSectionTitle: string;
  noEventsMessage: string;
  noEventsSubtitle: string;
}

import { EventDisplay } from "./events";

export interface EventsPageData {
  upcomingEvents: EventDisplay[];
  pastEvents: EventDisplay[];
}
