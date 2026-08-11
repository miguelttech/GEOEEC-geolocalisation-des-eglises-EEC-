from django.contrib import admin

from .models import News, NewsImage


class NewsImageInline(admin.TabularInline):
    model = NewsImage
    extra = 0


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ["titre", "est_publiee", "auteur", "created_at"]
    list_filter = ["est_publiee"]
    search_fields = ["titre", "contenu"]
    inlines = [NewsImageInline]
