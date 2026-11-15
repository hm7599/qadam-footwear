export interface ProductItemSpec {
  weight: string;
  cushioning: string;
  upperMaterial: string;
  soleMaterial: string;
  heelDrop: string;
  fit: string;
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
    "_id": "prod-aura-heritage-derby",
    "id": "prod-aura-heritage-derby",
    "name": "QADAM Heritage Casual Derby Tan",
    "slug": "qadam-heritage-casual-derby-tan",
    "tagline": "Storm-Welted Open Lacing",
    "edition": "Heritage Classic",
    "brand": "QADAM",
    "price": 380,
    "salePrice": 325,
    "category": "casuals",
    "gender": "men",
    "description": "A versatile everyday casual derby shoe in rich tan leather. Clean lines, open-quarter construction and a storm-welted sole that pairs seamlessly with denim, trousers and smart casual attire.",
    "specs": {
      "weight": "390g (Size 9 US)",
      "cushioning": "Ergonomic leather insole",
      "upperMaterial": "Hand-buffed Italian tan calfskin",
      "soleMaterial": "Storm-Welted Dainite Composite Sole",
      "heelDrop": "2.4 cm heel",
      "fit": "True to size"
    },
    "colors": [
      {
        "name": "Black",
        "hex": "#111111",
        "previewImage": "/images/shoes/formal-derby-tan.jpg",
        "modelTint": "#111111"
      },
      {
        "name": "Brown",
        "hex": "#4A2E1B",
        "previewImage": "/images/shoes/formal-derby-tan.jpg",
        "modelTint": "#4A2E1B"
      },
      {
        "name": "Maroon",
        "hex": "#681326",
        "previewImage": "/images/shoes/formal-derby-tan.jpg",
        "modelTint": "#681326"
      },
      {
        "name": "White",
        "hex": "#FFFFFF",
        "previewImage": "/images/shoes/formal-derby-tan.jpg",
        "modelTint": "#FFFFFF"
      },
      {
        "name": "Tan",
        "hex": "#C49A6C",
        "previewImage": "/images/shoes/formal-derby-tan.jpg",
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
    "stock": 20,
    "images": [
      "/images/shoes/formal-derby-tan.jpg"
    ],
    "rating": 4.88,
    "reviewCount": 49,
    "isNewArrival": false,
    "isBestSeller": false,
    "isTrending": false,
    "isLimitedEdition": false,
    "reviews": [],
    "createdAt": "2026-11-07T23:10:52.441Z"
  },
  {
    "_id": "prod-aura-monkstrap-chestnut",
    "id": "prod-aura-monkstrap-chestnut",
    "name": "QADAM Florentine Double Monkstrap",
    "slug": "qadam-florentine-double-monkstrap",
    "tagline": "Chestnut Patina with Palladium Buckles",
    "edition": "Sartoriale Drop",
    "brand": "QADAM",
    "price": 440,
    "salePrice": 385,
    "category": "formals",
    "gender": "men",
    "description": "A sartorial statement piece. Hand-painted chestnut calf leather with dual palladium silver buckles, Goodyear-welted leather outsole and beveled waist. Ideal for boardrooms and formal galas.",
    "specs": {
      "weight": "400g (Size 9 US)",
      "cushioning": "Layered cork and leather footbed",
      "upperMaterial": "Hand-painted museum calf leather",
      "soleMaterial": "Goodyear Welted Beveled Leather Sole",
      "heelDrop": "2.4 cm stacked leather heel",
      "fit": "True to size"
    },
    "colors": [
      {
        "name": "Black",
        "hex": "#111111",
        "previewImage": "/images/shoes/formal-monkstrap-chestnut.jpg",
        "modelTint": "#111111"
      },
      {
        "name": "Brown",
        "hex": "#4A2E1B",
        "previewImage": "/images/shoes/formal-monkstrap-chestnut.jpg",
        "modelTint": "#4A2E1B"
      },
      {
        "name": "Maroon",
        "hex": "#681326",
        "previewImage": "/images/shoes/formal-monkstrap-chestnut.jpg",
        "modelTint": "#681326"
      },
      {
        "name": "White",
        "hex": "#FFFFFF",
        "previewImage": "/images/shoes/formal-monkstrap-chestnut.jpg",
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
    "stock": 15,
    "images": [
      "/images/shoes/formal-monkstrap-chestnut.jpg"
    ],
    "rating": 4.95,
    "reviewCount": 77,
    "isNewArrival": false,
    "isBestSeller": true,
    "isTrending": true,
    "isLimitedEdition": true,
    "reviews": [],
    "createdAt": "2026-11-07T23:10:52.442Z"
  },
  {
    "_id": "prod-aura-sovereign-loafer",
    "id": "prod-aura-sovereign-loafer",
    "name": "QADAM Sovereign Venetian Loafer",
    "slug": "qadam-sovereign-venetian-loafer",
    "tagline": "Deep Glacé Patina with Beveled Waist",
    "edition": "Masterpiece Atelier",
    "brand": "QADAM",
    "price": 460,
    "salePrice": 360,
    "category": "formals",
    "gender": "men",
    "description": "Handmade from full-grain Italian leather with a rich dark-brown polish, hand-stitched top and a strong stitched sole. Easy to slip on and smart enough for formal wear.",
    "specs": {
      "weight": "360g (Size 9 US)",
      "cushioning": "Soft cork insole",
      "upperMaterial": "Hand-polished calf leather",
      "soleMaterial": "Goodyear-Welted Oak-Bark Tanned Leather Sole",
      "heelDrop": "2.2 cm leather heel",
      "fit": "True to size (regular width)"
    },
    "colors": [
      {
        "name": "Black",
        "hex": "#111111",
        "previewImage": "/images/shoes/formal-italian-loafers.png",
        "modelTint": "#111111"
      },
      {
        "name": "Brown",
        "hex": "#4A2E1B",
        "previewImage": "/images/atelier/formal_oxford_set3_3.jpg",
        "modelTint": "#4A2E1B"
      },
      {
        "name": "Maroon",
        "hex": "#681326",
        "previewImage": "/images/shoes/formal-italian-loafers.png",
        "modelTint": "#681326"
      },
      {
        "name": "White",
        "hex": "#FFFFFF",
        "previewImage": "/images/shoes/formal-italian-loafers.png",
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
      "/images/shoes/formal-italian-loafers.png",
      "/images/atelier/formal_oxford_set3_3.jpg"
    ],
    "rating": 4.98,
    "reviewCount": 88,
    "isNewArrival": true,
    "isBestSeller": true,
    "isTrending": true,
    "isLimitedEdition": true,
    "reviews": [],
    "createdAt": "2026-11-07T23:10:52.443Z"
  },
  {
    "_id": "prod-aura-patina-wholecut",
    "id": "prod-aura-patina-wholecut",
    "name": "QADAM Patina Wholecut Oxford",
    "slug": "qadam-patina-wholecut-oxford",
    "tagline": "Sunburst Golden-Brown Mirror Glaze",
    "edition": "Limited Edition // 200 Pairs",
    "brand": "QADAM",
    "price": 495,
    "salePrice": 440,
    "category": "formals",
    "gender": "men",
    "description": "Made from one piece of Italian leather with no seams, and hand-polished for a rich golden-brown shine.",
    "specs": {
      "weight": "370g (Size 9 US)",
      "cushioning": "Soft cork insole",
      "upperMaterial": "One-piece Italian leather",
      "soleMaterial": "Closed-Channel Goodyear Welt Sole",
      "heelDrop": "2.2 cm leather heel",
      "fit": "True to size"
    },
    "colors": [
      {
        "name": "Black",
        "hex": "#111111",
        "previewImage": "/images/atelier/formal_oxford_set3_3.jpg",
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
        "previewImage": "/images/atelier/formal_oxford_set3_3.jpg",
        "modelTint": "#681326"
      },
      {
        "name": "White",
        "hex": "#FFFFFF",
        "previewImage": "/images/atelier/formal_oxford_set3_3.jpg",
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
    "stock": 14,
    "images": [
      "/images/atelier/formal_oxford_set3_3.jpg",
      "/images/shoes/formal-italian-loafers.png"
    ],
    "rating": 4.98,
    "reviewCount": 52,
    "isNewArrival": false,
    "isBestSeller": true,
    "isTrending": false,
    "isLimitedEdition": true,
    "reviews": [],
    "createdAt": "2026-11-07T23:10:52.444Z"
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
  },
  {
    "_id": "prod-aura-noir-chelsea",
    "id": "prod-aura-noir-chelsea",
    "name": "QADAM Noir Equestrian Chelsea",
    "slug": "qadam-noir-chelsea",
    "tagline": "Black Mirror Polish with Ribbed Gussets",
    "brand": "QADAM",
    "price": 420,
    "category": "chelsea-boots",
    "gender": "men",
    "description": "Masterfully crafted from high-shine aniline black calfskin. Features heavy-duty ribbed elastic gussets and a storm-welted Dainite rubber sole for year-round elegance and weather resistance.",
    "specs": {
      "weight": "420g (Size 9 US)",
      "cushioning": "Tempered Steel Shank + Cork Bedding",
      "upperMaterial": "High-Shine Aniline Calfskin",
      "soleMaterial": "Goodyear Welted Dainite Rubber Sole",
      "heelDrop": "2.8 cm stacked heel",
      "fit": "True to size (Sleek Equestrian Last)"
    },
    "colors": [
      {
        "name": "Black",
        "hex": "#111111",
        "previewImage": "/images/atelier/formal_boot_set2_3.jpg",
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
        "previewImage": "/images/atelier/formal_boot_set2_3.jpg",
        "modelTint": "#681326"
      },
      {
        "name": "White",
        "hex": "#FFFFFF",
        "previewImage": "/images/atelier/formal_boot_set2_3.jpg",
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
    "stock": 15,
    "images": [
      "/images/atelier/formal_boot_set2_3.jpg"
    ],
    "rating": 4.97,
    "reviewCount": 38,
    "isNewArrival": false,
    "isBestSeller": true,
    "isTrending": false,
    "isLimitedEdition": true,
    "isAtelierFeatured": true,
    "edition": "Winter Atelier",
    "reviews": [],
    "createdAt": "2026-11-08T12:00:00.000Z"
  },
  {
    "_id": "prod-aura-single-monk",
    "id": "prod-aura-single-monk",
    "name": "QADAM Florentine Single Monkstrap",
    "slug": "qadam-single-monk",
    "tagline": "Palladium Buckle with Beveled Waist",
    "brand": "QADAM",
    "price": 385,
    "category": "formals",
    "gender": "men",
    "description": "Sculpted on a classic Florentine chiseled last using glacé obsidian calfskin. Finished with an understated single palladium buckle and an oak-bark tanned leather outsole.",
    "specs": {
      "weight": "390g (Size 9 US)",
      "cushioning": "Breathable Natural Cork Insole",
      "upperMaterial": "Fine-Grained Obsidian Calfskin",
      "soleMaterial": "Goodyear Welted Oak-Bark Leather Sole",
      "heelDrop": "2.4 cm heel",
      "fit": "True to size (Classic Florentine D-Last)"
    },
    "colors": [
      {
        "name": "Black",
        "hex": "#111111",
        "previewImage": "/images/atelier/formal_prestige_set6_2.jpg",
        "modelTint": "#111111"
      },
      {
        "name": "Brown",
        "hex": "#4A2E1B",
        "previewImage": "/images/atelier/formal_prestige_set6_2.jpg",
        "modelTint": "#4A2E1B"
      },
      {
        "name": "Maroon",
        "hex": "#681326",
        "previewImage": "/images/atelier/formal_prestige_set6_2.jpg",
        "modelTint": "#681326"
      },
      {
        "name": "White",
        "hex": "#FFFFFF",
        "previewImage": "/images/atelier/formal_prestige_set6_2.jpg",
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
    "stock": 12,
    "images": [
      "/images/atelier/formal_prestige_set6_2.jpg"
    ],
    "rating": 4.95,
    "reviewCount": 31,
    "isNewArrival": true,
    "isBestSeller": false,
    "isTrending": true,
    "isLimitedEdition": false,
    "isAtelierFeatured": true,
    "edition": "Cordwainer Series",
    "reviews": [],
    "createdAt": "2026-11-08T12:00:00.000Z"
  }
];
