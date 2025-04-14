import {
  EmailType,
  getEmailParagraphs,
  getEmailSignature,
  getEmailStyles,
  getEmailSignoff,
} from "./emailConstants";

function replaceTemplateVariables(
  text: string,
  replacements: Record<string, string>
): string {
  return Object.entries(replacements).reduce((acc, [key, value]) => {
    return acc.replace(`\${${key}}`, value);
  }, text);
}

export function getEmailHTMLFormat(
  name: string,
  amount: string,
  type: EmailType
): string {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const paragraphs = getEmailParagraphs(type);
  const signature = getEmailSignature(type);
  const styles = getEmailStyles(type);
  const signoff = getEmailSignoff(type);

  const paragraphsHtml = paragraphs
    .map((paragraph) => {
      const cleanedParagraph = replaceTemplateVariables(paragraph, {
        name: name,
        amount: amount,
        date: date,
      });
      return `<p>${cleanedParagraph}</p>`;
    })
    .join("");

  return `
    <div style="font-family: ${styles.fontFamily}; line-height: ${styles.lineHeight}; color: ${styles.textColor}">
      <img src="cid:j9logo" alt="J9 Legacy Foundation Logo" style="height: ${styles.logoHeight}; width: auto" />
      <p>Dear ${name},</p>
      ${paragraphsHtml}
      <p style="margin: 1em 0 0.5em 0">${signoff}</p>
      <p style="margin: 0">${signature.name}</p>
      <p style="margin: 0">${signature.position}</p>
    </div>
  `;
}

export function getEmailPlaintextFormat(
  name: string,
  amount: string,
  type: EmailType
): string {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const paragraphs = getEmailParagraphs(type);
  const signature = getEmailSignature(type);
  const signoff = getEmailSignoff(type);

  const paragraphsText = paragraphs
    .map((paragraph) => {
      const cleanedParagraph = replaceTemplateVariables(paragraph, {
        name: name,
        amount: amount,
        date: date,
      });
      return cleanedParagraph;
    })
    .join("\n\n");

  return `Dear ${name},\n\n${paragraphsText}\n\n${signoff}\n${signature.name}\n${signature.position}`;
}
