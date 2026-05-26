FROM python:3.13-slim

WORKDIR /app

# Build deps for C-extension packages (cryptography, Pillow, bcrypt)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY req.txt .
RUN pip install --no-cache-dir -r req.txt

COPY . .

EXPOSE 8000

# Render injects $PORT at runtime; fall back to 8000 for local docker run
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
