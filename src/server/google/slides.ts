import { google, type slides_v1 } from "googleapis";
import type { OAuth2Client } from "google-auth-library";

// --- Public types: what the agent produces ---

export interface SlideContent {
  layout?: "content" | "section_header";
  title: string;
  bullets?: string[];
  speakerNotes?: string;
}

interface CreateSlidesResult {
  presentationId: string;
  presentationUrl: string;
  slideCount: number;
}

/** Create a Google Slides presentation from structured slide descriptions */
export async function createPresentation(
  auth: OAuth2Client,
  title: string,
  subtitle: string,
  slides: SlideContent[]
): Promise<CreateSlidesResult> {
  const api = google.slides({ version: "v1", auth });

  // Create empty presentation
  const createRes = await api.presentations.create({
    requestBody: { title },
  });
  const presentationId = createRes.data.presentationId!;

  // --- Phase 1: Populate the default title slide ---
  const titleRequests: slides_v1.Schema$Request[] = [];
  const firstSlide = createRes.data.slides?.[0];

  const titleShape = firstSlide?.pageElements?.find(
    (el) =>
      el.shape?.placeholder?.type === "CENTERED_TITLE" ||
      el.shape?.placeholder?.type === "TITLE"
  );
  const subtitleShape = firstSlide?.pageElements?.find(
    (el) => el.shape?.placeholder?.type === "SUBTITLE"
  );

  if (titleShape?.objectId) {
    titleRequests.push({
      insertText: { objectId: titleShape.objectId, text: title },
    });
  }
  if (subtitleShape?.objectId && subtitle) {
    titleRequests.push({
      insertText: { objectId: subtitleShape.objectId, text: subtitle },
    });
  }

  if (titleRequests.length > 0) {
    await api.presentations.batchUpdate({
      presentationId,
      requestBody: { requests: titleRequests },
    });
  }

  // --- Phase 2: Create all content slides ---
  const createSlideRequests: slides_v1.Schema$Request[] = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const layout =
      slide.layout === "section_header" ? "SECTION_HEADER" : "TITLE_AND_BODY";
    const slideId = `slide_${i}`;
    const titleId = `title_${i}`;

    const placeholderIdMappings: slides_v1.Schema$LayoutPlaceholderIdMapping[] =
      [
        {
          layoutPlaceholder: { type: "TITLE", index: 0 },
          objectId: titleId,
        },
      ];

    if (layout === "TITLE_AND_BODY") {
      placeholderIdMappings.push({
        layoutPlaceholder: { type: "BODY", index: 0 },
        objectId: `body_${i}`,
      });
    }

    createSlideRequests.push({
      createSlide: {
        objectId: slideId,
        insertionIndex: i + 1,
        slideLayoutReference: { predefinedLayout: layout },
        placeholderIdMappings,
      },
    });
  }

  if (createSlideRequests.length > 0) {
    await api.presentations.batchUpdate({
      presentationId,
      requestBody: { requests: createSlideRequests },
    });
  }

  // --- Phase 3: Insert text and formatting ---
  const textRequests: slides_v1.Schema$Request[] = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const titleId = `title_${i}`;
    const bodyId = `body_${i}`;

    textRequests.push({
      insertText: {
        objectId: titleId,
        text: slide.title,
        insertionIndex: 0,
      },
    });

    if (
      slide.layout !== "section_header" &&
      slide.bullets &&
      slide.bullets.length > 0
    ) {
      const bodyText = slide.bullets.join("\n");

      textRequests.push({
        insertText: {
          objectId: bodyId,
          text: bodyText,
          insertionIndex: 0,
        },
      });

      textRequests.push({
        createParagraphBullets: {
          objectId: bodyId,
          textRange: { type: "ALL" },
          bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
        },
      });

      textRequests.push({
        updateTextStyle: {
          objectId: bodyId,
          textRange: { type: "ALL" },
          style: { fontSize: { magnitude: 16, unit: "PT" } },
          fields: "fontSize",
        },
      });
    }
  }

  if (textRequests.length > 0) {
    await api.presentations.batchUpdate({
      presentationId,
      requestBody: { requests: textRequests },
    });
  }

  // --- Phase 4: Speaker notes (requires reading presentation back) ---
  const fullPresentation = await api.presentations.get({ presentationId });
  const notesRequests: slides_v1.Schema$Request[] = [];
  const allSlides = fullPresentation.data.slides || [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    if (!slide.speakerNotes) continue;

    const gSlide = allSlides[i + 1]; // +1 for title slide
    if (!gSlide) continue;

    const speakerNotesId =
      gSlide.slideProperties?.notesPage?.notesProperties
        ?.speakerNotesObjectId;

    if (speakerNotesId) {
      notesRequests.push({
        insertText: {
          objectId: speakerNotesId,
          text: slide.speakerNotes,
          insertionIndex: 0,
        },
      });
    }
  }

  if (notesRequests.length > 0) {
    await api.presentations.batchUpdate({
      presentationId,
      requestBody: { requests: notesRequests },
    });
  }

  return {
    presentationId,
    presentationUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
    slideCount: slides.length + 1,
  };
}
