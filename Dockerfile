FROM python:3.11-slim

WORKDIR /usr/src/app

# Copy project files so image can be used standalone (production).
COPY . .

EXPOSE 8000

# Simple static server. In dev we'll mount the host dir so edits are live.
CMD ["python", "-m", "http.server", "8000"]
