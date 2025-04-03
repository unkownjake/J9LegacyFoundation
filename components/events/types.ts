export interface Event {
  id: number;
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
