var marginLine = {top: 25, right: 67.5, bottom: 25, left: 25},
  widthLine = 350 - marginLine.left - marginLine.right,
  heightLine = 100 - marginLine.top - marginLine.bottom;

var parseFullDate = d3.time.format("%Y-%m-%d").parse;

var bisectDate = d3.bisector(function(d) { return d.date; }).left;

var xLine = d3.time.scale()
  .range([0, widthLine]);

var xLineAxis = d3.svg.axis()
  .scale(xLine)
  .orient("bottom")
  .ticks(3)
  .tickFormat(d3.time.format("%b"));

var yLineAxis = d3.svg.axis()
  .scale(y)
  .orient("right")
  .ticks(3);

d3.csv("sandbox-ymd-space.csv", type, function(error, data) {
  var spaces = d3.nest()
    .key(function(d) { return d.space; })
    .entries(data);

  xLine.domain([
    d3.min(data, function(d) { return data[0].date; }),
    d3.max(data, function(d) { return data[data.length - 1].date; })
  ]);

  y.domain([
    0, d3.max(spaces, function(s) { return s.values[0].demand + 500; })]
  );

  var svg = d3.select("#loadProfile").selectAll("svg")
    .data(spaces)
    .enter()
    .append("svg")
    .attr("width", widthLine + marginLine.left + marginLine.right)
    .attr("height", heightLine + marginLine.top + marginLine.bottom)
    .append("g")
    .attr("transform", "translate(" + marginLine.left + "," + marginLine.top + ")");

  svg.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(275,-12.5)")
    .call(yLineAxis);

  svg.append("g")
    .attr("class", "x axis")
    .attr()
    .attr("transform", "translate(0," + heightLine + ")")
    .call(xLineAxis);

  svg.append("path")
    .attr("class", "area")
    .attr("d", function(space) {
      return d3.svg.area()
        .x(function(d) { return xLine(d.date); })
        .y1(function(d) { return y(d.demand) - 12.5; })
        .y0(heightLine - 12.5)
        (space.values);
    });

  svg.append("path")
    .attr("class", "line")
    .attr("d", function(space) {
      return d3.svg.line()
        .x(function(d) { return xLine(d.date); })
        .y(function(d) { return y(d.demand) - 12.5; })
        (space.values);
    });

  var focus = svg.append("g")
      .attr("class", "focus")
      .style("display", "none");

  focus.append("circle")
      .attr("r", 4.5);

  focus.append("text")
      .attr("x", 9)
      .attr("dy", ".35em");

  svg.append("rect")
      .attr("class", "overlay")
      .attr("width", widthLine)
      .attr("height", heightLine)
      .on("mouseover", function() { focus.style("display", null); })
      .on("mouseout", function() { focus.style("display", "none"); })
      .on("mousemove", mousemove);

  function mousemove() {
    var x0 = xLine.invert(d3.mouse(this)[0]),
        i = bisectDate(data, x0, 1),
        d0 = data[i - 1],
        d1 = data[i],
        d = x0 - d0.date > d1.date - x0 ? d1 : d0;
    focus.attr("transform", "translate(" + xLine(d.date) + "," + 0 + ")");

    focus.select("text")
      // .text(d.date.toDateString() + " " + d.demand.toFixed(1) + " kW");
      .text(function(space) { 
        return "Space " + space.key + 
          " on " + d.date.toDateString() +  
          ": " + d3.median(space.values, function(d){ return d.demand.toFixed(1); }) + " kW"; 
        });
  }

});

function type(d) {
  d.demand = +d.demand;
  d.date = parseFullDate(d.date);
  return d;
}