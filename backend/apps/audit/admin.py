from django.contrib import admin
from .models import LogActivite


@admin.register(LogActivite)
class LogActiviteAdmin(admin.ModelAdmin):
    list_display    = ["created_at", "utilisateur", "action", "type_objet", "objet_nom", "ip_address"]
    list_filter     = ["action", "type_objet", "created_at"]
    search_fields   = ["objet_nom", "description", "utilisateur__username", "utilisateur__last_name"]
    readonly_fields = [
        "utilisateur", "action", "type_objet", "objet_id",
        "objet_nom", "description", "ip_address", "created_at",
    ]
    ordering        = ["-created_at"]
    date_hierarchy  = "created_at"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser
