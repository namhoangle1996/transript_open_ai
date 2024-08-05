# YouTube Transcript & Summary Extension

This Chrome extension extracts YouTube video transcripts and generates summaries using AI language models. It also provides translation features and custom prompt options for interacting with the AI.

## Features

- Extract transcripts from YouTube videos
- Translate transcripts to other languages
- Generate summaries using ChatGPT or other AI models
- Customizable prompts for AI interaction
- Real-time transcript and translation display during video playback
- Options page for customizing follow-up prompts

## Installation

1. Clone this repository or download the source code.
2. Run `npm install` to install the dependencies.
3. Build the extension using `npm run build` (you may need to create this script in package.json).
4. Open Chrome and go to `chrome://extensions/`.
5. Enable "Developer mode" in the top right corner.
6. Click "Load unpacked" and select the `dist` folder created by the build process.

## Usage

1. Navigate to a YouTube video.
2. Click the "Extract Transcription" button that appears below the video.
3. The extension will open a new tab with the AI model (e.g., ChatGPT) and inject the transcript.
4. Interact with the AI to get summaries or ask questions about the video content.

## Configuration

You can customize the extension's behavior through the options page:

1. Right-click the extension icon in Chrome.
2. Select "Options" from the menu.
3. Customize the prompt for summaries and set up to 10 follow-up prompts.

## Development

This project uses TypeScript and Webpack for building the extension. The main components are:

- `src/index.ts`: Entry point for content scripts
- `src/background.ts`: Background script for handling messages and API calls
- `src/youtube.ts`: YouTube-specific functionality
- `src/chatgpt.ts`: ChatGPT integration
- `src/options.ts`: Options page functionality

To make changes:

1. Modify the source files in the `src` directory.
2. Run `npm run build` to compile and bundle the extension.
3. Reload the extension in Chrome to see your changes.

## Dependencies

- jQuery
- Google Translate API (via google-translate-api-x)
- Webpack for bundling
- TypeScript for type-checking and compilation
