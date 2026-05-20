import type { SectionPageContent, PageComponent, PageRow } from "@/lib/types/cms";

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

function row(columns: 1 | 2 | 3, ...components: PageComponent[]): PageRow {
  const cells: PageComponent[][] = Array.from({ length: columns }, () => []);
  components.forEach((c, i) => cells[i % columns].push(c));
  return { id: uid("r"), columns, cells };
}

function heading(text: string, level: 1 | 2 | 3 = 2): PageComponent {
  return { id: uid("h"), kind: "heading", text, level, style: "plain" };
}

function text(bodyHtml: string): PageComponent {
  return { id: uid("t"), kind: "text", title: "", body: "", bodyHtml };
}

function callout(text: string, tone: "info" | "neutral" | "success" = "info"): PageComponent {
  return { id: uid("co"), kind: "callout", text, tone };
}

function documents(title?: string): PageComponent {
  return { id: uid("docs"), kind: "documents", title: title ?? "", files: [] };
}

function list(items: string[]): PageComponent {
  return { id: uid("list"), kind: "list", title: "", style: "bullet", items };
}

function stats(items: { value: string; label: string }[]): PageComponent {
  return {
    id: uid("stats"),
    kind: "stats",
    items: items.map((it) => ({ id: uid("s"), ...it })),
  };
}

function quote(textValue: string, attribution = ""): PageComponent {
  return { id: uid("q"), kind: "quote", text: textValue, attribution };
}

export const upcomingEventStarter: SectionPageContent = {
  title: "",
  backLink: null,
  rows: [
    row(1, heading("Highlights"), list([
      "What makes this event special",
      "Who it's for",
      "Why you should join",
    ])),
    row(1, heading("What to bring"), list([
      "Comfortable clothing & closed-toe shoes",
      "Water bottle",
      "Sunscreen / weather-appropriate gear",
      "A friend!",
    ])),
    row(1, heading("Activities"), text(
      "<p>Describe the activities, schedule, or run-of-show for the day so attendees know what to expect.</p>",
    )),
  ],
};

export const pastEventStarter: SectionPageContent = {
  title: "",
  backLink: null,
  rows: [
    row(1, heading("Thank you!"), text(
      "<p>Thank you to everyone who came out and made this event a success. Your support means the world to us.</p>",
    )),
    row(1, heading("Thanks to our sponsors"), text(
      "<p>We're grateful to the sponsors and partners who made this event possible. Add their names, logos, or link cards here.</p>",
    )),
    row(1, heading("Event highlights"), text(
      "<p>Share your favorite moments from the day — add photos, quotes, and short recap paragraphs.</p>",
    )),
    row(1, heading("By the numbers"), stats([
      { value: "$0", label: "Raised" },
      { value: "0", label: "Participants" },
      { value: "0", label: "Volunteers" },
    ])),
    row(1, quote("A short testimonial from a participant or family captures the impact better than statistics ever could.", "— Attendee")),
  ],
};

export function eventStarterFor(variant: "upcoming" | "past"): SectionPageContent {
  return variant === "past" ? pastEventStarter : upcomingEventStarter;
}
