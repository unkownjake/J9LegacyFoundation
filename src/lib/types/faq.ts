export interface FaqItem {
  id: string;
  question: string;
  /** Rich-text HTML (sanitized via sanitizeHtml). */
  answer: string;
}

export interface FaqContent {
  title: string;
  intro: string;
  items: FaqItem[];
  ctaTitle: string;
  ctaDescription: string;
  ctaButtonLabel: string;
  /** mailto:, https://, or internal path. */
  ctaButtonLink: string;
}

const fid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export const newFaqItem = (): FaqItem => ({
  id: fid("q"),
  question: "New question?",
  answer: "",
});

