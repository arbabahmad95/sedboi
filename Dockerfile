# Use official Node.js LTS image
FROM node:20

# Install system dependencies: ffmpeg and yt-dlp
RUN apt-get update && \
    apt-get install -y ffmpeg yt-dlp && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the app
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the server
CMD ["npm", "start"] 