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
    tags,
    link,
    linkLabel,
    "images": images[] {
      alt,
      caption,
      "url": asset->url,
      "mimeType": asset->mimeType,
      "lqip": asset->metadata.lqip,
      "dimensions": asset->metadata.dimensions,
    },
    specs,
    description,
  }
`);

export const projectByOrderQuery = defineQuery(`
  *[_type == "project" && order == $order][0] {
    _id,
    title,
    slug,
    order,
    year,
    tags,
    link,
    linkLabel,
    "images": images[] {
      alt,
      caption,
      "url": asset->url,
      "mimeType": asset->mimeType,
      "lqip": asset->metadata.lqip,
      "dimensions": asset->metadata.dimensions,
    },
    specs,
    description,
  }
`);
