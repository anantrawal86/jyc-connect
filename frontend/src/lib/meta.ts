export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} | JYC Connect` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} | JYC Connect` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
