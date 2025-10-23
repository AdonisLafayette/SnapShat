# Snapstreak Restore Bot

## Overview

A desktop application for automating Snapchat streak restoration submissions. The application allows users to manage a list of friends whose streaks need to be restored, and automatically submits restoration requests to Snapchat's support system while handling CAPTCHAs and providing real-time progress tracking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component Library**: shadcn/ui built on Radix UI primitives with Tailwind CSS for styling

**Design System**: Glassmorphic design inspired by macOS Tahoe/iOS 26, featuring:
- Backdrop blur effects with transparency layers
- Inter font family for UI elements and JetBrains Mono for monospace content
- Dark mode by default for OLED displays
- Layered depth through glassmorphic surfaces with varying opacity levels

**State Management**: 
- TanStack Query (React Query) for server state management
- React hooks (useState) for local component state
- Custom WebSocket hook for real-time updates

**Key Design Patterns**:
- Component-based architecture with reusable UI components in `client/src/components/ui/`
- Custom glassmorphic card wrapper component (`GlassCard`) for consistent visual treatment
- Real-time communication via WebSocket for live automation status updates

### Backend Architecture

**Runtime**: Node.js with Express.js HTTP server

**Language**: TypeScript with ESM modules

**Automation Engine**: Puppeteer for browser automation
- Non-headless mode to allow manual CAPTCHA solving
- Cookie persistence for session management
- Form automation for Snapchat support ticket submission

**API Design**:
- RESTful endpoints for CRUD operations on friends and settings
- WebSocket server for broadcasting real-time automation events
- Multer middleware for file upload handling (friend list imports)

**Key Services**:
- `SnapchatAutomation` class: Manages browser automation lifecycle, form filling, and CAPTCHA detection
- `storage`: Abstract storage interface with in-memory implementation for friends, submissions, settings, and cookies

**Architectural Decisions**:
- In-memory storage chosen for simplicity and session-based data (can be replaced with database implementation via the `IStorage` interface)
- WebSocket communication pattern allows real-time UI updates without polling
- Automation runs in non-headless mode to enable human CAPTCHA solving

### Data Storage Solutions

**Current Implementation**: In-memory storage via `MemStorage` class

**Schema Defined**: PostgreSQL schema using Drizzle ORM in `shared/schema.ts`
- `friends`: Stores friend usernames and metadata
- `submissions`: Tracks automation job status and logs
- `settings`: User account credentials for form filling
- Cookie storage for session persistence

**Storage Interface**: Abstract `IStorage` interface allows swapping storage backends without changing business logic

**Migration Path**: Drizzle configuration present for future PostgreSQL integration with Neon serverless database

**Decision Rationale**: 
- In-memory storage simplifies initial development and eliminates database setup complexity
- Schema definition prepared for future database migration when persistence is required
- Cookie files would be stored separately for browser session reuse

### External Dependencies

**Browser Automation**:
- Puppeteer: Headless Chrome automation for form submission
- Target URL: `https://help.snapchat.com/hc/en-us/requests/new?co=true&ticket_form_id=149423`

**UI Component Libraries**:
- Radix UI: Accessible component primitives (dialogs, dropdowns, checkboxes, etc.)
- shadcn/ui: Pre-built component implementations following Radix patterns
- Tailwind CSS: Utility-first styling framework with custom glassmorphic design tokens

**Fonts**:
- Google Fonts: Inter (400, 500, 600, 700) and JetBrains Mono (400, 500)

**Real-time Communication**:
- WebSocket (ws package): Bidirectional communication for automation status updates

**Database** (Prepared but not currently active):
- Neon Serverless PostgreSQL: Configured via `@neondatabase/serverless`
- Drizzle ORM: Type-safe database queries and schema management
- Connection pool via `connect-pg-simple` for session storage

**Development Tools**:
- Vite: Fast development server and build tool
- Replit plugins: Runtime error overlay, cartographer, dev banner

**Form Handling**:
- React Hook Form: Form state management
- Zod: Schema validation via `drizzle-zod`

**Date Handling**:
- date-fns: Date formatting and manipulation