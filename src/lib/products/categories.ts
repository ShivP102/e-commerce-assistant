export const CATEGORIES = [
  "Laptop",
  "TV",
  "Book",
  "Ceramic",
  "Kitchen",
  "Headphones",
  "Furniture",
  "Sportswear",
  "Camera",
  "Appliance",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_PREFIX: Record<Category, string> = {
  Laptop: "L",
  TV: "TV",
  Book: "B",
  Ceramic: "C",
  Kitchen: "K",
  Headphones: "H",
  Furniture: "F",
  Sportswear: "S",
  Camera: "CAM",
  Appliance: "A",
};
