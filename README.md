# QADAM Men's Footwear — E-Commerce Platform

A production-grade, ultra-luxury footwear e-commerce application for QADAM Men's Footwear.

---

## 🌟 Key Highlights & Signature Interactions

### 1. The Signature Cinematic Interactive Showcase
- **Select any shoe silhouette**: The shoe smoothly animates from its original position with physics-based spring curves.
- **Scales up and glides to the right** of the stage while the **editorial product details panel gracefully slides in from the left**.
- Includes live colorway switching (material updates live on the 3D model), size picker with remaining stock indicator, Add to Cart with 3D Flip, and instant Buy Now checkout.
- Adapts responsively into an ergonomic vertical stack on mobile devices.

### 2. The Signature 3D Flip-to-Cart Experience
- Clicking **"Add to Cart"** causes the chosen footwear model to perform a **smooth 3D flip (`rotateY: 360°`)**.
- The shoe glides on a parabolic trajectory towards the header shopping bag.
- The shopping bag reacts with an energetic shake animation and counter increment.
- Micro-confetti particle burst provides tactile confirmation without interrupting the shopping flow.

### 3. Interactive 360° 3D Product Viewer
- Built with **Three.js** with zero reliance on fragile external 50MB assets:
  - 360° mouse and touch drag rotation.
  - Zoom in / out controls.
  - Camera angle presets: **Perspective**, **Profile**, **Top**, **Front**, **Sole**.
  - Live color material tinting synchronized across color swatches.
  - Wireframe architecture mode toggle.
  - Studio key lighting, rim lighting, and soft ground contact shadows.
  - High-resolution fallback photography for low-power devices.

### 4. Pure Light Luxury Design System
- Palette: Pure White (`#FFFFFF`), Soft Atelier Grey (`#FAFBFD`, `#F5F6F8`), Deep Black (`#111111`), Subtle Titanium/Silver borders (`#EAEAEA`).
- Apple-grade typography and generous whitespace.
- Subtle shadows, micro-interactions, and animated link underlines.

### 5. Progressive Web App (PWA) & Web Push Notifications
- Installable on desktop, Android, and iOS as a standalone app.
- Custom non-intrusive opt-in dialog: *"Never Miss a New Drop!"*.
- Service worker (`sw.js`) with cache management, push event handling, and custom action buttons.
- Real web-push backend with dynamic or persistent VAPID keypairs.

---

## 🧭 All 18 Pages & Admin Dashboard

### Customer Boutique (18 Pages):
1. **Home (`/`)**: 3D hero showcase, interactive signature showcase, featured collections, deconstructed anatomy, drop countdown, verified reviews, and newsletter.
2. **Shop All (`/shop`)**: Complete footwear catalog with multi-facet filters (category, gender, size, price slider), sorting, and grid/column toggles.
3. **Men's Collection (`/mens`)**: Curated men's performance & architectural silhouettes.
4. **Women's Collection (`/womens`)**: Ergonomic featherweight silhouettes with arch contouring.
5. **New Arrivals (`/new-arrivals`)**: Latest seasonal drops from Milan.
6. **Best Sellers (`/best-sellers`)**: Iconic top-rated footwear models.
7. **Product Details (`/product/:slug`)**: 3D interactive viewer, live colorways, size picker, technical specs, customer reviews breakdown, review submission modal, and related models.
8. **Shopping Bag (`/cart`)**: Interactive cart drawer and dedicated cart page with free shipping progress bar, promo code validation, and quantity steppers.
9. **Checkout (`/checkout`)**: Multi-step checkout with address validation, courier options (Express vs White Glove), card preview mock with visual cardholder updates, Apple Pay, Google Pay, and Cash on Delivery.
10. **My Account (`/account`)**: Customer profile, saved shipping addresses, and quick login.
11. **My Orders (`/orders`)**: Order history with order status tags, waybills, and invoice generation.
12. **Wishlist (`/wishlist`)**: Saved shoe silhouettes with one-click "Move to Cart" flip animation.
13. **About Us (`/about`)**: Brand philosophy, Milan design studio, carbon monocoque engineering, and supercritical nitrogen micro-foam innovation.
14. **Contact Us (`/contact`)**: Client concierge dispatch form and 4 flagship showrooms (Milan, New York, London, Tokyo).
15. **Size Guide (`/size-guide`)**: Interactive sizing conversion matrix (US, UK, EU, CM, Inches) and real-time foot length calculator with width recommendations.
16. **Order Tracking (`/track-order`)**: Live order tracking by order number (e.g., `QDM-89214`) with interactive 5-step milestone timeline.
17. **Privacy Policy (`/privacy`)**: Luxury atelier client privacy, data encryption, and GDPR/CCPA terms.
18. **Terms & Conditions (`/terms`)**: 30-day white glove returns policy, warranty, and limited edition allocations.

### Separate Admin Operations Portal (`/admin`):
- **Overview Dashboard (`/admin`)**: Total sales revenue, total orders, active products, push subscriber count, monthly revenue growth chart, low-stock alerts, and recent orders.
- **Product Management (`/admin/products`)**: Add new shoe silhouettes with images, color swatches, sizes, specs, and badges; edit pricing and stock; delete models.
- **Order Logistics (`/admin/orders`)**: View all orders, update status (Pending, Processing, Shipped, Delivered, Cancelled), assign courier waybills, and add tracking notes.
- **Customer Directory (`/admin/customers`)**: View registered clients and membership details.
- **Web Push Broadcast Dispatcher (`/admin/notifications`)**: Real-time push broadcast composer with pre-built drop templates, a live smartphone lockscreen preview mockup, and delivery dispatch statistics.
- **Admin PWA**: The admin portal is also installable as a standalone PWA via the sidebar installation button.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Three.js, Framer Motion, GSAP, Lucide React, Canvas Confetti.
- **Backend**: Node.js, Express, TypeScript (TSX), Mongoose, JWT, BcryptJS, Web-Push.
- **Database**: MongoDB (Mongoose Schema Models + Resilient Dual Storage Layer).
  - Automatically connects to `MONGODB_URI` (local MongoDB or MongoDB Atlas).
  - If MongoDB is currently disconnected, seamlessly operates in high-speed fallback mode so the entire application functions instantly out-of-the-box without crashing!

---

## 🚀 Running the Project

### 1. Install Dependencies
```bash
npm install
npm run install:all
```

### 2. Start Both Server & Client
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:5173` (or `5174`)
- **Backend API**: `http://localhost:5000`

### 3. Demo Credentials

#### Administrator Account:
- **Email**: `admin@qadamshoes.com`
- **Password**: `admin123`
- Direct access to `/admin`

#### Customer Account:
- **Email**: `alex@example.com`
- **Password**: `customer123`

#### Sample Order for Tracking:
- **Order Number**: `QDM-89214`
- View live tracking on `/track-order?orderNumber=QDM-89214`

#### Promotional Discount Code:
- Apply active promo codes at checkout.
