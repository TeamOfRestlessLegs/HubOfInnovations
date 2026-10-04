FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HF_HOME=/models

WORKDIR /app

COPY requirements.txt /app
# torch w wersji CPU — sentence-transformers domyślnie ściąga wersję z CUDA (kilka GB więcej)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install --no-cache-dir -r requirements.txt

# .env, .venv i vector_db są w .dockerignore — klucz i baza przychodzą z docker-compose
COPY . /app

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
