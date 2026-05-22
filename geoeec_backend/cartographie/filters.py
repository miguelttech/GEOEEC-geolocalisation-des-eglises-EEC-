import django_filters
from django.db import models
from .models import Paroisse, Ouvrier, Oeuvre, StatistiqueAnnuelle, Region, District, Grade, TypeOeuvre

class ParoisseFilter(django_filters.FilterSet):
    nom = django_filters.CharFilter(lookup_expr='icontains')
    quartier = django_filters.CharFilter(lookup_expr='icontains')
    region = django_filters.ModelChoiceFilter(queryset=Region.objects.all())
    district = django_filters.ModelChoiceFilter(queryset=District.objects.all())
    niveau = django_filters.ChoiceFilter(choices=Paroisse.NIVEAU_CHOICES)
    communiants_min = django_filters.NumberFilter(field_name='communiants', lookup_expr='gte')
    communiants_max = django_filters.NumberFilter(field_name='communiants', lookup_expr='lte')
    total_fideles_min = django_filters.NumberFilter(method='filter_total_fideles_min')
    total_fideles_max = django_filters.NumberFilter(method='filter_total_fideles_max')
    has_location = django_filters.BooleanFilter(method='filter_has_location')
    
    class Meta:
        model = Paroisse
        fields = ['nom', 'quartier', 'region', 'district', 'niveau', 'actif']
    
    def filter_total_fideles_min(self, queryset, name, value):
        return queryset.annotate(
            total_fideles=models.F('communiants') + models.F('non_communiants')
        ).filter(total_fideles__gte=value)
    
    def filter_total_fideles_max(self, queryset, name, value):
        return queryset.annotate(
            total_fideles=models.F('communiants') + models.F('non_communiants')
        ).filter(total_fideles__lte=value)
    
    def filter_has_location(self, queryset, name, value):
        if value:
            return queryset.filter(localisation__isnull=False)
        return queryset.filter(localisation__isnull=True)

class OuvrierFilter(django_filters.FilterSet):
    nom = django_filters.CharFilter(lookup_expr='icontains')
    prenom = django_filters.CharFilter(lookup_expr='icontains')
    grade = django_filters.ModelChoiceFilter(queryset=Grade.objects.all())
    paroisse = django_filters.ModelChoiceFilter(queryset=Paroisse.objects.all())
    region = django_filters.ModelChoiceFilter(
        field_name='paroisse__region',
        queryset=Region.objects.all()
    )
    district = django_filters.ModelChoiceFilter(
        field_name='paroisse__district',
        queryset=District.objects.all()
    )
    statut = django_filters.ChoiceFilter(choices=Ouvrier.STATUT_CHOICES)
    date_ordination_year = django_filters.NumberFilter(
        field_name='date_ordination__year'
    )
    has_location = django_filters.BooleanFilter(method='filter_has_location')
    
    class Meta:
        model = Ouvrier
        fields = ['nom', 'prenom', 'grade', 'paroisse', 'statut']
    
    def filter_has_location(self, queryset, name, value):
        if value:
            return queryset.filter(localisation__isnull=False)
        return queryset.filter(localisation__isnull=True)

class OeuvreFilter(django_filters.FilterSet):
    nom = django_filters.CharFilter(lookup_expr='icontains')
    type_oeuvre = django_filters.ModelChoiceFilter(queryset=TypeOeuvre.objects.all())
    paroisse = django_filters.ModelChoiceFilter(queryset=Paroisse.objects.all())
    region = django_filters.ModelChoiceFilter(
        field_name='paroisse__region',
        queryset=Region.objects.all()
    )
    district = django_filters.ModelChoiceFilter(
        field_name='paroisse__district',
        queryset=District.objects.all()
    )
    niveau = django_filters.ChoiceFilter(choices=Oeuvre.NIVEAU_CHOICES)
    statut = django_filters.ChoiceFilter(choices=Oeuvre.STATUT_CHOICES)
    date_creation_year = django_filters.NumberFilter(
        field_name='date_creation__year'
    )
    has_location = django_filters.BooleanFilter(method='filter_has_location')
    
    class Meta:
        model = Oeuvre
        fields = ['nom', 'type_oeuvre', 'paroisse', 'niveau', 'statut']
    
    def filter_has_location(self, queryset, name, value):
        if value:
            return queryset.filter(localisation__isnull=False)
        return queryset.filter(localisation__isnull=True)

class StatistiqueAnnuelleFilter(django_filters.FilterSet):
    paroisse = django_filters.ModelChoiceFilter(queryset=Paroisse.objects.all())
    region = django_filters.ModelChoiceFilter(
        field_name='paroisse__region',
        queryset=Region.objects.all()
    )
    district = django_filters.ModelChoiceFilter(
        field_name='paroisse__district',
        queryset=District.objects.all()
    )
    annee = django_filters.NumberFilter()
    annee_min = django_filters.NumberFilter(field_name='annee', lookup_expr='gte')
    annee_max = django_filters.NumberFilter(field_name='annee', lookup_expr='lte')
    validee = django_filters.BooleanFilter()
    communiants_min = django_filters.NumberFilter(field_name='communiants', lookup_expr='gte')
    communiants_max = django_filters.NumberFilter(field_name='communiants', lookup_expr='lte')
    
    class Meta:
        model = StatistiqueAnnuelle
        fields = ['paroisse', 'annee', 'validee']
