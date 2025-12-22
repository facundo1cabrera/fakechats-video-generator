# FakeChats Video Generator

A production-ready Node.js tool that automates creating short-form videos by compositing "chat screenshots" on top of a background video.

## Features

- 🎬 **Automated Screenshot Generation**: Uses Playwright to render HTML/CSS chat UI into transparent PNG screenshots
- 🎥 **Video Compositing**: Uses FFmpeg to overlay chat screenshots onto background videos with precise timing
- 📱 **iMessage-like Styling**: Beautiful chat bubbles with iOS-inspired design
- ⚡ **CLI Interface**: Simple commands for initialization, validation, and rendering
- 🎯 **TypeScript**: Fully typed for better developer experience

## Installation

```bash
npm install
npm run build
```

Or use directly with `tsx`:
```bash
npm install -g tsx
tsx src/cli.ts <command>
```

## Prerequisites

- **Node.js** 18+ 
- **FFmpeg** - Install via:
  - macOS: `brew install ffmpeg`
  - Linux: `sudo apt-get install ffmpeg` (or your package manager)
- **Playwright browsers** - Will be installed automatically on first run

## Usage

### Initialize a New Project

```bash
chatvid init my-project
```

This creates:
- `project.json` - Your project configuration
- `assets/` - Directory for background videos
- `out/` - Output directory (gitignored)

### Validate Project

```bash
chatvid validate project.json
```

Checks:
- Project schema validity
- File path existence
- FFmpeg availability
- Playwright availability

### Generate Screenshots Only

```bash
chatvid screenshots project.json
```

Generates transparent PNG screenshots to `out/chat/chat-<index>.png`

### Render Complete Video

```bash
chatvid render project.json
```

This will:
1. Generate missing screenshots automatically
2. Composite screenshots over background video
3. Output final MP4 to the specified path

## Project JSON Format

```json
{
  "bgVideo": "assets/bg.mp4",
  "output": "out/final.mp4",
  "fps": 30,
  "resolution": { "w": 1080, "h": 1920 },
  "chat": {
    "theme": "ios",
    "participants": [
      { "id": "me", "name": "Me" },
      { "id": "her", "name": "Her" }
    ],
    "messages": [
      { "from": "her", "text": "Qué significa ese tatuaje?" },
      { "from": "me", "text": "El tatuaje no... pero la modelo sí 😌" }
    ]
  },
  "overlays": [
    {
      "messageIndex": 0,
      "start": 0.5,
      "end": 2.5,
      "x": 80,
      "y": 980,
      "w": 920
    },
    {
      "messageIndex": 1,
      "start": 2.5,
      "end": 5.0,
      "x": 80,
      "y": 980,
      "w": 920
    }
  ]
}
```

### Field Descriptions

- **bgVideo**: Path to background video file
- **output**: Path for final rendered video
- **fps**: Frame rate (default: 30)
- **resolution**: Target video resolution (w × h)
- **chat.theme**: Chat theme (currently only "ios" supported)
- **chat.participants**: Array of chat participants with id and name
- **chat.messages**: Array of messages with `from` (participant id) and `text`
- **overlays**: Array of overlay configurations:
  - **messageIndex**: Which message index to show (0-based, inclusive - shows all messages up to this index)
  - **start**: Start time in seconds
  - **end**: End time in seconds
  - **x**: X position in pixels
  - **y**: Y position in pixels
  - **w**: Width in pixels (height maintains aspect ratio)

## How It Works

### Step A: Screenshot Generation

1. Reads the project JSON and extracts chat configuration
2. For each unique `messageIndex` in overlays, generates a screenshot showing all messages from 0 to that index
3. Uses Playwright to render an HTML template with injected chat data
4. Takes transparent PNG screenshots of the chat container
5. Saves to `out/chat/chat-<index>.png`

### Step B: Video Rendering

1. Loads background video and all overlay screenshots
2. Builds an FFmpeg `filter_complex` chain:
   - Scales and pads background video to target resolution
   - For each overlay: scales image to target width, then overlays with time-based enable
3. Renders final video with:
   - Codec: libx264
   - Pixel format: yuv420p
   - CRF: 18 (high quality)
   - Preset: veryfast
   - Preserves audio from background video if present

## Technical Details

- **Screenshot Rendering**: Playwright with transparent background (`omitBackground: true`)
- **Video Processing**: FFmpeg with `filter_complex` for complex overlay chains
- **Time-based Overlays**: Uses `enable='between(t,start,end)'` for precise timing
- **Aspect Ratio**: Overlays maintain aspect ratio when scaled to target width

## Project Structure

```
.
├── src/
│   ├── cli.ts                 # CLI entry point
│   ├── projectSchema.ts       # TypeScript types and validation
│   ├── chat/
│   │   ├── template.ts        # HTML template for chat UI (embedded)
│   │   └── renderScreenshots.ts
│   ├── video/
│   │   └── renderVideo.ts
│   └── utils/
│       ├── exec.ts            # Command execution utilities
│       └── paths.ts           # Path resolution utilities
├── examples/
│   └── project.example.json
├── assets/                    # Place background videos here
├── out/                       # Output directory (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

## Development

```bash
# Build TypeScript
npm run build

# Run CLI directly with tsx
npm run dev <command>

# Or use built version
npm start <command>
```

## License

MIT

