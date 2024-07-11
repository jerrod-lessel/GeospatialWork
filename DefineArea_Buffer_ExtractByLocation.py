# This process and script is adapted from the book 'Python for Geospatial Data Analysis' by Bonny P. McClain.
# It is meant to find a particular river, then create a buffer around that river, and finally find places that lie along that river within the buffer zone.

from qgis import processing

# List of all agorithms within QGIS
#for alg in QgsApplication.processingRegistry().algorithms():
#    print(alg.id(),"->", alg.displayName())

# The 'algorithmHelp' process basically gives you the readme for each algorithm
#processing.algorithmHelp("qgis:selectbyattribute")

buffer_distance = 0.1 #degrees
my_gpkg = "/Users/jerrod/Documents/myStuff/Python_for_geospatial_data_analysis/natural_earth_vector.gpkg/packages/natural_earth_vector.gpkg"
rivers = '{}|layername=ne_10m_rivers_lake_centerlines'.format(my_gpkg)
places = '{}|layername=ne_10m_populated_places'.format(my_gpkg)
expression = "name = 'Amazonas'"

amazonas = processing.run("native:extractbyexpression",
    {'INPUT':rivers,'EXPRESSION':expression,'OUTPUT':'memory:'}
    )['OUTPUT']

buffered_amazonas = processing.run("native:buffer",
    {'INPUT':amazonas,'DISTANCE':buffer_distance,'SEGMENTS':5,'END_CAP_STYLE':0,
    'JOIN_STYLE':0,'MITER_LIMIT':2,'DISSOLVE':False,'OUTPUT':'memory:'}
    )['OUTPUT']

places_along_amazonas = processing.run("native:extractbylocation",
    {'INPUT':places,'PREDICATE':[0],'INTERSECT':buffered_amazonas,'OUTPUT':
        'memory:'}
    )['OUTPUT']

QgsProject.instance().addMapLayer(places_along_amazonas)

for feature in places_along_amazonas.getFeatures():
    print(feature["name"])
