import { defineField, defineType } from "sanity";
import { Sparkles } from "lucide-react";

/** One Are.na board shown on the Inspiration page. */
export const inspirationBoardType = defineType({
  name: "inspirationBoard",
  title: "Inspiration board",
  type: "document",
  icon: Sparkles,
  fields: [
    defineField({
      name: "url",
      title: "Are.na board link",
      type: "url",
      description: "Paste the board's link, e.g. https://www.are.na/your-name/board-name. The board must be public.",
      validation: (r) =>
        r.required().custom((value) =>
          !value || /^https:\/\/(www\.)?are\.na\/[^/]+\/[^/]+/.test(value)
            ? true
            : "Use a board link like https://www.are.na/your-name/board-name",
        ),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "Shown above the board. Leave empty to use the board's name from the link.",
    }),
    defineField({
      name: "note",
      title: "Note",
      type: "text",
      rows: 2,
      description: "Optional line about what the board is for.",
    }),
    defineField({
      name: "order",
      title: "Order",
      type: "number",
      description: "1 shows first.",
      initialValue: 1,
    }),
    defineField({
      name: "hidden",
      title: "Hide from the website",
      type: "boolean",
      initialValue: false,
    }),
  ],
  orderings: [{ title: "Order", name: "orderAsc", by: [{ field: "order", direction: "asc" }] }],
  preview: {
    select: { title: "title", url: "url", hidden: "hidden" },
    prepare({ title, url, hidden }) {
      return { title: title || url || "Are.na board", subtitle: hidden ? "Hidden from site" : url };
    },
  },
});
