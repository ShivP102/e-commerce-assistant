import { faker } from "@faker-js/faker";
import fs from "fs";
import path from "path";
import {
  CATEGORIES,
  CATEGORY_PREFIX,
  type Category,
} from "../src/lib/products/categories";
import {
  productsFileSchema,
  type Product,
} from "../src/lib/products/schema";

faker.seed(42);

const PRODUCTS_PER_CATEGORY = 100;

const BRANDS: Record<Category, string[]> = {
  Laptop: ["Dell", "HP", "Lenovo", "Apple", "Asus", "Acer", "MSI"],
  TV: ["Samsung", "LG", "Sony", "TCL", "OnePlus", "Mi"],
  Book: ["Penguin", "HarperCollins", "Rupa", "Westland", "Aleph"],
  Ceramic: ["ClayCraft", "HomeEssence", "ArtisanPottery", "MudStudio"],
  Kitchen: ["Prestige", "Borosil", "Philips", "Bajaj", "Wonderchef"],
  Headphones: ["Sony", "Bose", "JBL", "Sennheiser", "boAt", "Apple"],
  Furniture: ["IKEA", "Urban Ladder", "Wakefit", "Nilkamal", "Godrej"],
  Sportswear: ["Nike", "Adidas", "Puma", "Reebok", "Decathlon"],
  Camera: ["Canon", "Nikon", "Sony", "Fujifilm", "GoPro"],
  Appliance: ["Samsung", "LG", "Whirlpool", "Bosch", "IFB"],
};

function buildDescription(category: Category, name: string, brand: string): string {
  const templates: Record<Category, string[]> = {
    Laptop: [
      `${name} by ${brand} is built for productivity and everyday multitasking with a crisp display and responsive keyboard.`,
      `Ideal for students and professionals, this ${brand} laptop balances performance with portability for work on the go.`,
    ],
    TV: [
      `${name} delivers immersive viewing with vivid colors and smooth motion for movies, sports, and gaming nights.`,
      `This ${brand} television brings cinematic contrast and smart streaming apps to your living room.`,
    ],
    Book: [
      `${name} is a compelling read with rich storytelling that stays with you long after the final page.`,
      `Readers praise this title for its vivid characters and thoughtful exploration of human relationships.`,
    ],
    Ceramic: [
      `${name} adds artisan charm to your table with a hand-finished glaze and elegant silhouette.`,
      `Perfect for gifting, this ceramic piece blends traditional craftsmanship with modern dining aesthetics.`,
    ],
    Kitchen: [
      `${name} simplifies daily cooking with durable materials and intuitive controls for busy home chefs.`,
      `Designed for Indian kitchens, this ${brand} appliance handles high-heat cooking with reliable safety features.`,
    ],
    Headphones: [
      `${name} offers balanced audio with comfortable padding for long listening sessions at home or travel.`,
      `Tune out distractions and enjoy detailed sound with these ${brand} headphones tuned for clarity.`,
    ],
    Furniture: [
      `${name} complements modern interiors with clean lines and sturdy construction for everyday use.`,
      `This ${brand} furniture piece maximizes space while keeping your room organized and inviting.`,
    ],
    Sportswear: [
      `${name} keeps you comfortable during workouts with breathable fabric and a flexible fit.`,
      `Built for active lifestyles, this ${brand} sportswear supports training, running, and recovery days.`,
    ],
    Camera: [
      `${name} captures sharp photos and smooth video for travel, events, and creative projects.`,
      `Photography enthusiasts love this ${brand} camera for its reliable autofocus and natural color science.`,
    ],
    Appliance: [
      `${name} reduces household chores with efficient performance and energy-conscious operation.`,
      `This ${brand} appliance is engineered for durability and low maintenance in daily home use.`,
    ],
  };
  return faker.helpers.arrayElement(templates[category]);
}

function createProduct(category: Category, index: number): Product {
  const brand = faker.helpers.arrayElement(BRANDS[category]);
  const prefix = CATEGORY_PREFIX[category];
  const id = `${prefix}${String(index + 1).padStart(3, "0")}`;

  const base = {
    id,
    brand,
    price: faker.number.int({ min: 499, max: 250000 }),
    description: "",
  };

  switch (category) {
    case "Laptop": {
      const ram = faker.helpers.arrayElement(["8GB", "16GB", "32GB"]);
      const name = `${brand} ${faker.helpers.arrayElement(["ProBook", "Inspiron", "ThinkPad", "ZenBook"])} ${ram}`;
      return {
        ...base,
        category: "Laptop",
        name,
        ram,
        storage: faker.helpers.arrayElement(["256GB SSD", "512GB SSD", "1TB SSD"]),
        processor: faker.helpers.arrayElement([
          "Intel i5",
          "Intel i7",
          "AMD Ryzen 5",
          "Apple M2",
        ]),
        screenInches: faker.helpers.arrayElement([13.3, 14, 15.6, 16]),
        description: buildDescription(category, name, brand),
      };
    }
    case "TV": {
      const inches = faker.helpers.arrayElement([32, 43, 50, 55, 65]);
      const name = `${brand} ${inches}" ${faker.helpers.arrayElement(["Crystal", "OLED", "QLED", "Vision"])} TV`;
      return {
        ...base,
        category: "TV",
        name,
        screenInches: inches,
        resolution: faker.helpers.arrayElement(["Full HD", "4K UHD", "8K"]),
        panelType: faker.helpers.arrayElement(["LED", "OLED", "QLED", "Mini LED"]),
        smartTv: faker.datatype.boolean({ probability: 0.85 }),
        description: buildDescription(category, name, brand),
      };
    }
    case "Book": {
      const author = faker.person.fullName();
      const name = faker.helpers.arrayElement([
        "The Silent River",
        "Midnight Bazaar",
        "Echoes of the Hills",
        "Paper Monsoon",
        "The Last Station",
      ]);
      return {
        ...base,
        category: "Book",
        name,
        author,
        format: faker.helpers.arrayElement(["Paperback", "Hardcover", "Kindle"]),
        pages: faker.number.int({ min: 120, max: 650 }),
        genre: faker.helpers.arrayElement([
          "Fiction",
          "Mystery",
          "Romance",
          "History",
          "Self Help",
        ]),
        description: buildDescription(category, `${name} by ${author}`, brand),
      };
    }
    case "Ceramic": {
      const name = `${faker.helpers.arrayElement(["Glazed", "Handcrafted", "Studio"])} ${faker.helpers.arrayElement(["Vase", "Bowl Set", "Dinner Plate", "Tea Set"])}`;
      return {
        ...base,
        category: "Ceramic",
        name,
        color: faker.color.human(),
        dishwasherSafe: faker.datatype.boolean({ probability: 0.6 }),
        setPieces: faker.number.int({ min: 1, max: 12 }),
        description: buildDescription(category, name, brand),
      };
    }
    case "Kitchen": {
      const name = `${brand} ${faker.helpers.arrayElement(["Mixer", "Induction Cooktop", "Air Fryer", "Kettle", "Food Processor"])}`;
      return {
        ...base,
        category: "Kitchen",
        name,
        capacity: faker.helpers.arrayElement(["1L", "1.5L", "2L", "5L"]),
        powerWatts: faker.number.int({ min: 600, max: 2200 }),
        warrantyYears: faker.number.int({ min: 1, max: 3 }),
        description: buildDescription(category, name, brand),
      };
    }
    case "Headphones": {
      const name = `${brand} ${faker.helpers.arrayElement(["Studio", "Pulse", "Quiet", "Bass"])} ${faker.helpers.arrayElement(["Pro", "Max", "Lite"])}`;
      return {
        ...base,
        category: "Headphones",
        name,
        noiseCancellation: faker.datatype.boolean({ probability: 0.7 }),
        batteryHours: faker.number.int({ min: 8, max: 60 }),
        driverSizeMm: faker.helpers.arrayElement([30, 40, 45, 50]),
        description: buildDescription(category, name, brand),
      };
    }
    case "Furniture": {
      const name = `${brand} ${faker.helpers.arrayElement(["Oak", "Nordic", "Urban"])} ${faker.helpers.arrayElement(["Desk", "Bookshelf", "Coffee Table", "Wardrobe"])}`;
      return {
        ...base,
        category: "Furniture",
        name,
        dimensions: `${faker.number.int({ min: 60, max: 180 })}x${faker.number.int({ min: 40, max: 90 })}x${faker.number.int({ min: 45, max: 200 })} cm`,
        assemblyRequired: faker.datatype.boolean({ probability: 0.75 }),
        weightKg: faker.number.int({ min: 8, max: 80 }),
        description: buildDescription(category, name, brand),
      };
    }
    case "Sportswear": {
      const name = `${brand} ${faker.helpers.arrayElement(["Run", "Train", "Flex", "Active"])} ${faker.helpers.arrayElement(["T-Shirt", "Track Pants", "Hoodie", "Shorts"])}`;
      return {
        ...base,
        category: "Sportswear",
        name,
        fabric: faker.helpers.arrayElement(["Polyester", "Cotton Blend", "Nylon"]),
        gender: faker.helpers.arrayElement(["Men", "Women", "Unisex"]),
        activity: faker.helpers.arrayElement(["Running", "Gym", "Yoga", "Cricket"]),
        description: buildDescription(category, name, brand),
      };
    }
    case "Camera": {
      const name = `${brand} ${faker.helpers.arrayElement(["Alpha", "EOS", "Lumix", "Insta"])} ${faker.number.int({ min: 100, max: 9000 })}`;
      return {
        ...base,
        category: "Camera",
        name,
        sensorType: faker.helpers.arrayElement(["APS-C", "Full Frame", "Micro Four Thirds"]),
        videoResolution: faker.helpers.arrayElement(["1080p", "4K", "6K"]),
        interchangeableLens: faker.datatype.boolean({ probability: 0.65 }),
        description: buildDescription(category, name, brand),
      };
    }
    case "Appliance": {
      const name = `${brand} ${faker.helpers.arrayElement(["Front Load", "Top Load", "Double Door", "Inverter"])} ${faker.helpers.arrayElement(["Washer", "Refrigerator", "Microwave", "Dishwasher"])}`;
      return {
        ...base,
        category: "Appliance",
        name,
        capacity: faker.helpers.arrayElement(["6kg", "7kg", "260L", "340L", "20L"]),
        powerWatts: faker.number.int({ min: 500, max: 2500 }),
        smartEnabled: faker.datatype.boolean({ probability: 0.5 }),
        description: buildDescription(category, name, brand),
      };
    }
    default: {
      const _exhaustive: never = category;
      throw new Error(`Unhandled category: ${_exhaustive}`);
    }
  }
}

const products: Product[] = [];

for (const category of CATEGORIES) {
  for (let i = 0; i < PRODUCTS_PER_CATEGORY; i += 1) {
    products.push(createProduct(category, i));
  }
}

productsFileSchema.parse(products);

const outPath = path.join(process.cwd(), "data", "products.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(products, null, 2));

console.log(`Wrote ${products.length} products to ${outPath}`);
