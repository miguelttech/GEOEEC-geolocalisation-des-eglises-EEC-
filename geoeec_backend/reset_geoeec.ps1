# Paramètres de connexion PostgreSQL
$pgUser = "postgres"
$pgPassword = "belvine2003"
$pgDatabase = "geoeec"
$pgHost = "localhost"
$pgPort = "5432"

# Commande psql pour exécuter SQL
$psqlCmd = "psql -U $pgUser -h $pgHost -p $pgPort -d $pgDatabase -w -c"

# SQL pour vider toutes les tables
$truncateSql = @"
DO
\$\$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' CASCADE;';
    END LOOP;
END
\$\$;
"@

# SQL pour réinitialiser toutes les séquences
$resetSeqSql = @"
DO
\$\$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT c.relname FROM pg_class c WHERE c.relkind = 'S') LOOP
        EXECUTE 'ALTER SEQUENCE ' || quote_ident(r.relname) || ' RESTART WITH 1;';
    END LOOP;
END
\$\$;
"@

# Exécuter les commandes SQL
Write-Host "Vider toutes les tables..."
Invoke-Expression "$psqlCmd `"$truncateSql`""

Write-Host "Réinitialiser toutes les séquences..."
Invoke-Expression "$psqlCmd `"$resetSeqSql`""

# Supprimer les fichiers de migration (sauf __init__.py)
Write-Host "Suppression des fichiers de migration..."
Get-ChildItem -Path . -Recurse -Include "0*.py" | Where-Object { $_.Name -ne "__init__.py" } | Remove-Item

# Refaire les migrations Django
Write-Host "Création des nouvelles migrations Django..."
python manage.py makemigrations

Write-Host "Application des migrations Django..."
python manage.py migrate

Write-Host "✅ Réinitialisation complète terminée !"
