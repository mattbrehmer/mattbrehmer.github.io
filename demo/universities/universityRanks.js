/**

UniversityRanks

A visual summary of univeristy rankings
Data from QS topuniversities.com

by Matt Brehmer / @mattbrehmer

December - January 2014

**/

//track horizontal and vertical scrolling
window.pos = function() {
  if (window.scrollX != null && window.scrollY != null) 
    return { x: window.scrollX, y : window.scrollY };
  else 
    return { x: document.body.parentNode.scrollLeft, 
             y: document.body.parentNode.scrollTop };
};

//keep header panel fixed to top but not left
window.onscroll = function(e){
  document.getElementById('header_panel')
          .style.top = window.pos().y + 'px';
};

//initialize dimensions
var margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = window.innerWidth - 35,
    height = 10000;

//initialize scales
var x = d3.scale.ordinal(),
    y = d3.scale.linear(), //scales for each dimension
    z = d3.scale.linear(), //scale for bar charts
    country_scale = d3.scale.ordinal(); //ordinal scale for country

//initialize dispatch for highlighting selections from dropdowns
var dispatch = d3.dispatch("highlight");                  

//initialize main svg area
var main_svg = d3.select("body")
                 .append("svg")
                 .attr("id", "main_panel")
                 .attr("width", width)
                 .attr("height", height);

//initialize header svg
var header_svg = d3.select("body")
                   .append("svg")
                   .attr("id", "header_panel")
                   .attr("width", width)
                   .attr("height", 25); 

//initialize filter div
var filter_div = d3.select("body")
                   .append("div") 
                   .attr("id", "filter_div");                     

//initialize footer svg
var footer_svg = d3.select("body")
                   .append("svg")
                   .attr("id", "footer_panel")
                   .attr("width", width)
                   .attr("height", 25) ;    

//initialize tooltip svg
var tooltip_svg = d3.select("body")
                    .append("svg")
                    .attr("id", "tooltip_panel")
                    .attr("class", "tooltip")
                    .attr("width", 160)
                    .attr("height", 120);                 

//tooltip text and link fields
tooltip_svg.append("text")
           .attr("dy", "0.9em")
           .attr("dx", "0.3em")
           .attr("class","institution")
           .attr("id","tooltip_institution");                                                

tooltip_svg.append("text")
           .attr("dy", "1.9em")
           .attr("dx", "0.3em")
           .attr("class","country")
           .attr("id","tooltip_country");                                                

tooltip_svg.append("text")
          .attr("dy", "3.9em")
          .attr("dx", "0.3em")
          .attr("id","tooltip_size");                                                                                              

tooltip_svg.append("text")
          .attr("dy", "4.9em")
          .attr("dx", "0.3em")
          .attr("id","tooltip_focus");  

tooltip_svg.append("text")
           .attr("dy", "5.9em")
           .attr("dx", "0.3em")
           .attr("id","tooltip_research");   

tooltip_svg.append("text")
          .attr("dy", "6.9em")
          .attr("dx", "0.3em")
          .attr("id","tooltip_age");                

tooltip_svg.append("text")
          .attr("dy", "8.9em")
          .attr("dx", "0.3em")
          .attr("id","tooltip_rank");   

tooltip_svg.append("text")
          .attr("dy", "9.9em")
          .attr("dx", "0.3em")
          .attr("id","tooltip_score");                                            

var about_visible = false;              

var about_panel = d3.select("body")
                    .append("div") 
                    .attr("id", "about_panel")    
                    .style("display",'none')
                    .on("click", function() {
                      about_visible = false;
                      d3.select(this).style("display","none");
                    })                                                  
                    .html('<strong>UniversityRanks</strong> is an interactive visualization by @<a href="https://twitter.com/mattbrehmer">mattbrehmer</a> for comparing multiple university rankings. ' + 
                      'The data visualized here represents the 402 univiersities ranked between 2012 and 2014 by <a href="http://www.topuniversities.com/">QS Top Universities</a>. ' + 
                      '<br/><br/><strong>Visual Encoding</strong>: Each column is associated with a year. Each cell containing a bar corresponds to a score. The vertical position of a cell encodes its rank among other universities ranked that year. ' + 
                      'The bars in each cell encode the score itself.<br/><br/>The first column is unique in that it encodes the average rank and score over the past 3 years. ' + 
                      '<br/><br/>The columns are of unequal size because: (1) not all of the universities were ranked each year; and (2) some years have more ties than others. ' + 
                      '<br/><br/><strong>Interaction</strong>: Hover over a university to highlight the ranks and scores across all of the years, and to see details about the univiersity (such as country, size, and research focus) in the panel at the lower left. ' + 
                      '<br/><br/>You can also hover over any cell. ' + 
                      'Clicking on a cell makes the highlighting persist, which can facilitate comparisons between universities. Clicking again removes the highlight. ' +
                      '<br/><br/><strong>Metadata Filtering</strong>: Select a sountry, institution size, research level, focus level, or institution age from the dropdown boxes in the lower left to filter the list of universities (filtering maintains the relative rank positions of scores). ' +
                      '<br/><br/>(Click anywhere in this panel to close it.)');
              
//create an array of known rank dimensions              
var rank_data = ["score_2014", 
                "score_2013",
                "score_2012"]

//load the data from csv
d3.csv("qsScores.csv", function(error, data) { 

  // Extract the list of dimensions and create a scale for each.
  // dimensions are scores from review publications
  x.domain(dimensions = d3.keys(data[0]).filter(function(d) {
    return rank_data.indexOf(d) != -1;
  }));

  //determine cell size based on the number of dimensions
  var cell_width = width / (dimensions.length + 3 );
  var cell_height = 16;

  x.rangePoints([cell_width * 2.5, 
    cell_width * 2.5 + dimensions.length * cell_width], 1);  

  //specify range and domain of bar charts based on cell width
  y.range([0,height - 100])
   .domain([0,data.length - 1]);

  //specify range and domain of bar charts based on cell width
  z.range([0,cell_width / 1.5])
   .domain([0,100]);

  //specify country scale domain
  country_scale.domain(data.map( function (d) { 
    return d.country; 
  }));

  /**

  HEADER

  **/

  //append container containing column heads to header panel
  var header = header_svg.append("g")
                         .attr("class","header");

  //append title to header                       
  header.append("text")
        .attr("class","title")
        .attr("dy", "0.7em")
        .text(function() {
          if (width >= 1400) 
            return "UniversityRanks";
          else 
            return "UR"; //short version for small windows
        });

  //append subtitle to header
  header.append("text")
        .attr("class","subtitle")
        .attr("dy", "2.1em")
        .text(function() {
          if (width >= 1400) 
            return "a visual summary of university rankings";
          else 
            return "university rankings"; //short version for small windows
        });
     
  //append institution column head to header
  header.append("text")
        .attr("text-anchor", "end")
        .attr("class","institution")
        .attr("dy", "0.9em")
        .text("Institution")
        .style("pointer-events", "none")
        .attr("transform", function() { 
          return "translate(" + (1.75 * cell_width) + ",0)"; 
        }); 

  //append album column head to header
  header.append("text")
        .attr("class","country")
        .attr("text-anchor", "end")
        .attr("dy", "2em")
        .text("Country")
        .style("pointer-events", "none")
        .attr("transform", function() { 
          return "translate(" + (1.75 * cell_width) + ",0)"; 
        });     

  //append rank to header
  header.append("text")
            .attr("class","index")
            .attr("text-anchor", "end")
            .attr("dy", "1.2em")
            .text(function(d, i) {
              if (width >= 1400) 
                return "rank";
              else 
                return ""; //don't show in small windows
            })
            .attr("transform", function(d, i) { 
              return "translate(" + (1.87 * cell_width) + ",0)"; 
            }); 

  //append column heads
  header.append("text")
        .attr("class","column")
        .attr("dy", "1.2em")            
        .attr("transform", function(d,i) { 
          return "translate(" + (2 * cell_width) + ",0)"; 
        })
        .text("average score");        

  //append column heads to header, one for each year
  header.selectAll("column")
        .data(dimensions)
        .enter()
        .append("g")
        .append("text")
        .attr("class","column")
        .attr("dy", "1.2em")            
        .attr("transform", function(d,i) { 
          return "translate(" + (3 * cell_width + i * cell_width) + ",0)"; 
        })
        .text(function(d) { 
          return d; 
        });

  /**

  MAIN BODY

  **/     

  //append "table" of rows containing data to main panel
  var table = main_svg.append("g")
                      .attr("class","table")
                      .attr("transform", function(d, i) { 
                        return "translate(0," + 35 + ")"; 
                      });

  var selected_row = null;                    

  //append rows to the table, one for each datum
  var row = table.selectAll("row")
                 .data(data)
                 .enter()
                 .append("g")
                 .attr("class", "row")
                 .on("mouseover", function(d,i) { //specify tooltip behaviour 
                  d3.select("#tooltip_institution")
                    .transition()
                    .text(d.institution);                  
                  d3.select("#tooltip_country")
                    .transition()
                    .text("Country: " + d.country);                  
                  d3.select("#tooltip_focus")
                    .transition()
                    .text("Focus: " + d.focus);
                  d3.select("#tooltip_size")
                    .transition()
                    .text("Institution Size: " + d.size);
                  d3.select("#tooltip_research")
                    .transition()
                    .text("Research: " + d.research);
                  d3.select("#tooltip_age")
                    .transition()
                    .text("Age: " + d.age);
                  d3.select("#tooltip_rank")
                    .transition()
                    .text("Rank / 2014: " + ((d.rank_14 != '') ? d.rank_14 : 'N/A') + "; " + 
                          "2013: " + ((d.rank_13 != '') ? d.rank_13 : 'N/A') + "; " + 
                          "2012: " + ((d.rank_12 != '') ? d.rank_12 : 'N/A'));
                  d3.select("#tooltip_score")
                    .transition()
                    .text("Score / 2014: " + ((d.score_2014 != '') ? d.score_2014 : 'N/A') + "; " + 
                          "2013: " + ((d.score_2013 != '') ? d.score_2013 : 'N/A') + "; " + 
                          "2012: " + ((d.score_2012 != '') ? d.score_2012 : 'N/A'));    
                })
                 .on("mouseenter", function(d,i) {
                  if (selected_row != d.institution) {             
                    d3.select('.table').selectAll(".row").sort(function (a, b) { // select the parent and sort the path's
                        if (a.institution != d.institution && a.institution != selected_row) return -1;               // a is not the hovered element, send "a" to the back
                        else return 1;                             // a is the hovered element, bring "a" to the front
                    });
                    d3.select(this) //highlight corresponding row of cells 
                      .selectAll("rect")
                      .transition()
                      .duration(200)
                      .style("stroke", "#de2d26");
                    d3.select(this)
                      .selectAll("rect.value")
                      .transition()
                      .duration(200)
                      .style("fill", "#fcbba1")
                      .style("stroke", "#de2d26");
                    d3.select(this)
                      .selectAll("text.institution")
                      .style("fill", "#de2d26");
                    d3.select(this)
                      .selectAll("text.country")
                      .style("fill", "#de2d26");
                    d3.select(this)
                      .selectAll("line.link_line")
                      .style("opacity", "1")
                      .style("stroke", "#de2d26");
                  }
                })
              .on("click", function(d,i) { //specify tooltip behaviour
                  if (selected_row == null) {
                    selected_row = d.institution;
                    d3.select('.table').selectAll(".row").sort(function (a, b) { // select the parent and sort the path's
                        if (a.institution != d.institution && a.institution != selected_row) return -1;               // a is not the hovered element, send "a" to the back
                        else return 1;                             // a is the hovered element, bring "a" to the front
                    });
                    d3.select(this) //highlight corresponding row of cells 
                      .selectAll("rect")
                      .transition()
                      .duration(200)
                      .style("stroke", "#54278f");
                    d3.select(this)
                      .selectAll("rect.value")
                      .transition()
                      .duration(200)
                      .style("fill", "#bcbddc")
                      .style("stroke", "#54278f");                    
                    d3.select(this)
                      .selectAll("text.institution")
                      .style("fill", "#54278f");
                    d3.select(this)
                      .selectAll("text.country")
                      .style("fill", "#54278f");
                    d3.select(this)
                      .selectAll("line.link_line")
                      .style("opacity", "1")
                      .style("stroke", "#54278f");
                  }
                  else if (selected_row == d.institution){
                    selected_row = null;
                    d3.select(this) //highlight corresponding row of cells 
                      .selectAll("rect")
                      .transition()
                      .duration(200)
                      .style("stroke", "#bbb");
                    d3.select(this)
                      .selectAll("rect.value")
                      .transition()
                      .duration(200)
                      .style("fill", "#ccc")
                      .style("stroke", "#bbb");                    
                    d3.select(this)
                      .selectAll("text.institution")
                      .style("fill", "#000");
                    d3.select(this)
                      .selectAll("text.country")
                      .style("fill", "#666");
                    d3.select(this)
                      .selectAll("line.link_line")
                      .style("opacity", "1")
                      .style("stroke", "#bbb");
                  }
                })
                .on("mouseleave", function(d,i) {  //undo mouseenter events                    
                  if (selected_row != d.institution) {                      
                    d3.select(this)
                      .selectAll("rect")
                      .transition()
                      .delay(100)
                      .duration(200)
                      .style("z-index", "0")
                      .style("stroke", "#bbb");
                    d3.select(this)
                      .selectAll("rect.value")
                      .transition()
                      .delay(100)
                      .duration(200)
                      .style("fill", "#ccc")
                      .style("stroke", "#bbb");                    
                    d3.select(this)
                      .selectAll("text.institution")
                      .style("fill", "#000");
                    d3.select(this)
                      .selectAll("text.country")
                      .style("fill", "#666");
                    d3.select(this)
                      .selectAll("line.link_line")
                      .style("opacity", "0.25")
                      .style("stroke", "#bbb");
                  }
                });

  //append row header to each row to contain institution
  var row_header = row.append("g")
                      .attr("class","row_header");  

  //append institution name to row header
  row_header.append("text")
            .attr("text-anchor", "end")
            .attr("class","institution")
            .attr("dy", "0.9em")
            .text(function(d) { 
              return d.institution; 
            })                            
            .attr("y", function(d,i) {
              return y(i);
            })
            .attr("transform", function(d, i) { 
              return "translate(" + (1.75 * cell_width) + ",0)"; 
            });

  //append institution name to row header
  row_header.append("text")
            .attr("text-anchor", "end")
            .attr("class","country")
            .attr("dy", "2em")
            .text(function(d) { 
              return d.country; 
            })                            
            .attr("y", function(d,i) {
              return y(i);
            })
            .attr("transform", function(d, i) { 
              return "translate(" + (1.75 * cell_width) + ",0)"; 
            });

  //append index to row header
  row_header.append("text")
            .attr("class","index")
            .attr("text-anchor", "end")
            .attr("dy", "1.5em")
            .text(function(d, i) {
              return d.rank;              
            })
            .attr("y", function(d,i) {
              return y(i);
            })
            .attr("transform", function(d, i) { 
              return "translate(" + (1.87 * cell_width) + ",0)"; 
            });          

  //append univ cell to each row
  var univcell = row.append("g")
                    .attr("class","cell")
                    .attr("y", function(d,i) {
                      return y(i);
                    })
                    .attr("transform", function(d) { 
                      return "translate(" + 
                        (2 * cell_width) + 
                        ",0)"; 
                    })
                    .attr("width", cell_width / 1.5)
                    .attr("height", cell_height);

  //append rectangular bounds to each cell
  univcell.append("rect")   
          .attr("class", "bounds")
          .attr("height", cell_height)
          .attr("width", cell_width / 1.5)
          .attr("y", function(d,i) {
              return y(i);
          });                 

  //append bar scaled to score to cell
  univcell.append("rect")
          .attr("class","value")
          .attr("height", cell_height)
          .attr("width", function(d) { 
            return z(d.score); 
          })
          .attr("y", function(d,i) {
            return y(i);
          });

  //append score in the cell
  univcell.append("text")
          .attr("class","score")
          .attr("height", cell_height)
          .attr("dy", "1.5em")
          .attr("dx", "0.3em")
          .text(function(d) { 
            return d.score; 
          })
          .attr("y", function(d,i) {
              return y(i);
          });       

  //append line to cell, link to next cell
  univcell.append("line")
          .attr("class","link_line")
          .attr("x1", function() {
            return x(dimensions[0]) - 2.335 * cell_width;
          })
          .attr("x2", function() {
            return x(dimensions[0]) - 2 * cell_width;
          })
          .attr("y1", function(d,i) {
            return y(i) + cell_height / 2;
          })
          .attr("y2", function(d,i) {
            return y(d.rank_14 - 1) + cell_height / 2;
          })
          .style("display", function(d,i){
            if (y(d.rank_14 - 1) <= -1)
              return "none";
            else
              return "inline";
          });       

  //append cells to each row, map each cell to a dimension
  var cell = row.selectAll("cell")                
                .data(function(d) { 
                  return dimensions.map(function(k) {
                    return d[k]; 
                  }); 
                })
                .enter()
                .append("g")
                .attr("class","cell")                
                .attr("width", cell_width / 1.5)
                .attr("height", cell_height);

  //append rectangular bounds to each cell
  cell.append("rect")   
      .attr("class", "bounds")
      .attr("height", cell_height)
      .attr("width", cell_width / 1.5)
      .attr("x", function(d,i) {
        return x(dimensions[i]);
      })
      .attr("y", function(d,i) {
        if (d == '')
          return y(data.length - 1);
        else if (i == 0) 
          return y(d3.select(this.parentNode.parentNode).datum().rank_14 - 1);  
        else if (i == 1) 
          return y(d3.select(this.parentNode.parentNode).datum().rank_13 - 1);
        else 
          return y(d3.select(this.parentNode.parentNode).datum().rank_12 - 1);          
      })
      .style("stroke-width", function(d) { 
        if (d == '')
          return 0 + "px"; 
      });                 

  //append bar scaled to score to cell
  cell.append("rect")
      .attr("class","value")
      .attr("height", cell_height)
      .attr("width", function(d) { 
        return z(d); 
      })
      .attr("x", function(d,i) {
        return x(dimensions[i]);
      })
      .attr("y", function(d,i) {
        if (d == '')
          return y(data.length - 1);
        else if (i == 0) 
          return y(d3.select(this.parentNode.parentNode).datum().rank_14 - 1);  
        else if (i == 1) 
          return y(d3.select(this.parentNode.parentNode).datum().rank_13 - 1);
        else 
          return y(d3.select(this.parentNode.parentNode).datum().rank_12 - 1);        
      });

  //append score in the cell
  cell.append("text")
      .attr("class","score")
      .attr("height", cell_height)
      .attr("dy", "1.5em")
      .attr("dx", "0.3em")
      .text(function(d) { 
        return d; 
      })
      .attr("x", function(d,i) {
        return x(dimensions[i]);
      })
      .attr("y", function(d,i) {
        if (d == '')
          return y(data.length - 1);
        else if (i == 0) { 
          return y(d3.select(this.parentNode.parentNode).datum().rank_14 - 1);  
        }
        else if (i == 1) 
          return y(d3.select(this.parentNode.parentNode).datum().rank_13 - 1);
        else 
          return y(d3.select(this.parentNode.parentNode).datum().rank_12 - 1);       
      });

  //append score in the cell
  cell.append("text")
      .attr("class","index")
      .attr("height", cell_height)
      .attr("dy", "1.5em")
      .attr("dx", "0.3em")
      .text(function(d,i) { 
        if (d == '')
          return '';
        else if (i == 0) { 
          return d3.select(this.parentNode.parentNode).datum().rank_14;  
        }
        else if (i == 1) 
          return d3.select(this.parentNode.parentNode).datum().rank_13;
        else 
          return d3.select(this.parentNode.parentNode).datum().rank_12; 
      })
      .attr("x", function(d,i) {
        return x(dimensions[i]) - 20;
      })
      .attr("y", function(d,i) {
        if (d == '')
          return y(data.length - 1);
        else if (i == 0) { 
          return y(d3.select(this.parentNode.parentNode).datum().rank_14 - 1);  
        }
        else if (i == 1) 
          return y(d3.select(this.parentNode.parentNode).datum().rank_13 - 1);
        else 
          return y(d3.select(this.parentNode.parentNode).datum().rank_12 - 1);       
      });

  //append line to cell, link to next cell
  cell.append("line")
      .attr("class","link_line")
      .attr("x1", function(d,i) {
        return x(dimensions[i]) + cell_width / 1.5;
      })
      .attr("x2", function(d,i) {
        if (i == 0 || i === 1)
          return x(dimensions[i + 1]);
        else 
          return x(dimensions[i]);
      })
      .attr("y1", function(d,i) {
        if (i == 0)
          return y(d3.select(this.parentNode.parentNode).datum().rank_14 - 1) + cell_height / 2;  
        else if (i == 1)
          return y(d3.select(this.parentNode.parentNode).datum().rank_13 - 1) + cell_height / 2;
        else 
          return y(-1);
      })
      .attr("y2", function(d,i) {
        if (i == 0)
          return y(d3.select(this.parentNode.parentNode).datum().rank_13 - 1) + cell_height / 2;  
        else if (i == 1)
          return y(d3.select(this.parentNode.parentNode).datum().rank_12 - 1) + cell_height / 2;
        else 
          return y(-1);
      })
      .style("display", function(d,i){
        if (i == 0 && (y(d3.select(this.parentNode.parentNode).datum().rank_14 - 1) <= -1 || y(d3.select(this.parentNode.parentNode).datum().rank_13 - 1) <= -1))
          return "none";
        else if (i == 1 && (y(d3.select(this.parentNode.parentNode).datum().rank_13 - 1) <= -1 || y(d3.select(this.parentNode.parentNode).datum().rank_12 - 1) <= -1 ))
          return "none"
        else if (i == 2)
          return "none"
        else
          return "inline";
      });
    
  //listen for dispatch events from selectors
  dispatch.on("highlight.row", function(country,size,research,focus,age) {
    row.style("opacity", function(d){
      if ((d.country == country || country == "( All Countries )") && 
          (d.size == size || size == "( All Sizes )") &&
          (d.research == research || research == "( All Research )") && 
          (d.focus == focus || focus == "( All Focus )") &&
          (d.age == age || age == "( All Ages )"))
        return 1;
      else 
        return 0.15;
    });    
    row.style("pointer-events", function(d){
      if ((d.country == country || country == "( All Countries )") && 
          (d.size == size || size == "( All Sizes )") &&
          (d.research == research || research == "( All Research )") && 
          (d.focus == focus || focus == "( All Focus )") &&
          (d.age == age || age == "( All Ages )"))
        return 'inherit';
      else 
        return 'none';
    }); 
    row.sort(function (d, a) { // select the parent and sort the path's
      if ((d.country == country || country == "( All Countries )") && 
          (d.size == size || size == "( All Sizes )") &&
          (d.research == research || research == "( All Research )") && 
          (d.focus == focus || focus == "( All Focus )") &&
          (d.age == age || age == "( All Ages )"))
        return 1; // a is not the hovered element, send "a" to the back
      else 
        return -1; // a is the hovered element, bring "a" to the front
    }); 
  });

  /**

  FOOTER

  **/ 

  //append container credits to footer panel
  var footer = footer_svg.append("g")
                         .attr("class","footer");

  footer.append("text")
        .attr("class","institution")
        .attr("id","more_info")
        .attr("dy", "1.3em")
        .attr("dx", "2.2em")
        .text("More Info")
        .on("mouseover", function() {
          d3.select(this).style("fill","#de2d26");
          d3.select('#info_button').attr("xlink:href","info-hover.png");
        })
        .on("mouseout", function() {
          d3.select(this).style("fill","#000");
          d3.select('#info_button').attr("xlink:href","info.png");
        })
        .on("click", function() {
          if (!about_visible) {
            about_visible = true;
            d3.select('#about_panel').style("display","inline");
          }
          else {
            about_visible = false;
            d3.select('#about_panel').style("display","none");
          }
        });                             

  //append title to footer                       
  footer.append("a")
        .attr("xlink:href", 
          "https://twitter.com/mattbrehmer")
        .append("text")
        .attr("class","attribution")
        .attr("dy", "0.6em")
        .attr("dx", "7.5em")
        .text("by @mattbrehmer");

  //append subtitle to footer
  footer.append("a")
        .attr("xlink:href", 
          "http://www.topuniversities.com/")
        .append("text")
        .attr("class","attribution")
        .attr("dy", "2.0em")
        .attr("dx", "7.5em")
        .text("data from QS topuniversities.com");

  //append subtitle to footer
  footer.append("image")
        .attr("id","info_button")
        .attr("xlink:href","info.png")
        .style("cursor","pointer")
        .attr("width", 16)
        .attr("height", 16)
        .on("mouseover", function() {
          d3.select('#more_info').style("fill","#de2d26");
          d3.select(this).attr("xlink:href","info-hover.png");
        })
        .on("mouseout", function() {
          d3.select('#more_info').style("fill","#000");
          d3.select(this).attr("xlink:href","info.png");
        })
        .on("click", function() {
          if (!about_visible) {
            about_visible = true;
            d3.select('#about_panel').style("display","inline");
          }
          else {
            about_visible = false;
            d3.select('#about_panel').style("display","none");
          }
        })
        .append("title")
        .text("More info");

  d3.select("#filter_div")
    .html("Filter by: ")

  var all_countries = ["( All Countries )"];

  //append country dropdown to footer, 
  var select_country = d3.select("#filter_div")
                       .append("select")
                       .on("change", dropdownChange),
      country_options = select_country.selectAll("option")
                                  .data(all_countries.concat(country_scale.domain().sort()));

  //populate country dropdown with countries 
  country_options.enter()
               .append("option")
               .text(function (d) { 
                return d; 
               });     
  
  var size_scale = ["( All Sizes )","S","M","L","XL"];

  //append size dropdown to footer, 
  var select_size = d3.select("#filter_div")
                      .append("select")
                      .on("change", dropdownChange),
      size_options = select_size.selectAll("option")
                                .data(size_scale);

  //populate size dropdown with sizes
  size_options.enter()
               .append("option")
               .text(function (d) { 
                return d; 
               });

  var research_scale = ["( All Research )","Low","Medium","High","Very High"];

  //append research dropdown to footer, 
  var select_research = d3.select("#filter_div")
                          .append("select")
                          .on("change", dropdownChange),
      research_options = select_research.selectAll("option")
                                        .data(research_scale);

  //populate researcg dropdown with research levels 
  research_options.enter()
                 .append("option")
                 .text(function (d) { 
                   return d; 
                 });                  

  var focus_scale = ["( All Focus )","Specialist","Focused","Comprehensive","Full Comprehensive"];

  //append focus dropdown to footer, 
  var select_focus = d3.select("#filter_div")
                       .append("select")
                       .on("change", dropdownChange),
      focus_options = select_focus.selectAll("option")
                                  .data(focus_scale);

  //populate focus dropdown with focus levels 
  focus_options.enter()
               .append("option")
               .text(function (d) { 
                return d; 
               });  

  var age_scale = ["( All Ages )","Young","Established","Mature","Historic"];

  //append age dropdown to footer, 
  var select_age = d3.select("#filter_div")
                       .append("select")
                       .on("change", dropdownChange),
      age_options = select_age.selectAll("option")
                              .data(age_scale);

  //populate age dropdown with age levels 
  age_options.enter()
               .append("option")
               .text(function (d) { 
                return d; 
               });                       

  //whenever an option is selected from the dropdowns, issue a dispatch event 
  function dropdownChange() {
    var selected_country_index = select_country.property("selectedIndex"),
        selected_country = country_options[0][selected_country_index].__data__,
        selected_size_index = select_size.property("selectedIndex"),
        selected_size = size_options[0][selected_size_index].__data__,
        selected_research_index = select_research.property("selectedIndex"),
        selected_research = research_options[0][selected_research_index].__data__,
        selected_focus_index = select_focus.property("selectedIndex"),
        selected_focus = focus_options[0][selected_focus_index].__data__
        selected_age_index = select_age.property("selectedIndex"),
        selected_age = age_options[0][selected_age_index].__data__;

    dispatch.highlight(selected_country,selected_size,selected_research,selected_focus,selected_age);
  } 

}); //end d3.csv load
