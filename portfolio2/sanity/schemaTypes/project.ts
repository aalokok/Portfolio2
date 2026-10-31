import { defineArrayMember, defineField, defineType } from "sanity";
import {
  audioType,
  buttonsType,
  calloutType,
  codeType,
  dividerType,
  embedType,
  imageRowType,
  mediaTextType,
  pullQuoteType,
  statsType,
  storyBlock,
  storyImage,
  storyVideo,
  textColumnsType,
} from "./blocks";

export const projectType = defineType({
  name: "project",
  title: "Project",
  type: "document",
  // Tabs at the top of each project in the Studio.
  groups: [
    { name: "basics", title: "Basics", default: true },
    { name: "story", title: "Story" },
    { name: "media", title: "Gallery" },
    { name: "details", title: "Details" },
    { name: "seo", title: "Sharing" },
  ],
  fields: [
    // ---------- Basics ----------
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "basics",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "basics",
      options: { source: "title" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      group: "basics",
      description: "Position in the project list. 1 is first.",
      validation: (r) => r.required().integer().min(1).max(99),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      group: "basics",
      description: "Which tab the project appears under on Creations and Explorations.",
      initialValue: "creative-technology",
      options: {
        list: [
          { title: "Design (UI/UX, branding, case studies)", value: "design" },
          { title: "Creative Technology (installations, visuals, sound, games)", value: "creative-technology" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "hidden",
      title: "Hide from the website",
      type: "boolean",
      group: "basics",
      description: "Keeps the project in the Studio but removes it from the site.",
      initialValue: false,
    }),
    defineField({
      name: "year",
      title: "Year",
      type: "number",
      group: "basics",
    }),
    defineField({
      name: "summary",
      title: "One-line Summary",
      type: "string",
      group: "basics",
      description: "Shown when hovering the project in the list. Falls back to the description's first sentence.",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      group: "basics",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),

    // ---------- Story ----------
    defineField({
      name: "description",
      title: "Story",
      type: "array",
      group: "story",
      description:
        "The project write-up. Type text as normal; use Insert (+) to add images, image grids, image + text, video, embeds, quotes, columns, callouts, numbers, code, buttons and dividers.",
      of: [
        storyBlock,
        storyImage,
        storyVideo,
        defineArrayMember({ type: imageRowType.name }),
        defineArrayMember({ type: mediaTextType.name }),
        defineArrayMember({ type: embedType.name }),
        defineArrayMember({ type: audioType.name }),
        defineArrayMember({ type: pullQuoteType.name }),
        defineArrayMember({ type: textColumnsType.name }),
        defineArrayMember({ type: calloutType.name }),
        defineArrayMember({ type: statsType.name }),
        defineArrayMember({ type: codeType.name }),
        defineArrayMember({ type: buttonsType.name }),
        defineArrayMember({ type: dividerType.name }),
      ],
    }),

    // ---------- Gallery ----------
    defineField({
      name: "images",
      title: "Gallery",
      type: "array",
      group: "media",
      description:
        "Shown after the story. The first image is also used in the project list preview. Optional if your images are in the story.",
      of: [
        {
          type: "image",
          title: "Image",
          options: { hotspot: true },
          fields: [
            defineField({ name: "alt", title: "Alt text", type: "string" }),
            defineField({ name: "caption", title: "Caption", type: "string" }),
          ],
        },
        {
          type: "file",
          title: "Video",
          options: { accept: "video/*" },
          fields: [
            defineField({ name: "alt", title: "Alt text", type: "string" }),
            defineField({ name: "caption", title: "Caption", type: "string" }),
          ],
        },
      ],
    }),
    defineField({
      name: "galleryColumns",
      title: "Gallery layout",
      type: "number",
      group: "media",
      initialValue: 1,
      options: {
        list: [
          { title: "One per line", value: 1 },
          { title: "2 columns", value: 2 },
          { title: "3 columns", value: 3 },
        ],
        layout: "radio",
        direction: "horizontal",
      },
    }),

    // ---------- Details ----------
    defineField({
      name: "collaborators",
      title: "Collaborators",
      type: "array",
      group: "details",
      of: [{ type: "object", fields: [
        { name: "name", title: "Name", type: "string" },
        { name: "role", title: "Role", type: "string" },
        { name: "link", title: "Link", type: "url" },
      ] }],
    }),
    defineField({
      name: "specs",
      title: "Specs",
      type: "array",
      group: "details",
      description: "Key-value pairs shown in the specs panel, e.g. Role → Lead designer.",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "label", title: "Label", type: "string" }),
            defineField({ name: "value", title: "Value", type: "string" }),
          ],
          preview: {
            select: { title: "label", subtitle: "value" },
          },
        },
      ],
    }),
    defineField({
      name: "link",
      title: "Documentation Link",
      type: "url",
      group: "details",
    }),
    defineField({
      name: "linkLabel",
      title: "Link Label",
      type: "string",
      group: "details",
      placeholder: "View project",
    }),
    defineField({
      name: "liveLink",
      title: "Live Link",
      type: "url",
      group: "details",
    }),

    // ---------- Sharing ----------
    defineField({
      name: "seo",
      title: "Link preview",
      type: "object",
      group: "seo",
      description:
        "What shows when someone shares this project's link (LinkedIn, Slack, iMessage) and in Google. Everything falls back to the title, summary and first image.",
      fields: [
        defineField({ name: "title", title: "Title", type: "string" }),
        defineField({
          name: "description",
          title: "Description",
          type: "text",
          rows: 2,
          validation: (r) => r.max(200).warning("Long descriptions get cut off in previews."),
        }),
        defineField({
          name: "image",
          title: "Preview image",
          type: "image",
          description: "Shown at 1200 × 630. Keep the important part in the middle.",
          options: { hotspot: true },
        }),
      ],
    }),
  ],
  orderings: [
    {
      title: "Display Order",
      name: "orderAsc",
      by: [{ field: "order", direction: "asc" }],
    },
  ],
  preview: {
    select: { title: "title", order: "order", media: "images.0", hidden: "hidden", category: "category" },
    prepare({ title, order, media, hidden, category }) {
      const tab = category === "design" ? "Design" : "Creative Technology";
      return { title: `${order}. ${title}`, subtitle: hidden ? `${tab} · Hidden from site` : tab, media };
    },
  },
});
