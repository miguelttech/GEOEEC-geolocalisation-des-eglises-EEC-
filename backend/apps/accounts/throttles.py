"""
Throttles ciblés pour les endpoints sensibles (authentification).

Le throttle global AnonRateThrottle a été retiré des réglages par défaut
(REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []) car la carte publique charge
des centaines d'enregistrements paginés à chaque affichage — un throttle global
bloquerait les visiteurs légitimes (et même le endpoint CSRF, donc la connexion).

On limite désormais uniquement là où ça compte :
  - login    : anti-brute-force sur le mot de passe
  - register : anti-spam de création de comptes

Les taux sont définis dans REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"].
La clé est l'adresse IP du client (comportement de AnonRateThrottle).
"""

from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    scope = "login"


class RegisterRateThrottle(AnonRateThrottle):
    scope = "register"
