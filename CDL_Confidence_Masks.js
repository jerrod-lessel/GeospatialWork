// This script is meant to build 'confidence masks' in the US using freely available CDL data in the Google Earth Engine (GEE) platform. 
// By using the 'And' statement, we create a 'High confidence mask' which shows areas that are more likely to be the crop in question given that every year iterated over it has been that crop.
// By using the 'Or' statement, we create a 'Low confidence mask' because while that particular area has had the crop in question before, it may have only been in one year.
// By using the 'Sum' statement, we can see a mask where the more frequent the crop will appear in brighter tones while the less frequent the crop is planted in darker tones.


//Show all CDL Layers
cdl = ee.ImageCollection("USDA/NASS/CDL");
print(cdl);

//Choose your year
var year  = '2009'; // <---- Change the year here

//Select the year out of the years available
var cdl_20xx = ee.Image(cdl.filter(ee.Filter.eq('system:index', year)).first()).select('cropland');
print(cdl_20xx);
Map.addLayer(cdl_20xx,{}, 'CDL All',false);

//Extract single crops per year selected
var corn = cdl_20xx.eq(1).updateMask(cdl_20xx.eq(1)).toFloat();
var cotton = cdl_20xx.eq(2).updateMask(cdl_20xx.eq(2)).toFloat();
var rice = cdl_20xx.eq(3).updateMask(cdl_20xx.eq(3)).toFloat();
var sorghum = cdl_20xx.eq(4).updateMask(cdl_20xx.eq(4)).toFloat();
var soy = cdl_20xx.eq(5).updateMask(cdl_20xx.eq(5)).toFloat();
var barley = cdl_20xx.eq(21).updateMask(cdl_20xx.eq(21)).toFloat();
var dwheat = cdl_20xx.eq(22).updateMask(cdl_20xx.eq(22)).toFloat();
var swheat = cdl_20xx.eq(23).updateMask(cdl_20xx.eq(23)).toFloat();
var wwheat = cdl_20xx.eq(24).updateMask(cdl_20xx.eq(24)).toFloat();
var rye = cdl_20xx.eq(27).updateMask(cdl_20xx.eq(27)).toFloat();
var dsc = cdl_20xx.eq(239).updateMask(cdl_20xx.eq(239)).toFloat();
var dso = cdl_20xx.eq(240).updateMask(cdl_20xx.eq(240)).toFloat();
var dcs = cdl_20xx.eq(241).updateMask(cdl_20xx.eq(241)).toFloat();

/*
Map.addLayer(corn,{palette:'ffd400'},'Corn CDL',false);
Map.addLayer(cotton,{palette:'ff2626'},'Cotton CDL',false);
Map.addLayer(rice,{palette:'00a8e3'},'Rice CDL',false);
Map.addLayer(sorghum,{palette:'ff9e0a'},'Sorghum CDL',false);
Map.addLayer(soy,{palette:'267000'},'Soy CDL',false);
Map.addLayer(barley,{palette:'e3007d'},'Barley CDL',false);
Map.addLayer(dwheat,{palette:'896054'},'Durum Wheat CDL',false);
Map.addLayer(swheat,{palette:'d8b56b'},'Spring Wheat CDL',false);
Map.addLayer(wwheat,{palette:'a57000'},'Winter Wheat CDL',false);
Map.addLayer(rye,{palette:'ab007d'},'Rye CDL',false);
Map.addLayer(dsc,{palette:'267000'},'Double Soy/Cotton CDL',false);
Map.addLayer(dso,{palette:'267000'},'Double Soy/Oats',false);
Map.addLayer(dcs,{palette:'ffd300'},'Double Corn/Soy',false);
*/

/////////////////////////Regular high and low confidence masks over all years/////////////////////////

//Function to go through all the masks
var allCrop = function(i) {
  var getCrop = i.eq(1);//  <- This is where you change the crop type. For example in CDL, 1 is corn, 5 is soy, 23 is spring wheat, etc.
  return getCrop;
};

var lc1 = cdl.select('cropland').map(allCrop).or(); //also works with .sum() instead of .or(), sum will show the amount of years that are present
Map.addLayer(lc1,{min:0,max:12,palette:['000000','ffffff']}, 'All Crop Or',false);

var lowConf = lc1.mask(lc1.gt(0));
Map.addLayer(lowConf,{palette:'00dd00'}, 'Low Confidence',false);

var hc1 = cdl.select('cropland').map(allCrop).and();
Map.addLayer(hc1,{min:0,max:1,palette:['000000','ffffff']}, 'All Crop And',false);

var highConf = hc1.mask(hc1.gt(0));
Map.addLayer(highConf,{palette:'007700'}, 'High Confidence',false);

var summed1 = cdl.select('cropland').map(allCrop).sum();
Map.addLayer(summed1,{min:0,max:12,palette:['000000','ffffff']}, 'All Crop Sum',false);

var summed = summed1.mask(summed1.gt(0));
Map.addLayer(summed,{min:0,max:23,palette:['000000','00ff00']}, 'Summed crops',false);

// Reprojecting the masks if needed
/*
var lowProject = lowConf.reproject(ee.Projection('EPSG:4326'), null, 30);
Map.addLayer(lowProject,{min:0, max:8, palette:'aaeeaa'}, 'Low Confidence Reprojected',false);
*/

/////////////////////////Clumped high and low confidence masks/////////////////////////
var blank = ee.Image(0);

var outputlc = blank.where(
    lc1.gte(1),
    1);

// Output contains 0s and 1s.  Mask it with itself to get rid of the 0s.
var resultlc = outputlc.updateMask(outputlc);
var result1 = resultlc.connectedPixelCount({maxSize:8,eightConnected:false}).reproject(ee.Projection('EPSG:4326'), null, 30);
var result2 = result1.mask(result1.gte(8));
Map.addLayer(result2, {min:0, max:8, palette:'aaaaff'}, 'Low Confidence Clumped',false);

var outputhc = blank.where(
    hc1.gte(1),
    1);

// Output contains 0s and 1s.  Mask it with itself to get rid of the 0s.
var resulthc = outputhc.updateMask(outputhc);
var result3 = resulthc.connectedPixelCount({maxSize:8,eightConnected:false}).reproject(ee.Projection('EPSG:4326'), null, 30);
var result4 = result3.mask(result3.gte(8));
Map.addLayer(result4, {min:0, max:8, palette:'aaaaff'}, 'High Confidence Clumped',false);

/////////////////////////Confidence masks between set years/////////////////////////

var cdl_yearsDif = ee.ImageCollection(cdl.filter(ee.Filter.date('2010-01-01','2020-12-31'))).select('cropland');
//print(cdl_yearsDif);

var lc1Dif = cdl_yearsDif.select('cropland').map(allCrop).or(); //also works with .sum() instead of .or(), but then divide by the number of years used
//Map.addLayer(lc1Dif,{min:0,max:1,palette:['000000','ffffff']}, 'All Soy Or',false);

var lowConfDif = lc1Dif.mask(lc1Dif.gt(0));
Map.addLayer(lowConfDif,{palette:'880000'}, 'Low Confidence 10-20',false);

var hc1Dif = cdl_yearsDif.select('cropland').map(allCrop).and();
//Map.addLayer(hc1Dif,{min:0,max:1,palette:['000000','ffffff']}, 'All Soy And',false);

var highConfDif = hc1Dif.mask(hc1Dif.gt(0));
Map.addLayer(highConfDif,{palette:'888800'}, 'High Confidence 10-20',false);

var summed1Dif = cdl_yearsDif.select('cropland').map(allCrop).sum();
//Map.addLayer(summed1Dif,{min:0,max:12,palette:['000000','ffffff']}, 'All Crop Sum',false);

var summedDif = (summed1Dif.mask(summed1Dif.gt(0))).divide(11); //<- change the number being divided by the number of years
Map.addLayer(summedDif,{min:0,max:1,palette:['000000','00ff00']}, 'Summed crops float 10-20',false);

//////////////////////////////////////////////////////////Export//////////////////////////////////////////////////////////

Export.image.toDrive({
  image: result4.reproject(ee.Projection('EPSG:4326'), null, 30),
  folder: 'GEE_Exports',
  region: geometry,
  scale: 30,
  description: 'USCorn_HCClump_99_15',
  maxPixels: 1e13,
});
