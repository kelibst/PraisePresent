# PraisePresent Activities Log

## Major Activities & Attempts

### May 2025

- Completely redesigned Homepage with animated entry using Framer Motion
- Added smooth animations for logo, text elements and buttons
- Created staggered animation sequence for better visual appeal
- Fixed image import paths in Homepage component
- Added subtle continuous logo animation
- Implemented spring animations for interactive elements
- Centered the homepage design and improved visual hierarchy
- Added motion effects for decorative elements
- Improved button styling with hover animations
- Refactored sidebar to a persistent, animated aside (retractable/expandable)
- Implemented theme toggle (sun/moon icons) at the bottom of the aside
- Fixed dark mode bug: now works with Tailwind and CSS variables using :root.dark
- Removed modal drawer and overlay for navigation
- Integrated Redux Toolkit for global state management of services
- Updated routing/layout to use a layout component for all pages except homepage
- Improved code structure for maintainability and scalability
- Added service list and service detail pages with Redux state
- Ensured theme toggle persists and updates the UI instantly
- Added smooth transitions for sidebar and theme changes
- Debugged Tailwind dark mode and variable cascade issues
- Set up project for further feature expansion (songs, media, presentations)

### May 2023

- Fixed window frame issues by updating the BrowserWindow configuration
- Implemented automatic window maximization on application startup
- Added system theme detection and propagation to the renderer process
- Created IPC handlers for theme management (get, set, and update events)
- Configured proper TypeScript typings for Vite-injected constants
- Disabled DevTools opening by default in production builds
- Fixed empty space at window edges in fullscreen/maximized mode
- Eliminated browser-like scrollbars by setting appropriate window options
- Added custom scrollbar styling for elements that need scrolling
- Improved CSS to ensure proper fullscreen behavior without gaps
- Enhanced window state tracking with maximize/unmaximize events
- Set default background color to match theme in window configuration
- Completely redesigned title bar component with proper CSS for drag regions
- Fixed window layout issues by implementing proper app container structure
- Improved cleanup of event listeners to prevent memory leaks
- Added hiddenInset title bar style for macOS for a more native look and feel

---

_This log will be updated as new features and changes are attempted or completed._ 