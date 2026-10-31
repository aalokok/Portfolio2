import { defineQuery } from "next-sanity";

// Published, visible projects only. (Drafts are also excluded by the client's
// "published" perspective; the path check is a second guard.)
const visible = `_type == "project" && hidden != true && !(_id in path("drafts.**"))`;

// Fields every uploaded image/video needs on the site.
const media = `
  "url": asset->url,
  "mimeType": asset->mimeType,
  "lqip": asset->metadata.lqip,
  "dimensions": asset->metadata.dimensions
`;

// Links to other projects resolve to that project's position in the list.
const markDefs = `markDefs[] { ..., _type == "projectLink" => { "order": project->order } }`;

const simpleText = `text[] { ..., ${markDefs} }`;

export const projectNavQuery = defineQuery(`
  *[${visible}] | order(order asc) {
    order,
    title,
  }
`);

export const allProjectsQuery = defineQuery(`
  *[${visible}] | order(order asc) {
    _id,
    title,
    slug,
    order,
    year,
    summary,
    category,
    tags,
    link,
    linkLabel,
    liveLink,
    collaborators,
    "images": images[] {
      alt,
      caption,
      ${media},
    },
    galleryColumns,
    specs,
    "description": description[] {
      ...,
      _type == "block" => { ${markDefs} },
      _type in ["image", "file"] => { ${media} },
      _type == "imageRow" => { "images": images[] { _key, alt, caption, ${media} } },
      _type == "mediaText" => { "image": image { alt, caption, ${media} }, ${simpleText} },
      _type == "audio" => { "url": file.asset->url, "mimeType": file.asset->mimeType },
      _type == "textColumns" => { "columns": columns[] { _key, heading, ${simpleText} } },
      _type == "callout" => { ${simpleText} },
    },
  }
`);

/** Just what the link preview (title, description, image) needs for one project. */
export const projectSeoQuery = defineQuery(`
  *[${visible} && order == $order][0] {
    title,
    summary,
    "seoTitle": seo.title,
    "seoDescription": seo.description,
    "seoImage": seo.image.asset->url,
    "fallbackImage": coalesce(
      images[_type == "image"][0].asset->url,
      description[_type == "image"][0].asset->url,
      description[_type == "imageRow"][0].images[0].asset->url
    ),
  }
`);

/** Are.na boards for the Inspiration page, in order. */
export const inspirationBoardsQuery = defineQuery(`
  *[_type == "inspirationBoard" && hidden != true && !(_id in path("drafts.**"))] | order(order asc) {
    _id,
    title,
    url,
    note,
  }
`);
