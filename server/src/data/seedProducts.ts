export interface ProductItemSpec {
  weight: string;
  cushioning: string;
  upperMaterial: string;
  soleMaterial: string;
  heelDrop: string;
  fit: string;
  innerLining?: string;
  innerSock?: string;
}

export interface ColorVariant {
  name: string;
  hex: string;
  previewImage: string;
  modelTint: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
}

// Aliases so older names keep working after the rename
export type ProductSpec = ProductItemSpec;

export interface Product {
  _id: string;
  id: string;
  name: string;
  slug: string;
  tagline: string;
  brand: string;
  price: number;
  salePrice?: number;
  category: 'casuals' | 'formals' | 'sandals' | 'slides' | 'chelsea-boots' | 'running' | 'lifestyle' | 'basketball' | 'luxury-minimal';
  gender: 'men' | 'women' | 'unisex';
  description: string;
  specs: ProductSpec;
  colors: ColorVariant[];
  sizes: number[];
  stock: number;
  images: string[];
  model3DUrl?: string;
  rating: number;
  reviewCount: number;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  isLimitedEdition: boolean;
  isAtelierFeatured?: boolean;
  edition?: string;
  reviews: ReviewItem[];
  createdAt?: string;
}
export type ProductItem = Product;

export const SEED_PRODUCTS: ProductItem[] = [
  {
    "_id": "prod-qadam-bos-0032-two-tone",
    "id": "prod-qadam-bos-0032-two-tone",
    "name": "QADAM BOS 0032 Two Tone Leather Shoe",
    "slug": "qadam-bos-0032-two-tone",
    "tagline": "Premium two-tone leather shoes crafted with quality materials for a refined and elegant look.",
    "edition": "Handcrafted Two-Tone",
    "brand": "QADAM",
    "price": 420,
    "salePrice": 365,
    "category": "formals",
    "gender": "men",
    "description": "The BOS 0032 Two Tone shoes feature a premium cow finish leather upper, offering a sophisticated two-tone appearance with a timeless style. The inner lining and sock are also made from cow finish leather for a comfortable and quality feel. Finished with a genuine leather sole, these shoes combine classic elegance with refined craftsmanship.\n\nSpecifications:\n- Upper Material: Cow Finish Leather\n- Inner Lining: Cow Finish Leather\n- Inner Sock: Cow Finish Leather\n- Sole: Leather",
    "specs": {
      "upperMaterial": "Cow Finish Leather",
      "cushioning": "Cow Finish Leather Lining & Sock",
      "soleMaterial": "Genuine Leather Sole",
      "innerLining": "Cow Finish Leather",
      "innerSock": "Cow Finish Leather",
      "weight": "385g (Size 42)",
      "heelDrop": "2.2 cm leather heel",
      "fit": "True to size (regular width)"
    },
    "colors": [
      {
        "name": "Brown",
        "hex": "#4A2E1B",
        "previewImage": "/images/shoes/formal-brogue-cognac.jpg",
        "modelTint": "#4A2E1B"
      },
      {
        "name": "Black",
        "hex": "#111111",
        "previewImage": "/images/shoes/qadam-oxford-derby-black.png",
        "modelTint": "#111111"
      },
      {
        "name": "Maroon",
        "hex": "#681326",
        "previewImage": "/images/featured/burgundy-loafer.png",
        "modelTint": "#681326"
      },
      {
        "name": "White",
        "hex": "#FFFFFF",
        "previewImage": "/images/shoes/formal-brogue-cognac.jpg",
        "modelTint": "#FFFFFF"
      }
    ],
    "sizes": [
      39,
      40,
      41,
      42,
      43,
      44,
      45
    ],
    "stock": 28,
    "images": [
      "/images/shoes/formal-brogue-cognac.jpg",
      "/images/shoes/formal-italian-loafers.png",
      "/images/atelier/formal_patina_set4_1.jpg"
    ],
    "rating": 4.96,
    "reviewCount": 84,
    "isNewArrival": true,
    "isBestSeller": true,
    "isTrending": true,
    "isLimitedEdition": false,
    "isAtelierFeatured": true,
    "reviews": [
      {
        "id": "rev-bos-1",
        "author": "Hamza K.",
        "rating": 5,
        "date": "2026-11-10",
        "title": "Incredible cow finish leather quality",
        "comment": "The two-tone finish is stunning in person. Cow finish leather lining feels super comfortable even after all-day wear.",
        "verified": true
      }
    ],
    "createdAt": "2026-11-15T12:00:00.000Z"
  },
  {
    "_id": "prod-aura-phantom-01",
    "id": "prod-aura-phantom-01",
    "name": "QADAM Phantom Oxford Brogue",
    "slug": "qadam-phantom-01",
    "tagline": "Artisanal Wingtip Medallion Brogueing",
    "edition": "Goodyear Welted",
    "brand": "QADAM",
    "price": 450,
    "salePrice": 395,
    "category": "formals",
    "gender": "men",
    "description": "Handmade from soft, full-grain Italian leather. A classic formal shoe with fine brogue hole patterns, five-hole lacing and a strong stitched leather sole. The cork insole slowly shapes to your foot for a comfortable, personal fit. Perfect for the office, weddings and special events.",
    "specs": {
      "weight": "380g (Size 9 US)",
      "cushioning": "Soft cork insole",
      "upperMaterial": "Full-grain Italian calf leather",
      "soleMaterial": "Goodyear-Welted Oak-Bark Tanned Leather Sole",
      "heelDrop": "2.2 cm leather heel",
      "fit": "True to size (regular width)"
    },
    "colors": [
      {
        "name": "Black",
        "hex": "#111111",
        "previewImage": "/images/mockup/hq-prod-1-oxford.png",
        "modelTint": "#111111"
      },
      {
        "name": "Brown",
        "hex": "#4A2E1B",
        "previewImage": "/images/shoes/formal-italian-loafers.png",
        "modelTint": "#4A2E1B"
      },
      {
        "name": "Maroon",
        "hex": "#681326",
        "previewImage": "/images/featured/burgundy-loafer.png",
        "modelTint": "#681326"
      },
      {
        "name": "White",
        "hex": "#FFFFFF",
        "previewImage": "/images/mockup/hq-prod-1-oxford.png",
        "modelTint": "#FFFFFF"
      }
    ],
    "sizes": [
      39,
      40,
      41,
      42,
      43,
      44,
      45
    ],
    "stock": 26,
    "images": [
      "/images/mockup/hq-prod-1-oxford.png",
      "/images/shoes/formal-italian-loafers.png",
      "/images/atelier/formal_oxford_set3_3.jpg"
    ],
    "rating": 4.95,
    "reviewCount": 162,
    "isNewArrival": true,
    "isBestSeller": true,
    "isTrending": true,
    "isLimitedEdition": true,
    "reviews": [
      {
        "id": "rev-1",
        "author": "Marcus Vance",
        "rating": 5,
        "date": "2026-10-24",
        "title": "Excellent leather quality",
        "comment": "The leather is very soft but keeps its shape. The details are perfect.",
        "verified": true
      }
    ],
    "createdAt": "2026-11-07T23:10:52.437Z"
  },
  {
    "_id": "prod-aura-artisan-sandal",
    "id": "prod-aura-artisan-sandal",
    "name": "QADAM Artisan Leather Fisherman Sandal",
    "slug": "qadam-artisan-leather-sandal",
    "tagline": "Crisscross Straps with Antique Brass Buckles",
    "edition": "Summer Atelier",
    "brand": "QADAM",
    "price": 280,
    "salePrice": 245,
    "category": "sandals",
    "gender": "men",
    "description": "Masterfully crafted from vegetable-tanned Italian calfskin, featuring hand-woven crossover straps and antique brass buckle hardware. Finished with a Goodyear-stitched stacked leather sole for breathable warm-weather luxury.",
    "specs": {
      "weight": "310g (Size 9 US)",
      "cushioning": "Padded calfskin arch bed",
      "upperMaterial": "Full-grain burnished calfskin",
      "soleMaterial": "Stitched Italian Leather Sole",
      "heelDrop": "1.5 cm stacked heel",
      "fit": "True to size (ergonomic strap adjustment)"
    },
    "colors": [
      {
        "name": "Black",
        "hex": "#111111",
        "previewImage": "/images/shoes/artisan-leather-sandal.jpg",
        "modelTint": "#111111"
      },
      {
        "name": "Brown",
        "hex": "#4A2E1B",
        "previewImage": "/images/shoes/artisan-leather-sandal.jpg",
        "modelTint": "#4A2E1B"
      },
      {
        "name": "Maroon",
        "hex": "#681326",
        "previewImage": "/images/shoes/artisan-leather-sandal.jpg",
        "modelTint": "#681326"
      },
      {
        "name": "White",
        "hex": "#FFFFFF",
        "previewImage": "/images/shoes/artisan-leather-sandal.jpg",
        "modelTint": "#FFFFFF"
      }
    ],
    "sizes": [
      39,
      40,
      41,
      42,
      43,
      44,
      45
    ],
    "stock": 35,
    "images": [
      "/images/shoes/artisan-leather-sandal.jpg"
    ],
    "rating": 4.96,
    "reviewCount": 84,
    "isNewArrival": true,
    "isBestSeller": true,
    "isTrending": true,
    "isLimitedEdition": false,
    "reviews": [],
    "createdAt": "2026-11-07T23:10:52.438Z"
  },
  {
    "_id": "prod-aura-luxury-slides",
    "id": "prod-aura-luxury-slides",
    "name": "QADAM Riviera Woven Leather Slide",
    "slug": "qadam-riviera-woven-leather-slide",
    "tagline": "Espresso & Nero with Cushioned Arch Bed",
    "edition": "Resort Archive",
    "brand": "QADAM",
    "price": 250,
    "salePrice": 220,
    "category": "slides",
    "gender": "men",
    "description": "Refined Milanese leisure wear. Hand-interlaced Italian leather band across the vamp paired with a glove-soft contoured footbed. Effortless luxury for lounge, resort, or summer formal wear.",
    "specs": {
      "weight": "280g (Size 9 US)",
      "cushioning": "Contoured memory foam footbed",
      "upperMaterial": "Intrecciato woven calfskin",
      "soleMaterial": "Beveled Leather Sole with Rubber Inset",
      "heelDrop": "1.8 cm beveled heel",
      "fit": "True to size (slip-on fit)"
    },
    "colors": [
      {
        "name": "Black",
        "hex": "#111111",
        "previewImage": "/images/shoes/luxury-leather-slides.jpg",
        "modelTint": "#111111"
      },
      {
        "name": "Brown",
        "hex": "#4A2E1B",
        "previewImage": "/images/shoes/luxury-leather-slides.jpg",
        "modelTint": "#4A2E1B"
      },
      {
        "name": "Maroon",
        "hex": "#681326",
        "previewImage": "/images/shoes/luxury-leather-slides.jpg",
        "modelTint": "#681326"
      },
      {
        "name": "White",
        "hex": "#FFFFFF",
        "previewImage": "/images/shoes/luxury-leather-slides.jpg",
        "modelTint": "#FFFFFF"
      }
    ],
    "sizes": [
      39,
      40,
      41,
      42,
      43,
      44,
      45
    ],
    "stock": 28,
    "images": [
      "/images/shoes/luxury-leather-slides.jpg"
    ],
    "rating": 4.92,
    "reviewCount": 71,
    "isNewArrival": true,
    "isBestSeller": true,
    "isTrending": false,
    "isLimitedEdition": true,
    "reviews": [],
    "createdAt": "2026-11-07T23:10:52.439Z"
  },
  {
    "_id": "prod-aura-driving-casual",
    "id": "prod-aura-driving-casual",
    "name": "QADAM Cognac Leather Driving Casual",
    "slug": "qadam-cognac-leather-driving-casual",
    "tagline": "Hand-Stitched Moccasin Toe & Gommino Sole",
    "edition": "Bespoke Casual",
    "brand": "QADAM",
    "price": 340,
    "salePrice": 295,
    "category": "casuals",
    "gender": "men",
    "description": "Hand-lasted moccasin silhouette in supple cognac calf leather. Features traditional penny strap styling and segmented gommino pebble rubber driving soles for exceptional flex and pedal feel.",
    "specs": {
      "weight": "320g (Size 9 US)",
      "cushioning": "Latex-cushioned leather insole",
      "upperMaterial": "Supple Italian grain calfskin",
      "soleMaterial": "Segmented Gommino Pebble Rubber Sole",
      "heelDrop": "Flat driving heel",
      "fit": "True to size (flexible moccasin last)"
    },
    "colors": [
      {
        "name": "Black",
        "hex": "#111111",
        "previewImage": "/images/shoes/cognac-driving-casual.jpg",
        "modelTint": "#111111"
      },
      {
        "name": "Brown",
        "hex": "#4A2E1B",
        "previewImage": "/images/shoes/cognac-driving-casual.jpg",
        "modelTint": "#4A2E1B"
      },
      {
        "name": "Maroon",
        "hex": "#681326",
        "previewImage": "/images/shoes/cognac-driving-casual.jpg",
        "modelTint": "#681326"
      },
      {
        "name": "White",
        "hex": "#FFFFFF",
        "previewImage": "/images/shoes/cognac-driving-casual.jpg",
        "modelTint": "#FFFFFF"
      },
      {
        "name": "Tan",
        "hex": "#C49A6C",
        "previewImage": "/images/shoes/cognac-driving-casual.jpg",
        "modelTint": "#C49A6C"
      }
    ],
    "sizes": [
      39,
      40,
      41,
      42,
      43,
      44,
      45
    ],
    "stock": 30,
    "images": [
      "/images/shoes/cognac-driving-casual.jpg"
    ],
    "rating": 4.94,
    "reviewCount": 96,
    "isNewArrival": true,
    "isBestSeller": true,
    "isTrending": true,
    "isLimitedEdition": false,
    "reviews": [],
    "createdAt": "2026-11-07T23:10:52.440Z"
  },
  {
    "_id": "prod-aura-tuscan-chelsea",
    "id": "prod-aura-tuscan-chelsea",
    "name": "QADAM Tuscan Chelsea Sovereign",
    "slug": "qadam-tuscan-chelsea-sovereign",
    "tagline": "Warm Cognac with Dainite Commando Sole",
    "edition": "Handmade in Milan",
    "brand": "QADAM",
    "price": 480,
    "salePrice": 425,
    "category": "chelsea-boots",
    "gender": "men",
    "description": "A classic Chelsea boot in full-grain Italian leather with stretchy side panels, so it slips on easily.",
    "specs": {
      "weight": "440g (Size 9 US)",
      "cushioning": "Soft cork insole",
      "upperMaterial": "Full-grain Italian leather",
      "soleMaterial": "Goodyear-Welted Dainite Rubber & Leather Sole",
      "heelDrop": "2.8 cm leather heel",
      "fit": "True to size"
    },
    "colors": [
      {
        "name": "Black",
        "hex": "#111111",
        "previewImage": "/images/atelier/formal_boot_set2_2.jpg",
        "modelTint": "#111111"
      },
      {
        "name": "Brown",
        "hex": "#4A2E1B",
        "previewImage": "/images/atelier/formal_boot_set2_3.jpg",
        "modelTint": "#4A2E1B"
      },
      {
        "name": "Maroon",
        "hex": "#681326",
        "previewImage": "/images/atelier/formal_boot_set2_2.jpg",
        "modelTint": "#681326"
      },
      {
        "name": "White",
        "hex": "#FFFFFF",
        "previewImage": "/images/atelier/formal_boot_set2_2.jpg",
        "modelTint": "#FFFFFF"
      }
    ],
    "sizes": [
      39,
      40,
      41,
      42,
      43,
      44,
      45
    ],
    "stock": 16,
    "images": [
      "/images/atelier/formal_boot_set2_2.jpg",
      "/images/atelier/formal_boot_set2_3.jpg"
    ],
    "rating": 4.94,
    "reviewCount": 68,
    "isNewArrival": false,
    "isBestSeller": true,
    "isTrending": true,
    "isLimitedEdition": false,
    "isAtelierFeatured": true,
    "reviews": [],
    "createdAt": "2026-11-07T23:10:52.445Z"
  },
  {
    "_id": "prod-aura-horsebit-loafer",
    "id": "prod-aura-horsebit-loafer",
    "name": "QADAM Horsebit Loafer",
    "slug": "qadam-horsebit-loafer",
    "tagline": "Champagne Gold Horsebit Hardware",
    "brand": "QADAM",
    "price": 375,
    "category": "formals",
    "gender": "men",
    "description": "Distinguished slip-on loafer tailored from hand-burnished calfskin leather. Accented with custom champagne gold horsebit hardware and a beveled Goodyear-welted leather sole.",
    "specs": {
      "weight": "350g (Size 9 US)",
      "cushioning": "Arch Support Leather Insole",
      "upperMaterial": "Textured Box Calfskin",
      "soleMaterial": "Goodyear Welted Beveled Sole",
      "heelDrop": "2.2 cm stacked heel",
      "fit": "True to size (Elegante Loafer Last)"
    },
    "colors": [
      {
        "name": "Black",
        "hex": "#111111",
        "previewImage": "/images/atelier/formal_horsebit_set5_2.jpg",
        "modelTint": "#111111"
      },
      {
        "name": "Brown",
        "hex": "#4A2E1B",
        "previewImage": "/images/atelier/formal_horsebit_set5_2.jpg",
        "modelTint": "#4A2E1B"
      },
      {
        "name": "Maroon",
        "hex": "#681326",
        "previewImage": "/images/atelier/formal_horsebit_set5_2.jpg",
        "modelTint": "#681326"
      },
      {
        "name": "White",
        "hex": "#FFFFFF",
        "previewImage": "/images/atelier/formal_horsebit_set5_2.jpg",
        "modelTint": "#FFFFFF"
      }
    ],
    "sizes": [
      39,
      40,
      41,
      42,
      43,
      44,
      45
    ],
    "stock": 18,
    "images": [
      "/images/atelier/formal_horsebit_set5_2.jpg"
    ],
    "rating": 4.96,
    "reviewCount": 42,
    "isNewArrival": true,
    "isBestSeller": false,
    "isTrending": true,
    "isLimitedEdition": false,
    "isAtelierFeatured": true,
    "edition": "QADAM Sartoriale",
    "reviews": [],
    "createdAt": "2026-11-08T12:00:00.000Z"
  }
];
