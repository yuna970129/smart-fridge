/** Parse a browser data URL (or bare base64) into its parts for the AI SDK. */
export function parseDataUrl(image: string): {
  base64: string;
  mimeType: string;
} {
  const match = /^data:([^;]+);base64,([\s\S]*)$/.exec(image);
  if (match) return { mimeType: match[1], base64: match[2] };
  return {
    mimeType: "image/jpeg",
    base64: image.includes(",") ? image.split(",")[1] : image,
  };
}
