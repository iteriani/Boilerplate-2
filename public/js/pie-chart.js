
var width = 600,
    height = 350,
    radius = Math.min(width, height) / 2;

var color = d3.scale.category20();

var pie = d3.layout.pie()
    .value(function(d) { return d.init; })
    .sort(null);

var arc = d3.svg.arc()
    .innerRadius(radius - 100)
    .outerRadius(radius - 20);

var outerArc = d3.svg.arc()
  .innerRadius(radius * 0.9)
  .outerRadius(radius * 0.9);

var svg = d3.select("#piechart").append("svg")
    .attr("width", width)
    .attr("height", height)
  	.append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
    .on("click", function(){
		$("#piechart").slideToggle();
		$("#graph").slideToggle()
    })
    .style("cursor", "pointer");
    
svg.append("g")
  .attr("class", "slices");
svg.append("g")
  .attr("class", "labels");
svg.append("g")
  .attr("class", "lines");


 	var data = [{"init" : 100, "second" : 54325}, {"init" : 0, "second" : 50000}];
 	var path = svg.datum(data).selectAll("path")
      .data(pie)
    .enter().append("path")
      .attr("fill", function(d, i) { 
      	return color(i); 
      })
      .attr("d", arc)
      .each(function(d) { this._current = d; }); // store the initial angles


  var text = svg.select(".labels").selectAll("text")
    .data(pie(data), key);

  text.enter()
    .append("text")
    .attr("dy", ".35em")
    .text(function(d) {
      return d.data.label;
    });
  
  function midAngle(d){
    return d.startAngle + (d.endAngle - d.startAngle)/2;
  }

  text.transition().duration(1000)
    .attrTween("transform", function(d) {
      this._current = this._current || d;
      var interpolate = d3.interpolate(this._current, d);
      this._current = interpolate(0);
      return function(t) {
        var d2 = interpolate(t);
        var pos = outerArc.centroid(d2);
        pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
        return "translate("+ pos +")";
      };
    })
    .styleTween("text-anchor", function(d){
      this._current = this._current || d;
      var interpolate = d3.interpolate(this._current, d);
      this._current = interpolate(0);
      return function(t) {
        var d2 = interpolate(t);
        return midAngle(d2) < Math.PI ? "start":"end";
      };
    });

  text.exit()
    .remove();

  /* ------- SLICE TO TEXT POLYLINES -------*/

  var polyline = svg.select(".lines").selectAll("polyline")
    .data(pie(data), key);
  
  polyline.enter()
    .append("polyline");

  polyline.transition().duration(1000)
    .attrTween("points", function(d){
      this._current = this._current || d;
      var interpolate = d3.interpolate(this._current, d);
      this._current = interpolate(0);
      return function(t) {
        var d2 = interpolate(t);
        var pos = outerArc.centroid(d2);
        pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
        return [arc.centroid(d2), outerArc.centroid(d2), pos];
      };      
    });
  
  polyline.exit()
    .remove();


  function switchVals(valset){
  	console.log(valset);
  	var i = 0;
  	pie.value(function(d) {
     return valset[i++]; 
     }); // change the value function
    path = path.data(pie); // compute the new angles
    path.transition().duration(750).attrTween("d", arcTween); // redraw the arcs
  }

// Store the displayed angles in _current.
// Then, interpolate from _current to the new angles.
// During the transition, _current is updated in-place by d3.interpolate.
function arcTween(a) {
  var i = d3.interpolate(this._current, a);
  this._current = i(0);
  return function(t) {
    return arc(i(t));
  };
}
