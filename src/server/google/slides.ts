import { google, type slides_v1 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

interface CreateSlidesResult {
  presentationId: string;
  presentationUrl: string;
  slideCount: number;
}

interface LessonSection {
  title: string;
  content: string;
  phase?: string;
  duration?: string;
}

/** Parse lesson markdown into sections suitable for slides */
function parseLessonSections(markdown: string): {
  title: string;
  subtitle: string;
  sections: LessonSection[];
} {
  const lines = markdown.split("\n");
  let title = "Lesson Plan";
  let subtitle = "";
  const sections: LessonSection[] = [];
  let currentSection: LessonSection | null = null;

  for (const line of lines) {
    // Main title
    const h1 = line.match(/^# (.+)$/);
    if (h1) {
      title = h1[1];
      continue;
    }

    // Extract subtitle from metadata
    const prepMatch = line.match(/\*\*Prepared for:\*\*\s*(.+)/);
    if (prepMatch) {
      subtitle = prepMatch[1].trim();
      continue;
    }

    // H2 sections become slides
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      if (currentSection) sections.push(currentSection);
      currentSection = { title: h2[1], content: "" };
      continue;
    }

    // H3 subsections fold into the current H2 section as content
    const h3 = line.match(/^### (.+)$/);
    if (h3) {
      if (currentSection) {
        currentSection.content += `\n${h3[1]}\n`;
      }
      continue;
    }

    // Timing markers
    const timeMatch = line.match(/\*\*(\d+[–-]\d+ min)\*\*/);
    if (timeMatch && currentSection) {
      currentSection.duration = timeMatch[1];
      continue;
    }

    // Phase markers
    const phaseMatch = line.match(/\*\*Phase:\*\*\s*(.+)/);
    if (phaseMatch && currentSection) {
      currentSection.phase = phaseMatch[1].trim();
      continue;
    }

    // Accumulate content
    if (currentSection && line.trim()) {
      // Strip markdown formatting for slide text
      const clean = line
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/^[-*] /, "- ")
        .replace(/^\| .+/, ""); // Skip table rows
      if (clean.trim()) {
        currentSection.content += clean + "\n";
      }
    }
  }

  if (currentSection) sections.push(currentSection);

  return { title, subtitle, sections };
}

/** Create a Google Slides presentation from a lesson plan */
export async function createPresentation(
  auth: OAuth2Client,
  title: string,
  markdownContent: string
): Promise<CreateSlidesResult> {
  const slides = google.slides({ version: "v1", auth });

  // Create empty presentation
  const createRes = await slides.presentations.create({
    requestBody: { title },
  });

  const presentationId = createRes.data.presentationId!;
  const { title: lessonTitle, subtitle, sections } = parseLessonSections(markdownContent);

  const requests: slides_v1.Schema$Request[] = [];

  // Get the default first slide ID
  const firstSlideId = createRes.data.slides?.[0]?.objectId;

  // Update the title slide (the default first slide)
  if (firstSlideId) {
    // Find the title and subtitle placeholders
    const titleShape = createRes.data.slides?.[0]?.pageElements?.find(
      (el) => el.shape?.placeholder?.type === "CENTERED_TITLE" || el.shape?.placeholder?.type === "TITLE"
    );
    const subtitleShape = createRes.data.slides?.[0]?.pageElements?.find(
      (el) => el.shape?.placeholder?.type === "SUBTITLE"
    );

    if (titleShape?.objectId) {
      requests.push({
        insertText: {
          objectId: titleShape.objectId,
          text: lessonTitle,
        },
      });
    }
    if (subtitleShape?.objectId && subtitle) {
      requests.push({
        insertText: {
          objectId: subtitleShape.objectId,
          text: subtitle,
        },
      });
    }
  }

  // Apply title slide text first
  if (requests.length > 0) {
    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: { requests },
    });
  }

  // Create content slides in a separate batch — first create all slides
  const createRequests: slides_v1.Schema$Request[] = [];
  for (let i = 0; i < sections.length; i++) {
    const slideId = `slide_${i}`;
    const titleId = `title_${i}`;
    const bodyId = `body_${i}`;

    createRequests.push({
      createSlide: {
        objectId: slideId,
        insertionIndex: i + 1,
        slideLayoutReference: { predefinedLayout: "TITLE_AND_BODY" },
        placeholderIdMappings: [
          { layoutPlaceholder: { type: "TITLE", index: 0 }, objectId: titleId },
          { layoutPlaceholder: { type: "BODY", index: 0 }, objectId: bodyId },
        ],
      },
    });
  }

  if (createRequests.length > 0) {
    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: { requests: createRequests },
    });
  }

  // Now insert text into the created slides
  const textRequests: slides_v1.Schema$Request[] = [];
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const titleId = `title_${i}`;
    const bodyId = `body_${i}`;

    // Section title with optional timing
    let slideTitle = section.title;
    if (section.duration) slideTitle += ` (${section.duration})`;

    textRequests.push({
      insertText: {
        objectId: titleId,
        text: slideTitle,
      },
    });

    // Body content — trim to reasonable length for a slide
    const bodyText = section.content.trim().slice(0, 500);
    if (bodyText) {
      textRequests.push({
        insertText: {
          objectId: bodyId,
          text: bodyText,
        },
      });
    }
  }

  if (textRequests.length > 0) {
    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: { requests: textRequests },
    });
  }

  return {
    presentationId,
    presentationUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
    slideCount: sections.length + 1, // +1 for title slide
  };
}
