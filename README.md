# Grám - Instagram to Website in 5 Minutes

Grám is a modern, high-performance web application designed to instantly transform any public Instagram profile into a fully-fledged website package. It extracts posts, captions, contact info, and story highlights, and then uses AI (Claude) to generate polished website copy, SEO keywords, FAQs, and a Google Business Profile.

## 🚀 Features

- **Deep Profile Extraction**: Automatically captures bio, contact info, follower count, image URLs, and story highlights from any public Instagram profile without requiring login.
- **AI-Powered Copywriting**: Leverages Claude AI to read every caption and generate homepage copy, services, FAQs, SEO keywords, testimonials, and a keyword-optimized Google Business Profile.
- **Seamless Exporting**: Extracts and structures the generated website package into a clean CSV format or pushes directly to Google Sheets, perfect for client handoffs.
- **Premium Dark Canvas Design**: A highly polished, Framer-inspired marketing site design. Features a pure black canvas with a single confident accent color, extreme negative letter-spacing for display types, and vibrant gradient atmosphere cards (magenta, violet, orange, coral).
- **Fast & Responsive**: Built on Next.js 15 and React 19, utilizing Turbopack for lightning-fast compilation and optimized asset delivery.

## 🛠 Tech Stack

- **Framework**: [Next.js 15.5](https://nextjs.org/) (App Router, Turbopack)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [SQLite](https://sqlite.org/) via `better-sqlite3` and [Prisma ORM](https://www.prisma.io/)
- **Storage**: [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) via `@aws-sdk/client-s3` for object storage.
- **File Management**: `jszip` for data packaging.
- **Typography**: Inter Variable with customized OpenType character variants (`cv01`, `cv05`, `cv09`, `cv11`, `ss03`, `ss07`, `dlig`).

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v20 or higher recommended)
- `npm` or `yarn` or `pnpm`

## 🏃‍♂️ Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Rename `.env.example` to `.env` (or create a new `.env` file) and fill in your keys:
   ```env
   # Add your environment variables here
   DATABASE_URL="file:./dev.db"
   # AI and Cloudflare R2 variables should be added accordingly
   ```

3. **Run Database Migrations**
   ```bash
   npx prisma db push
   ```

4. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🎨 Design System

The application strictly adheres to a confident, dark-canvas marketing system:
- **Background**: Near-pure black artboards with subtle surface lifting (`surface-1`, `surface-2`).
- **Typography**: Emphasizes stark contrast and rhythm. Oversized white display fonts paired with aggressively tight tracking.
- **Buttons**: Consistent use of rounded pill shapes. Primary actions are white pills, secondary actions are charcoal pills.
- **Highlights**: Chromatic accents are restricted. Deep gradient spotlight cards (violet, magenta, orange) are used to break the rhythm and provide an atmospheric showcase without overwhelming the dark theme.

For detailed design specifications, refer to the `DESIGN.md` documentation.

## 📜 Scripts

- `npm run dev` - Starts the development server with Turbopack.
- `npm run build` - Creates an optimized production build.
- `npm run start` - Starts the production server.
- `npm run lint` - Runs ESLint to catch formatting and code quality issues.
