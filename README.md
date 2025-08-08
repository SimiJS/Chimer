# Chimer

<img width="847" height="540" alt="program" src="https://github.com/user-attachments/assets/d17d5039-f2a4-4e0d-b58d-b89ff02cd923" />
<br>
<br>
A simple soundboard with dual-output, that allows you to preview and download sounds from youtube.

## Features

- 🎵 **Audio Playback**: Play multiple audio formats (MP3, WAV, OGG)
- 🎛️ **Dual Output**: Support for main and auxiliary audio outputs
- ⌨️ **Global Hotkeys**: Assign keyboard shortcuts to sounds and actions
- 📁 **Sound Manag
ement**: Organize sounds into custom groups to reduce Ui clutter
- 💾 **Database System**: Save and load sound and group collections
- 🔄 **Drag & Drop**: Reorder sounds drag and drop
- 🌐 **YouTube Integration**: Download audio from YouTube videos
- 🎨 **Modern UI**: Uses Shadcn/ui components


## Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Setup

1. Download the Installer

2. Run the Installer

3. Enjoy

### Build

1. Clone the repository:

    ```bash
    git clone https://github.com/simijs/chimer.git
    cd chimer
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Set up environment variables:

    ```bash
    cp .env.example .env
    # Edit .env and add your Tenor API key
    ```

4. Start the development server:
    ```bash
    npm run dev
    ```

## Building

To build the application for your platform:

```bash
# Build for Windows
npm run build:win

# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux
```

## Technologies Used

- **Electron** - Cross-platform desktop app framework
- **React** - UI framework with hooks
- **TypeScript** - Type-safe JavaScript
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Reusable Ui Components
- **React Router** - Page router

## Contributing

This is my first open-source project! Contributions, issues, and pull requests are welcome.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built as a learning project. Ai help was used, but code was individually reviewed.
