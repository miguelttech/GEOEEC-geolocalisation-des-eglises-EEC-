FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# GDAL/GEOS/PROJ requis par GeoDjango + Pango/Cairo requis par WeasyPrint (PDF)
# gosu : permet à docker-entrypoint.sh de démarrer root le temps de corriger
# les permissions du volume de logs, puis d'abandonner définitivement les
# privilèges avant d'exécuter gunicorn (voir USER appuser plus bas).
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
    gosu \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid appuser --no-create-home --shell /usr/sbin/nologin appuser

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chmod +x docker-entrypoint.sh && chown -R appuser:appuser /app

EXPOSE 8000

# Commande par défaut = PRODUCTION (migrate + collectstatic + gunicorn).
# Le service dev (docker-compose.yml) écrase toujours cette commande par
# "python manage.py runserver" — aucun impact sur le développement local.
# Démarre root (docker-entrypoint.sh fait le chown du volume de logs monté
# depuis l'hôte, puis "exec gosu appuser ..." — le process gunicorn final
# tourne bien en non-root, jamais l'inverse).
CMD ["./docker-entrypoint.sh"]
