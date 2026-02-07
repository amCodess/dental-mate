FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Expose port (Vite default)
EXPOSE 5173

# Start development server with host mapping
CMD ["npm", "run", "dev", "--", "--host"]
