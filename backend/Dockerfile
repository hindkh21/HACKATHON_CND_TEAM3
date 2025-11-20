FROM python:3.11-slim
WORKDIR /app

# Install system deps needed to build some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt ./
RUN pip install --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend sources (including model files)
COPY . .

EXPOSE 9001

ENV PYTHONUNBUFFERED=1
CMD ["python", "integrated_watcher.py"]
