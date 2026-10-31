// Layout blocks for a project's Story (description). Each one shows up under
// "Insert" in the Studio's text editor, and each is drawn by
// components/creations/project-description.tsx on the site.
import { defineArrayMember, defineField, defineType } from "sanity";
import {
  AudioLines,
  BarChart3,
  Code2,
  Columns3,
  Frame,
  Images,
  LayoutPanelLeft,
  Link2,
  MessageSquareQuote,
  Minus,
  PanelTop,
  Video,
} from "lucide-react";

// ---------- shared fields ----------

const altField = defineField({
  name: "alt",
  title: "Alt text",
  type: "string",
  description: "Describe the image for screen readers and search engines.",
});

const captionField = defineField({ name: "caption", title: "Caption", type: "string" });

const positionField = defineField({
  name: "position",
  title: "Position",
  type: "string",
  description: "Left and Right sit beside the text so it wraps around (desktop only; phones always show full width).",
  initialValue: "full",
  options: {
    list: [
      { title: "Normal", value: "full" },
      { title: "Wide", value: "wide" },
      { title: "Left, text wraps", value: "left" },
      { title: "Right, text wraps", value: "right" },
      { title: "Small, centred", value: "center" },
    ],
    layout: "radio",
    direction: "horizontal",
  },
});

const aspectList = [
  { title: "Original", value: "original" },
  { title: "Square 1:1", value: "square" },
  { title: "Landscape 4:3", value: "landscape" },
  { title: "Portrait 3:4", value: "portrait" },
  { title: "Widescreen 16:9", value: "wide" },
];

const linkAnnotation = defineArrayMember({
  name: "link",
  type: "object",
  title: "Link",
  icon: Link2,
  fields: [
    defineField({
      name: "href",
      title: "URL",
      type: "url",
      validation: (r) => r.uri({ scheme: ["http", "https", "mailto", "tel"], allowRelative: true }),
    }),
  ],
});

const projectLinkAnnotation = defineArrayMember({
  name: "projectLink",
  type: "object",
  title: "Link to another project",
  icon: PanelTop,
  fields: [
    defineField({
      name: "project",
      title: "Project",
      type: "reference",
      to: [{ type: "project" }],
    }),
  ],
});

const decorators = [
  { title: "Bold", value: "strong" },
  { title: "Italic", value: "em" },
  { title: "Underline", value: "underline" },
  { title: "Strike", value: "strike-through" },
  { title: "Code", value: "code" },
  { title: "Highlight", value: "highlight" },
];

// ---------- text ----------

/** Rich text used inside other blocks (Image + text, Columns, Callout). */
export const simpleTextType = defineType({
  name: "simpleText",
  title: "Text",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "Subheading", value: "h3" },
        { title: "Small label", value: "h4" },
      ],
      marks: { decorators, annotations: [linkAnnotation, projectLinkAnnotation] },
    }),
  ],
});

/** The block definition for the main Story editor. */
export const storyBlock = defineArrayMember({
  type: "block",
  styles: [
    { title: "Normal", value: "normal" },
    { title: "Large intro", value: "lead" },
    { title: "Heading", value: "h2" },
    { title: "Subheading", value: "h3" },
    { title: "Small label", value: "h4" },
    { title: "Quote", value: "blockquote" },
    { title: "Right aligned", value: "right" },
    { title: "Centred", value: "center" },
  ],
  marks: { decorators, annotations: [linkAnnotation, projectLinkAnnotation] },
});

// ---------- media ----------

export const storyImage = defineArrayMember({
  type: "image",
  title: "Image",
  options: { hotspot: true },
  fields: [altField, captionField, positionField],
});

export const storyVideo = defineArrayMember({
  type: "file",
  title: "Video",
  icon: Video,
  options: { accept: "video/*" },
  fields: [
    altField,
    captionField,
    positionField,
    defineField({
      name: "playback",
      title: "Playback",
      type: "string",
      initialValue: "ambient",
      options: {
        list: [
          { title: "Ambient: plays silently on a loop", value: "ambient" },
          { title: "Player: controls and sound", value: "player" },
        ],
        layout: "radio",
      },
    }),
  ],
});

export const imageRowType = defineType({
  name: "imageRow",
  title: "Image row / grid",
  type: "object",
  icon: Images,
  fields: [
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      description: "2 to 12 images. They wrap onto new lines after the column count.",
      of: [defineArrayMember({ type: "image", options: { hotspot: true }, fields: [altField, captionField] })],
      options: { layout: "grid" },
      validation: (r) => r.min(2).max(12),
    }),
    defineField({
      name: "columns",
      title: "Columns",
      type: "number",
      description: "Leave empty to fit everything on one line (up to 4).",
      options: { list: [2, 3, 4], layout: "radio", direction: "horizontal" },
    }),
    defineField({
      name: "aspect",
      title: "Shape",
      type: "string",
      description: "Crop every image to the same shape so the grid lines up.",
      initialValue: "original",
      options: { list: aspectList, layout: "radio", direction: "horizontal" },
    }),
    // Kept so rows made before "Shape" existed still work.
    defineField({ name: "crop", type: "boolean", hidden: true }),
    defineField({ name: "caption", title: "Caption under the whole row", type: "string" }),
  ],
  preview: {
    select: { media: "images.0", images: "images", caption: "caption" },
    prepare({ media, images, caption }) {
      return { title: `Image row / grid (${images?.length ?? 0})`, subtitle: caption, media };
    },
  },
});

export const mediaTextType = defineType({
  name: "mediaText",
  title: "Image + text",
  type: "object",
  icon: LayoutPanelLeft,
  fields: [
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      fields: [altField, captionField],
      validation: (r) => r.required(),
    }),
    defineField({ name: "text", title: "Text", type: "simpleText" }),
    defineField({
      name: "imageSide",
      title: "Image side",
      type: "string",
      initialValue: "left",
      options: {
        list: [
          { title: "Left", value: "left" },
          { title: "Right", value: "right" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
    }),
    defineField({
      name: "imageWidth",
      title: "Image width",
      type: "string",
      initialValue: "half",
      options: {
        list: [
          { title: "One third", value: "third" },
          { title: "Half", value: "half" },
          { title: "Two thirds", value: "twoThirds" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
    }),
  ],
  preview: {
    select: { media: "image", side: "imageSide" },
    prepare({ media, side }) {
      return { title: "Image + text", subtitle: `Image on the ${side ?? "left"}`, media };
    },
  },
});

export const embedType = defineType({
  name: "embed",
  title: "Embed (YouTube, Vimeo, SoundCloud, Figma…)",
  type: "object",
  icon: Frame,
  fields: [
    defineField({
      name: "url",
      title: "URL",
      type: "url",
      description:
        "Paste a normal link: YouTube, Vimeo, SoundCloud, Spotify, Bandcamp embed, CodePen, Figma, the p5.js editor, or any page that allows embedding (like a live demo).",
      validation: (r) => r.required().uri({ scheme: ["https"] }),
    }),
    defineField({
      name: "aspect",
      title: "Shape",
      type: "string",
      description: "Ignored for SoundCloud and Spotify, which have a fixed height.",
      initialValue: "wide",
      options: {
        list: [
          { title: "Widescreen 16:9", value: "wide" },
          { title: "Landscape 4:3", value: "landscape" },
          { title: "Square 1:1", value: "square" },
          { title: "Portrait 3:4", value: "portrait" },
          { title: "Phone 9:16", value: "phone" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
    }),
    captionField,
  ],
  preview: {
    select: { title: "url", subtitle: "caption" },
    prepare({ title, subtitle }) {
      return { title: title ?? "Embed", subtitle: subtitle ?? "Embed" };
    },
  },
});

export const audioType = defineType({
  name: "audio",
  title: "Audio",
  type: "object",
  icon: AudioLines,
  fields: [
    defineField({
      name: "file",
      title: "Audio file",
      type: "file",
      options: { accept: "audio/*" },
      validation: (r) => r.required(),
    }),
    defineField({ name: "title", title: "Title", type: "string" }),
    captionField,
  ],
  preview: {
    select: { title: "title", subtitle: "caption" },
    prepare({ title, subtitle }) {
      return { title: title ?? "Audio", subtitle };
    },
  },
});

// ---------- text layouts ----------

export const pullQuoteType = defineType({
  name: "pullQuote",
  title: "Pull quote",
  type: "object",
  icon: MessageSquareQuote,
  fields: [
    defineField({ name: "quote", title: "Quote", type: "text", rows: 3, validation: (r) => r.required() }),
    defineField({ name: "attribution", title: "Who said it", type: "string" }),
  ],
  preview: {
    select: { title: "quote", subtitle: "attribution" },
  },
});

export const textColumnsType = defineType({
  name: "textColumns",
  title: "Text columns",
  type: "object",
  icon: Columns3,
  description: "Side-by-side text, e.g. Problem / Approach / Outcome.",
  fields: [
    defineField({
      name: "columns",
      title: "Columns",
      type: "array",
      validation: (r) => r.min(2).max(4),
      of: [
        defineArrayMember({
          type: "object",
          name: "column",
          fields: [
            defineField({ name: "heading", title: "Heading", type: "string" }),
            defineField({ name: "text", title: "Text", type: "simpleText" }),
          ],
          preview: { select: { title: "heading" } },
        }),
      ],
    }),
  ],
  preview: {
    select: { columns: "columns" },
    prepare({ columns }) {
      const names = (columns ?? []).map((c: { heading?: string }) => c.heading).filter(Boolean);
      return { title: `Text columns (${columns?.length ?? 0})`, subtitle: names.join(" / ") };
    },
  },
});

export const calloutType = defineType({
  name: "callout",
  title: "Callout box",
  type: "object",
  icon: PanelTop,
  description: "A highlighted box, e.g. My role, The result, Tools used.",
  fields: [
    defineField({ name: "label", title: "Label", type: "string" }),
    defineField({ name: "text", title: "Text", type: "simpleText" }),
    defineField({
      name: "tone",
      title: "Colour",
      type: "string",
      initialValue: "neutral",
      options: {
        list: [
          { title: "Neutral", value: "neutral" },
          { title: "Blue", value: "blue" },
          { title: "Green", value: "green" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
    }),
  ],
  preview: {
    select: { title: "label" },
    prepare({ title }) {
      return { title: title ?? "Callout box", subtitle: "Callout" };
    },
  },
});

export const statsType = defineType({
  name: "stats",
  title: "Numbers",
  type: "object",
  icon: BarChart3,
  description: "Big numbers with a label, e.g. 500 → 50k followers.",
  fields: [
    defineField({
      name: "items",
      title: "Numbers",
      type: "array",
      validation: (r) => r.min(1).max(4),
      of: [
        defineArrayMember({
          type: "object",
          name: "stat",
          fields: [
            defineField({ name: "value", title: "Number", type: "string", validation: (r) => r.required() }),
            defineField({ name: "label", title: "Label", type: "string" }),
          ],
          preview: { select: { title: "value", subtitle: "label" } },
        }),
      ],
    }),
  ],
  preview: {
    select: { items: "items" },
    prepare({ items }) {
      return {
        title: "Numbers",
        subtitle: (items ?? []).map((i: { value?: string }) => i.value).join(" · "),
      };
    },
  },
});

export const codeType = defineType({
  name: "codeBlock",
  title: "Code",
  type: "object",
  icon: Code2,
  fields: [
    defineField({
      name: "language",
      title: "Language",
      type: "string",
      initialValue: "glsl",
      options: {
        list: ["glsl", "javascript", "typescript", "python", "html", "css", "c++", "max/msp", "text"],
      },
    }),
    defineField({ name: "filename", title: "File name (optional)", type: "string" }),
    defineField({ name: "code", title: "Code", type: "text", rows: 10, validation: (r) => r.required() }),
  ],
  preview: {
    select: { title: "filename", subtitle: "language" },
    prepare({ title, subtitle }) {
      return { title: title ?? "Code", subtitle };
    },
  },
});

export const buttonsType = defineType({
  name: "buttons",
  title: "Buttons",
  type: "object",
  icon: Link2,
  fields: [
    defineField({
      name: "items",
      title: "Buttons",
      type: "array",
      validation: (r) => r.min(1).max(4),
      of: [
        defineArrayMember({
          type: "object",
          name: "button",
          fields: [
            defineField({ name: "label", title: "Label", type: "string", validation: (r) => r.required() }),
            defineField({
              name: "url",
              title: "URL",
              type: "url",
              validation: (r) => r.required().uri({ scheme: ["http", "https", "mailto"], allowRelative: true }),
            }),
          ],
          preview: { select: { title: "label", subtitle: "url" } },
        }),
      ],
    }),
  ],
  preview: {
    select: { items: "items" },
    prepare({ items }) {
      return { title: "Buttons", subtitle: (items ?? []).map((i: { label?: string }) => i.label).join(" · ") };
    },
  },
});

export const dividerType = defineType({
  name: "divider",
  title: "Divider / space",
  type: "object",
  icon: Minus,
  fields: [
    defineField({
      name: "kind",
      title: "Kind",
      type: "string",
      initialValue: "line",
      options: {
        list: [
          { title: "Line", value: "line" },
          { title: "Small space", value: "small" },
          { title: "Large space", value: "large" },
        ],
        layout: "radio",
        direction: "horizontal",
      },
    }),
  ],
  preview: {
    select: { kind: "kind" },
    prepare({ kind }) {
      return { title: kind === "line" || !kind ? "Divider line" : `${kind === "large" ? "Large" : "Small"} space` };
    },
  },
});

/** Every type above that must be registered in the schema. */
export const blockTypes = [
  simpleTextType,
  imageRowType,
  mediaTextType,
  embedType,
  audioType,
  pullQuoteType,
  textColumnsType,
  calloutType,
  statsType,
  codeType,
  buttonsType,
  dividerType,
];
