
var svg = d3.select("body")
    .append("svg")
    .call(d3.behavior.zoom()
          .on("zoom", redraw))
    .append("g");

var counties = svg.append("g")
    .attr("id", "counties");

var path = d3.geo.path();

var fill = d3.scale.log()
    .domain([10, 500])
    .range(["brown", "steelblue"]);

d3.json("../data/us-counties.json", function(json) {
            counties.selectAll("path")
                .data(json.features)
                .enter().append("path")
                .attr("d", path)
                .attr("fill", function(d) { 
                          console.log(d,path.area(d),fill(path.area(d)));
                          return fill(path.area(d)); });
        });

function redraw() {
    svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

