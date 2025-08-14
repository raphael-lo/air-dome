# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Bundle app source, including the pre-built dist directory
COPY . .

# The app is already built, so we just need to run it.
# The CMD will be set back to "npm start" in the docker-compose.yml
