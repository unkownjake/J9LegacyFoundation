/**
 * Seed script — imports Supabase data into Neon.
 * Run with: npx tsx src/db/seed.ts
 *
 * Set CLERK_ADMIN_USER_ID before running:
 *   CLERK_ADMIN_USER_ID=user_xxx npx tsx src/db/seed.ts
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const CLERK_ADMIN_USER_ID = process.env.CLERK_ADMIN_USER_ID;
if (!CLERK_ADMIN_USER_ID) {
  console.error("ERROR: Set CLERK_ADMIN_USER_ID=user_xxx before running.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("Seeding events...");
  await db.insert(schema.events).values([
    {
      id: "04861c8d-34ec-4df0-938d-62ba3405578c",
      slug: "test",
      title: "Test",
      description:
        "Test event!Test event!Test event!Test event!Test event!Test event!Test event!Test event!Test event!Test event!Test event!Test event!Test event!Test event!Test event!Test event!Test event!Test event!Test event!Test event!Test event!Test event!Test event!\n",
      location: "68 Hopedale Street\nBoston, Massachusetts 02163",
      startsAt: new Date("2026-05-12T22:06:00Z"),
      endsAt: new Date("2026-05-13T00:06:00Z"),
      // NOTE: Supabase storage URL — update to Vercel Blob URL in Phase 13
      heroImage:
        "https://aizlwyatlqgavgbwwmlv.supabase.co/storage/v1/object/public/site-images/events/04861c8d-34ec-4df0-938d-62ba3405578c-1777759596512.png",
      gallery: [],
      published: true,
      sortOrder: 0,
      subtitle: "Subtext",
      eventType: "registration",
      costDescription: "$10",
      registrationDeadline: "2026-05-11",
      capacity: 120,
      registrationOpen: true,
      pageContent: {},
      pricingTiers: [
        { id: "t-xgt17lks", kind: "individual", name: "Individual", price: 12, capacity: null },
        { id: "t-114iqydq", kind: "team", name: "Team", price: 50, capacity: null, rosterMax: 8, rosterMin: 4 },
      ],
      registrationForm: {
        sections: [
          {
            id: "s-ksyyzur",
            goTo: { kind: "submit" },
            title: "",
            fields: [
              { id: "f-6eg11le", kind: "short_text", label: "Name", required: true },
              { id: "f-l4imt1a", kind: "number", label: "Number of attendees", required: true },
            ],
            description: "",
          },
        ],
      },
      organizerName: "Kris Wong",
      organizerEmail: "kwong@j9legacy.org",
      organizerPhone: "123456677",
      // NOTE: Supabase storage URL — update to Vercel Blob URL in Phase 13
      documents: [
        {
          id: "doc_ixdwnwm8",
          url: "https://aizlwyatlqgavgbwwmlv.supabase.co/storage/v1/object/public/site-documents/9165d2a0-fce5-465f-8c6b-98520ccfdceb.pdf",
          mime: "application/pdf",
          name: "Flyer",
          size: 286869,
        },
      ],
      createdAt: new Date("2026-05-02T22:05:40.769Z"),
      updatedAt: new Date("2026-05-10T21:47:07.384Z"),
    },
  ]).onConflictDoNothing();

  console.log("Seeding pages...");
  await db.insert(schema.pages).values([
    {
      slug: "home",
      content: {
        hero: {
          title: "J9 Legacy Foundation",
          description:
            "Empowering youth and families to attend camps through community events that support access to educational and recreational opportunities.",
        },
        homepageCards: [
          {
            id: "default-1",
            icon: "info",
            link: "/about",
            image:
              "https://aizlwyatlqgavgbwwmlv.supabase.co/storage/v1/object/public/site-images/home-cards/bbee1e42-cce8-4227-91a4-86977b599750.jpeg",
            title: "About Us",
            description: "Learn about our mission and the impact we are making in the community.",
            verticalPosition: "center",
          },
          {
            id: "default-2",
            icon: "calendar",
            link: "/events",
            image:
              "https://aizlwyatlqgavgbwwmlv.supabase.co/storage/v1/object/public/site-images/home-cards/872f5f9e-70b1-4472-b439-7744a314f014.jpg",
            title: "Our Events",
            description: "Discover upcoming events and how you can get involved.",
            verticalPosition: "center",
          },
          {
            id: "default-3",
            icon: "heart",
            link: "/donate",
            image:
              "https://aizlwyatlqgavgbwwmlv.supabase.co/storage/v1/object/public/site-images/home-cards/a733ceab-0ab7-4606-80b3-ae1b93ce2353.jpeg",
            title: "Support Our Cause",
            description: "Find out how you can contribute to our mission and make a difference.",
            verticalPosition: "20%",
          },
        ],
      },
      updatedAt: new Date("2026-05-02T21:02:45.443Z"),
    },
    {
      slug: "event:04861c8d-34ec-4df0-938d-62ba3405578c:upcoming",
      content: {
        rows: [
          {
            id: "r-hx0yud3",
            cells: [
              [
                { id: "h-odqatvg", kind: "heading", text: "Highlights", level: 2, style: "plain" },
                {
                  id: "list-jpgn4s9",
                  kind: "list",
                  items: ["What makes this event special", "Who it's for", "Why you should join"],
                  style: "bullet",
                  title: "",
                },
              ],
            ],
            columns: 1,
          },
          {
            id: "r-5qpp05d",
            cells: [
              [
                { id: "h-gthcvb3", kind: "heading", text: "What to bring", level: 2, style: "plain" },
                {
                  id: "list-wnz0c49",
                  kind: "list",
                  items: ["Comfortable clothing & closed-toe shoes", "Water bottle", "Sunscreen / weather-appropriate gear", "A friend!"],
                  style: "bullet",
                  title: "",
                },
              ],
            ],
            columns: 1,
          },
          {
            id: "r-f05xij3",
            cells: [
              [
                { id: "h-b5ke1m7", kind: "heading", text: "Activities", level: 2, style: "plain" },
                {
                  id: "t-fdgek2y",
                  body: "",
                  kind: "text",
                  title: "",
                  bodyHtml:
                    "<p>Describe the activities, schedule, or run-of-show for the day so attendees know what to expect.</p>",
                },
              ],
            ],
            columns: 1,
          },
        ],
        title: "",
        backLink: null,
      },
      updatedAt: new Date("2026-05-10T21:47:07.484Z"),
    },
    {
      slug: "event:04861c8d-34ec-4df0-938d-62ba3405578c:past",
      content: {
        rows: [
          {
            id: "r-6sdrd3b",
            cells: [
              [
                { id: "h-oyi86eg", kind: "heading", text: "Thank you!", level: 2, style: "plain" },
                {
                  id: "t-u8b51aj",
                  body: "",
                  kind: "text",
                  title: "",
                  bodyHtml:
                    "<p>Thank you to everyone who came out and made this event a success. Your support means the world to us.</p>",
                },
              ],
            ],
            columns: 1,
          },
          {
            id: "r-wwxskhj",
            cells: [
              [
                { id: "h-8xa7oj1", kind: "heading", text: "Thanks to our sponsors", level: 2, style: "plain" },
                {
                  id: "t-e8wo0am",
                  body: "",
                  kind: "text",
                  title: "",
                  bodyHtml:
                    "<p>We're grateful to the sponsors and partners who made this event possible. Add their names, logos, or link cards here.</p>",
                },
              ],
            ],
            columns: 1,
          },
          {
            id: "r-j17wvj6",
            cells: [
              [
                { id: "h-wor1vz4", kind: "heading", text: "Event highlights", level: 2, style: "plain" },
                {
                  id: "t-fhdg4h2",
                  body: "",
                  kind: "text",
                  title: "",
                  bodyHtml:
                    "<p>Share your favorite moments from the day — add photos, quotes, and short recap paragraphs.</p>",
                },
              ],
            ],
            columns: 1,
          },
          {
            id: "r-liwarv6",
            cells: [
              [
                { id: "h-21pfwux", kind: "heading", text: "By the numbers", level: 2, style: "plain" },
                {
                  id: "stats-b8fc42i",
                  kind: "stats",
                  items: [
                    { id: "s-5fythhv", label: "Raised", value: "$0" },
                    { id: "s-1aphlz0", label: "Participants", value: "0" },
                    { id: "s-p124mf2", label: "Volunteers", value: "0" },
                  ],
                },
              ],
            ],
            columns: 1,
          },
          {
            id: "r-whyqln1",
            cells: [
              [
                {
                  id: "q-24d44la",
                  kind: "quote",
                  text: "A short testimonial from a participant or family captures the impact better than statistics ever could.",
                  attribution: "— Attendee",
                },
              ],
            ],
            columns: 1,
          },
        ],
        title: "",
        backLink: null,
      },
      updatedAt: new Date("2026-05-10T21:46:40.324Z"),
    },
    {
      slug: "about",
      content: {
        rows: [
          {
            id: "r-lz9xzd7",
            cells: [
              [
                {
                  id: "t-b1xmp92",
                  body: "The J9 Legacy Foundation was started to honor the memory of our son, brother, cousin, and friend, Jacob Eshenbaugh, who passed away on May 23, 2024. As a child, summer camps were an important and impactful part of Jacob's life, so we thought it was fitting to try and help children experience something that was so meaningful to him.\n\nThe Foundation is dedicated to empowering youth and families by providing financial support for camp attendance and organizing community events that enhance access to educational and recreational opportunities. We believe that every child deserves the chance to grow, learn, and explore in a nurturing and supportive environment.\n\nThrough our efforts, we honor Jacob's legacy by opening doors to opportunities that create cherished memories for children in need. Together, we strive to transform lives and make a lasting impact, one experience at a time.",
                  kind: "text",
                  style: "plain",
                  title: "Our Mission",
                },
              ],
              [
                {
                  id: "i-mxun67v",
                  alt: "J9 Legacy Foundation Team",
                  url: "https://aizlwyatlqgavgbwwmlv.supabase.co/storage/v1/object/public/site-images/about/ebcc5ce3-1487-4cce-8f4d-0837d362693b.png",
                  kind: "image",
                  aspect: "4/3",
                  verticalPosition: "center",
                },
              ],
            ],
            columns: 2,
          },
          {
            id: "r-tnap0v0",
            cells: [
              [
                { id: "t-65s2k6w", body: "", kind: "text", style: "plain", title: "Our Impact", bodyHtml: "<p>Through our initiatives, we aim to:</p>" },
                {
                  id: "lc-b5cxton",
                  kind: "linkCards",
                  cards: [
                    { id: "c-r690fv8", icon: "tent", link: "/about/camp-sponsorship", title: "Sponsor youth and families to attend camps", description: "" },
                    { id: "c-7h9k5ml", icon: "users", link: "/about/community-events", title: "Host community events supporting educational access", description: "" },
                    { id: "c-z7cawai", icon: "volleyball", link: "/about/recreational-activities", title: "Create opportunities for recreational activities", description: "" },
                    { id: "c-x0exil3", icon: "tree", link: "/about/personal-growth", title: "Foster personal growth and development", description: "" },
                  ],
                },
                { id: "t-velbc0z", body: "Join us in our mission to create lasting positive impacts on the lives of youth and families in our community.", kind: "text", style: "plain", title: "" },
              ],
            ],
            columns: 1,
          },
        ],
        intro: "",
        title: "About J9 Legacy Foundation",
        backLink: null,
      },
      updatedAt: new Date("2026-05-02T20:28:32.786Z"),
    },
    {
      slug: "about-community-events",
      content: {
        rows: [
          { id: "r-6mmwwr8", cells: [[{ id: "h-bjz5e8j", kind: "heading", text: "Supporting Educational Access", level: 2, style: "plain" }, { id: "t-0qpqsyh", body: "The J9 Legacy Foundation is committed to empowering youth and families through meaningful community events that provide greater access to educational and recreational opportunities. Each gathering serves as a chance to build connections, celebrate Jacob's legacy, and ensure that all participants can engage in enriching experiences.", kind: "text", style: "plain", title: "Supporting Educational Access" }]], columns: 1 },
          { id: "r-82u3rjm", cells: [[{ id: "h-oe712fu", kind: "heading", text: "Annual Events", level: 2, style: "plain" }, { id: "ic-rkd7068", body: "", kind: "infoCard", title: "Unkown Jake Lacrosse Jamboree", bodyHtml: "<p>A community-centered lacrosse event that welcomes players of all backgrounds and experience levels. Whether seasoned athletes, casual players, or first-timers, participants get to enjoy a day of fun, teamwork, and sportsmanship while celebrating Jacob's passion for the game.</p>" }, { id: "ic-w1sg9ny", body: "The Foundation's annual fundraiser, bringing people together through the shared joy of skating. This event features an auction spotlighting small local businesses, an exciting slide competition, and—for the first time coming next year—a raffle to further engage participants while raising funds for scholarships and youth programs. The fundraiser is a celebration of movement, connection, and the generosity of a community dedicated to keeping Jacob's legacy alive.", kind: "infoCard", title: "Rollin' with Jacob Skate Fundraiser" }], [{ id: "i-ihexgsv", alt: "Community events", url: "https://aizlwyatlqgavgbwwmlv.supabase.co/storage/v1/object/public/site-images/about-community-events/a3569901-d1b5-4b7e-bab4-f01151b31dfa.jpeg", kind: "image", aspect: "4/3", verticalPosition: "center" }]], columns: 2 },
          { id: "r-l038sx7", cells: [[{ id: "i-1d55ft1", alt: "Community events photo", url: "https://aizlwyatlqgavgbwwmlv.supabase.co/storage/v1/object/public/site-images/about-community-events/f406d5e7-8079-4312-a9ff-781d7311a9ef.jpeg", kind: "image", aspect: "4/3", verticalPosition: "center" }], [{ id: "h-j1x3vic", kind: "heading", text: "Ongoing Initiatives", level: 2, style: "plain" }, { id: "ic-e7sml61", body: "", kind: "infoCard", title: "Pop-up Fundraisers", bodyHtml: "<p>In partnership with local restaurants, bakeries, and small businesses, the Foundation is looking to host mini fundraising events throughout the year. These gatherings not only raise awareness and support scholarship opportunities, but also provide a chance for community members to come together in a relaxed, welcoming atmosphere.</p>" }, { id: "ic-tzwfrmq", body: "", kind: "infoCard", title: "Expanding Educational & Recreational Access", bodyHtml: "<p>Through our community events and fundraising efforts, we continue to grow opportunities for youth and families to engage in activities that promote learning, confidence, and joy. Whether through camps, sports, or creative initiatives, every program ensures that barriers to participation are reduced and that families feel supported and included.</p>" }]], columns: 2 },
          { id: "r-0r56ww4", cells: [[{ id: "t-oa2yxvo", body: "", kind: "text", style: "plain", title: "", bodyHtml: "<p>Each event is more than just a gathering — it's a chance to foster friendships, build confidence, and create lasting memories. Through these experiences, Jacob's spirit of adventure, kindness, and inclusivity lives on in every moment of joy shared by the community.</p>" }]], columns: 1 },
        ],
        intro: "",
        title: "Community Events",
        backLink: { to: "/about", label: "Back to About" },
        pageIcon: "users",
      },
      updatedAt: new Date("2026-05-02T20:16:15.814Z"),
    },
    {
      slug: "about-recreational-activities",
      content: {
        rows: [
          { id: "r-w3gvtnr", cells: [[{ id: "t-39kswn6", body: "", kind: "text", style: "plain", title: "", bodyHtml: "<p>Access to recreational activities is more than just fun — it's a entryway to personal growth, community connection, and lifelong memories. One of J9 Legacy Foundation's goal is to allow youth and families, the enjoyment and enrichment that recreational opportunities provide.<br><br>Through our current and future scholarships, we aim to help youth and their families participate in activities that may have previously been out of reach. These programs offer not only moments of excitement but also opportunities for skill-building, confidence-building, and social engagement.</p>" }]], columns: 1 },
          { id: "r-wwvcmvq", cells: [[{ id: "h-nf8fj7n", kind: "heading", text: "Current Recreational Initiatives", level: 2, style: "plain" }, { id: "ic-ra6yaxv", body: "Sponsoring around 70 second- through fifth-graders from the local Boys & Girls Club for a skating experience, giving them the chance to enjoy movement, teamwork, and the thrill of trying something new.", kind: "infoCard", title: "Expanding Recreational Access" }, { id: "ic-gdv9098", body: "Creating pathways for youth to explore activities like lacrosse, roller skating, and other recreational programs that encourage physical activity and personal development.", kind: "infoCard", title: "Broadening Sports Participation" }], [{ id: "i-3ye5scf", alt: "Recreational activities", url: "https://aizlwyatlqgavgbwwmlv.supabase.co/storage/v1/object/public/site-images/about-recreational-activities/af9eda89-5d37-46d1-9222-7113e651d266.jpeg", kind: "image", aspect: "4/3", verticalPosition: "center" }]], columns: 2 },
          { id: "r-52ra3rf", cells: [[{ id: "t-djl7lrh", body: "Looking ahead, the Foundation remains dedicated to growing access to enriching recreational opportunities, ensuring that more youth and families can benefit from the transformative power of play, movement, and connection.", kind: "text", style: "plain", title: "" }]], columns: 1 },
        ],
        intro: "",
        title: "Create opportunities for recreational activities",
        backLink: { to: "/about", label: "Back to About" },
        pageIcon: "volleyball",
      },
      updatedAt: new Date("2026-05-02T20:23:24.109Z"),
    },
    {
      slug: "about-camp-sponsorship",
      content: {
        rows: [
          { id: "r-t3tx3p7", cells: [[{ id: "t-nay19qk", body: "Summer camps played a pivotal role in Jacob's childhood, shaping experiences that remained deeply meaningful to him. The friendships, confidence-building moments, and sense of adventure that camps provided were cornerstones of his journey, leaving lasting impressions that influenced his life.\n\nTo honor his legacy, the J9 Legacy Foundation is committed to ensuring that youth and families, regardless of financial barriers, have access to these transformative experiences. Through camp sponsorships, our goal is to help young people discover new skills, build self-confidence, and form lasting friendships in an environment that fosters growth and joy.", kind: "text", style: "plain", title: "Why Camps Sponsorships?" }], [{ id: "i-q3bl9id", alt: "Camp sponsorship", url: "https://aizlwyatlqgavgbwwmlv.supabase.co/storage/v1/object/public/site-images/about-camp-sponsorship/49aba1c4-f4a7-47fe-92f3-7f47d25577e5.jpeg", kind: "image", aspect: "4/3", verticalPosition: "center" }]], columns: 2 },
          { id: "r-ddlqlcf", cells: [[{ id: "h-h1uaqn6", kind: "heading", text: "Current Camp Sponsorships", level: 2 }, { id: "ic-w93bp6r", body: "Sponsoring a ninth-grade girl to attend a weeklong goalie lacrosse camp, providing her with specialized coaching and a chance to build skills, resilience, and teamwork in a sport Jacob loved.", kind: "infoCard", link: "", title: "Lacrosse Camp" }, { id: "ic-ok5tadz", body: "Partnering with organizations to identify families in need of scholarships, ensuring that adopted children and their families can attend a camp designed to support connection, growth, and shared experiences.", kind: "infoCard", link: "https://www.adoptionfamilycamp.org/", title: "Adoption Family Camp" }, { id: "ic-ahwupev", body: "Working with organizations to help youth access roller skating camp, where they can experience the freedom and joy of movement while building confidence in a supportive environment.", kind: "infoCard", title: "Roller Skating Camp" }, { id: "ic-5qkf9u4", body: "Sponsoring two youth for a weeklong summer camp experience, where they can explore new activities, make lifelong friends, and enjoy the simple pleasures of summer adventures.", kind: "infoCard", link: "https://www.summerfuncamp.net/", title: "Summer Fun Camp" }]], columns: 1 },
          { id: "r-g98y2yc", cells: [[{ id: "i-p9g7alk", alt: "Image", url: "https://aizlwyatlqgavgbwwmlv.supabase.co/storage/v1/object/public/site-images/about-camp-sponsorship/1cfc994b-5cf7-4c2b-a8bd-ec049d33b73d.jpeg", kind: "image", aspect: "4/3", verticalPosition: "center" }], [{ id: "t-esm8wbk", body: "", kind: "text", style: "boxed", title: "", bodyHtml: "<p>Beyond the activities themselves, these camps give youth and families moments of joy, personal development, and belonging, ensuring that Jacob's legacy lives on through each shared experience, each new friendship, and each spark of confidence gained along the way.</p>" }, { id: "btn-aj0yesc", kind: "button", link: "/sponsorship-application", align: "left", label: "Apply for Sponsorship", newTab: false, variant: "primary" }]], columns: 2 },
        ],
        intro: "",
        title: "Youth and Families Camp Sponsorships",
        backLink: { to: "/about", label: "Back to About" },
        pageIcon: "tent",
      },
      updatedAt: new Date("2026-05-02T20:48:20.202Z"),
    },
    {
      slug: "about-personal-growth",
      content: {
        rows: [
          { id: "r-4xvrk6p", cells: [[{ id: "t-zuw8cx2", body: "", kind: "text", align: "center", title: "", bodyHtml: "<p>Every event and sponsorship builds confidence, nurtures friendships, and creates lasting memories—all ensuring Jacob's legacy thrives through moments of joy.<br></p>" }]], columns: 1 },
          { id: "r-aoheyu1", cells: [[{ id: "h-av8h2m5", kind: "heading", text: "Building Confidence Through New Experiences", level: 3, style: "plain" }, { id: "t-td6b22z", body: "", kind: "text", style: "plain", title: "Building Confidence Through New Experiences", bodyHtml: "<p>Whether stepping onto the field for their first lacrosse game, learning how to surf or lacing up skates for a community event, youth gain valuable skills that strengthen resilience, independence, and self-assurance. Trying something new in a supportive environment helps them develop courage and a sense of accomplishment.</p>" }, { id: "h-ygkm1i3", kind: "heading", text: "Creating Opportunities for Friendship and Belonging", level: 3, style: "plain" }, { id: "t-7oyruzh", body: "", kind: "text", style: "plain", title: "Creating Opportunities for Friendship and Belonging", bodyHtml: "<p>By bringing youth and families together, we foster an environment where friendships flourish. Camps and events provide safe spaces for connection, allowing participants to bond over shared experiences, form relationships, and feel embraced by a community that supports them.</p>" }, { id: "h-mmnnflu", kind: "heading", text: "Cultivating Joy and Lasting Memories", level: 3, style: "plain" }, { id: "t-2psdgv1", body: "Each camp, jamboree, and fundraiser is more than just an activity—it's an opportunity to experience joy, laughter, and the simple thrill of play. These moments stay with youth and families, becoming treasured memories that carry Jacob's legacy forward in their lives.", kind: "text", style: "plain", title: "Cultivating Joy and Lasting Memories" }], [{ id: "i-e80n8or", alt: "Personal growth", url: "https://aizlwyatlqgavgbwwmlv.supabase.co/storage/v1/object/public/site-images/about-personal-growth/b163fafd-1b99-44bc-bf51-05886d25a97d.jpeg", kind: "image", aspect: "4/3", verticalPosition: "center" }]], columns: 2 },
          { id: "r-je69d1f", cells: [[{ id: "t-ad6lak0", body: "", kind: "text", align: "center", title: "", bodyHtml: "<p>Through these experiences, the Foundation continues to honor Jacob's spirit, ensuring his passion for community, connection, and adventure lives on in every child who finds joy, strength, and friendship through our programs.</p>" }]], columns: 1 },
        ],
        intro: "\n",
        title: "Foster personal growth and development",
        backLink: { to: "/about", label: "Back to About" },
        pageIcon: "tree",
      },
      updatedAt: new Date("2026-05-02T20:38:10.284Z"),
    },
    {
      slug: "faq",
      content: {
        intro: "Find answers to common questions about the J9 Legacy Foundation, our mission, and how you can get involved.",
        items: [
          { id: "q-seed01", answer: "<p>The foundation was created to honor the memory of Jacob Eshenbaugh, a beloved son, brother, cousin, and friend who passed away on May 23, 2024. Summer camps played a meaningful role in Jacob's life, and we aim to help children experience the same joy and growth they brought him.</p>", question: "Why was the J9 Legacy Foundation started?" },
          { id: "q-seed02", answer: "<p>We empower youth and families by providing financial support for camp attendance and hosting community events that promote education, recreation, and personal growth. Our mission is to ensure every child has the opportunity to learn, explore, and thrive in a nurturing environment.</p>", question: "What is the J9 Legacy Foundation?" },
          { id: "q-seed03", answer: '<p><strong>"J"</strong> represents Jacob, <strong>"9"</strong> was his lacrosse number and favorite number, and <strong>"Legacy"</strong> reflects our mission to continue his kindness and impact.</p>', question: "Where does the name J9 Legacy come from?" },
          { id: "q-seed04", answer: "<p>Our scholarships are here to support families who might not otherwise be able to access these opportunities.</p>", question: "Who does the foundation support?" },
          { id: "q-seed05", answer: '<p>Email <a href="mailto:info@j9legacy.org">info@j9legacy.org</a> to request a scholarship application.</p>', question: "How do I apply for a camp scholarship?" },
          { id: "q-seed06", answer: '<p>Visit our <a href="https://www.j9legacy.org/">website</a>, follow us on Facebook (J9 Legacy Foundation), or check out our Instagram (<a href="https://www.instagram.com/j9_legacy/">@J9_Legacy</a>) for updates.</p>', question: "Where can I find information about upcoming J9 Legacy Foundation events?" },
          { id: "q-seed07", answer: '<p>Donations can be made via:</p><ul><li><strong>PayPal</strong> username: J9 Legacy Foundation</li><li><strong>Venmo</strong> username: J9 Legacy Foundation</li><li><strong>Zelle</strong> username: J9 Legacy Foundation</li><li>Checks made out to "J9 Legacy Foundation"</li></ul>', question: "How can I donate to the J9 Legacy Foundation?" },
          { id: "q-seed08", answer: "<p><em>[Insert price]</em></p>", question: "How much does a T-shirt cost?" },
          { id: "q-seed09", answer: "<p><em>[Insert price]</em></p>", question: "How much does a sticker cost?" },
        ],
        title: "Frequently Asked Questions",
        ctaTitle: "Still have questions?",
        ctaButtonLink: "mailto:info@j9legacy.org",
        ctaButtonLabel: "Contact Us",
        ctaDescription: "We're here to help! Reach out to us for any additional information.",
      },
      updatedAt: new Date("2026-05-02T21:00:55.929Z"),
    },
    {
      slug: "events",
      content: {
        empty: { intro: "We're busy planning what's next. Check back soon for upcoming community events and activities.", title: "No events scheduled right now" },
        intro: "Join us for meaningful community events, educational workshops, and recreational activities that bring people together and support our mission.",
        title: "Community Events & Activities",
        inProgress: { badge: "Happening Now", intro: "Come join us — the event is in progress. Tap below for details.", title: "An event is happening right now!" },
        pastHeading: "Past Events",
        upcomingHeading: "Upcoming Events",
      },
      updatedAt: new Date("2026-05-02T21:19:51.651Z"),
    },
    {
      slug: "donate",
      content: {
        title: "Support Our Cause",
        venmo: { handle: "j9legacy", enabled: true },
        zelle: { email: "nmaxey@j9legacy.org", enabled: true },
        paypal: { enabled: true, businessId: "6E6ZPWVH5ZL22" },
        amounts: ["5", "10", "25", "50"],
        subtitle: "Your donation helps us continue our mission to support youth athletics. Every contribution, no matter the size, makes a difference.",
        feePercent: 1.99,
        impactText: "We are currently in the process of identifying and establishing partnerships with youth sports programs and organizations in the greater Seattle area that align with our mission. Your donations will help us support these initiatives once they are finalized.\n\nWe are committed to transparency and will keep our donors informed as we develop our programs and partnerships. Thank you for your support as we work to make a meaningful impact in our local community.",
        impactTitle: "Building Our Impact",
        defaultAmount: "25",
        paypalCheckout: { enabled: true, clientId: "AVKjRxMn2l7KHuzByGBVYlMIZrxm9-tivwLXiqY7ClkOZtfanRA8P4jeIcP3VN0-1dLKOg3N55_M24xo", environment: "sandbox" },
      },
      updatedAt: new Date("2026-05-10T22:33:16.858Z"),
    },
    {
      slug: "sponsorship-application",
      content: {
        rows: [
          { id: "r-sa-intro", cells: [[{ id: "h-sesug9h", kind: "heading", text: "Welcome", level: 2, style: "plain" }, { id: "t-qxizmyu", body: "", kind: "text", title: "", bodyHtml: "<p>Our scholarships are here to support families who may not otherwise be able to access these opportunities. We know that money can be a sensitive and complicated topic, and there's no single right story when it comes to financial need.</p><p>If paying for camp or an activity would feel like a real stretch for your family, we warmly encourage you to apply.</p><p>If you would like to help us continue offering this scholarship, please support us below.</p>" }, { id: "btn-sa-donate", kind: "button", link: "/donate", align: "center", label: "Support Our Camp Sponsorship Program", newTab: false, variant: "primary" }]], columns: 1 },
          { id: "r-sa-panels", cells: [[{ id: "h-sa-how", icon: "mail", kind: "heading", text: "Who Should Apply?", level: 2, style: "plain" }, { id: "t-sa-how", body: "", kind: "text", title: "", bodyHtml: "<p>You might consider applying if you or your family:</p>" }, { id: "l-sa-how", kind: "list", items: ["Rent your home", "Have not completed a postgraduate degree", "Are disabled, chronically ill, or neurodivergent", "Identify as part of the BIPOC or 2SLGBTQIA+ communities", "Are parenting on your own", "Receive public assistance", "Use credit cards to cover basic needs", "Don't have a financial safety net", "Have difficulty accessing mental health care due to cost", "Are unemployed or underemployed", "Rarely have extra money for fun activities"], style: "bullet", title: "" }], [{ id: "h-sa-info", icon: "info", kind: "heading", text: "Important Application Information", level: 2, style: "plain" }, { id: "l-sa-info", kind: "list", items: ["We have limited resources and cannot support every application", "Applications are reviewed on a rolling basis", "We will contact you with our decision via email", "Please apply as early as possible before camp registration deadlines"], style: "bullet", title: "" }, { id: "co-sa-limit", kind: "callout", text: "Sponsorship Limit: Up to $400 per camp per youth/family per year", tone: "info" }, { id: "h-3nptd38", kind: "heading", text: "Application Questions", level: 3, style: "plain" }, { id: "t-gpueqar", body: "", kind: "text", title: "", bodyHtml: "<p>Please type up your answers to these questions and submit them as a pdf in the Application form below.</p>" }, { id: "list-5j7lrhy", kind: "list", items: ["Please describe your family's current financial situation (We're not looking for detailed paperwork - just a little context helps)", "Why are you or your child excited to participate?", "Is there anything else you'd like us to know?"], style: "number", title: "" }]], columns: 2 },
        ],
        title: "Camp Sponsorship",
        backLink: null,
        pageIcon: "tent",
      },
      updatedAt: new Date("2026-05-10T23:42:08.296Z"),
    },
    {
      slug: "sponsorship-application-form",
      content: {
        intro: "Tell us about yourself and the camp or program you'd like sponsored. Required fields are marked with *.",
        title: "Sponsorship Application",
        sections: [
          { id: "s-applicant", goTo: { kind: "next" }, title: "Applicant Information", fields: [{ id: "applicant_name", kind: "short_text", label: "Full name", required: true }, { id: "f-v30hbrw", kind: "select", label: "Applicant is...", options: [{ id: "o-vjg3p5w", label: "Parent / Guardian" }, { id: "o-lm5wpu0", label: "Child" }], required: true }, { id: "applicant_email", kind: "email", label: "Email", required: true }, { id: "f-wts293x", kind: "phone", label: "Phone Number", required: true }, { id: "f-1ia3rih", kind: "select", label: "Text Messages OK?", options: [{ id: "o-eolzq9u", label: "Yes" }, { id: "o-6in8ypc", label: "No" }], required: true }, { id: "f-95we8yp", kind: "number", label: "Zip Code", required: true }, { id: "grade", kind: "short_text", label: "Child's Current Grade", required: true }] },
          { id: "s-camp", goTo: { kind: "submit" }, title: "Camp / Program", fields: [{ id: "camp_name", kind: "short_text", label: "Camp / Activity Name", required: true }, { id: "f-9cwxz9c", kind: "date", label: "Start date of the camp/activity", required: true }, { id: "camp_url", kind: "short_text", label: "Camp website (URL)" }, { id: "camp_cost", kind: "number", label: "Estimated cost ($)", required: true }, { id: "f-mkx046m", kind: "number", label: "If a partial scholarship would make participation possible for you, what amount would allow you to participate?" }, { id: "essay", kind: "file_upload", label: "Application essay (upload)", helpText: "PDF or Word document, up to 10MB.", required: true, maxSizeMb: 10, acceptedTypes: ".pdf,.doc,.docx" }] },
        ],
      },
      updatedAt: new Date("2026-05-10T23:39:28.965Z"),
    },
  ]).onConflictDoNothing();

  console.log("Seeding feature_roadmap...");
  await db.insert(schema.featureRoadmap).values([
    { id: "c70aa5aa-f467-45c0-a6c1-3b7003a79fe3", title: "Remove Lovable Dependencies", description: "Move backend to AWS / figure out how to host for free / cheap on our domain.", category: "general", priority: "high", status: "planned", sortOrder: 60, createdAt: new Date("2026-05-03T00:21:36.286Z"), updatedAt: new Date("2026-05-04T03:45:55.604Z") },
    { id: "8cf8149d-0058-49e7-a56a-64d79ed2a75d", title: "Zelle / Venmo email scraping", description: "Scrape inbound payment notification emails and auto-register them against an event submission.", category: "payments", priority: "low", status: "planned", sortOrder: 30, createdAt: new Date("2026-05-03T00:02:57.123Z"), updatedAt: new Date("2026-05-04T03:46:07.539Z") },
    { id: "0fe9c1a7-3317-4a08-b923-e07ad6564ecc", title: "Transactional confirmation emails", description: "Send confirmation emails for event registrations and applications. Requires verified email domain.", category: "email", priority: "high", status: "done", sortOrder: 10, createdAt: new Date("2026-05-03T00:02:57.123Z"), updatedAt: new Date("2026-05-10T22:38:49.789Z") },
    { id: "39fdab63-5f72-4e2d-9fb5-f25f6fc96860", title: "PayPal live mode end-to-end testing", description: "Test full donation + event registration capture flow in live PayPal environment.", category: "payments", priority: "high", status: "in_progress", sortOrder: 20, createdAt: new Date("2026-05-03T00:02:57.123Z"), updatedAt: new Date("2026-05-10T22:38:57.110Z") },
    { id: "5532ea7c-bd41-4b15-ba38-902bc7ea418d", title: "Magic-link edit (not just cancel)", description: "Allow attendees to edit their submitted form answers via the magic link.", category: "events", priority: "low", status: "in_progress", sortOrder: 50, createdAt: new Date("2026-05-03T00:02:57.123Z"), updatedAt: new Date("2026-05-10T22:46:33.208Z") },
  ]).onConflictDoNothing();

  console.log("Seeding applications...");
  await db.insert(schema.applications).values([
    { id: "267c43e0-4be5-4f70-a78c-28141012fed9", applicantName: "a", applicantEmail: "s@s.m", status: "new", answers: { why: "df", essay: "essays/2026/7360e8bb-6f2d-4b09-8e92-947c0f6056e2-BGIE_Spring_2026_Final_Exam.pdf", camp_name: "as", applicant_age: "12", applicant_name: "a", applicant_email: "s@s.m" }, attachments: [{ mime: "application/pdf", name: "BGIE Spring 2026 Final Exam.pdf", path: "essays/2026/7360e8bb-6f2d-4b09-8e92-947c0f6056e2-BGIE_Spring_2026_Final_Exam.pdf", size: 1794075, fieldId: "essay" }], createdAt: new Date("2026-05-03T04:41:12.169Z"), updatedAt: new Date("2026-05-03T04:41:12.169Z") },
    { id: "4625a07e-50ca-4fe4-ad27-a9ce91f102fc", applicantName: "asdjfkl", applicantEmail: "kristofer.wong.27@gmail.com", status: "new", answers: { why: "wer", camp_name: "asjoi", applicant_name: "asdjfkl", applicant_email: "kristofer.wong.27@gmail.com" }, attachments: [], createdAt: new Date("2026-05-10T21:45:25.921Z"), updatedAt: new Date("2026-05-10T21:45:25.921Z") },
  ]).onConflictDoNothing();

  console.log("Seeding event_submissions...");
  await db.insert(schema.eventSubmissions).values([
    { id: "0949f186-b9d7-4b7a-a31f-26bf560c0599", eventId: "04861c8d-34ec-4df0-938d-62ba3405578c", status: "confirmed", amount: "0", paymentMethod: "free", paymentStatus: "not_required", submitterName: "Kris Wong", submitterEmail: "kristofer.wong.27@gmail.com", submitterPhone: "123412342", roster: [], answers: { "f-6eg11le": "Kris Wong", "f-l4imt1a": "3" }, magicToken: "24d5b073de214614aa49c3ae37af8097", headcount: 1, createdAt: new Date("2026-05-03T00:11:28.862Z"), updatedAt: new Date("2026-05-03T00:11:28.862Z") },
    { id: "74f14c88-6b7c-4517-a62a-7bb6ed2fca95", eventId: "04861c8d-34ec-4df0-938d-62ba3405578c", status: "cancelled", pricingTierId: "t-xgt17lks", pricingTierName: "Individual", pricingTierKind: "individual", amount: "12", paymentMethod: "in_person", paymentStatus: "owed_in_person", submitterName: "abc", submitterEmail: "kristofer.wong.27@gmail.com", roster: [], answers: { "f-6eg11le": "Kris", "f-l4imt1a": "1" }, magicToken: "41815ad7590c490d9fe2d942d5e15cff", headcount: 1, createdAt: new Date("2026-05-10T21:47:45.331Z"), updatedAt: new Date("2026-05-10T21:48:22.315Z"), cancelledAt: new Date("2026-05-10T21:48:22.291Z") },
  ]).onConflictDoNothing();

  console.log("Seeding user_roles...");
  await db.insert(schema.userRoles).values([
    { userId: CLERK_ADMIN_USER_ID, role: "admin", createdAt: new Date("2026-05-01T20:26:22.024Z") },
  ]).onConflictDoNothing();

  console.log("Seeding admin_notification_prefs...");
  await db.insert(schema.adminNotificationPrefs).values([
    { userId: CLERK_ADMIN_USER_ID, notifyApplications: true, notifyDonations: true, notifyEventSubmissions: true, createdAt: new Date("2026-05-10T21:43:44.637Z"), updatedAt: new Date("2026-05-10T21:43:44.637Z") },
  ]).onConflictDoNothing();

  console.log("✓ Seed complete.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
