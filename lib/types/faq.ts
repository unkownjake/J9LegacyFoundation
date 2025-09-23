export interface FAQ {
  id: string;
  question: string;
  answer: string;
  order?: number;
  isActive?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface FAQPageContent {
  faqs: FAQ[];
  title?: string;
  description?: string;
}
