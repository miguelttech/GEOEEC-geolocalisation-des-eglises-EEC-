from django.urls import path
from .views import CartographieStatisticsView, CartographieLayersView, CartographieSearchView, RegionListView, DistrictListView, OeuvreTypeListView

urlpatterns = [
    path('statistics/', CartographieStatisticsView.as_view(), name='cartographie-statistics'),
    path('layers/', CartographieLayersView.as_view(), name='cartographie-layers'),
    path('search/', CartographieSearchView.as_view(), name='cartographie-search'),
    path('regions/', RegionListView.as_view(), name='cartographie-regions'),
    path('districts/', DistrictListView.as_view(), name='cartographie-districts'),
    path('oeuvre-types/', OeuvreTypeListView.as_view(), name='cartographie-oeuvre-types'),
]
