# Snapstreak Restore - Automated Streak Restoration Tool

## Overview
A Windows-native full-stack web application that automates the process of submitting Snapchat streak restoration requests. The application handles form filling, CAPTCHA detection, cookie persistence, and opens Chrome natively on your desktop for manual CAPTCHA solving when needed. Features a stunning iOS 26-inspired liquid glass design system.

## Last Updated
October 25, 2025 - Windows-native implementation complete with iOS 26 liquid glass UI

## Project Architecture

### Technology Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui + iOS 26 Liquid Glass Design
- **Backend**: Express.js + TypeScript
- **Automation**: Puppeteer (Windows-native Chrome)
- **Real-time**: WebSocket (ws library)
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
- `src/components/BrowserView.tsx` - Browser status indicator with CAPTCHA guidance
- `src/hooks/useWebSocket.ts` - WebSocket connection hook
- `src/components/ui/` - shadcn/ui components with iOS 26 liquid glass styling

### Backend (`server/`)
- `automation.ts` - Core Puppeteer automation logic
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

1. **Browser Launches**: Puppeteer launches Chrome natively on Windows desktop
2. **Cookie Loading**: Loads any saved cookies to bypass CAPTCHA
3. **Page Navigation**: Navigates to Snapchat help page
4. **CAPTCHA Detection**: Checks for Cloudflare Turnstile
   - If no CAPTCHA: Proceeds to step 6
   - If CAPTCHA present: Goes to step 5
5. **Manual CAPTCHA Solving**:
   - Automation pauses
   - User switches to Chrome window on desktop
   - User solves CAPTCHA by clicking checkbox
   - System detects when token is generated (CAPTCHA solved)
   - Cookies automatically saved
   - Automation resumes
6. **Form Filling**: Fills all required fields with human-like delays
7. **Form Submission**: Clicks submit button
8. **Success Verification**: Waits for success confirmation page
9. **Status Update**: Updates friend submission status
10. **Next Friend**: Repeats for next friend in queue

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

## Windows-Native Browser Architecture

```
User Dashboard (Web Interface)
    ↓ (WebSocket for status updates)
Express Server Backend
    ↓ (Puppeteer automation)
Chrome Browser (Native Windows Window)
    ↑
User interacts directly with Chrome for CAPTCHA solving
```

The Windows-native setup allows users to see and interact with Chrome directly on their desktop, providing a seamless CAPTCHA solving experience.

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

## Windows-Native Design

The application is **Windows-native only** with these features:

### Windows Implementation
- Uses system Chrome (auto-detected by Puppeteer)
- Headful browser opens natively on desktop for CAPTCHA solving
- Direct window interaction - no embedded viewers
- Same automation capabilities with native Windows UX
- Simple download-and-run experience (double-click start.bat)

### iOS 26 Liquid Glass UI
- **Multi-layer gradients**: Vibrant blues, purples, pinks, and cyans creating depth
- **Glassmorphism**: Frosted glass cards with backdrop-blur-xl effects
- **Depth & Shadows**: Multi-layer shadow system for floating card effect
- **Fluid animations**: Smooth hover states, shimmer effects, staggered transitions
- **Modern typography**: Inter font family with gradient text effects
- **Gradient buttons**: Blue-to-purple gradients with glow effects
- **CSS utilities**: Reusable glass-card, transition-smooth, text-gradient classes

## Environment Setup

### Required System Dependencies

#### Windows
- Chrome or Chromium installed on system (auto-detected by Puppeteer)
- Node.js 18+ (verified by start.bat launcher)

### Node.js Packages
All packages installed via `package.json`:
- Core: `express`, `puppeteer`, `ws`
- Frontend: `react`, `vite`, `tailwindcss`
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

## Future Enhancements

- Database integration for persistent storage
- Multiple concurrent automation sessions
- Persistent cookie storage (database)
- Advanced CAPTCHA solving (paid services integration)
- Queue management for batch processing
- Analytics and success rate tracking

## Troubleshooting

### Chrome Window Not Appearing
- Check if Chrome is installed on your system
- Verify Puppeteer can detect Chrome (check automation logs)
- Ensure no other Puppeteer instances are running

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
