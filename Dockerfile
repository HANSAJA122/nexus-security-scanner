# Step 1: Use Node.js as the base image
FROM node:20-slim

# Step 2: Install Python and required system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Step 3: Set the working directory
WORKDIR /app

# Step 4: Install Python dependencies
# Ensure your requirements.txt is in the root
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Step 5: Install Node dependencies
COPY package*.json ./
RUN npm install

# Step 6: Copy the rest of the application code
COPY . .

# Step 7: Expose the port your app runs on
EXPOSE 3000

# Step 8: Start the application
CMD ["npm", "start"]