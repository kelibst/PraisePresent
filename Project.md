# Church Presentation Software Requirements Specification (SRS)

**Project Name:** PraisePresent  
**Document Version:** 1.0  
**Date:** May 3, 2025  
**Author:** Claude AI  

## Table of Contents
1. [Introduction](#1-introduction)
   1. [Purpose](#11-purpose)
   2. [Document Conventions](#12-document-conventions)
   3. [Intended Audience](#13-intended-audience)
   4. [Project Scope](#14-project-scope)
   5. [References](#15-references)
2. [Overall Description](#2-overall-description)
   1. [Product Perspective](#21-product-perspective)
   2. [Product Features](#22-product-features)
   3. [User Classes and Characteristics](#23-user-classes-and-characteristics)
   4. [Operating Environment](#24-operating-environment)
   5. [Design and Implementation Constraints](#25-design-and-implementation-constraints)
   6. [User Documentation](#26-user-documentation)
   7. [Assumptions and Dependencies](#27-assumptions-and-dependencies)
3. [System Features](#3-system-features)
   1. [Presentation Management](#31-presentation-management)
   2. [Scripture Management](#32-scripture-management)
   3. [Song Management](#33-song-management)
   4. [Media Management](#34-media-management)
   5. [Live Presentation Mode](#35-live-presentation-mode)
   6. [Service Planning](#36-service-planning)
   7. [Settings and Configuration](#37-settings-and-configuration)
   8. [Data Management](#38-data-management)
4. [External Interface Requirements](#4-external-interface-requirements)
   1. [User Interfaces](#41-user-interfaces)
   2. [Hardware Interfaces](#42-hardware-interfaces)
   3. [Software Interfaces](#43-software-interfaces)
   4. [Communications Interfaces](#44-communications-interfaces)
5. [Non-Functional Requirements](#5-non-functional-requirements)
   1. [Performance Requirements](#51-performance-requirements)
   2. [Safety Requirements](#52-safety-requirements)
   3. [Security Requirements](#53-security-requirements)
   4. [Software Quality Attributes](#54-software-quality-attributes)
   5. [Business Rules](#55-business-rules)
6. [Technical Architecture](#6-technical-architecture)
   1. [Technology Stack](#61-technology-stack)
   2. [Database Design](#62-database-design)
   3. [System Architecture](#63-system-architecture)
7. [Development Roadmap](#7-development-roadmap)
   1. [Phase 1: MVP](#71-phase-1-mvp)
   2. [Phase 2: Enhanced Features](#72-phase-2-enhanced-features)
   3. [Phase 3: Advanced Features](#73-phase-3-advanced-features)
8. [Appendices](#8-appendices)
   1. [Appendix A: Glossary](#appendix-a-glossary)
   2. [Appendix B: Analysis Models](#appendix-b-analysis-models)
   3. [Appendix C: Issues List](#appendix-c-issues-list)

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) document provides a detailed overview of the requirements for the PraisePresent application, a church presentation software designed to enhance the worship experience. It outlines the features, functionality, interfaces, and constraints necessary to guide the development process.

### 1.2 Document Conventions
- **SHALL**: Indicates a mandatory requirement
- **SHOULD**: Indicates a recommendation
- **MAY**: Indicates an optional feature

### 1.3 Intended Audience
This document is intended for:
- Software developers implementing the system
- Project managers overseeing the development
- Church staff/volunteers who will provide feedback
- AI assistants supporting development
- Quality assurance testers

### 1.4 Project Scope
PraisePresent is a desktop application designed to create, manage, and present worship-related content in church settings. It focuses on scripture presentation, song lyrics, multimedia integration, and service planning with a strong emphasis on usability and reliability in live church environments.

The application aims to improve upon older versions of similar software like EasyWorship by maintaining valuable legacy features (such as topic-based scripture search) while introducing modern interface design and expanded functionality.

**In Scope:**
- Scripture database and advanced search capabilities
- Song lyrics and chord management
- Media presentation (images, videos, audio)
- Service/program planning
- Live presentation controls
- Multi-display support
- Templates for common church presentation formats

**Out of Scope:**
- Church management systems (membership, finances)
- Integrated video editing capabilities
- Complex animation creation tools
- Live streaming functionality (though outputs may be captured)
- Audio mixing capabilities

### 1.5 References
- Electron Framework Documentation: https://www.electronjs.org/docs
- EasyWorship (reference software): https://www.easyworship.com/
- Bible API Documentation: https://scripture.api.bible/

## 2. Overall Description

### 2.1 Product Perspective
PraisePresent is a standalone desktop application built on Electron that will operate on Windows, macOS, and Linux. It replaces older church presentation software while maintaining backward compatibility where possible. The application will integrate with external Bible APIs for scripture content but will primarily function as a self-contained system.

### 2.2 Product Features
1. **Scripture Management**
   - Access to multiple Bible translations
   - Advanced search by reference, topic, and keywords
   - Custom formatting and display options

2. **Presentation Creation**
   - Slide editor with text, media, and formatting tools
   - Template system for consistent design
   - Background management for slides

3. **Service Planning**
   - Service/event order creation and management
   - Reusable service templates
   - Import/export of service plans

4. **Media Management**
   - Library for images, videos, and audio
   - Organization tools (folders, tags, search)
   - Background collection management

5. **Live Presentation**
   - Presenter view with notes and previews
   - Audience view for projection
   - Smooth transitions between elements
   - On-the-fly editing capabilities

6. **Song Management**
   - Song database with lyrics
   - Optional chord and notation display
   - CCLI tracking for copyright compliance

7. **System Management**
   - Backup and restore functionality
   - Settings and preferences
   - User profiles for different operators
   - Import/export capabilities

### 2.3 User Classes and Characteristics

1. **Technical Operators**
   - Church tech team members
   - High computer literacy
   - Need quick access to features during live services
   - Require comprehensive training on all features

2. **Content Creators**
   - Pastors, worship leaders, and church staff
   - Moderate computer literacy
   - Focus on content creation rather than presentation
   - Need intuitive interfaces for planning and organization

3. **Occasional Users**
   - Volunteers with limited training
   - Various levels of computer literacy
   - Need simplified interface for basic operations
   - Require robustness and error prevention

### 2.4 Operating Environment
- **Operating Systems:** Windows 10+, macOS 10.15+, Ubuntu 20.04+ (and other major Linux distributions)
- **Minimum System Requirements:**
  - CPU: 2.0 GHz dual-core processor
  - RAM: 4GB (8GB recommended)
  - Storage: 2GB for application, plus space for media library
  - Graphics: DirectX 11 / OpenGL 4.0 compatible
  - Display: 1366x768 minimum resolution
- **Recommended System Requirements:**
  - CPU: 3.0 GHz quad-core processor
  - RAM: 16GB
  - Storage: SSD with 10GB+ free space
  - Graphics: Dedicated GPU with 2GB+ VRAM
  - Display: 1920x1080 or higher resolution
- **Multiple Display Support:** System must handle presentation output to secondary displays/projectors

### 2.5 Design and Implementation Constraints
- Application will be built using Electron framework
- Must maintain reasonable performance on minimum system requirements
- Must handle unreliable internet connections by caching necessary resources
- Database design must accommodate efficient scripture and song searches
- User interface must be accessible and support appropriate keyboard shortcuts
- Must implement proper error handling for live presentation environments

### 2.6 User Documentation
The following documentation SHALL be provided:
- Installation guide
- Quick start guide
- Comprehensive user manual
- Video tutorials for common tasks
- Context-sensitive help system within the application
- Keyboard shortcut reference

### 2.7 Assumptions and Dependencies
- **Assumptions:**
  - Users have basic knowledge of church service structure and presentation needs
  - System will primarily operate on Windows computers in church environments
  - Majority of users will have persistent internet access for initial setup
  
- **Dependencies:**
  - Bible API for scripture content (with offline fallback)
  - FFmpeg for video processing
  - Electron framework and associated dependencies
  - SQLite for local database storage

## 3. System Features

### 3.1 Presentation Management

#### 3.1.1 Slide Editor
1. The system SHALL provide a WYSIWYG slide editor
2. The editor SHALL support:
   - Text formatting (font, size, color, alignment, spacing)
   - Text effects (shadow, outline, gradient)
   - Image placement and resizing
   - Shape creation and manipulation
   - Background selection (solid color, gradient, image, video)
3. The system SHALL provide undo/redo functionality
4. The system SHALL auto-save slide edits
5. The system SHALL support master slides/templates
6. The system SHALL provide snap-to-grid and alignment tools

#### 3.1.2 Template System
1. The system SHALL provide pre-designed templates for common presentation needs
2. Users SHALL be able to create and save custom templates
3. Templates SHALL include:
   - Master slide designs
   - Text formatting presets
   - Background options
   - Transition settings
4. The system SHALL allow template categories for organization
5. The system SHALL allow importing and exporting templates

#### 3.1.3 Presentation Organization
1. The system SHALL allow users to organize slides into presentations
2. The system SHALL provide drag-and-drop reordering of slides
3. The system SHALL allow grouping slides into sections
4. The system SHALL provide presentation preview functionality
5. The system SHALL allow saving presentations as reusable files
6. The system SHALL maintain presentation version history

### 3.2 Scripture Management

#### 3.2.1 Bible Database
1. The system SHALL include multiple Bible translations
2. The system SHALL allow adding/removing translations
3. The system SHALL support downloading translations for offline use
4. The system SHALL maintain proper verse formatting (poetry, paragraphs, etc.)
5. The system SHALL display verse numbers and chapter headings
6. The system SHALL handle book names in multiple languages
7. The system SHALL support canonical and deuterocanonical books

#### 3.2.2 Scripture Search
1. The system SHALL provide search by reference (e.g., "John 3:16")
2. The system SHALL provide keyword search across verses
3. The system SHALL provide topic-based search functionality
   - Topics SHALL be categorized hierarchically
   - Topics SHALL be linked to relevant verses
   - Users SHALL be able to add custom topic-verse connections
4. The system SHALL provide fuzzy matching for references
5. The system SHALL search across multiple translations if specified
6. The system SHALL display search results in context
7. The system SHALL allow sorting search results by relevance or biblical order

#### 3.2.3 Scripture Display
1. The system SHALL format scripture for optimal readability on projection
2. The system SHALL allow customization of scripture display:
   - Font style and size
   - Verse number display
   - Reference display location
   - Translation indication
3. The system SHALL allow highlighting specific words or phrases
4. The system SHALL support parallel translation display
5. The system SHALL support displaying multiple verses together
6. The system SHALL allow adding annotations to scriptures
7. The system SHALL automatically split long passages across multiple slides

### 3.3 Song Management

#### 3.3.1 Song Database
1. The system SHALL maintain a database of song lyrics
2. Each song SHALL include:
   - Title
   - Author/Artist
   - Lyrics (with verse/chorus structure)
   - Optional chords
   - CCLI number (if applicable)
   - Tags/categories
   - Date added
3. The system SHALL support importing songs from text files and common formats (CCLI SongSelect, OpenLyrics)
4. The system SHALL support exporting songs
5. The system SHALL provide song search by title, lyrics, author, or tags
6. The system SHALL track song usage history

#### 3.3.2 Song Editor
1. The system SHALL provide a song editor interface
2. The editor SHALL support:
   - Verse/chorus/bridge marking
   - Chord placement
   - Formatting options
   - Key transposition
3. The system SHALL validate song structure
4. The system SHALL provide preview of song as it will appear in presentation

#### 3.3.3 Song Presentation
1. The system SHALL automatically format songs for projection
2. The system SHALL provide options for displaying:
   - Current verse/chorus only
   - Next verse/chorus preview
   - Chords with lyrics
   - Copyright information
3. The system SHALL allow customizing song appearance
4. The system SHALL support multiple arrangement orders of verses/choruses
5. The system SHALL track CCLI reporting information

### 3.4 Media Management

#### 3.4.1 Media Library
1. The system SHALL provide a centralized media library for:
   - Images
   - Videos
   - Audio files
2. The system SHALL support common media formats:
   - Images: JPG, PNG, BMP, GIF
   - Video: MP4, MOV, AVI, WMV
   - Audio: MP3, WAV, AAC, OGG
3. The system SHALL allow organizing media into folders
4. The system SHALL support tagging and searching media
5. The system SHALL display media previews
6. The system SHALL extract and display metadata from media files

#### 3.4.2 Background Management
1. The system SHALL provide a collection of slide backgrounds
2. The system SHALL support:
   - Static image backgrounds
   - Video backgrounds
   - Motion backgrounds
   - Solid colors and gradients
3. The system SHALL allow organizing backgrounds by category
4. The system SHALL support importing backgrounds from files
5. The system SHALL provide preview of backgrounds
6. The system SHALL allow applying backgrounds to individual slides or templates

#### 3.4.3 Media Playback
1. The system SHALL support:
   - Video playback with controls
   - Audio playback with controls
   - Image slideshows
2. The system SHALL provide playback options:
   - Loop video/audio
   - Auto-advance slideshows
   - Playback speed control
3. The system SHALL support trimming media files
4. The system SHALL handle common codecs without requiring additional software
5. The system SHALL support fading between media elements

### 3.5 Live Presentation Mode

#### 3.5.1 Dual-Screen Interface
1. The system SHALL provide a presenter view and an audience view
2. Presenter view SHALL include:
   - Current slide
   - Next slide preview
   - Notes
   - Timer/clock
   - Service plan navigation
3. Audience view SHALL display only the current presentation content
4. The system SHALL support independent resolution settings for each view
5. The system SHALL allow configuration of which display is used for each view

#### 3.5.2 Live Controls
1. The system SHALL provide controls for:
   - Advancing/navigating slides
   - Quick access to service elements
   - Black/blank screen
   - Volume control
   - Emergency notices
2. The system SHALL support keyboard shortcuts for all controls
3. The system SHALL provide on-screen control panel
4. The system SHALL support remote control via mobile devices
5. The system SHALL provide stage display option for performers/speakers

#### 3.5.3 Transitions and Effects
1. The system SHALL support transitions between slides:
   - Fade
   - Cut
   - Dissolve
   - Slide (directional)
   - Custom transitions
2. The system SHALL allow default transition settings
3. The system SHALL allow per-slide transition settings
4. The system SHALL provide text animation options
5. The system SHALL ensure smooth playback during transitions

#### 3.5.4 Live Editing
1. The system SHALL allow on-the-fly editing during presentation
2. The system SHALL support:
   - Text corrections
   - Slide reordering
   - Adding new slides
   - Adjusting media properties
3. Changes SHALL be applied without interrupting presentation
4. The system SHALL maintain presentation state during edits
5. The system SHALL provide quick access to common editing tasks

### 3.6 Service Planning

#### 3.6.1 Service Schedule
1. The system SHALL allow creation of service plans
2. Service plans SHALL include:
   - Date and time
   - Service name/type
   - Ordered list of elements (songs, scriptures, media, etc.)
   - Notes for each element
   - Personnel assignments
3. The system SHALL provide calendar view of services
4. The system SHALL support recurring service templates
5. The system SHALL allow importing/exporting service plans

#### 3.6.2 Service Elements
1. The system SHALL support various service elements:
   - Songs
   - Scripture readings
   - Sermon slides
   - Announcements
   - Videos
   - Custom slides
2. Each element SHALL include duration estimate
3. Each element SHALL allow notes for operators/leaders
4. The system SHALL allow reordering elements
5. The system SHALL support nested elements (e.g., sermon with multiple scripture references)

#### 3.6.3 Planning Tools
1. The system SHALL provide drag-and-drop planning interface
2. The system SHALL support planning templates for common service structures
3. The system SHALL provide search across all content for planning
4. The system SHALL track total estimated service duration
5. The system SHALL allow collaborative planning features
6. The system SHALL provide printable order of service

### 3.7 Settings and Configuration

#### 3.7.1 Application Settings
1. The system SHALL provide user-configurable settings:
   - Display preferences
   - Default paths
   - Backup settings
   - Performance options
2. Settings SHALL be saved between sessions
3. The system SHALL provide import/export of settings
4. The system SHALL provide reset to defaults option
5. The system SHALL validate settings values

#### 3.7.2 User Profiles
1. The system SHALL support multiple user profiles
2. Each profile SHALL maintain separate:
   - UI preferences
   - Shortcuts
   - Recent items
   - Workspace layouts
3. The system SHALL allow profile switching
4. The system SHALL support profile backup/restore
5. The system SHALL provide admin and operator level profiles

#### 3.7.3 Display Configuration
1. The system SHALL detect available displays
2. The system SHALL allow assigning roles to displays:
   - Main output
   - Confidence monitor
   - Stage display
3. The system SHALL support various output resolutions
4. The system SHALL allow custom output area definition
5. The system SHALL handle display disconnection gracefully

### 3.8 Data Management

#### 3.8.1 Backup and Restore
1. The system SHALL provide automated backup functionality
2. The system SHALL allow configuration of backup:
   - Frequency
   - Location
   - Content included
3. The system SHALL provide restore from backup functionality
4. The system SHALL maintain backup history
5. The system SHALL perform integrity check on backups

#### 3.8.2 Import/Export
1. The system SHALL support importing:
   - Songs from CCLI SongSelect
   - PowerPoint presentations
   - Media files
   - Data from compatible presentation software
2. The system SHALL support exporting:
   - Service plans
   - Presentations
   - Song lists
   - Media content
3. The system SHALL validate imported content
4. The system SHALL maintain original source information
5. The system SHALL report import/export errors

#### 3.8.3 Content Management
1. The system SHALL track:
   - Content usage statistics
   - Last used dates
   - Creation/modification dates
2. The system SHALL provide content organization tools
3. The system SHALL support archiving unused content
4. The system SHALL detect duplicate content
5. The system SHALL validate content integrity

## 4. External Interface Requirements

### 4.1 User Interfaces

#### 4.1.1 Main Application Window
1. The UI SHALL provide:
   - Main workspace area
   - Navigation sidebar
   - Toolbar for common actions
   - Status bar
2. The UI SHALL support theme customization
3. The UI SHALL provide resizable panes
4. The UI SHALL remember window positions and sizes
5. The UI SHALL support fullscreen mode

#### 4.1.2 Editor Interfaces
1. The system SHALL provide specialized editors for:
   - Slides
   - Songs
   - Scripture selection
   - Service planning
2. Editors SHALL have consistent design patterns
3. Editors SHALL provide context-sensitive tools
4. Editors SHALL validate user input
5. Editors SHALL provide undo/redo functionality

#### 4.1.3 Live Presentation Interface
1. The system SHALL provide:
   - Presenter view with control panel
   - Audience output view
   - Quick access toolbar
2. The interface SHALL be optimized for use during live services
3. The interface SHALL provide high visibility of current status
4. The interface SHALL minimize risk of operational errors
5. The interface SHALL support keyboard navigation

#### 4.1.4 Mobile Companion Interface
1. The system SHALL provide a mobile interface for:
   - Remote control
   - Service plan viewing
   - Basic content editing
2. The mobile interface SHALL be responsive to different screen sizes
3. The mobile interface SHALL maintain core functionality
4. The mobile interface SHALL sync with main application
5. The mobile interface SHALL work over local network

### 4.2 Hardware Interfaces

#### 4.2.1 Display Outputs
1. The system SHALL support:
   - Multiple monitors
   - Projectors
   - External displays
2. The system SHALL detect available display outputs
3. The system SHALL handle different resolutions and aspect ratios
4. The system SHALL support extended and duplicate display modes
5. The system SHALL recover gracefully from display changes

#### 4.2.2 Input Devices
1. The system SHALL support:
   - Keyboard and mouse
   - Touchscreens
   - Presentation remotes
   - MIDI controllers
2. The system SHALL allow mapping controls to various input devices
3. The system SHALL detect connected input devices
4. The system SHALL provide fallback control options
5. The system SHALL handle input device failures gracefully

#### 4.2.3 Audio Interfaces
1. The system SHALL support:
   - System audio output
   - Multiple audio devices
   - Audio monitoring
2. The system SHALL detect available audio devices
3. The system SHALL allow routing different audio to different outputs
4. The system SHALL provide basic volume control
5. The system SHALL handle audio device changes gracefully

### 4.3 Software Interfaces

#### 4.3.1 Operating System Integration
1. The system SHALL integrate with:
   - File system for content storage
   - System display management
   - Audio subsystem
   - Local network capabilities
2. The system SHALL follow OS-specific user interface guidelines
3. The system SHALL handle OS events appropriately
4. The system SHALL respect system settings where appropriate
5. The system SHALL support OS-specific features where beneficial

#### 4.3.2 External APIs
1. The system SHALL interface with:
   - Bible API for scripture content
   - CCLI SongSelect for song import
   - Cloud storage services for backup
2. API interactions SHALL handle authentication securely
3. API interactions SHALL handle network failures gracefully
4. API interactions SHALL cache data for offline use
5. API interactions SHALL respect rate limits and service terms

#### 4.3.3 File Format Support
1. The system SHALL support:
   - Common image formats (JPG, PNG, BMP, GIF)
   - Common video formats (MP4, MOV, AVI, WMV)
   - Common audio formats (MP3, WAV, AAC, OGG)
   - PowerPoint import
   - PDF import
2. The system SHALL validate file integrity on import
3. The system SHALL provide format conversion where needed
4. The system SHALL handle corrupt files gracefully
5. The system SHALL respect file format specifications

### 4.4 Communications Interfaces

#### 4.4.1 Network Communications
1. The system SHALL support:
   - Local network for remote control
   - Internet for content updates
   - Cloud services for backup
2. Communications SHALL use secure protocols where appropriate
3. Communications SHALL handle network interruptions gracefully
4. Communications SHALL respect bandwidth limitations
5. Communications SHALL provide status feedback

#### 4.4.2 Remote Control Protocol
1. The system SHALL implement remote control over:
   - WebSocket for real-time communication
   - HTTP API for command and control
2. Remote protocol SHALL support authentication
3. Remote protocol SHALL be documented for third-party integration
4. Remote protocol SHALL handle multiple simultaneous connections
5. Remote protocol SHALL provide connection status feedback

## 5. Non-Functional Requirements

### 5.1 Performance Requirements
1. The system SHALL start up in less than 10 seconds on recommended hardware
2. The system SHALL respond to user input within 100ms
3. The system SHALL render transitions at minimum 30fps
4. The system SHALL support presentations with 1000+ slides
5. The system SHALL handle media libraries with 10,000+ items
6. The system SHALL optimize memory usage for extended operation
7. The system SHALL perform slide transitions in less than 500ms
8. The system SHALL maintain performance stability during long services

### 5.2 Safety Requirements
1. The system SHALL protect user data with automatic backups
2. The system SHALL prevent data loss during unexpected shutdowns
3. The system SHALL verify file integrity before presentation
4. The system SHALL provide emergency recovery options
5. The system SHALL maintain logs for troubleshooting

### 5.3 Security Requirements
1. The system SHALL encrypt sensitive data (credentials, license keys)
2. The system SHALL implement secure authentication for remote access
3. The system SHALL validate all external data sources
4. The system SHALL respect file system permissions
5. The system SHALL implement secure update mechanisms

### 5.4 Software Quality Attributes

#### 5.4.1 Reliability
1. The system SHALL operate continuously for 8+ hours without degradation
2. The system SHALL recover from crashes preserving user data
3. The system SHALL handle resource constraints gracefully
4. The system SHALL implement watchdog functionality for critical components
5. The system SHALL provide detailed error reporting

#### 5.4.2 Availability
1. The system SHALL be available for immediate use when launched
2. The system SHALL provide offline functionality for core features
3. The system SHALL handle peripheral disconnections without crashing
4. The system SHALL provide fallback modes for component failures
5. The system SHALL maintain service during updates

#### 5.4.3 Usability
1. The system SHALL provide intuitive interfaces for common tasks
2. The system SHALL follow consistent design patterns
3. The system SHALL provide helpful error messages
4. The system SHALL implement progressive disclosure of advanced features
5. The system SHALL support accessibility features
6. The system SHALL provide context-sensitive help

#### 5.4.4 Maintainability
1. The system SHALL implement modular architecture
2. The system SHALL provide diagnostic tools
3. The system SHALL log significant events
4. The system SHALL allow component updates independently
5. The system SHALL implement clean separation of concerns

#### 5.4.5 Portability
1. The system SHALL run on Windows, macOS, and Linux
2. The system SHALL adapt to different screen resolutions
3. The system SHALL support various input methods
4. The system SHALL adapt to different system capabilities
5. The system SHALL minimize OS-specific dependencies

### 5.5 Business Rules
1. The system SHALL track CCLI reporting requirements
2. The system SHALL respect copyright constraints on content
3. The system SHALL maintain audit trails for licensing compliance
4. The system SHALL support organizational workflows
5. The system SHALL maintain separation between user accounts

## 6. Technical Architecture

### 6.1 Technology Stack
1. The system SHALL be built using:
   - Electron framework for cross-platform desktop application
   - Node.js for backend processes
   - Chromium for rendering UI
   - HTML5/CSS3/JavaScript for UI implementation
   - React for component-based UI development
   - SQLite for local database
   - FFmpeg for media processing
2. Development SHALL follow:
   - TypeScript for type safety
   - Jest for unit testing
   - Electron Builder for packaging
   - ESLint for code quality
   - Git for version control

### 6.2 Database Design
1. The system SHALL implement databases for:
   - Bible content (books, chapters, verses, translations)
   - Songs (lyrics, metadata, usage)
   - Media (paths, metadata, tags)
   - Presentations (structure, content, history)
   - Service plans (schedule, elements, notes)
   - Settings and configuration
2. Database SHALL implement:
   - Efficient indexing for search performance
   - Data integrity constraints
   - Transaction support
   - Backup and recovery mechanisms
   - Schema migration support

### 6.3 System Architecture

#### 6.3.1 Component Architecture
1. The system SHALL implement these major components:
   - Core Application Framework
   - Presentation Engine
   - Content Management System
   - Media Processing Subsystem
   - Data Storage Layer
   - User Interface Layer
   - Remote Control Service
2. Components SHALL communicate via defined interfaces
3. Components SHALL be loosely coupled for maintainability
4. Components SHALL handle failure states gracefully
5. Components SHALL be individually testable

#### 6.3.2 Process Architecture
1. The system SHALL implement these processes:
   - Main application process
   - Renderer process for UI
   - Background workers for intensive tasks
   - Media processing workers
   - Data synchronization service
2. Processes SHALL communicate via IPC
3. Processes SHALL handle termination gracefully
4. Processes SHALL respect system resource constraints
5. Processes SHALL implement proper error handling

#### 6.3.3 Deployment Architecture
1. The system SHALL be deployable as:
   - Standalone installer
   - Portable application
   - Auto-updating application
2. Deployment SHALL include:
   - Application binaries
   - Runtime dependencies
   - Default content
   - Documentation
3. Deployment SHALL support silent installation
4. Deployment SHALL verify system requirements
5. Deployment SHALL respect OS security constraints

## 7. Development Roadmap

### 7.1 Phase 1: MVP
1. Core application framework
2. Basic presentation engine
3. Scripture database and search
4. Basic song management
5. Simple media handling
6. Essential live presentation controls
7. Core UI implementation
8. Basic data management
9. Single-user operation

### 7.2 Phase 2: Enhanced Features
1. Advanced scripture search capabilities
2. Enhanced media management
3. Expanded template system
4. Service planning tools
5. Advanced presentation transitions
6. User profiles
7. Remote control capability
8. Import/export functionality
9. Multi-display support

### 7.3 Phase 3: Advanced Features
1. Cloud synchronization
2. Mobile companion app
3. Collaborative editing
4. Advanced media effects
5. Performance optimizations
6. API for third-party extensions
7. Advanced user permissions
8. Analytics and reporting
9. Integration with church management systems

## 8. Appendices

### Appendix A: Glossary
- **CCLI**: Christian Copyright Licensing International
- **Confidence Monitor**: A display visible to presenters showing current and upcoming content
- **EasyWorship**: A reference church presentation software
- **IPC**: Inter-Process Communication
- **WYSIWYG**: "What You See Is What You Get" editing interface

### Appendix B: Analysis Models
- UI Wireframes (to be developed)
- Database Schema Diagrams (to be developed)
- Use Case Diagrams (to be developed)
- Component Interaction Diagrams (to be developed)

### Appendix C: Issues List
- Performance considerations for video backgrounds
- Bible API selection and offline capabilities
- Remote control security considerations
- CCLI reporting integration details
- Cross-platform testing strategy


# Set up the database (one-time setup)
npm run db:setup

# View database in Prisma Studio
npm run db:studio

# Generate Prisma client after schema changes
npm run db:generate