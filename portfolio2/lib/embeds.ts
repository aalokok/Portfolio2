// Turns an ordinary share link into something that can go in an <iframe>.

export type EmbedTarget = {
  src: string;
  /** Players with a fixed height (audio) ignore the chosen shape. */
  fixedHeight?: number;
  title: string;
};

export function toEmbed(raw: string): EmbedTarget | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  const parts = url.pathname.split("/").filter(Boolean);

  // YouTube
  if (host === "youtube.com" || host === "youtu.be" || host === "youtube-nocookie.com") {
    const id =
      host === "youtu.be"
        ? parts[0]
        : url.searchParams.get("v") ?? (["embed", "shorts", "live"].includes(parts[0]) ? parts[1] : null);
    if (!id) return null;
    const start = url.searchParams.get("t") ?? url.searchParams.get("start");
    const seconds = start ? parseInt(start, 10) : 0;
    return {
      src: `https://www.youtube-nocookie.com/embed/${id}?rel=0${seconds ? `&start=${seconds}` : ""}`,
      title: "YouTube video",
    };
  }

  // Vimeo (vimeo.com/123 or vimeo.com/123/privatehash)
  if (host === "vimeo.com" && /^\d+$/.test(parts[0] ?? "")) {
    const hash = parts[1] && /^[a-z0-9]+$/i.test(parts[1]) ? `?h=${parts[1]}` : "";
    return { src: `https://player.vimeo.com/video/${parts[0]}${hash}`, title: "Vimeo video" };
  }

  // SoundCloud
  if (host === "soundcloud.com") {
    return {
      src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url.href)}&color=%230a33ff&visual=false&show_comments=false`,
      fixedHeight: 166,
      title: "SoundCloud player",
    };
  }

  // Spotify
  if (host === "open.spotify.com" && parts.length >= 2) {
    const [kind, id] = parts[0] === "embed" ? [parts[1], parts[2]] : [parts[0], parts[1]];
    return {
      src: `https://open.spotify.com/embed/${kind}/${id}`,
      fixedHeight: kind === "track" || kind === "episode" ? 152 : 352,
      title: "Spotify player",
    };
  }

  // CodePen
  if (host === "codepen.io" && (parts[1] === "pen" || parts[1] === "embed") && parts[2]) {
    return { src: `https://codepen.io/${parts[0]}/embed/${parts[2]}?default-tab=result`, title: "CodePen" };
  }

  // Figma
  if (host === "figma.com" && ["file", "design", "proto", "board"].includes(parts[0])) {
    return { src: `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url.href)}`, title: "Figma" };
  }

  // p5.js editor: show the running sketch, not the editor
  if (host === "editor.p5js.org" && parts.length >= 3) {
    return { src: `https://editor.p5js.org/${parts[0]}/full/${parts[2]}`, title: "p5.js sketch" };
  }

  // Anything else (Bandcamp embed links, live demos, Glitch, etc.) goes in as-is.
  return { src: url.href, title: "Embedded page" };
}
