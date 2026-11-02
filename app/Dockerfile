# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/engine/reference/builder/

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
ENV NODE_ENV production


WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the rest of the source files into the image.
COPY . .


# Run the application as a non-root user.
RUN  chown -R node /usr/src/app
USER node

# Expose the port that the application listens on.
EXPOSE 3000

CMD ["npm", "start"]
