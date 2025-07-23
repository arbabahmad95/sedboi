/** @format */

class AtmosphericAudioApp {
  constructor() {
    this.audioProcessor = new AudioEffectsProcessor();
    this.currentAudioUrl = null;
    this.isLoading = false;

    this.initializeElements();
    this.attachEventListeners();
    this.updateUI();
  }

  initializeElements() {
    // Input elements
    this.youtubeUrlInput = document.getElementById("youtube-url");
    this.loadAudioBtn = document.getElementById("load-audio");

    // Player elements
    this.playerSection = document.getElementById("player-section");
    this.audioPlayer = document.getElementById("audio-player");
    this.currentTimeSpan = document.getElementById("current-time");
    this.durationSpan = document.getElementById("duration");

    // Effects elements
    this.effectsSection = document.getElementById("effects-section");
    this.speedSlider = document.getElementById("speed-slider");
    this.speedValue = document.getElementById("speed-value");
    this.reverbSlider = document.getElementById("reverb-slider");
    this.reverbValue = document.getElementById("reverb-value");
    this.rainSlider = document.getElementById("rain-slider");
    this.rainValue = document.getElementById("rain-value");
    this.rainToggle = document.getElementById("rain-toggle");
    this.volumeSlider = document.getElementById("volume-slider");
    this.volumeValue = document.getElementById("volume-value");

    // Preset buttons
    this.presetButtons = document.querySelectorAll(".preset-btn");

    // Status message
    this.statusMessage = document.getElementById("status-message");

    // Loader
    this.loader = document.querySelector(".loader");
  }

  attachEventListeners() {
    // Load audio button
    this.loadAudioBtn.addEventListener("click", () => this.loadAudio());

    // Enter key on URL input
    this.youtubeUrlInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.loadAudio();
      }
    });

    // Audio player events
    this.audioPlayer.addEventListener("loadedmetadata", () =>
      this.onAudioLoaded()
    );
    this.audioPlayer.addEventListener("timeupdate", () => this.updateTime());
    this.audioPlayer.addEventListener("play", () =>
      this.audioProcessor.resumeContext()
    );

    // Effect sliders
    this.speedSlider.addEventListener("input", (e) =>
      this.updateSpeed(e.target.value)
    );
    this.reverbSlider.addEventListener("input", (e) =>
      this.updateReverb(e.target.value)
    );
    this.rainSlider.addEventListener("input", (e) =>
      this.updateRain(e.target.value)
    );
    this.volumeSlider.addEventListener("input", (e) =>
      this.updateVolume(e.target.value)
    );

    // Rain toggle
    this.rainToggle.addEventListener("click", () => this.toggleRain());

    // Preset buttons
    this.presetButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const preset = e.target.dataset.preset;
        this.applyPreset(preset);
      });
    });
  }

  async loadAudio() {
    const youtubeUrl = this.youtubeUrlInput.value.trim();

    if (!youtubeUrl) {
      this.showStatus("Please enter a YouTube URL", "error");
      return;
    }

    if (!this.isValidYouTubeUrl(youtubeUrl)) {
      this.showStatus("Please enter a valid YouTube URL", "error");
      return;
    }

    this.setLoading(true);
    this.showStatus("Extracting audio from YouTube video...", "info");

    try {
      const response = await fetch("/extract-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ youtubeUrl }),
      });

      const data = await response.json();

      if (data.success) {
        this.currentAudioUrl = data.audioUrl;
        this.audioPlayer.src = data.audioUrl;
        this.showStatus("Audio loaded successfully!", "success");
        this.showPlayerSection();
      } else {
        throw new Error(data.error || "Failed to extract audio");
      }
    } catch (error) {
      console.error("Error loading audio:", error);
      this.showStatus("Failed to load audio: " + error.message, "error");
    } finally {
      this.setLoading(false);
    }
  }

  isValidYouTubeUrl(url) {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/v\/[\w-]+/,
    ];

    return patterns.some((pattern) => pattern.test(url));
  }

  async onAudioLoaded() {
    await this.audioProcessor.connectAudio(this.audioPlayer);
    this.showEffectsSection();
    this.updateTime();
  }

  updateTime() {
    if (this.audioPlayer.duration) {
      this.currentTimeSpan.textContent = this.formatTime(
        this.audioPlayer.currentTime
      );
      this.durationSpan.textContent = this.formatTime(
        this.audioPlayer.duration
      );
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  updateSpeed(value) {
    const rate = parseFloat(value);

    // Update display with pitch indication
    const isPitchShifting = Math.abs(rate - 1.0) >= 0.05;
    if (isPitchShifting) {
      this.speedValue.textContent = value + "x 🎶";
      this.speedValue.title = "Speed + Pitch shifting active";
    } else {
      this.speedValue.textContent = value + "x";
      this.speedValue.title = "Normal speed (no pitch shift)";
    }

    console.log(
      `🎛️ Speed slider moved to: ${value}x (pitch shift: ${isPitchShifting})`
    );
    this.audioProcessor.setPlaybackRate(rate);
  }

  updateReverb(value) {
    console.log(`🎛️ Reverb slider moved to: ${value}%`);
    this.reverbValue.textContent = value + "%";
    this.audioProcessor.setReverbAmount(parseFloat(value));
  }

  updateRain(value) {
    this.rainValue.textContent = value + "%";
    this.audioProcessor.setRainVolume(parseFloat(value));

    // Update rain toggle button
    this.rainToggle.textContent = value > 0 ? "🔊" : "🔇";
    this.rainToggle.classList.toggle("active", value > 0);
  }

  updateVolume(value) {
    this.volumeValue.textContent = value + "%";
    this.audioProcessor.setMasterVolume(parseFloat(value));
  }

  toggleRain() {
    const currentValue = parseInt(this.rainSlider.value);
    if (currentValue > 0) {
      this.rainSlider.value = 0;
      this.updateRain(0);
    } else {
      this.rainSlider.value = 30;
      this.updateRain(30);
    }
  }

  applyPreset(presetName) {
    const preset = this.audioProcessor.applyPreset(presetName);
    if (!preset) return;

    // Update sliders and values
    this.speedSlider.value = preset.speed;
    this.updateSpeed(preset.speed);

    this.reverbSlider.value = preset.reverb;
    this.updateReverb(preset.reverb);

    this.rainSlider.value = preset.rain;
    this.updateRain(preset.rain);

    this.volumeSlider.value = preset.volume;
    this.updateVolume(preset.volume);

    // Add visual feedback
    const presetBtn = document.querySelector(`[data-preset="${presetName}"]`);
    if (presetBtn) {
      presetBtn.style.transform = "scale(0.95)";
      setTimeout(() => {
        presetBtn.style.transform = "";
      }, 150);
    }

    this.showStatus(`Applied ${presetName} preset`, "success");
  }

  setLoading(loading) {
    this.isLoading = loading;
    this.loadAudioBtn.disabled = loading;

    if (loading) {
      this.loadAudioBtn.querySelector("span").style.display = "none";
      this.loader.classList.remove("hidden");
    } else {
      this.loadAudioBtn.querySelector("span").style.display = "inline";
      this.loader.classList.add("hidden");
    }
  }

  showPlayerSection() {
    this.playerSection.classList.remove("hidden");
    this.playerSection.classList.add("fade-in");
  }

  showEffectsSection() {
    this.effectsSection.classList.remove("hidden");
    this.effectsSection.classList.add("fade-in");
  }

  showStatus(message, type = "info") {
    this.statusMessage.textContent = message;
    this.statusMessage.className = `status-message ${type}`;
    this.statusMessage.classList.add("show");

    // Auto hide after 4 seconds
    setTimeout(() => {
      this.statusMessage.classList.remove("show");
    }, 4000);
  }

  updateUI() {
    // Set initial values
    this.updateSpeed(this.speedSlider.value);
    this.updateReverb(this.reverbSlider.value);
    this.updateRain(this.rainSlider.value);
    this.updateVolume(this.volumeSlider.value);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const app = new AtmosphericAudioApp();

  // Store app instance globally for debugging
  window.atmosphericAudio = app;

  // Expose test functions for debugging
  window.testReverb = () => app.audioProcessor.testReverb();
  window.debugAudio = () => app.audioProcessor.debugAudioState();
  window.audioProcessor = app.audioProcessor;

  console.log("Atmospheric Audio app initialized");
});
