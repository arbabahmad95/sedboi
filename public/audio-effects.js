/** @format */

class AudioEffectsProcessor {
  constructor() {
    this.audioContext = null;
    this.sourceNode = null;
    this.audioElement = null;
    this.convolver = null;
    this.reverbGain = null;
    this.dryGain = null;
    this.masterGain = null;
    this.rainSource = null;
    this.rainGain = null;
    this.rainBuffer = null;
    this.reverbBuffer = null;
    this.isRainPlaying = false;

    // For pitch-shifting speed control
    this.audioBuffer = null;
    this.bufferSource = null;
    this.currentPlaybackRate = 1.0;
    this.isUsingBufferSource = false;
    this.currentTime = 0;
    this.startedAt = 0;
    this.pausedAt = 0;

    this.initializeAudioContext().then(() => {
      // Delay reverb buffer creation to ensure audio context is ready
      setTimeout(() => {
        this.createReverbBuffer();
        this.loadRainFile();
      }, 100);
    });
  }

  async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      // Resume context if it's suspended (required by some browsers)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }

      console.log("Audio context initialized");
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
    }
  }

  async connectAudio(audioElement) {
    if (!this.audioContext) {
      await this.initializeAudioContext();
    }

    this.audioElement = audioElement;

    // Ensure reverb buffer is created and audio context is running
    await this.audioContext.resume();

    if (!this.reverbBuffer) {
      console.log("Creating reverb buffer...");
      this.createReverbBuffer();
    }

    // Load audio into buffer for pitch-shifting speed control
    await this.loadAudioBuffer(audioElement.src);

    // Create audio nodes
    this.convolver = this.audioContext.createConvolver();
    this.reverbGain = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();
    this.masterGain = this.audioContext.createGain();
    this.rainGain = this.audioContext.createGain();

    // Set up convolver with reverb impulse response
    if (this.reverbBuffer) {
      this.convolver.buffer = this.reverbBuffer;
      console.log("✅ Reverb buffer attached to convolver successfully");
    } else {
      console.error(
        "❌ Reverb buffer still not available! Creating fallback..."
      );
      // Create a simple fallback reverb buffer
      this.createSimpleFallbackReverb();
    }

    // Initially use the HTML5 audio element for normal playback
    this.isUsingBufferSource = false;
    this.sourceNode = this.audioContext.createMediaElementSource(audioElement);
    this.connectAudioGraph();

    // Set up event listeners for HTML5 audio controls
    this.setupAudioEventListeners();

    // Set initial values
    this.dryGain.gain.value = 1.0; // 100% dry signal
    this.reverbGain.gain.value = 0.0; // 0% reverb
    this.masterGain.gain.value = 0.7; // 70% master volume
    this.rainGain.gain.value = 0.0; // 0% rain

    console.log("🎵 Audio effects connected successfully", {
      reverbBuffer: !!this.reverbBuffer,
      convolverBuffer: !!this.convolver.buffer,
      audioContextState: this.audioContext.state,
    });
  }

  connectAudioGraph() {
    try {
      if (!this.sourceNode) {
        console.error("No source node available for connection");
        return;
      }

      // Don't disconnect here - should be done before calling this method
      // Connect the audio graph fresh
      console.log(
        `🔗 Connecting audio graph with source:`,
        this.isUsingBufferSource ? "BufferSource" : "HTML5 Audio"
      );

      // Dry signal path
      this.sourceNode.connect(this.dryGain);

      // Wet (reverb) signal path
      this.sourceNode.connect(this.convolver);
      this.convolver.connect(this.reverbGain);

      // Mix dry and wet signals
      this.dryGain.connect(this.masterGain);
      this.reverbGain.connect(this.masterGain);

      // Connect to destination
      this.masterGain.connect(this.audioContext.destination);

      console.log(
        `✅ Audio graph connected successfully (${
          this.isUsingBufferSource ? "BufferSource" : "HTML5 Audio"
        })`
      );
    } catch (error) {
      console.error("❌ Error connecting audio graph:", error);
    }
  }

  createReverbBuffer() {
    if (!this.audioContext) {
      console.error("Audio context not available for reverb buffer creation");
      return;
    }

    if (this.audioContext.state !== "running") {
      console.warn("Audio context not running, reverb buffer creation delayed");
      return;
    }

    try {
      // Create a simpler but effective reverb impulse response
      const length = this.audioContext.sampleRate * 2; // 2 seconds
      const buffer = this.audioContext.createBuffer(
        2,
        length,
        this.audioContext.sampleRate
      );

      for (let channel = 0; channel < 2; channel++) {
        const channelData = buffer.getChannelData(channel);

        for (let i = 0; i < length; i++) {
          // Create exponential decay with random noise
          const n = length - i;
          const decay = Math.pow(n / length, 2);
          const noise = (Math.random() * 2 - 1) * decay;

          // Add some early reflections
          const earlyReflection =
            i < length * 0.1 ? (Math.random() * 2 - 1) * decay * 0.5 : 0;

          // Combine and scale
          channelData[i] = (noise + earlyReflection) * 0.3;
        }
      }

      this.reverbBuffer = buffer;
      console.log("✅ Reverb buffer created successfully", {
        sampleRate: this.audioContext.sampleRate,
        length: length,
        duration: length / this.audioContext.sampleRate,
      });
    } catch (error) {
      console.error("❌ Error creating reverb buffer:", error);
    }
  }

  async loadAudioBuffer(url) {
    try {
      console.log("🎵 Loading audio buffer for pitch-shifting...");
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      console.log("✅ Audio buffer loaded successfully", {
        duration: this.audioBuffer.duration,
        sampleRate: this.audioBuffer.sampleRate,
        channels: this.audioBuffer.numberOfChannels,
      });
    } catch (error) {
      console.error("❌ Error loading audio buffer:", error);
    }
  }

  createSimpleFallbackReverb() {
    try {
      console.log("Creating simple fallback reverb...");
      const length = this.audioContext.sampleRate * 1; // 1 second
      const buffer = this.audioContext.createBuffer(
        2,
        length,
        this.audioContext.sampleRate
      );

      for (let channel = 0; channel < 2; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          const decay = 1 - i / length;
          channelData[i] = (Math.random() * 2 - 1) * decay * 0.2;
        }
      }

      this.reverbBuffer = buffer;
      if (this.convolver) {
        this.convolver.buffer = this.reverbBuffer;
      }
      console.log("✅ Fallback reverb buffer created");
    } catch (error) {
      console.error("❌ Failed to create fallback reverb:", error);
    }
  }

  async loadRainFile() {
    try {
      if (!this.audioContext) {
        await this.initializeAudioContext();
      }

      const response = await fetch("/rain.mp3");
      const arrayBuffer = await response.arrayBuffer();
      this.rainBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      console.log("Rain audio file loaded successfully");
    } catch (error) {
      console.error(
        "Error loading rain file, falling back to synthetic rain:",
        error
      );
      this.createSyntheticRain();
    }
  }

  createSyntheticRain() {
    if (!this.audioContext) return;

    // Fallback synthetic rain sound
    const length = this.audioContext.sampleRate * 10; // 10 seconds loop
    const buffer = this.audioContext.createBuffer(
      2,
      length,
      this.audioContext.sampleRate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Generate pink noise for rain effect
        let noise = 0;
        for (let j = 0; j < 8; j++) {
          noise += (Math.random() * 2 - 1) / Math.pow(2, j);
        }

        // Apply low-pass filtering for realistic rain sound
        const t = i / this.audioContext.sampleRate;
        const envelope = 0.5 + 0.3 * Math.sin(t * 0.5) * Math.random();
        channelData[i] = noise * envelope * 0.15;
      }
    }

    this.rainBuffer = buffer;
  }

  setPlaybackRate(rate) {
    this.currentPlaybackRate = rate;

    if (Math.abs(rate - 1.0) < 0.05) {
      // Use HTML5 audio for rates very close to normal (no pitch shift needed)
      this.switchToNormalPlayback();
      if (this.audioElement) {
        this.audioElement.playbackRate = rate;
        console.log(
          `📻 Normal playback rate set to: ${rate}x (no pitch shift)`
        );
      }
    } else {
      // Use buffer source for pitch-shifting speed control
      this.switchToBufferPlayback(rate);
      console.log(`🎶 Pitch-shifting playback rate set to: ${rate}x`);
    }
  }

  switchToBufferPlayback(rate) {
    if (!this.audioBuffer) {
      console.warn("Audio buffer not available for pitch-shifting");
      return;
    }

    // Get current playback time
    const currentTime = this.isUsingBufferSource
      ? this.getCurrentBufferTime()
      : this.audioElement
      ? this.audioElement.currentTime
      : 0;

    const wasPlaying = this.audioElement ? !this.audioElement.paused : false;

    // CRITICAL: Completely disconnect and stop all current sources
    this.disconnectAllSources();

    // Create new buffer source
    this.bufferSource = this.audioContext.createBufferSource();
    this.bufferSource.buffer = this.audioBuffer;
    this.bufferSource.playbackRate.value = rate;

    // Set this as the active source BEFORE connecting
    this.sourceNode = this.bufferSource;
    this.isUsingBufferSource = true;

    // Connect to audio graph
    this.connectAudioGraph();

    // Start from current position if was playing
    if (wasPlaying) {
      this.startedAt = this.audioContext.currentTime;
      this.pausedAt = 0;
      this.currentTime = currentTime;
      this.bufferSource.start(0, currentTime);
      console.log(
        `🎶 Buffer source started at ${currentTime.toFixed(2)}s (rate: ${rate})`
      );
    } else {
      this.currentTime = currentTime;
      console.log(
        `🎶 Buffer source ready at ${currentTime.toFixed(2)}s (paused)`
      );
    }
  }

  switchToNormalPlayback() {
    if (!this.isUsingBufferSource) {
      // Already using normal playback, just update rate
      if (this.audioElement) {
        this.audioElement.playbackRate = this.currentPlaybackRate;
      }
      return;
    }

    // Get current playback time from buffer source
    const currentTime = this.getCurrentBufferTime();
    const wasPlaying = this.bufferSource && this.startedAt && !this.pausedAt;

    // CRITICAL: Completely disconnect and stop all current sources
    this.disconnectAllSources();

    // Create new HTML5 audio source
    this.sourceNode = this.audioContext.createMediaElementSource(
      this.audioElement
    );
    this.isUsingBufferSource = false;

    // Connect to audio graph
    this.connectAudioGraph();

    // Sync time and playback state with HTML5 audio
    if (this.audioElement) {
      this.audioElement.currentTime = currentTime;
      this.audioElement.playbackRate = this.currentPlaybackRate;

      if (wasPlaying) {
        // Resume playback if it was playing
        this.audioElement
          .play()
          .catch((e) => console.warn("Auto-play prevented:", e));
      }
    }

    console.log(`📻 Switched to normal playback at ${currentTime.toFixed(2)}s`);
  }

  disconnectAllSources() {
    // Stop and disconnect buffer source
    if (this.bufferSource) {
      try {
        this.bufferSource.stop();
      } catch (e) {
        // Source might already be stopped
      }
      try {
        this.bufferSource.disconnect();
      } catch (e) {
        // Might not be connected
      }
      this.bufferSource = null;
    }

    // Pause and disconnect HTML5 audio
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }

    // Disconnect the current source node completely
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (e) {
        // Might already be disconnected
      }
    }

    // Disconnect all audio processing nodes to prevent double connections
    try {
      if (this.dryGain) this.dryGain.disconnect();
      if (this.reverbGain) this.reverbGain.disconnect();
      if (this.convolver) this.convolver.disconnect();
      if (this.masterGain) this.masterGain.disconnect();
    } catch (e) {
      // Some nodes might not be connected
    }

    console.log("🔇 All audio sources disconnected");
  }

  stopCurrentSources() {
    // Legacy method - now calls the more comprehensive disconnect
    this.disconnectAllSources();
  }

  getCurrentBufferTime() {
    if (!this.isUsingBufferSource || !this.startedAt) return 0;

    if (this.pausedAt) {
      return this.currentTime;
    } else {
      const elapsed =
        (this.audioContext.currentTime - this.startedAt) *
        this.currentPlaybackRate;
      return this.currentTime + elapsed;
    }
  }

  // Methods to control playback
  play() {
    if (this.isUsingBufferSource) {
      if (this.pausedAt) {
        // Resume from paused position
        this.bufferSource = this.audioContext.createBufferSource();
        this.bufferSource.buffer = this.audioBuffer;
        this.bufferSource.playbackRate.value = this.currentPlaybackRate;
        this.sourceNode = this.bufferSource;
        this.connectAudioGraph();

        this.startedAt = this.audioContext.currentTime;
        this.bufferSource.start(0, this.currentTime);
        this.pausedAt = 0;
        console.log(
          `▶️ Resumed buffer playback at ${this.currentTime.toFixed(2)}s`
        );
      }
    } else {
      if (this.audioElement) {
        this.audioElement.play();
      }
    }
  }

  pause() {
    if (this.isUsingBufferSource) {
      this.currentTime = this.getCurrentBufferTime();
      this.pausedAt = this.audioContext.currentTime;
      this.stopCurrentSources();
      console.log(
        `⏸️ Paused buffer playback at ${this.currentTime.toFixed(2)}s`
      );
    } else {
      if (this.audioElement) {
        this.audioElement.pause();
      }
    }
  }

  setupAudioEventListeners() {
    if (!this.audioElement) return;

    this.audioElement.addEventListener("play", () => {
      console.log("🎵 HTML5 audio play event");
      if (this.isUsingBufferSource && this.pausedAt) {
        this.play();
      }
    });

    this.audioElement.addEventListener("pause", () => {
      console.log("⏸️ HTML5 audio pause event");
      if (this.isUsingBufferSource) {
        this.pause();
      }
    });

    this.audioElement.addEventListener("seeked", () => {
      console.log("⏭️ HTML5 audio seeked event");
      if (this.isUsingBufferSource) {
        // Restart buffer source at new position
        const newTime = this.audioElement.currentTime;
        this.switchToBufferPlayback(this.currentPlaybackRate);
        this.currentTime = newTime;
        if (!this.audioElement.paused) {
          this.play();
        }
      }
    });

    console.log("🎧 Audio event listeners set up");
  }

  setReverbAmount(amount) {
    console.log(`setReverbAmount called with: ${amount}`);

    if (!this.reverbGain || !this.dryGain) {
      console.error("Reverb nodes not initialized!", {
        reverbGain: !!this.reverbGain,
        dryGain: !!this.dryGain,
        convolver: !!this.convolver,
        reverbBuffer: !!this.reverbBuffer,
      });
      return;
    }

    if (!this.audioContext) {
      console.error("Audio context not available");
      return;
    }

    try {
      // amount is 0-100, convert to 0-1
      const wetLevel = amount / 100;

      // Proper mixing: keep dry signal at full volume, add wet signal
      const dryLevel = 1.0; // Always keep full dry signal
      const wetGain = wetLevel * 5.0; // Boost wet signal for audible reverb

      this.dryGain.gain.setTargetAtTime(
        dryLevel,
        this.audioContext.currentTime,
        0.05
      );
      this.reverbGain.gain.setTargetAtTime(
        wetGain,
        this.audioContext.currentTime,
        0.05
      );

      console.log(
        `✅ Reverb applied: dry=${dryLevel.toFixed(2)}, wet=${wetGain.toFixed(
          2
        )}, amount=${amount}%`,
        {
          reverbBuffer: !!this.reverbBuffer,
          convolverBuffer: !!this.convolver?.buffer,
          reverbGainValue: this.reverbGain.gain.value,
          dryGainValue: this.dryGain.gain.value,
        }
      );
    } catch (error) {
      console.error("Error applying reverb:", error);
    }
  }

  setMasterVolume(volume) {
    if (this.masterGain) {
      // volume is 0-100, convert to 0-1
      const gain = volume / 100;
      this.masterGain.gain.setTargetAtTime(
        gain,
        this.audioContext.currentTime,
        0.05
      );

      console.log(`Master volume: ${gain.toFixed(2)}`);
    }
  }

  setRainVolume(volume) {
    if (this.rainGain) {
      const gain = volume / 100;
      this.rainGain.gain.setTargetAtTime(
        gain,
        this.audioContext.currentTime,
        0.1
      );

      // Start or stop rain based on volume
      if (volume > 0 && !this.isRainPlaying) {
        this.startRain();
      } else if (volume === 0 && this.isRainPlaying) {
        this.stopRain();
      }
    }
  }

  startRain() {
    if (!this.rainBuffer || this.isRainPlaying) return;

    this.rainSource = this.audioContext.createBufferSource();
    this.rainSource.buffer = this.rainBuffer;
    this.rainSource.loop = true;
    this.rainSource.connect(this.rainGain);
    this.rainGain.connect(this.audioContext.destination);
    this.rainSource.start();
    this.isRainPlaying = true;
  }

  stopRain() {
    if (this.rainSource && this.isRainPlaying) {
      this.rainSource.stop();
      this.rainSource = null;
      this.isRainPlaying = false;
    }
  }

  toggleRain() {
    if (this.isRainPlaying) {
      this.stopRain();
      return false;
    } else {
      this.startRain();
      return true;
    }
  }

  // Preset configurations
  applyPreset(presetName) {
    const presets = {
      chill: {
        speed: 0.85,
        reverb: 35,
        rain: 25,
        volume: 60,
      },
      study: {
        speed: 0.7,
        reverb: 50,
        rain: 40,
        volume: 45,
      },
      sleep: {
        speed: 0.6,
        reverb: 70,
        rain: 60,
        volume: 30,
      },
      dramatic: {
        speed: 0.5,
        reverb: 85,
        rain: 80,
        volume: 75,
      },
      reset: {
        speed: 1.0,
        reverb: 0,
        rain: 0,
        volume: 70,
      },
    };

    const preset = presets[presetName];
    if (preset) {
      return preset;
    }
    return null;
  }

  // Resume audio context (needed for user interaction requirement)
  async resumeContext() {
    if (this.audioContext && this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  // Debug current audio state
  debugAudioState() {
    console.log("🔍 Current Audio State:");
    console.log("- Using Buffer Source:", this.isUsingBufferSource);
    console.log("- HTML5 Audio Paused:", this.audioElement?.paused);
    console.log("- HTML5 Audio Current Time:", this.audioElement?.currentTime);
    console.log("- Buffer Source:", !!this.bufferSource);
    console.log("- Buffer Current Time:", this.getCurrentBufferTime());
    console.log("- Audio Context State:", this.audioContext?.state);
    console.log("- Current Playback Rate:", this.currentPlaybackRate);

    if (this.isUsingBufferSource && !this.audioElement?.paused) {
      console.warn(
        "⚠️ DOUBLE PLAYBACK DETECTED: Both buffer source and HTML5 audio might be playing!"
      );
    }
  }

  // Test reverb functionality
  testReverb() {
    console.log("🧪 Testing reverb...");
    console.log("Audio Context State:", this.audioContext?.state);
    console.log("Reverb Buffer:", !!this.reverbBuffer);
    console.log("Convolver:", !!this.convolver);
    console.log("Convolver Buffer:", !!this.convolver?.buffer);
    console.log("Reverb Gain:", !!this.reverbGain);
    console.log("Dry Gain:", !!this.dryGain);

    if (this.reverbGain && this.dryGain) {
      console.log("Current Gain Values:", {
        reverb: this.reverbGain.gain.value,
        dry: this.dryGain.gain.value,
      });

      // Test by temporarily setting high reverb
      const oldReverb = this.reverbGain.gain.value;
      this.reverbGain.gain.value = 1.0;
      console.log(
        "✅ Set reverb to 100% for testing - you should hear reverb now"
      );

      // Reset after 3 seconds
      setTimeout(() => {
        this.reverbGain.gain.value = oldReverb;
        console.log("↩️ Reverb reset to original value");
      }, 3000);
    }
  }

  // Cleanup
  disconnect() {
    this.stopRain();
    this.disconnectAllSources();

    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Export for use in other files
window.AudioEffectsProcessor = AudioEffectsProcessor;
