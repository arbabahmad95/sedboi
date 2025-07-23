<!-- @format -->

# 🌧️ Atmospheric Audio

Transform YouTube videos into atmospheric soundscapes with slowed audio, massive reverb, and rain effects.

## Features

✨ **YouTube Audio Extraction** - Paste any YouTube URL to extract audio  
🐌 **Speed Control** - Slow down audio from 0.25x to 2.0x speed  
🏛️ **Massive Reverb** - Add cathedral-like reverb effects  
🌧️ **Rain Effects** - Synthetic rain sounds to create atmosphere  
🔊 **Volume Control** - Master volume with smooth transitions  
🎛️ **Presets** - Quick settings for different moods (Chill, Study, Sleep, Dramatic)  
🎨 **Beautiful UI** - Modern dark theme with smooth animations  
📱 **Responsive** - Works on desktop and mobile devices

## Prerequisites

Before running this application, you need to install:

1. **Node.js** (v14 or higher)
2. **yt-dlp** - For YouTube audio extraction

   ```bash
   # Install yt-dlp using pip
   pip install yt-dlp

   # Or using brew on macOS
   brew install yt-dlp

   # Or download from: https://github.com/yt-dlp/yt-dlp
   ```

## Installation

1. **Clone or download this project**

   ```bash
   git clone <repository-url>
   cd atmospheric-audio
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Verify yt-dlp installation**
   ```bash
   yt-dlp --version
   ```

## Usage

1. **Start the server**

   ```bash
   npm start
   ```

   For development with auto-reload:

   ```bash
   npm run dev
   ```

2. **Open your browser**
   Navigate to `http://localhost:3000`

3. **Use the application**
   - Paste a YouTube URL in the input field
   - Click "Load Audio" and wait for extraction
   - Adjust effects using the sliders:
     - **Speed**: Control playback rate
     - **Reverb**: Add atmospheric reverb
     - **Rain**: Mix in rain sounds
     - **Volume**: Master volume control
   - Try the preset buttons for quick configurations

## How It Works

### Backend (server.js)

- **Express server** serves the frontend and handles API requests
- **YouTube audio extraction** using yt-dlp command-line tool
- **Audio file serving** with proper headers for streaming
- **Temporary file management** for downloaded audio

### Frontend

- **Modern UI** with CSS Grid, Flexbox, and smooth animations
- **Web Audio API** for real-time audio processing:
  - **MediaElementSourceNode** for audio input
  - **ConvolverNode** for reverb effects
  - **GainNodes** for volume control and mixing
  - **BufferSourceNode** for rain sound generation
- **Responsive design** that works on all devices

### Audio Effects

- **Speed + Pitch Control**: Changes both speed and pitch together (like vinyl records) - slow = low pitch, fast = high pitch
- **Reverb**: Synthetic impulse response with ConvolverNode for cathedral-like atmospherics
- **Real Rain**: High-quality rain.mp3 file with realistic rain sounds (fallback to synthetic if unavailable)
- **Real-time Processing**: All effects applied in real-time with smooth transitions
- **Responsive Controls**: All sliders respond instantly with smooth transitions

## Presets

- **Chill Vibes**: Slightly slowed with moderate reverb and light rain
- **Study Mode**: Slower pace with medium reverb and ambient rain
- **Sleep Sounds**: Very slow with heavy reverb and strong rain
- **Dramatic**: Ultra-slow with massive reverb and storm-like rain
- **Reset**: Return to original settings

## Technical Details

### Browser Compatibility

- **Modern browsers** with Web Audio API support
- **Chrome, Firefox, Safari, Edge** (latest versions)
- **Mobile browsers** supported

### Audio Processing Chain

```
YouTube URL → yt-dlp → MP3 File → HTML5 Audio → Web Audio API → Speakers
                                       ↓
                         [Speed Control] → [Reverb] → [Real Rain Mix] → [Master Volume]
```

### File Structure

```
atmospheric-audio/
├── server.js              # Express server
├── package.json           # Dependencies
├── public/                # Frontend files
│   ├── index.html         # Main page
│   ├── styles.css         # Modern CSS styling
│   ├── app.js             # Main application logic
│   └── audio-effects.js   # Web Audio API processing
├── temp/                  # Temporary audio files (auto-created)
└── README.md              # This file
```

## Troubleshooting

### "yt-dlp not found" error

- Make sure yt-dlp is installed and available in your PATH
- Try: `which yt-dlp` (macOS/Linux) or `where yt-dlp` (Windows)

### Audio not loading

- Check if the YouTube URL is valid and accessible
- Some videos may be restricted or unavailable
- Check browser console for error messages

### Effects not working

- Modern browser required with Web Audio API support
- Click play on the audio player to activate audio context
- Check browser permissions for audio

### Performance issues

- Large audio files may take time to process
- Close other browser tabs using audio
- Check system resources (CPU/RAM)

## Limitations

- **YouTube Terms of Service**: This tool is for educational/personal use
- **Audio Quality**: Limited by YouTube's audio quality
- **File Size**: Large videos may take longer to process
- **Browser Limits**: Some browsers limit audio processing capabilities

## Contributing

Feel free to contribute improvements:

- Better reverb algorithms
- Additional audio effects
- UI/UX enhancements
- Performance optimizations

## License

MIT License - Feel free to use and modify for your projects.

---

**Enjoy creating atmospheric soundscapes! 🎵✨**
