tilemap = function() {

  //paremeterizable tilemap properties (getter/setter functions follow)
  var params = {},
      results = [],
      flowtype = 'outbound',
      color_scale_max = 1,
      normalize = false,
      color_scale = d3.scaleLinear();

  function tilemap (selection) {
    selection.each(function(data){

      var this_tilemap = d3.select(this);

      var formatComma = d3.format(",");

      //normalize by 100k population
      if (normalize) {
        results.forEach(function (d) {
          d.population = _.find(stateDetails, { 'code': d.code }).population / 100000;
          d.normalized_count = Math.round(d.count / d.population);
        });
      }

      //determine the new maximum value among the query results
      color_scale_max = (results.length == 0) ? 1 : d3.max(results, function(d) { 
        return normalize ? d.normalized_count : d.count;
      });

      //update the color scale
      color_scale.domain([0,(color_scale_max / 2),color_scale_max])
      .range(flowtype == "outbound" ? [d3.lab("#fee0d2"),d3.lab("#fc9272"),d3.lab("#de2d26")] : [d3.lab("#deebf7"),d3.lab("#9ecae1"),d3.lab("#3182bd")])
      .interpolate(d3.interpolateLab)
      .nice();
      
      var parent_svg = this_tilemap._groups[0][0].parentElement;
      
      //enter the legend 
      var legend = this_tilemap.selectAll('.legend')
      .data([null]);
      
      var legend_enter = legend.enter()
      .append("g")
      .attr('class','legend')
      .attr('transform', function(){
        var w = parent_svg.style.width.indexOf('p');
        var h = parent_svg.style.height.indexOf('p');
        return 'translate(' + (+parent_svg.style.width.substr(0,w) / 3) + ',' + (+parent_svg.style.height.substr(0,h) / 16) + ')';
      });

      //enter the legend gradient
      var defs = d3.select("#" + parent_svg.id).select('defs');

      var linear_gradient = defs.selectAll('.linear_gradient')
      .data([null]);

      var linear_gradient_enter = linear_gradient.enter()
      .append('linearGradient')
      .attr('id',parent_svg.id + '_gradient')
      .attr('class','linear_gradient')
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

      linear_gradient_enter.append('stop')
      .attr('class','linear_gradient_start')
      .attr('offset', '0%')
      .attr('stop-color',  d3.lab('#fee0d2'));

      linear_gradient_enter.append('stop')
      .attr('class','linear_gradient_mid')
      .attr('offset', '50%')
      .attr('stop-color', (results.length == 0) ?  d3.lab('#fee0d2') : (flowtype == "outbound") ? d3.lab("#fc9272") : d3.lab("#9ecae1"));

      linear_gradient_enter.append('stop')
      .attr('class','linear_gradient_end')
      .attr('offset', '100%')
      .attr('stop-color', (results.length == 0) ?  d3.lab('#fee0d2') : (flowtype == "outbound") ? d3.lab("#de2d26") : d3.lab("#3182bd"));

      var linear_gradient_update = linear_gradient;

      linear_gradient_update.select('.linear_gradient_start')
      .attr('stop-color', (results.length == 0) ?  d3.lab('#fee0d2') : (flowtype == "outbound") ? d3.lab("#fee0d2") : d3.lab("#deebf7"));

      linear_gradient_update.select('.linear_gradient_mid')
      .attr('stop-color', (results.length == 0) ?  d3.lab('#fee0d2') : (flowtype == "outbound") ? d3.lab("#fc9272") : d3.lab("#9ecae1"));

      linear_gradient_update.select('.linear_gradient_end')
      .attr('stop-color', (results.length == 0) ?  d3.lab('#fee0d2') : (flowtype == "outbound") ? d3.lab("#de2d26") : d3.lab("#3182bd"));

      legend_enter.append('rect')
      .attr('id', parent_svg.id + '_legend_swatch')
      .attr('rx', 5)
      .attr('width', function() {
        var w = parent_svg.style.width.indexOf('p');
        return +parent_svg.style.width.substr(0,w) / 3;
      })
      .attr('height', function() {
        var h = parent_svg.style.height.indexOf('p');
        return +parent_svg.style.height.substr(0,h) / 16;
      })      
      .attr('fill',function(){
        return "url(#" + parent_svg.id +"_gradient)"; 
      });

      legend_enter.append('text')
      .attr('class','legend_text')
      .text('1')
      .attr('text-anchor', "start")
      .attr('dy','-0.2em');

      legend_enter.append('text')
      .attr('class','legend_text')
      .attr('id','legend_text_end')
      .text((results.length == 0) ? 1 : (formatComma(color_scale.domain()[2]) + (normalize ? ' (per 100k)' : '')))
      .attr('text-anchor', "end")
      .attr('dy','-0.2em')
      .attr('transform', function(){
        var w = parent_svg.style.width.indexOf('p');
        return 'translate(' + (+parent_svg.style.width.substr(0,w) / 3) + ',0)';
      });

      //update the legend
      var legend_update = this_tilemap.selectAll('.legend')
      .attr('transform', function(){
        var w = parent_svg.style.width.indexOf('p');
        var h = parent_svg.style.height.indexOf('p');
        return 'translate(' + (+parent_svg.style.width.substr(0,w) / 3) + ',' + (+parent_svg.style.height.substr(0,h) / 16) + ')';
      });

      legend_update.select('rect')
      .attr('width', function() {
        var w = parent_svg.style.width.indexOf('p');
        return +parent_svg.style.width.substr(0,w) / 3;
      })
      .attr('height', function() {
        var h = parent_svg.style.height.indexOf('p');
        return +parent_svg.style.height.substr(0,h) / 16;
      });

      legend_update.select('#legend_text_end')
      .text((results.length == 0) ? 1 : (formatComma(color_scale.domain()[2]) + (normalize ? ' (per 100k)' : '')))
      .attr('transform', function(){
        var w = parent_svg.style.width.indexOf('p');
        return 'translate(' + (+parent_svg.style.width.substr(0,w) / 3) + ',0)';
      });
      
      //enter the tiles
      var tiles = this_tilemap.selectAll(".tile")
      .data(data.features, function(d) {
        return d.properties.state;
      }); 

      var tiles_enter = tiles.enter()
      .append("g")
      .attr("class","tile")
      .style('cursor', 'pointer')
      .attr("id", function (d) {
        return "tile_" + d.properties.state;
      });

      tiles_enter.append('path')
      .attr('d', gl.path)
      .attr('class', 'border')
      .attr('fill', '#fee0d2')
      .attr('stroke', '#222222')
      .attr('stroke-width', gl.scaling_factor * 4)
      .on('click', function (d, i) {
        d3.event.preventDefault(); 
        console.log(d);
        console.log('stateCodes[i]', gl.stateCodes[i]);
        console.log('stateNames[i]', gl.stateNames[i]);
      })
      .on('mouseover', function (d, i) {
        d3.event.preventDefault();

        hoverTile(d3.event.path[1].getBBox(), d3.select(this).attr('d'), d, i);
      })
      .on('mouseout', function (d) {
        d3.event.preventDefault();

        d3.select('#tooltip_' + d.properties.state).remove();
      });

      tiles_enter.append('text')
      .attr('class', function (d) {
        return 'state-label state-label-' + d.id;
      })
      .attr('transform', function (d) {
        return 'translate(' + gl.path.centroid(d) + ')';
      })
      .attr('dy', '.35em')
      .style('font-size', (gl.scaling_factor * 1.25) + 'em')
      .text(function (d) {
        return d.properties.state;
      });

      //update the tiles
      var tiles_update = tiles.transition()
      .duration(500);

      tiles_update.selectAll('path')
      .attr('d', gl.path)
      .attr('fill', function (d) {
        if (results.length != 0) {
          return normalize ? color_scale(_.find(results, { 'code': d.properties.state }).normalized_count) : color_scale(_.find(results, { 'code': d.properties.state }).count);
        }
        else {
          return color_scale(0);
        }
      });

      tiles_update.selectAll('text')
      .style('font-size', (gl.scaling_factor * 1.25) + 'em')
      .attr('transform', function (d) {
        return 'translate(' + gl.path.centroid(d) + ')';
      });

      function hoverTile(target, path, d, i) {

        var tooltip = this_tilemap.append('g')
          .attr('class', 'tooltip')
          .attr('id', 'tooltip_' + d.properties.state);

        tooltip.append('path')
          .attr('d', path)
          .attr('fill', 'none')
          .attr('stroke-width', gl.scaling_factor * 4)
          .attr('stroke', (flowtype == 'outbound') ? 'tomato' : 'cornflowerblue');

        tooltip.append('rect')
          .attr('rx', 5)
          .attr('width', target.width * 2)
          .attr('height', target.height)
          .attr('x', (target.x < target.width) ? target.x : target.x - target.width * 0.5)
          .attr('y', ((target.y < target.height) ? target.y + target.height : target.y - target.height))
          .attr('transform',function(){
            if (d.properties.state == 'ME' || d.properties.state == 'RI') {
              return 'translate(' + (-0.5 * target.width) + ',0)';
            }
          })
          .attr('fill', '#333')
          .attr('stroke-width', gl.scaling_factor * 4)
          .attr('stroke', (flowtype == 'outbound') ? 'tomato' : 'cornflowerblue');

        var hover_state_name = _.find(stateDetails, { 'code': d.properties.state }).state;

        var ranked_results = normalize ? _.sortBy(results, ['normalized_count']).reverse() : _.sortBy(results, ['count']).reverse();
        var hover_index = _.findIndex(ranked_results, { 'state': hover_state_name });

        var tooltip_text = tooltip.append('text')
          .attr('class', 'tooltip_text')
          .attr('y', ((target.y < target.height) ? target.y + target.height : target.y - target.height))
          .style('font-size', (gl.scaling_factor * 1.05) + 'em')
          .attr('transform', function () {
            if (d.properties.state == 'ME' || d.properties.state == 'RI') {
              return 'translate(' + (-0.5 * target.width) + ',0)';
            }
          });

        tooltip_text.append('tspan')
          .attr('x', (target.x < target.width) ? target.x : target.x - target.width * 0.5)
          .attr('dx', '0.3em')
          .attr('dy', '1.3em')
          .text(normalize ? formatComma(_.find(results, { 'code': d.properties.state }).normalized_count) + ' s. per 100k': formatComma(_.find(results, { 'code': d.properties.state }).count) + ' searches');

        tooltip_text.append('tspan')
          .attr('x', (target.x < target.width) ? target.x : target.x - target.width * 0.5)
          .attr('dx', '0.3em')
          .attr('dy', '1.3em')
          .text(((flowtype == 'outbound') ? 'from ' : 'about ') + d.properties.state + '.');

        tooltip_text.append('tspan')
          .attr('x', (target.x < target.width) ? target.x : target.x - target.width * 0.5)
          .attr('dx', '0.3em')
          .attr('dy', '1.3em')
          .text('Rank: ' + (hover_index + 1) + ' of 50.');

      }

    });
  }

  //getter / setter functions for tilemap properties

  tilemap.params = function (x) {
    if (!arguments.length) {
      return params;
    }
    params = x;
    return tilemap;
  };

  tilemap.results = function (x) {
    if (!arguments.length) {
      return results;
    }
    results = x;
    return tilemap;
  };

  tilemap.flowtype = function (x) {
    if (!arguments.length) {
      return flowtype;
    }
    flowtype = x;
    return tilemap;
  };

  tilemap.normalize = function (x) {
    if (!arguments.length) {
      return normalize;
    }
    normalize = x;
    return tilemap;
  };

  return tilemap;

};