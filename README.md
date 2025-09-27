# Breadcrumbs - Link Manager

A modern link management application built with Next.js and React Native, using Convex as the backend database.

## Project Structure

This project consists of two applications:

1. **Next.js Web App** - A responsive web application for managing links
2. **React Native Mobile App** (`/mobile` directory) - A cross-platform mobile app with the same functionality

## Features

- ✨ Create, read, update, and delete links
- 🔍 Search functionality with real-time filtering
- 🏷️ Tag management for better organization
- 📱 Responsive design with dark mode
- 🔗 Click to open links directly
- 📖 Optional descriptions for links
- ⚡ Real-time synchronization via Convex

## Tech Stack

### Web App
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI component library
- **Convex** - Backend database and real-time sync

### Mobile App
- **Expo** - React Native framework
- **TypeScript** - Type safety
- **React Native** - Cross-platform mobile development

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Convex account (sign up at [convex.dev](https://convex.dev))

### Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Convex:**
   ```bash
   # Login to Convex (follow the prompts)
   npx convex login

   # Initialize and deploy your Convex project
   npx convex deploy
   ```

3. **Configure environment variables:**
   - Copy the Convex deployment URL from the deploy output
   - Add it to `.env.local`:
     ```
     NEXT_PUBLIC_CONVEX_URL=https://your-deployment-url.convex.cloud
     ```

4. **Start the web application:**
   ```bash
   npm run dev
   ```

5. **Set up the mobile app:**
   ```bash
   cd mobile
   npm install

   # Start Expo development server
   npm start
   ```

   Then use the Expo Go app on your phone or an emulator to run the mobile app.

### Development

- **Web app**: Runs on `http://localhost:3000`
- **Mobile app**: Use Expo Go app to scan QR code
- **Convex Dashboard**: Monitor your database at the Convex dashboard

## API Routes

The Next.js app provides REST API endpoints for the mobile app:

- `GET /api/links` - Get all links (with optional search)
- `POST /api/links` - Create a new link
- `GET /api/links/[id]` - Get a specific link
- `PUT /api/links/[id]` - Update a link
- `DELETE /api/links/[id]` - Delete a link

## Deployment

### Web App (Vercel)

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_CONVEX_URL`
3. Deploy

### Mobile App

1. Build with Expo:
   ```bash
   cd mobile
   npx expo build
   ```

2. Follow Expo's deployment guides for App Store/Play Store

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License
