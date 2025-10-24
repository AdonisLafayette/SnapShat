# Snapstreak Restore - Automated Streak Restoration Tool

## Overview
A full-stack web application that automates the process of submitting Snapchat streak restoration requests. The application handles form filling, CAPTCHA detection, cookie persistence, and provides a live VNC viewer for manual interaction when needed.

## Last Updated
October 24, 2025 - Migration to Replit environment completed

## Project Architecture

### Technology Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Automation**: Puppeteer + x11vnc + Xvfb
- **Real-time**: WebSocket (ws library) + noVNC
- **Storage**: In-memory storage (MemStorage)

### Key Features

#### 1. Automated Form Submission
- Automatically navigates to Snapchat help page
- Fills out streak restoration form with user details
- Human-like typing with random delays to avoid detection
- Robust selector strategy with fallback options
- Automatic form submission

#### 2. Intelligent CAPTCHA Handling
- **Cloudflare Turnstile Detection**: Specifically checks for `cf-turnstile-response` input field
- **Solved State Detection**: Monitors if CAPTCHA token has been generated (solved vs unsolved)
- **Cookie Persistence**: Saves cookies after CAPTCHA solve to minimize future CAPTCHAs
- **Cookie Loading**: Loads saved cookies before navigation to bypass CAPTCHAs
- **Manual Solving Interface**: Embedded VNC viewer for user interaction when CAPTCHA appears
- **Automatic Resume**: Continues automation after CAPTCHA is solved

#### 3. Live Browser View (VNC Integration)
- **Virtual Display**: Xvfb creates headless X11 display
- **VNC Server**: x11vnc shares the display over VNC protocol
- **WebSocket Proxy**: Server-side proxy forwards VNC data to browser
- **noVNC Client**: Browser-based VNC client for live interaction
- **Real-time Interaction**: Users can click and type directly in the browser to solve CAPTCHAs

#### 4. Cookie Management
- Cookies saved automatically after CAPTCHA solve
- Cookies loaded before page navigation
- Stored in-memory (persists during session)
- Helps minimize CAPTCHA challenges on subsequent requests

#### 5. Friend Management
- Add friends individually or bulk import from file
- Track submission status per friend (pending, running, success, failed, captcha)
- Delete friends and associated submissions
- Profile picture support

#### 6. Settings & Configuration
- Store user information (username, email, phone)
- Used for automatic form filling
- Persistent across session

#### 7. Real-time Updates
- WebSocket connection for live status updates
- Processing logs displayed in real-time
- Friend status changes broadcast to all clients
- Current processing state synchronized

## File Structure

### Frontend (`client/`)
- `src/pages/Dashboard.tsx` - Main dashboard with friend list and controls
- `src/components/BrowserView.tsx` - Embedded VNC viewer component  
- `src/hooks/useWebSocket.ts` - WebSocket connection hook
- `src/components/ui/` - shadcn/ui components

### Backend (`server/`)
- `automation.ts` - Core Puppeteer automation logic
- `vnc-manager.ts` - VNC server management (Xvfb + x11vnc)
- `routes.ts` - API routes and WebSocket servers
- `storage.ts` - In-memory storage implementation
- `index.ts` - Express server entry point

### Shared (`shared/`)
- `schema.ts` - Drizzle ORM schema and Zod validation

## How It Works

### 1. User Adds Friends
User adds Snapchat usernames either individually or via bulk import.

### 2. User Configures Settings
User provides their own details (username, email, phone) used for form submission.

### 3. User Starts Processing
Clicking "Start Processing" initiates the automation:

1. **VNC Server Starts**: Xvfb and x11vnc launch automatically
2. **Browser Launches**: Puppeteer launches Chromium on virtual display
3. **Cookie Loading**: Loads any saved cookies to bypass CAPTCHA
4. **Page Navigation**: Navigates to Snapchat help page
5. **CAPTCHA Detection**: Checks for Cloudflare Turnstile
   - If no CAPTCHA: Proceeds to step 7
   - If CAPTCHA present: Goes to step 6
6. **Manual CAPTCHA Solving**:
   - Automation pauses
   - User sees live browser via VNC viewer
   - User solves CAPTCHA by clicking checkbox
   - System detects when token is generated (CAPTCHA solved)
   - Cookies automatically saved
   - Automation resumes
7. **Form Filling**: Fills all required fields with human-like delays
8. **Form Submission**: Clicks submit button
9. **Success Verification**: Waits for success confirmation page
10. **Status Update**: Updates friend submission status
11. **Next Friend**: Repeats for next friend in queue

### 4. Future Requests Skip CAPTCHA
Because cookies are saved, subsequent requests often bypass CAPTCHA entirely, maximizing automation.

## Cookie Strategy

The application implements a sophisticated cookie management system:

- **Save After CAPTCHA**: Immediately saves cookies after user solves CAPTCHA
- **Load Before Navigation**: Loads cookies before navigating to ticket page
- **Domain Matching**: Properly sets cookie domains for Snapchat/Cloudflare
- **In-Memory Storage**: Cookies persist during app session
- **Automatic Reuse**: Same cookies reused for all friends to minimize CAPTCHAs

This approach significantly reduces manual intervention as the first CAPTCHA solve often enables all subsequent submissions to proceed automatically.

## VNC Architecture

```
User Browser
    ↓ (WebSocket)
Express Server (/vnc WebSocket proxy)
    ↓ (TCP Socket)
x11vnc VNC Server (port 5900)
    ↓
Xvfb Virtual Display (:99)
    ↓
Puppeteer/Chromium Browser
```

The VNC setup allows users to see and interact with the actual browser running the automation, essential for solving CAPTCHAs.

## API Endpoints

### Friends
- `GET /api/friends` - Get all friends
- `POST /api/friends` - Add new friend
- `DELETE /api/friends/:id` - Delete friend
- `POST /api/friends/import` - Bulk import friends from file

### Submissions
- `GET /api/submissions` - Get all submissions
- `GET /api/submissions/:friendId` - Get submission for specific friend

### Settings
- `GET /api/settings` - Get user settings
- `POST /api/settings` - Create/update settings

### Process Control
- `POST /api/process/start` - Start automation for selected friends
- `POST /api/process/stop` - Stop ongoing automation
- `GET /api/process/status` - Get current processing status
- `GET /api/process/vnc-url` - Get VNC WebSocket URL
- `GET /api/process/screenshot` - Get current page screenshot

### Cookies
- `POST /api/cookies/clear` - Clear saved cookies

## WebSocket Endpoints

### Status Updates (`/ws`)
Real-time updates for:
- Friend additions/deletions
- Processing status changes
- Log entries
- Errors

### VNC Proxy (`/vnc`)
Binary WebSocket proxy that:
- Forwards VNC data from x11vnc to browser
- Handles binary protocol negotiation
- Manages keepalive pings
- Enables noVNC client connection

## Environment Setup

### Required System Dependencies (Pre-installed in Replit)
- `Xvfb` - Virtual framebuffer X11 server
- `x11vnc` - VNC server for X11
- `chromium` - Browser for Puppeteer

### Node.js Packages
All packages installed via `package.json`:
- Core: `express`, `puppeteer`, `ws`
- Frontend: `react`, `vite`, `tailwindcss`
- VNC: `novnc-core`
- Forms: `react-hook-form`, `zod`
- UI: `@radix-ui/*`, `lucide-react`

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Deployment Configuration

The app is configured for **autoscale deployment** (stateless):
- Build: `npm run build`
- Run: `npm run start`
- Port: 5000 (both frontend and backend)

## Known Limitations

1. **In-Memory Storage**: Data lost on server restart (friends, submissions, cookies)
2. **Single Session**: Only one automation can run at a time
3. **Cookie Persistence**: Cookies only persist during app runtime
4. **VNC Security**: VNC server bound to localhost only for security

## Future Enhancements

- Database integration for persistent storage
- Multiple concurrent automation sessions
- Persistent cookie storage (database)
- Advanced CAPTCHA solving (paid services integration)
- Queue management for batch processing
- Analytics and success rate tracking

## Troubleshooting

### VNC Not Connecting
- Check if VNC server started (logs should show "VNC server started")
- Verify WebSocket proxy is running on `/vnc` path
- Check browser console for noVNC connection errors

### CAPTCHA Not Detecting as Solved
- Ensure `cf-turnstile-response` input has value >10 characters
- Check automation logs for CAPTCHA detection messages
- Verify cookies are being saved after solve

### Form Not Filling
- Check if selectors match current Snapchat page structure
- Review automation logs for "Found field" messages
- Check screenshot in `/tmp/form-fill-failed.png`

### Cookies Not Persisting
- Cookies only persist in-memory during runtime
- Server restart clears all cookies
- Consider database integration for production use
