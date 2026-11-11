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
    "tagline": "Classic black leather Oxford with brogue details, handmade in Italy.",
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
        "name": "Obsidian Noir",
        "hex": "#111111",
        "previewImage": "/images/mockup/hq-prod-1-oxford.png",
        "modelTint": "#111111"
      },
      {
        "name": "Artisanal Italian Loafer",
        "hex": "#4A2E1B",
        "previewImage": "/images/shoes/formal-italian-loafers.png",
        "modelTint": "#4A2E1B"
      }
    ],
    "sizes": [
      7,
      7.5,
      8,
      8.5,
      9,
      9.5,
      10,
      10.5,
      11,
      11.5,
      12,
      13
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
    "tagline": "Handcrafted dark brown calfskin crisscross leather sandals with brass buckles.",
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
        "name": "Chestnut Brun",
        "hex": "#4A2E1B",
        "previewImage": "/images/shoes/artisan-leather-sandal.jpg",
        "modelTint": "#4A2E1B"
      }
    ],
    "sizes": [
      7,
      7.5,
      8,
      8.5,
      9,
      9.5,
      10,
      10.5,
      11,
      11.5,
      12,
      13
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
    "tagline": "Italian woven calfskin slide mules with cushioned leather footbeds.",
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
        "name": "Espresso & Nero",
        "hex": "#2B1D14",
        "previewImage": "/images/shoes/luxury-leather-slides.jpg",
        "modelTint": "#2B1D14"
      }
    ],
    "sizes": [
      7,
      7.5,
      8,
      8.5,
      9,
      9.5,
      10,
      10.5,
      11,
      11.5,
      12,
      13
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
    "tagline": "Italian cognac calfskin driving loafers with hand-stitched moccasin toe.",
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
        "name": "Cognac Sienna",
        "hex": "#8B5A2B",
        "previewImage": "/images/shoes/cognac-driving-casual.jpg",
        "modelTint": "#8B5A2B"
      }
    ],
    "sizes": [
      7,
      7.5,
      8,
      8.5,
      9,
      9.5,
      10,
      10.5,
      11,
      11.5,
      12,
      13
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
    "tagline": "Open-laced casual tan leather Derby shoe with storm welt stitching.",
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
        "name": "Tuscan Tan",
        "hex": "#A0522D",
        "previewImage": "/images/shoes/formal-derby-tan.jpg",
        "modelTint": "#A0522D"
      }
    ],
    "sizes": [
      7,
      7.5,
      8,
      8.5,
      9,
      9.5,
      10,
      10.5,
      11,
      11.5,
      12,
      13
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
    "tagline": "Hand-burnished chestnut leather double monkstrap with silver hardware.",
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
        "name": "Chestnut Patina",
        "hex": "#5A2E17",
        "previewImage": "/images/shoes/formal-monkstrap-chestnut.jpg",
        "modelTint": "#5A2E17"
      }
    ],
    "sizes": [
      7,
      7.5,
      8,
      8.5,
      9,
      9.5,
      10,
      10.5,
      11,
      11.5,
      12,
      13
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
    "tagline": "Polished brown leather loafer, handmade in Italy.",
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
        "name": "Burnished Amber",
        "hex": "#4A2E1B",
        "previewImage": "/images/shoes/formal-italian-loafers.png",
        "modelTint": "#4A2E1B"
      }
    ],
    "sizes": [
      7,
      7.5,
      8,
      8.5,
      9,
      9.5,
      10,
      10.5,
      11,
      11.5,
      12,
      13
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
    "tagline": "Smooth Oxford made from one single piece of leather.",
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
        "name": "Sunburst Patina",
        "hex": "#8B5A2B",
        "previewImage": "/images/atelier/formal_oxford_set3_3.jpg",
        "modelTint": "#8B5A2B"
      }
    ],
    "sizes": [
      7,
      7.5,
      8,
      8.5,
      9,
      9.5,
      10,
      10.5,
      11,
      11.5,
      12,
      13
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
    "tagline": "Handmade brown leather Chelsea boot with a strong stitched sole.",
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
        "name": "Warm Cognac",
        "hex": "#5A3825",
        "previewImage": "/images/atelier/formal_boot_set2_2.jpg",
        "modelTint": "#5A3825"
      }
    ],
    "sizes": [
      7,
      7.5,
      8,
      8.5,
      9,
      9.5,
      10,
      10.5,
      11,
      11.5,
      12,
      13
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
    "reviews": [],
    "createdAt": "2026-11-07T23:10:52.445Z"
  }
];
