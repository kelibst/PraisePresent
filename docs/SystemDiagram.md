# PraisePresent System Architecture

```mermaid
graph TB
    %% Main Application Components
    subgraph Application[PraisePresent Application]
        MainMenu[Main Menu]
        
        %% Content Management
        subgraph ContentManagement[Content Management]
            Presentations[Presentations]
            ServicePlans[Service Plans]
            MediaLibrary[Media Library]
            SongDatabase[Song Database]
            ScriptureDatabase[Scripture Database]
        end
        
        %% Live Presentation
        subgraph LivePresentation[Live Presentation]
            PresenterView[Presenter View]
            AudienceView[Audience View]
            Controls[Presentation Controls]
        end
        
        %% Settings & Configuration
        subgraph Settings[Settings & Configuration]
            DisplayConfig[Display Settings]
            UserProfiles[User Profiles]
            BackupSystem[Backup System]
        end
    end
    
    %% External Services
    subgraph ExternalServices[External Services]
        CCLI[CCLI API]
        BibleAPI[Bible API]
        CloudStorage[Cloud Storage]
    end
    
    %% Main Menu Connections
    MainMenu --> ContentManagement
    MainMenu --> LivePresentation
    MainMenu --> Settings
    
    %% Content Management Connections
    Presentations --> MediaLibrary
    Presentations --> SongDatabase
    Presentations --> ScriptureDatabase
    ServicePlans --> Presentations
    ServicePlans --> SongDatabase
    ServicePlans --> ScriptureDatabase
    
    %% Live Presentation Connections
    PresenterView --> Controls
    Controls --> AudienceView
    PresenterView --> ServicePlans
    PresenterView --> Presentations
    
    %% External Service Connections
    SongDatabase --> CCLI
    ScriptureDatabase --> BibleAPI
    BackupSystem --> CloudStorage
    
    %% Style Definitions
    classDef main fill:#f9f,stroke:#333,stroke-width:2px
    classDef content fill:#bbf,stroke:#333,stroke-width:2px
    classDef live fill:#ff9,stroke:#333,stroke-width:2px
    classDef settings fill:#9f9,stroke:#333,stroke-width:2px
    classDef external fill:#f99,stroke:#333,stroke-width:2px
    
    %% Apply Styles
    class MainMenu main
    class ContentManagement content
    class LivePresentation live
    class Settings settings
    class ExternalServices external
```

## System Components

### 1. Content Management
- **Presentations**: Create and manage presentation slides
- **Service Plans**: Plan and organize church services
- **Media Library**: Store and manage media files
- **Song Database**: Manage song lyrics and CCLI information
- **Scripture Database**: Access and manage scripture content

### 2. Live Presentation
- **Presenter View**: Control interface for presenters
- **Audience View**: Display for congregation
- **Controls**: Navigation and presentation tools

### 3. Settings & Configuration
- **Display Settings**: Configure multiple displays
- **User Profiles**: Manage user accounts
- **Backup System**: Data backup and restore

### 4. External Services
- **CCLI API**: Song licensing and reporting
- **Bible API**: Scripture content access
- **Cloud Storage**: Backup and sync services 