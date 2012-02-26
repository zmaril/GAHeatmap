var data; // loaded asynchronously

var path = d3.geo.path();

var svg = d3.select("body")
    .append("svg")
    .call(d3.behavior.zoom()
          .on("zoom", redraw))
    .append("g");

var counties = svg.append("g")
    .attr("id", "counties")
    .attr("class", "Blues");

var states = svg.append("g")
    .attr("id", "states");

d3.json("../data/us-counties.json", function(json) {
  counties.selectAll("path")
      .data(json.features)
    .enter().append("path")
      .attr("class", data ? quantize : null)
      .attr("d", path);
});

d3.json("../data/us-states.json", function(json) {
            states.selectAll("path")
                .data(json.features)
                .enter().append("path")
                .attr("d",path);
});

var visitors = svg.append("g")
    .attr("id", "visitors");

var fill = d3.scale.log()
    .domain([10, 500])
    .range(["brown", "steelblue"]);

function redraw() {
    svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale*0.4 + ")");
}

var displayLocationData= function(data){
    console.log(data);
    var features = $.map(data.rows,function(d,i){
                             var point = $.map(parseFloat,d.slice(0,2)).reverse();
                             var coords = [[point,[i,0],[0,0]]];
                             var fakePoint = {
                                 geometry: {
                                     coordinates: coords
                                     ,type: "Polygon"
                                 }
                                 ,type:"Feature"
                                 ,properties: {}               
                                 ,id: i+""
                             };
                            return fakePoint; 
                         });
    visitors.selectAll("path")
        .data(features).enter()
    .append("path")
    .attr("d",function(d,i){
              var a =path({
                              type: "LineString"
                              ,coordinates: d3.geo.bounds(d)                            
                          }); 
              return a;
          });
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
                    ,"filters": "ga:country==United States"
		    ,"dimensions":["ga:latitude","ga:longitude",
                                   "ga:date","ga:hour"
                                   ,"ga:country"].join(",")
		   };
    var requestInfo = {
	data: dataInfo,
	url: baseUrl+dataUrl,
	dataType: "jsonp",
	success: displayLocationData
    };
    $.ajax(requestInfo);
};

