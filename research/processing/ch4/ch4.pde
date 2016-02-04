FloatTable data;
float dataMin, dataMax;

float plotX1, plotY1;
float plotX2, plotY2;
float labelX, labelY;

float barWidth = 4;

int rowCount;
int currentColumn = 0;
int columnCount;

int yearMin, yearMax;
int[] years;
int yearInterval = 10;

int volumeInterval = 10;
int volumeIntervalMinor = 5;

PFont plotFont;

float[] tabLeft, tabRight;
float tabTop, tabBottom;
float tabPad = 10;

// Integrator[] interpolators;

void setup() {

	size(720,405);

	data = new FloatTable("milk-tea-coffee.csv");
	rowCount = data.getRowCount();
	columnCount = data.getColumnCount();

	years = int(data.getRowNames());
	yearMin = years[0];
	yearMax = years[years.length - 1];

	dataMin = 0;
	dataMax = ceil(data.getTableMax() / volumeInterval) * volumeInterval;

	// interpolators = new Integrator[rowCount];
	// for (int row = 0; row < rowCount; row++) {
	// 	float initialValue = data.getFloat(row, 0);
	// 	interpolators[row] = new Integrator(initialValue);
	// 	interpolators[row].attraction = 0.1; //set lower than default
	// }

	//corners of the plotted time series
	plotX1 = 120;
	plotX2 = width - 80;
	labelX = 50;
	plotY1 = 60;
	plotY2 = height - 70;
	labelY = height - 25;

	plotFont = createFont("sans-serif", 20);
	textFont(plotFont);

	smooth();

}

void draw() {

	background(224);

	//show the plot area as a white box
	fill(255);
	rectMode(CORNERS);
	noStroke();
	rect(plotX1,plotY1,plotX2,plotY2);
	
	drawTitleTabs();
	drawAxisLabels();
	drawVolumeLabels();

	// for (int row = 0; row < rowCount; row++) {
	// 	interpolators[row].update();
	// }

	//draw the data for the first column
	noStroke();
	fill(#5679C1);
	// strokeWeight(5);
	// drawDataPoints(currentColumn);
	drawDataArea(currentColumn);

	drawYearLabels();

	stroke(#FF0000);

	drawDataHighlight(currentColumn);
}

//draw the series as bars
void drawDataBars(int col) {

	noStroke();
	rectMode(CORNERS);

	for (int row = 0; row < rowCount; row ++) {
		if (data.isValid(row, col)) {
			float value = data.getFloat(row,col);
			float x = map(years[row], yearMin, yearMax, plotX1, plotX2);
			float y = map(value, dataMin, dataMax, plotY2, plotY1);
			rect(x - barWidth / 2, y, x + barWidth / 2, plotY2);
		}
	}
}


//draw the series as an area
void drawDataArea(int col) {

	beginShape();
	for (int row = 0; row < rowCount; row ++) {
		if (data.isValid(row, col)) {
			float value = data.getFloat(row, col);
			float x = map(years[row], yearMin, yearMax, plotX1, plotX2);
			float y = map(value, dataMin, dataMax, plotY2, plotY1);
			vertex(x,y);
			//double the curve points for the start and stop
			// if ((row == 0) || (row == rowCount-1)) {
			// 	curveVertex(x,y);
			// }
		}
	}
	//draw the lower-right and lower-left corners
	vertex(plotX2, plotY2);
	vertex(plotX1, plotY2);
	endShape(CLOSE);
}

//draw the series of points
void drawDataPoints(int col) {

	for (int row = 0; row < rowCount; row ++) {
		if (data.isValid(row, col)) {
			float value = data.getFloat(row,col);
			float x = map(years[row], yearMin, yearMax, plotX1, plotX2);
			float y = map(value, dataMin, dataMax, plotY2, plotY1);
			point(x,y);
		}
	}
}

void drawDataHighlight(int col) {

	for(int row = 0; row < rowCount; row++) {
		if (data.isValid(row, col)) {
			float value = data.getFloat(row,col);
			float x = map(years[row], yearMin, yearMax, plotX1, plotX2);
			float y = map(value, dataMin, dataMax, plotY2, plotY1);
			if (dist(mouseX, mouseY, x , y) < 3) {
				strokeWeight(10);
				point(x, y);
				fill(0);
				textSize(10);
				textAlign(CENTER);
				text(nf(value, 0 , 2) + "(" + years[row] + ")", x, y-8);
			}
		}
	}
}

void keyPressed() {
	if (key == '['){
		currentColumn--;		
		if (currentColumn < 0){
			currentColumn = columnCount - 1;
		}
	}
	else if (key == ']'){
		currentColumn++;
		if (currentColumn == columnCount){
			currentColumn = 0;
		}
	}
}

void drawAxisLabels() {

	fill(0);
	textSize(13);
	textLeading(15);

	textAlign(CENTER,CENTER);
	text("Gallons\nconsumed\nper capita", labelX, (plotY1+plotY2)/2);
	textAlign(CENTER);
	text("Year", (plotX1+plotX2)/2, labelY);
}

void drawYearLabels() {
	fill(0);
	textSize(10);
	textAlign(CENTER,TOP);

	//use thin, gray lines to draw grid
	stroke(255);
	strokeWeight(1);

	for (int row = 0; row < rowCount; row++) {
		if (years[row] % yearInterval == 0) {
			float x = map(years[row], yearMin, yearMax, plotX1, plotX2);
			text(years[row], x, plotY2 + 10);
			line(x, plotY1, x, plotY2);
		}
	}
}

void drawVolumeLabels() {

	fill(0);
	textSize(10);

	//use thin, gray lines to draw grid
	stroke(128);
	strokeWeight(1);
	
	for(float v = dataMin; v <= dataMax; v+= volumeIntervalMinor) {
		float y = map(v, dataMin, dataMax, plotY2, plotY1);
		if (v % volumeInterval == 0) { // if a major tick mark
			if (v == dataMin) {
				textAlign(RIGHT); //align by bottom
			}
			else if (v == dataMax) {
				textAlign(RIGHT,TOP); // align by top
			}
			else {
				textAlign(RIGHT, CENTER); //center vertically
			}
			text(floor(v), plotX1 - 10, y);
			line(plotX1 - 4, y, plotX1, y); //draw major tick
		}
		else {
			// line(plotX1 - 2, y, plotX1, y); //draw minor tick	
		}
	}
}

void drawTitle() {

	fill(0);
	textSize(20);
	textAlign(LEFT);
	String title = data.getColumnName(currentColumn);
	text(title, plotX1, plotY1 - 10);

}

void drawTitleTabs() {

	rectMode(CORNERS);
	noStroke();
	textSize(20);
	textAlign(LEFT);

	//on the first use of this method, allocate space for an array
	//to store the values for the left and right edges of the tabs
	if (tabLeft == null) {
		tabLeft = new float[columnCount];
		tabRight = new float[columnCount];
	}

	float runningX = plotX1;
	tabTop = plotY1 - textAscent() - 15;
	tabBottom = plotY1;

	for (int col = 0; col < columnCount; col++) {
		String title = data.getColumnName(col);
		tabLeft[col] = runningX;
		float titleWidth = textWidth(title);
		tabRight[col] = tabLeft[col] + tabPad + titleWidth + tabPad;

		//if the current tab, set its background white, otherwise use pale gray
		fill(col == currentColumn ? 255 : 224);
		rect(tabLeft[col], tabTop, tabRight[col], tabBottom);

		//if the current tab, use black for text, otherwise use dark gray
		fill(col == currentColumn ? 0 : 64);
		text(title, runningX + tabPad, plotY1 - 10);

		runningX = tabRight[col];
	}

}

void mousePressed() {

	if (mouseY > tabTop && mouseY < tabBottom) {
		for (int col = 0; col < columnCount; col++) {
			if (mouseX > tabLeft[col] && mouseX < tabRight[col]) {
				setColumn(col);
			}
		}
	}
}

void setColumn(int col) {
	
	if (col != currentColumn) {
		currentColumn = col;
	}

	// for(int row = 0; row < rowCount; row++) {
	// 	interpolators[row].target(data.getFloat(row,col));
	// }

}