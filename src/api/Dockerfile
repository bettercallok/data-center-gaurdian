# Stage 1: Build React Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Serve FastAPI Backend
FROM python:3.11-slim

# Create user with ID 1000 for Hugging Face Spaces
RUN useradd -m -u 1000 user

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY src/api/ src/api/
COPY data/processed/ data/processed/

# Copy built frontend from Stage 1
COPY --from=frontend-builder /frontend/dist frontend/dist

# Ensure permissions
RUN chown -R user:user /app

# Switch to the non-root user
USER user
ENV HOME=/home/user
ENV PATH=/home/user/.local/bin:$PATH

# Expose port for Hugging Face Spaces
EXPOSE 7860

# Run FastAPI via Uvicorn
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "7860"]
