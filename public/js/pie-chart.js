
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

  var data = [{"init" : 100, "second" : 54325}, {"init" : 0, "second" : 50000}];
  var path = svg.datum(data).selectAll("path")
      .data(pie)
    .enter().append("path")
      .attr("fill", function(d, i) { 
        return color(i); 
      })
      .attr("d", arc)
      .each(function(d) { this._current = d; }); // store the initial angles


  function switchVals(valset){
    console.log(valset);
    var i = 0;
    pie.value(function(d) {
     return valset[i++]; 
     }); // change the value function
    path = path.data(pie); // compute the new angles
    path.transition().duration(750).attrTween("d", arcTween); // redraw the arcs
  }
/*
  setInterval(function(){
    var data = [];
    for(var i = 0; i < 6; i++){
      data.push(parseInt(Math.random()*75000));
    }
    switchVals(data)
    
  },1050)*/


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