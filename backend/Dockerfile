FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# GDAL/GEOS/PROJ requis par GeoDjango + Pango/Cairo requis par WeasyPrint (PDF)
RUN apt-get update && apt-get install -y --no-install-recommends \
    binutils \
    libproj-dev \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    python3-gdal \
    curl \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libpangocairo-1.0-0 \
    libcairo2 \
    libgdk-pixbuf-2.0-0 \
    libffi8 \
    shared-mime-info \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x docker-entrypoint.sh

EXPOSE 8000

# Commande par défaut = PRODUCTION (migrate + collectstatic + gunicorn).
# Le service dev (docker-compose.yml) écrase toujours cette commande par
# "python manage.py runserver" — aucun impact sur le développement local.
CMD ["./docker-entrypoint.sh"]
