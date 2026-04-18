import { defineField, defineType } from "sanity";

export const projectType = defineType({
  name: "project",
  title: "Project",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (r) => r.required(),
    }),
    defineField({
      name: "collaborators",
      title: "Collaborators",
      type: "array",
      of: [{ type: "object", fields: [
        { name: "name", title: "Name", type: "string" },
        { name: "role", title: "Role", type: "string" },
        { name: "link", title: "Link", type: "url" },
      ] }],
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description: "Display order (1–10)",
      validation: (r) => r.required().min(1).max(10),
    }),
    defineField({
      name: "year",
      title: "Year",
      type: "number",
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    }),
    defineField({
      name: "link",
      title: "Documentation Link",
      type: "url",
    }),
    defineField({
      name: "linkLabel",
      title: "Link Label",
      type: "string",
      placeholder: "View project",
    }),
    defineField({
      name: "liveLink",
      title: "Live Link",
      type: "url",
      
    }),
    defineField({
      name: "images",
      title: "Media",
      type: "array",
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
      name: "specs",
      title: "Specs",
      type: "array",
      description: "Key-value pairs shown in the specs panel",
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
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
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
    select: { title: "title", order: "order", media: "images.0" },
    prepare({ title, order, media }) {
      return { title: `${order}. ${title}`, media };
    },
  },
});
