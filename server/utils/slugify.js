/**
 * Helper to convert a string into a URL-friendly slug.
 * Example: "Hello World 123!" -> "hello-world-123"
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars (alphanumeric, spaces, underscores, hyphens)
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

module.exports = { generateSlug };
