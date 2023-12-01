/** 
 * GLOBAL VARIABLES
*/
var gl = {
  svg_0: undefined,
  svg_1: undefined,
  svg_2: undefined,
  tilemap_g_0: undefined,
  tilemap_g_1: undefined,
  tilemap_g_2: undefined,
  tilemap_instances: undefined,
  svg_w: undefined,
  svg_h: undefined,
  double_svg_w: undefined,
  double_svg_h: undefined,
  stateDetails: undefined,
  topojson: undefined,
  d3: undefined,
  tilemap: undefined,
  paired_tilemap: undefined,
  tile_bbox: undefined,
  _: undefined,
  tiles: undefined,
  path: undefined,
  stateCodes: undefined,
  stateNames: undefined,
  sortedStateNames: undefined,
  scaling_factor: undefined,
  orientation_changed: undefined,
  loadQuery: undefined,
  loadPairedQuery: undefined,
  migration_graph: undefined,
  queryNames: undefined
};

//utility function for scaling the TopoJSON

function scale (scaleFactor) {
  return d3.geoTransform({
    point: function(x, y) {
      this.stream.point(
        0.975 * scaleFactor * (x - gl.tile_bbox[0]) + (0.0125 * gl.svg_w), 
        0.975 * scaleFactor * ((gl.tile_bbox[3] - gl.tile_bbox[1]) + -1 * (y - gl.tile_bbox[1])) + (0.0125 * gl.svg_h));
    }
  });
}

//returns a doubly nested array specified by a query field (e.g., "AllQueries", "JobQuery", etc.) and a flowtype ("inbound" | "outbound") 
function loadFlows(query,flowtype) {
  var flows = [];

  gl.stateDetails.forEach(function(state) {
    flows.push({
      'state': state.state,
      'code': state.code
    });
  });

  //converts tabular migration graph into a hierarchical array according to flow direction, with a single query value at each leaf
  var flow_array = d3.nest()
  .key(function(d){
    return (flowtype == 'outbound') ? d.Origin_State : d.Dest_State;
  })
  .sortKeys(d3.ascending)
  .key(function(d){
    return (flowtype == 'outbound') ? d.Dest_State : d.Origin_State;
  })
  .rollup(function(leaves){
    return d3.sum(leaves, function(d) {return (d[query]);});
  })
  .sortKeys(d3.ascending)    
  .entries(gl.migration_graph);

  //computes aggregate number of flows for each state
  for(var i = 0; i < flow_array.length; i++) {
    if (flow_array[i].key != "District of Columbia") {
      var flow_count = 0;
      for (var j = 0; j < flow_array[i].values.length; j++){
        if (flow_array[i].values[j].key != "District of Columbia") {
          flow_count += flow_array[i].values[j].value;
        }
      }
      flows[_.findIndex(flows, { 'state': flow_array[i].key })].count = flow_count;
    }
  }
  return flows;  
}

//loads the TopoJSON structure shared by all tilemaps
function loadTiles() {

  d3.selectAll('svg').append('defs');

  //add containers for each tilemap 
  gl.svg_0 = d3.select('#svg_0');
  gl.tilemap_g_0 = gl.svg_0.append('g')
  .attr('id','tilemap_g_0');

  gl.svg_1 = d3.select('#svg_1');
  gl.tilemap_g_1 = gl.svg_1.append('g')
  .attr('id','tilemap_g_1');

  gl.svg_2 = d3.select('#svg_2');
  gl.tilemap_g_2 = gl.svg_2.append('g')
  .attr('id','tilemap_g_2');

  //add more tilemap SVG containters here as needed
  
  //parse the topoJSON
  d3.json('tiles-topo-us.json', function showData(error, tilegram) {

    if (error) throw (error);

    gl.tiles = topojson.feature(tilegram, tilegram.objects.tiles);
    gl.tile_bbox = tilegram.bbox;
    
    gl.scaling_factor = gl.svg_w / (gl.tile_bbox[2] - gl.tile_bbox[0]);
    gl.svg_h = gl.scaling_factor * (gl.tile_bbox[3] - gl.tile_bbox[1]);

    gl.double_svg_h = window.innerWidth < 506 ? (gl.svg_h * 2) : gl.svg_h;

    gl.path = d3.geoPath()
    .projection(scale(gl.scaling_factor)); 

    //add state prefixes to each tile
    tilegram.objects.tiles.geometries.forEach(function (geometry) {
      if (gl.stateCodes.indexOf(geometry.properties.state) === -1) {
        gl.stateCodes.push(geometry.properties.state);
        gl.stateNames.push(_.find(stateDetails, { 'code': geometry.properties.state }).state);      
      }
    });
    gl.sortedStateNames = [];

    gl.stateNames.forEach(function (d){
      gl.sortedStateNames.push(d);
    });

    gl.sortedStateNames = gl.sortedStateNames.sort()

    d3.select('#location_select_0')
      .on('change', function () {
        if (gl.tilemap_instances[0].selected_dest() == '') {
          gl.changePairedQueryState(0, d3.select(this).property("value"), 'outbound')
        }
        else {
          gl.changePairedQueryState(0, d3.select(this).property("value"), 'inbound')
        }
      })
      .selectAll('option')
      .data(gl.sortedStateNames)
      .enter()
      .append('option')
      .text(function (d) { return d; })
      .property('value', function (d) { return d })
      .property('selected', function (d) { return d === 'Illinois' });
  });

  //bind the parsed TopoJSON to their respective SVG containers (d3.json is a bit slow, hence the interval loop)
  var checkExist = setInterval(function() {
    if (gl.tiles != undefined) {        
      gl.tilemap_g_0.datum(gl.tiles);
      gl.tilemap_g_1.datum(gl.tiles);
      gl.tilemap_g_2.datum(gl.tiles);
      render();    

      clearInterval(checkExist);
    }
  }, 100); // check every 100ms

  //declare the tilemaps and populate the tilemap instance array
  gl.tilemap_instances[0] = paired_tilemap();
  gl.tilemap_instances[1] = tilemap();
  gl.tilemap_instances[2] = tilemap();
  //add more (paired) tilemaps here as needed
  
}

//main rendering function for drawing and updating the tilemaps
function render() {

  //set the dimensions of the tilemaps' SVG containers
  
  gl.svg_0.style('width',gl.double_svg_w + 'px')
          .style('height',gl.double_svg_h + 'px');

  gl.svg_1.style('width',gl.svg_w + 'px')
          .style('height',gl.svg_h + 'px');

  gl.svg_2.style('width',gl.svg_w + 'px')
          .style('height',gl.svg_h + 'px');   

  //update the outgoing animated arcs, should they exist
  d3.selectAll('.outgoing_arc').transition()
  .duration(100)
  .style('animation',function(d) {
    var animation_rate = this.id.substr(-1);
    var origin_state = gl.path.centroid(d3.select('#origin_tile_' + d.origin_state)._groups[0][0].__data__),
        dest_state = gl.path.centroid(d3.select('#origin_tile_' + d.dest_state)._groups[0][0].__data__);

    var west_of_source = (dest_state[0] - origin_state[0]) < 0;
    var south_of_source = (dest_state[1] - origin_state[1]) > 0;
    
    if (west_of_source || south_of_source) {
      return 'reverseflow ' + animation_rate + 's linear infinite';
    }
    else {
      return 'flow ' + animation_rate + 's linear infinite';
    }
  })
  .style('-webkit-animation',function(d) {
    var animation_rate = this.id.substr(-1);
    var origin_state = gl.path.centroid(d3.select('#origin_tile_' + d.origin_state)._groups[0][0].__data__),
        dest_state = gl.path.centroid(d3.select('#origin_tile_' + d.dest_state)._groups[0][0].__data__);

    var west_of_source = (dest_state[0] - origin_state[0]) < 0;
    var south_of_source = (dest_state[1] - origin_state[1]) > 0;

    if (west_of_source || south_of_source) {
      return 'reverseflow ' + animation_rate + 's linear infinite';
    }
    else {
      return 'flow ' + animation_rate + 's linear infinite';
    }
  })
  .attr('d', function(d) {
    var origin_state = gl.path.centroid(d3.select('#origin_tile_' + d.origin_state)._groups[0][0].__data__),
        dest_state = gl.path.centroid(d3.select('#origin_tile_' + d.dest_state)._groups[0][0].__data__);

    var west_of_source = (dest_state[0] - origin_state[0]) < 0;
    var south_of_source = (dest_state[1] - origin_state[1]) > 0;

    dest_state[0] = gl.double_svg_h > gl.double_svg_w ? dest_state[0] : dest_state[0] + gl.svg_w;

    dest_state[1] = gl.double_svg_h > gl.double_svg_w ? dest_state[1] + gl.svg_h : dest_state[1];
            
    var dx = dest_state[0] - origin_state[0],
        dy = dest_state[1] - origin_state[1],
        dr = Math.sqrt(dx * dx + dy * dy)*2;
    if (west_of_source || south_of_source) {
      return "M" + dest_state[0] + "," + dest_state[1] + "A" + dr + "," + dr + " 0 0,1 " + origin_state[0] + "," + origin_state[1];
    }
    return "M" + origin_state[0] + "," + origin_state[1] + "A" + dr + "," + dr + " 0 0,1 " + dest_state[0] + "," + dest_state[1];
  });

  //update the incoming animated arcs, should they exist
  d3.selectAll('.incoming_arc').transition()
  .duration(100)
  .style('animation',function(d) {
    var animation_rate = this.id.substr(-1);
    var origin_state = gl.path.centroid(d3.select('#origin_tile_' + d.origin_state)._groups[0][0].__data__),
        dest_state = gl.path.centroid(d3.select('#origin_tile_' + d.dest_state)._groups[0][0].__data__);

    var west_of_source = (dest_state[0] - origin_state[0]) < 0;
    var south_of_source = (dest_state[1] - origin_state[1]) > 0;

    if (gl.double_svg_h > gl.double_svg_w && west_of_source || gl.double_svg_h < gl.double_svg_w && south_of_source) {
      return 'flow ' + animation_rate + 's linear infinite';
    }
    else {
      return 'reverseflow ' + animation_rate + 's linear infinite';
    }
  })
  .style('-webkit-animation',function(d) {
    var animation_rate = this.id.substr(-1);
    var origin_state = gl.path.centroid(d3.select('#origin_tile_' + d.origin_state)._groups[0][0].__data__),
        dest_state = gl.path.centroid(d3.select('#origin_tile_' + d.dest_state)._groups[0][0].__data__);

    var west_of_source = (dest_state[0] - origin_state[0]) < 0;
    var south_of_source = (dest_state[1] - origin_state[1]) > 0;

    if (gl.double_svg_h > gl.double_svg_w && west_of_source || gl.double_svg_h < gl.double_svg_w && south_of_source) {
      return 'flow ' + animation_rate + 's linear infinite';
    }
    else {
      return 'reverseflow ' + animation_rate + 's linear infinite';
    }
  })
  .attr('d', function(d) {
    var origin_state = gl.path.centroid(d3.select('#origin_tile_' + d.origin_state)._groups[0][0].__data__),
        dest_state = gl.path.centroid(d3.select('#origin_tile_' + d.dest_state)._groups[0][0].__data__);

    var west_of_source = (dest_state[0] - origin_state[0]) < 0;
    var south_of_source = (dest_state[1] - origin_state[1]) > 0;

    dest_state[0] = gl.double_svg_h > gl.double_svg_w ? dest_state[0] : dest_state[0] + gl.svg_w;

    dest_state[1] = gl.double_svg_h > gl.double_svg_w ? dest_state[1] + gl.svg_h : dest_state[1];
            
    var dx = dest_state[0] - origin_state[0],
        dy = dest_state[1] - origin_state[1],
        dr = Math.sqrt(dx * dx + dy * dy)*2;
    if (gl.double_svg_h > gl.double_svg_w && west_of_source || gl.double_svg_h < gl.double_svg_w && south_of_source) {
      return "M" + origin_state[0] + "," + origin_state[1] + "A" + dr + "," + dr + " 0 0,1 " + dest_state[0] + "," + dest_state[1];
    }
    return "M" + dest_state[0] + "," + dest_state[1] + "A" + dr + "," + dr + " 0 0,1 " + origin_state[0] + "," + origin_state[1];
  });

  gl.tilemap_g_0.call(gl.tilemap_instances[0]);             
  gl.tilemap_g_1.call(gl.tilemap_instances[1]);
  gl.tilemap_g_2.call(gl.tilemap_instances[2]);

}

//initialization upon load
window.addEventListener('load', function() {
  var single_w = d3.select('.single').style('width').indexOf('p');
  gl.svg_w = +d3.select('.single').style('width').substr(0,single_w);

  var double_w = d3.select('.double').style('width').indexOf('p');
  gl.double_svg_w = +d3.select('.double').style('width').substr(0,double_w);
 
  gl.stateDetails = window.stateDetails;
  gl.topojson = window.topojson;
  gl.d3 = window.d3;
  gl.tilemap = window.tilemap;
  gl.paired_tilemap = window.paired_tilemap;
  gl._ = window._;
  gl.stateCodes = [];
  gl.stateNames = [];
  gl.tilemap_instances = [];

  gl.queryNames = [
    { field: 'AllQueries', label: 'all housing and job searches'},
    { field: 'HousingQuery', label: 'housing searches'},
    { field: 'HousingRent', label: 'rental housing searches'},
    { field: 'HousingBuy', label: 'housing purchase searches'},
    { field: 'HousingApartment', label: 'apartment searches'},
    { field: 'HousingCondo', label: 'condominium searches'},
    { field: 'HousingDuplex', label: 'duplex searches'},
    { field: 'HousingTownhouse', label: 'townhouse searches'},
    { field: 'HousingHouse', label: 'house searches'},
    { field: 'HousingHome', label: 'home searches'},
    { field: 'JobQuery', label: 'job searches'},
    { field: 'JobArchitectureEngineering', label: 'architecture / engineering job searches'},
    { field: 'JobArt', label: 'art job searches'},
    { field: 'JobBusiness', label: 'business job searches'},
    { field: 'JobConstruction', label: 'construction job searches'},
    { field: 'JobEducation', label: 'education job searches'},
    { field: 'JobFinance', label: 'finance job searches'},
    { field: 'JobFood', label: 'food job searches'},
    { field: 'JobHealthcare', label: 'healthcare job searches'},
    { field: 'JobLeisureHospitality', label: 'leisure / hospitality job searches'},
    { field: 'JobManufacturing', label: 'manufacturing job searches'},
    { field: 'JobRetail', label: 'retail job searches'},
    { field: 'JobScience', label: 'science job searches'},
    { field: 'JobTechnology', label: 'technology job searches'},
    { field: 'JobTransportation', label: 'transportation job searches'},
    { field: 'HousingJobRatio', label: 'ratio of housing searches to job searches'}
  ];  	

  //load the migration graph (d3.tsv can be slow)
  d3.tsv('data/graph.tsv',function(error,data) {
    if (error) throw (error);

    gl.migration_graph = data;
    
  });
  
  d3.select('#query_select_0')
    .on('change', function(){
      gl.loadPairedQuery(0,d3.select(this).property("value"));
    })
    .selectAll('option')
    .data(gl.queryNames)
    .enter()
    .append('option')
    .text(function(d) { return d.label; })
    .property('value', function (d) { return d.field; })
    .property('selected', function (d) { return d.field === 'AllQueries' });

  d3.select('#query_select_1')
    .on('change', function () {
      gl.loadQuery(1, d3.select(this).property("value"), "outbound", d3.select('#query_cb_1').property("checked"));
    })
    .selectAll('option')
    .data(gl.queryNames.slice(0, 25))
    .enter()
    .append('option')
    .text(function (d) { return d.label; })
    .property('value', function (d) { return d.field; })
    .property('selected', function (d) { return d.field === 'AllQueries' });

  d3.select('#query_cb_1')
    .on('change', function () {
      gl.loadQuery(1, d3.select('#query_select_1').property("value"), "outbound", d3.select(this).property("checked"));
    });

  d3.select('#query_select_2')
    .on('change', function () {
      gl.loadQuery(2, d3.select(this).property("value"), "inbound",false)
    })
    .selectAll('option')
    .data(gl.queryNames.slice(0,25))
    .enter()
    .append('option')
    .text(function (d) { return d.label; })
    .property('value', function (d) { return d.field; })
    .property('selected', function (d) { return d.field === 'AllQueries' });

  d3.select('#flowtype_select_0')
    .on('change', function () {
      if (d3.select(this).property("value") == 'outbound'){
        gl.changePairedQueryState(0, gl.tilemap_instances[0].selected_dest(), 'outbound');        
      }
      else {
        gl.changePairedQueryState(0, gl.tilemap_instances[0].selected_origin(), 'inbound');       
      }
    })
    .selectAll('option')
    .data([
      { field: 'outbound', label: 'originating from' },
      { field: 'inbound', label: 'about' }
    ])
    .enter()
    .append('option')
    .text(function(d) { return d.label; })
    .property('value', function (d) { return d.field; })
    .property('selected',function(d) { return d === 'originating from' });

  //query function that can be called from the console for updating static tilemap instances 
  // requires a tilemap index, a query (a column name in data/graph.tsv), and a direction (inbound / outbound) 
  //
  //usage example 1: gl.loadQuery(1,"JobTechnology","outbound",false)
  //usage example 2: gl.loadQuery(2,"HousingQuery","inbound",false)
  //
  gl.loadQuery = function(tilemap,query,flowtype,normalize){      
    
    gl.tilemap_instances[tilemap].results(loadFlows(query,flowtype));
    gl.tilemap_instances[tilemap].flowtype(flowtype);
    gl.tilemap_instances[tilemap].normalize(normalize);

    render();    
   
  };

  gl.loadPairedQuery = function(tilemap, query) {

    gl.tilemap_instances[tilemap].query(query);

    for (var i = 0; i < gl.queryNames.length; i++) {
      if (gl.queryNames[i].field === query) {
        console.log(i);
        d3.select("#query_select_" + tilemap)
          .property('selectedIndex', i);
      }
    }

    render();

  };

  gl.changePairedQueryState = function(tilemap,state,flowtype) {
    if (flowtype == "outbound") {
      gl.tilemap_instances[tilemap].selected_origin(state);
      gl.tilemap_instances[tilemap].selected_dest("");
    }
    else {
      gl.tilemap_instances[tilemap].selected_origin("");
      gl.tilemap_instances[tilemap].selected_dest(state);
    }
    
    render();

  }
  
  loadTiles();

  // some initial queries that occur 500ms after on page load
  // slight delay to accommodate the slowness of d3.tsv
  setTimeout(function(){
    // Hide the address bar!
    gl.loadQuery("1","AllQueries","outbound",false);
    gl.loadQuery("2","AllQueries","inbound",false);
  }, 500);   

  d3.selectAll('.single')
    .style('position','absolute')
    .style('margin-top','-100%')
    .style('margin-left', '-100%');

});

//function to specify what happens when resizing the page, 
//including change of orientation from portrait to landscape on mobile
window.onresize = function(e) {  

  var single_w = d3.select('.single').style('width').indexOf('p');
  gl.svg_w = +d3.select('.single').style('width').substr(0,single_w);

  var double_w = d3.select('.double').style('width').indexOf('p');
  gl.double_svg_w = +d3.select('.double').style('width').substr(0,double_w);

  gl.scaling_factor = gl.svg_w / (gl.tile_bbox[2] - gl.tile_bbox[0]);
  gl.svg_h = gl.scaling_factor * (gl.tile_bbox[3] - gl.tile_bbox[1]);

  gl.path = d3.geoPath()
  .projection(scale(gl.scaling_factor)); 

  //check the orientation of the display
  var checkOrientation = setInterval(function() {

    gl.orientation_changed = false;
    if (window.innerWidth < 506 && gl.double_svg_h <= gl.svg_h) {
      orientation_changed = false;
      gl.double_svg_h = (gl.svg_h * 2);    
      render();
    }
    else if (window.innerWidth >= 506 && gl.double_svg_h != gl.svg_h) {
      orientation_changed = false;
      gl.double_svg_h = gl.svg_h; 
      render(); 
    }
    else {
      orientation_changed = true;
      render();
      clearInterval(checkOrientation);
    }
  }, 100);

};