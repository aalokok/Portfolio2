import { defineQuery } from "next-sanity";

export const projectNavQuery = defineQuery(`
  *[_type == "project"] | order(order asc) {
    order,
    title,
  }
`);

export const allProjectsQuery = defineQuery(`
  *[_type == "project"] | order(order asc) {
    _id,
    title,
    slug,
    order,
    year,
    summary,
    tags,
    link,
    linkLabel,
    liveLink,
    collaborators,
    "images": images[] {
      alt,
      caption,
      "url": asset->url,
      "mimeType": asset->mimeType,
      "lqip": asset->metadata.lqip,
      "dimensions": asset->metadata.dimensions,
    },
    specs,
    "description": description[] {
      ...,
      _type in ["image", "file"] => {
        "url": asset->url,
        "mimeType": asset->mimeType,
        "lqip": asset->metadata.lqip,
        "dimensions": asset->metadata.dimensions,
      },
    },
  }
`);

