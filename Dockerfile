# Use the official Node.js 20 image as the base image
FROM node:20-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables (Placeholders - should be set in Cloud Run)
ENV NODE_ENV=production

# Command to run the application
CMD ["npm", "start"]
