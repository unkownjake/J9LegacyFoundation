export interface Event {
  id: number;
  slug: string;
  title: string;
  date: string;
  time: string;
  location: string;
  address?: string;
  description: string;
  cardImageUrl: string;
  modalImageUrl: string;
  additionalInfo: string;
  src: string;
}
