"""
E-mails d'identifiants (création de compte, réinitialisation de mot de
passe) — HTML avec repli texte brut, logo EEC embarqué en pièce jointe
inline (cid:) et bouton « Se connecter » vers la page de connexion du
frontend.

Logo en cid: plutôt qu'en URL distante — un logo chargé depuis le frontend
ne s'affichait pas de façon fiable dans certains clients mail (Gmail
notamment) selon leur politique de chargement d'images externes ; l'inline
cid: est intégré au message lui-même et s'affiche toujours.
"""

from email.mime.image import MIMEImage
from pathlib import Path

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags

LOGO_PATH = Path(__file__).resolve().parent / "emails_assets" / "eec-logo.png"
LOGO_CID = "eec_logo"

ROLE_COLORS = {
    "SUPER":    "#C2410C",
    "REGION":   "#3B82F6",
    "DISTRICT": "#F97316",
    "PAROISSE": "#5AC472",
}


def send_credentials_email(*, user, password, subject, intro_html, intro_text,
                            security_note, show_role=False):
    """Envoie l'e-mail d'identifiants à `user`. Lève toute exception SMTP —
    à l'appelant de l'attraper (comme pour l'ancien send_mail() texte brut)."""
    login_url = f"{settings.FRONTEND_URL}/login"
    full_name = user.get_full_name() or user.username
    support_email = getattr(settings, "DEFAULT_FROM_EMAIL", "") or ""
    # "GÉOEEC EEC Cameroun <adresse@...>" → n'garder que l'adresse
    if "<" in support_email and ">" in support_email:
        support_email = support_email.split("<", 1)[1].split(">", 1)[0]

    context = {
        "subject": subject,
        "full_name": full_name,
        "intro_html": intro_html,
        "username": user.username,
        "password": password,
        "login_url": login_url,
        "security_note": security_note,
        "support_email": support_email,
        "logo_cid": LOGO_CID,
        "role_display": user.get_role_display() if show_role else None,
        "role_color": ROLE_COLORS.get(user.role, "#6B7280"),
    }
    html_body = render_to_string("emails/credentials_email.html", context)

    text_body = strip_tags(
        f"Bonjour {full_name},\n\n"
        f"{intro_text}\n\n"
        f"Identifiant : {user.username}\n"
        f"Mot de passe : {password}\n\n"
        f"{security_note}\n\n"
        f"Se connecter : {login_url}\n\n"
        f"— Plateforme EEC Géolocalisation"
    )

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
        to=[user.email],
    )
    msg.attach_alternative(html_body, "text/html")
    msg.mixed_subtype = "related"
    with open(LOGO_PATH, "rb") as f:
        logo = MIMEImage(f.read())
    logo.add_header("Content-ID", f"<{LOGO_CID}>")
    logo.add_header("Content-Disposition", "inline", filename="eec-logo.png")
    msg.attach(logo)
    msg.send(fail_silently=False)
