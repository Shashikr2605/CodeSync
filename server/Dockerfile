FROM node:20-slim

# Install system dependencies for code execution (Python, Java JDK, GCC/G++)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    default-jdk \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create a symlink so "python" command works (standard in LOCAL_CFG)
RUN ln -s /usr/bin/python3 /usr/bin/python

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# Bundle app source
COPY . .

# Expose the server port
EXPOSE 5000

# Start the application
CMD ["node", "index.js"]
