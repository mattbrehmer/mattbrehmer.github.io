/* @pjs preload="map.png"; */
PImage mapImage;

Table locationTable;
Table dataTable;
Table nameTable;

int rowCount;

float dataMin = -10;
float dataMax = 10;
float closestDist;
float closestTextX;
float closestTextY;

String closestText;

Integrator[] interpolators;

boolean newletter = true;

void setup() {

  size(619, 600);
  mapImage = loadImage("map.png");
  println('image loaded');

  //make data table from file that contains coordinates of each state
  locationTable = new Table("locations.csv");

  //row count will be used a lot, so store it globally
  rowCount = locationTable.getRowCount();
  println('row count: ' + rowCount);

  //read data table
  dataTable = new Table("random.csv");

  //read name table
  nameTable = new Table("names.csv");

  //load initial values into the Integrator
  interpolators = new Integrator[rowCount];
  for(int row = 0; row < rowCount; row++) {
    println('row #: ' + row + "; value: " + dataTable.getFloat(row, 1));
    float initialValue = dataTable.getFloat(row, 1);
    interpolators[row] = new Integrator(initialValue, 0.7, 0.05);
  }

  // find the min and max values
  for (int row = 0; row < rowCount; row++) {
    float value = dataTable.getFloat(row,1);
  
    if (value > dataMax) {
      dataMax = value;
    }
    
    if (value < dataMin) {
      dataMin = value;
    }
  }
  println('min value: ' + dataMin);
  println('max value: ' + dataMax);
  
  PFont font = loadFont("ComicSansMS-12.vlw");
  textFont(font);

}

void draw() {  

  background(255);
  image(mapImage, 0, 0);

  // draw: updated the Integrator with the current values
  // which are either those from the setup() function
  // or those loaded by the target() function issued in updateTable()
  if (newletter == true) {
    for(int row = 0; row < rowCount; row++) {
      interpolators[row].update();
    }
    newletter = false;
  }

  closestDist = MAX_FLOAT;

  //drawing attrubutes for the ellipses
  smooth();
  fill(192, 0, 0);
  noStroke();

  
  //loop through rows of the locations file and draw points
  for (int row = 0; row < rowCount; row++) {
    String abbrev = dataTable.getRowName(row);
    float x = locationTable.getFloatFromStringIndex(abbrev,1); // column 1
    float y = locationTable.getFloatFromStringIndex(abbrev,2); // column 2
    // println('location: ' + abbrev + "; x: " +  x + "; y: " + y);
    drawData(x, y, abbrev);
  }
  
  //use global variables set in drawData() to draw text related to closest circle
  if (closestDist != MAX_FLOAT) {
    fill(0);
    textAlign(CENTER);
    text(closestText,closestTextX,closestTextY);
  }
}

void drawData(float x, float y, String abbrev) {

  //find out what row this is
  int row = dataTable.getRowIndex(abbrev);

  //get data value for state
  float value = interpolators[row].value;
  // println('location: ' + abbrev + "; value: " + value);

  float radius = 0;

  if (value > 0) {
    radius = map(value, 0, dataMax, 1.5, 15);
    fill(#4422CC); //blue
  }
  else {
    radius = map(value, 0, dataMin, 1.5, 15);
    fill(#FF4422); //red
  }

  ellipseMode(RADIUS);
  
  //draw an ellipse for this item
  ellipse(x, y, radius, radius);

  float d = dist(x, y, mouseX, mouseY);

  //becase the followsing check is done each time
  // a new circle is drawnm we end up with the values of the 
  // circle circle to the mouse
  if((d < radius+2) && (d < closestDist)) {
    closestDist = d;
    String name = nameTable.getStringFromStringIndex(abbrev, 1);
    //use target (not current) value for showing the data point
    // String val = nfp(interpolators[row].target, 0, 2);

    closestText = name + " " + nfp(value, 0, 2);
    closestTextX = x;
    closestTextY = y-radius-4;
  }

}

void keyPressed() {
  if (key == ' ') {
    println('key pressed!');
    newletter = true;
    updateTable();
  }
}

void updateTable() {
  
  for (int row = 0; row < rowCount; row++) {
    float newValue = random(-10,10);
    interpolators[row].target(newValue);
  }    
    
  // dataTable = new Table("http://benfry.com/writing/map/random.cgi");
}
