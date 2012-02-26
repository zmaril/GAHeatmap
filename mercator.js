// The radius scale for the centroids.
var r = d3.scale.sqrt()
    .domain([0, 1e6])
    .range([0, 10]);

// Our projection.
var margin = {top: 0, right: 0, bottom: 0, left: 0},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var projection = d3.geo.mercator()
    .scale(width)
    .translate([width / 2, height / 2]);

var path = d3.geo.path()
    .projection(projection);

var zoom = d3.behavior.zoom()
    .translate(projection.translate())
    .scale(projection.scale())
    .scaleExtent([height, 8 * height])
    .on("zoom", move);

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(zoom);

var g = svg.append("g"),
    feature = g.selectAll(".feature");

svg.append("g").attr("id","visitors");




svg.append("rect")
    .attr("class", "frame")
    .attr("width", width)
    .attr("height", height);

d3.json("../data/world-countries.json", function(collection) {
  feature = feature
      .data(collection.features)
    .enter().append("path")
      .attr("class", "feature")
      .attr("d", path);
});

function move() {
  var t = d3.event.translate,
      s = d3.event.scale;
  t[0] = Math.max(-s / 2, Math.min(width + s / 2, t[0]));
  t[1] = Math.max(-s / 2, Math.min(height + s / 2, t[1]));
  zoom.translate(t);
  projection.translate(t).scale(s);
  feature.attr("d", path);
    svg.select("#visitors").selectAll("circle").attr("transform", function(d) { 
                  return "translate(" + projection(d.geometry.coordinates) + ")"; });

}

// var craftNormalApprox= function(data){
//     //Not sure what error rate we are at with 0.0001 of
//     //latitude. Probably need to find this out for later. I mean that is
//     //the increment we are.
//     //Assuming no correlation. Eh?
//     var sigma = 1;
//     console.log(data);
//     var constant = 1/(2*Math.PI*sigma*sigma);
//     var singleNormal = function(coords){
//         var mux = coords[0];
//         var muy = coords[1];
//         return function(x,y){
//             var z = Math.pow(x-mux,2)+Math.pow(y-muy,2); 
//             var answer = Math.exp(-z/(2*sigma*sigma));
//             return answer;
//         };
//     };
//     var normalApprox= function(x,y){
//         var normals = $.map(data,singleNormal);
//         var evaled = $.map(normals, function(f){
//                                return f(x,y);
//                            });

//         return Math.round(constant*_.reduce(evaled,function(a,b){
//                             return a+b;
//                         }));
//     };
//     return normalApprox;
// };
// var func = [];

var bucketData= function(d,data){
    var min = -180;
    var max = 180;
    var length = (max-min)/d;
    console.log(length);
    var histogram = $.map(_.range(length), function(n){
                              var arr = $.map(_.range(length), function(j){
                                     return [0];
                                    });  
                              return [arr];
                          });

    var indexer = function(coords){
        var indices = $.map(coords, function(i){
                                var n = (i-min)/d;
                                return Math.floor(n);
                            });
        histogram[indices[0]][indices[1]] += 1;
    };
    
    $.map(data,indexer);
    return histogram;
};

var displayLocationData= function(data){
    var filtered = _.filter(data.rows, function(row){
                                //Sorry tiny invisible island by africa. I don't think you exist.  
                                return !(row[0]==0.00000 && row[1] ==0.0000);

                            });

    var coordsFromData = _.map(data.rows,function(row){
                          return [parseFloat(row[0]),
                                  parseFloat(row[1])];});
    var d = 10;
    var giantArray  = graphData(d,coordsFromData);

    var collection = {
        "type": "FeatureCollecton"
        ,"features": $.map(filtered, function(row,i){
                               var feature = {};
                               var coords = $.map(row.slice(0,2),parseFloat).reverse();
                               feature["id"]=i;
                               feature["geometry"]={"type": "Point"
                                   ,"coordinates": coords
                                   ,"properties": {}
                               };
                              return feature;
                          })};
   svg.select("#visitors")
     .selectAll("circle")
       .data(collection.features)
     .enter().append("circle")
        .attr("transform", function(d) { 
                  return "translate(" + projection(d.geometry.coordinates) + ")"; })
        .attr("r", function(d) { return 5;});
};

//The url's for getting all of the stuffage. 
var baseUrl = "https://www.googleapis.com/analytics/v3/";
var dataUrl = "data/ga";
var coreAllUrl = "management/accounts/~all/webproperties/~all/profiles";

var outdata = [];

//Again with the function wrapping. 
var config = (function() {return {
                              client_id: '830039221919.apps.googleusercontent.com'
                              , immediate:true 
                              , scope: 'https://www.googleapis.com/auth/analytics.readonly'
                          };})();

var auth = function() {
    gapi.auth.authorize(config, getProfiles);
};

var getProfiles = function(){
    var dataInfo = {"access_token": gapi.auth.getToken().access_token};
    var requestInfo = {	data: dataInfo,
	                url: baseUrl+coreAllUrl,
	                dataType: "jsonp",
	                success: displayProfiles};
    $.ajax(requestInfo);        
};

var displayProfiles = function(data){
    $.map(data.items, function(item){
	      var button = $("<button>").text(item.name);
	      button.data('id',item.id);
	      button.click(function(a,b){
	                       getLocationData($(a.target).data('id'));
	                   });
	      $("#buttons").append(button);
          });
};

var getLocationData = function(id){
    var token = gapi.auth.getToken();

    var dataInfo = {access_token: token.access_token
		    ,"ids": "ga:"+id
		    ,"start-date": "2012-02-01" // Not all that subtle. 
		    ,"end-date": "2012-02-23" //Dates?
		    ,"metrics": "ga:visitors"
		    ,"dimensions":["ga:latitude","ga:longitude",
                                   "ga:date","ga:hour"
                                   ,"ga:country"].join(",")
		   };
    var requestInfo = {
	data: dataInfo,
	url: baseUrl+dataUrl,
	dataType: "jsonp",
	success: function(data){ 
            return displayLocationData(data);
        }
    };    
    $.ajax(requestInfo);
};

