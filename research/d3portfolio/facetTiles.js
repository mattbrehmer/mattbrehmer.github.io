var margin = {top: 25, right: 25, bottom: 25, left: 75},
  width = 600 - margin.left - margin.right,
  height = 100 - margin.top - margin.bottom;

var parseDate = d3.time.format("%m").parse;

var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];

var color = d3.scale.quantize()
  .domain([0,2000])
  .range(d3.range(9).map(function(d) { return "q" + d + "-9"; }));

var x = d3.time.scale()
  .range([0, width]);

var y = d3.scale.linear()
  .range([height, 0]);

var xAxis = d3.svg.axis()
  .scale(x)
  .orient("bottom")
  .ticks(12)
  .tickFormat(d3.time.format("%b"));

var yAxis = d3.svg.axis()
  .scale(y)
  .orient("left");

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
  return "<strong>Space:</strong> " + d.space + 
    "<br/><strong>Date: </strong>" + monthNames[d.date.getMonth()] + " 2013" + 
    "<br/><strong>Max:</strong> " + d.maxDemand.toFixed(1) + "kW" + 
    "<br/><strong>Avg:</strong> " + d.demand.toFixed(1) + "kW" + 
    "<br/><strong>Min:</strong> " + d.minDemand.toFixed(1) + "kW";
  })

d3.csv("sandbox-m-space.csv", type, function(error, data) {

  var spaces = d3.nest()
    .key(function(d) { return d.space; })
    .entries(data);

  x.domain([
    d3.min(spaces, function(s) { return s.values[0].date; }),
    d3.max(spaces, function(s) { return s.values[s.values.length - 1].date; })
  ]);

  var svg = d3.select("#colorStock").selectAll("svg")
    .data(spaces)
    .enter()
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("class", "RdSeq9")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
  svg.append("g")
    .attr("class", "x axis")
    .attr()
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  svg.append("g")
    .append("text")
    .attr("x", - 50)
    .attr("y", 0)
    .attr("dy", ".71em")
    .attr("text-anchor", "start")
    .attr("font-size", "1.1em")
    .text(function(d) { return d.key});

  svg.selectAll()
    .data(function(d) {return d.values;})
    .enter()
    .append("rect")
    .attr("x", function(d) { return x(d.date) - 12.5; })
    .attr("width", 25)
    .attr("y", 0)
    .attr("height", 25)
    .attr("class", function(d) { return "day " + color(d.demand); })
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide)
    .call(tip);

  svg.selectAll()
    .data(function(d) {return d.values;})
    .enter()
    .append("rect")
    .attr("x", function(d) { return x(d.date) - 12.5; })
    .attr("width", 25)
    .attr("y", -12.5)
    .attr("height", 12.5)
    .attr("class", function(d) { return "day " + color(d.maxDemand); })
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide)
    .call(tip);

  svg.selectAll()
    .data(function(d) {return d.values;})
    .enter()
    .append("rect")
    .attr("x", function(d) { return x(d.date) - 12.5; })
    .attr("width", 25)
    .attr("y", 25)
    .attr("height", 12.5)
    .attr("class", function(d) { return "day " + color(d.minDemand); })
    .on('mouseover', tip.show)
    .on('mouseout', tip.hide)
    .call(tip);

});

function type(d) {
  d.demand = +d.demand;
  d.minDemand = +d.minDemand;
  d.maxDemand = +d.maxDemand;
  d.date = parseDate(d.date);
  return d;
}