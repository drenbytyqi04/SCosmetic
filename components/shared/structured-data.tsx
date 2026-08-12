/**
 * Renders JSON-LD.
 *
 * `JSON.stringify` is the sanitisation step: the payload is built from typed domain
 * objects on the server, and escaping `<` prevents any string value from being able
 * to close the script tag.
 */
export function StructuredData({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      // Static, server-generated JSON — never user input rendered as markup.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
