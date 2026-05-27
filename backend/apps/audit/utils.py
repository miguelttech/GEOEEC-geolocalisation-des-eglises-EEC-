def log_action(request, action, type_objet="", objet_id=None, objet_nom="", description=""):
    """Enregistre une action dans le journal d'audit."""
    from .models import LogActivite

    ip = _get_client_ip(request)
    utilisateur = request.user if request.user.is_authenticated else None

    LogActivite.objects.create(
        utilisateur=utilisateur,
        action=action,
        type_objet=type_objet,
        objet_id=objet_id,
        objet_nom=objet_nom,
        description=description,
        ip_address=ip,
    )


def _get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")
