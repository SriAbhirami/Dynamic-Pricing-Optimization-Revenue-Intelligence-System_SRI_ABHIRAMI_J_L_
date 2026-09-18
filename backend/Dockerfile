FROM mcr.microsoft.com/playwright/python:v1.63.0-noble

WORKDIR /app

ENV PYTHONUNBUFFERED=1

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN echo "========================================"
RUN echo "Docker build completed"
RUN echo "========================================"

CMD ["sh", "-c", "echo 'Starting PricePilot backend...'; echo \"PORT=$PORT\"; python -u -c \"import app.main; print('APP IMPORT COMPLETED')\"; uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]