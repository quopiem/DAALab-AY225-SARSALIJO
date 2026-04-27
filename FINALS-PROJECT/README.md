# World GDP Ranking Dashboard

An interactive dashboard for exploring **2017 World Bank GDP data** by country, region, and income group. The project includes data tables, filter/sort controls, multiple charts, and built-in statistical analysis.

## Features

* Country ranking table with search and sorting
* Region and income-group summary tables
* Bar chart for top/bottom GDP economies
* Pie chart for regional GDP share
* Bar chart for income-group GDP
* Scatter plot for rank vs GDP with zoom/pan support
* Doughnut chart for GDP concentration by tier
* Automatic statistical analysis and key insights

## Project Structure

This project is split into two main parts:

### 1. `index.html`

The main page layout. It includes:

* Header and summary section
* Tabbed tables for countries, regions, and income groups
* Chart containers
* Analysis and insights sections
* External library imports
* Script links to `data-engine.js` and `viz-analysis.js`

### 2. `data-engine.js`

Handles:

* Loading and parsing the CSV file
* Cleaning and filtering dataset rows
* Rendering the main data table
* Rendering summary cards
* Filtering and sorting country rows
* Calling the visualization engine after data is ready

### 3. `viz-analysis.js`

Handles:

* Chart creation and updates
* Statistical functions such as variance, standard deviation, Pearson correlation, and linear regression
* Region and income-group chart rendering
* Scatter plot and doughnut chart controls
* Analysis text and insights generation

### 4. `styles.css`

Contains the visual styling for:

* Layout
* Tables
* Cards
* Charts
* Tabs
* Responsive design

### 5. `data.csv`

The dataset file containing the World Bank GDP data for 2017.

## Requirements

To run the project, you need:

* A modern web browser
* The project files in the same folder
* A local server or live preview tool

> Important: opening `index.html` directly in the browser may not always load `data.csv` correctly because of browser file restrictions. A local server is recommended.

## External Libraries Used

The dashboard uses these libraries through CDN:

* **PapaParse** – CSV parsing
* **Chart.js** – chart rendering
* **Hammer.js** – touch support for chart interactions
* **chartjs-plugin-zoom** – zoom and pan support for the scatter plot

## How to Run the Project

### Option 1: Using VS Code Live Server

1. Open the project folder in VS Code.
2. Install the Live Server extension if needed.
3. Right-click `index.html`.
4. Choose **Open with Live Server**.

### Option 2: Using Python Local Server

If Python is installed, open a terminal in the project folder and run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Option 3: Using any local web server

Any static server is fine as long as it serves:

* `index.html`
* `styles.css`
* `data-engine.js`
* `viz-analysis.js`
* `data.csv`

## How the Data Flow Works

1. `data-engine.js` fetches `data.csv`
2. PapaParse reads and converts the CSV into JavaScript objects
3. The dataset is cleaned and stored in `window.DS`
4. `renderTable()` and `renderSummaryCards()` display the table and cards
5. `onDataReady()` is called
6. `viz-analysis.js` renders charts, statistics, and insights

## Dataset Format

The dashboard expects columns similar to the World Bank GDP export format.

Common fields used by the code:

* `Code`
* `Rank`
* `Economy`
* `GDP`

Some helper functions also support alternate field names such as:

* `CountryCode`
* `CountryName`
* `name`
* `gdp`
* `value`

## Dashboard Sections

### Snapshot

Shows summary cards such as:

* Number of ranked countries
* World GDP
* Largest economy
* #1 ranked economy
* Mean GDP
* Data year

### Data Tables

Includes three tabs:

* **Country Rankings**
* **Regions**
* **Income Groups**

The country tab includes:

* Filter by country name
* Sort by name or GDP
* Reset button
* Row counter

### Country Rankings Chart

A horizontal bar chart that can display:

* Top GDP economies
* Lowest GDP economies

You can choose how many rows to show.

### Regional & Income Analysis

Contains:

* Region GDP pie chart
* Income group GDP bar chart

### Distribution & Concentration

Contains:

* Scatter plot of rank vs GDP
* Doughnut chart showing GDP concentration by tier

### Statistical Analysis

Shows computed metrics such as:

* Total country GDP
* Mean GDP
* Median GDP
* Standard deviation
* Coefficient of variation
* Top 5 and top 10 GDP share
* Correlation and regression values

### Key Insights

Provides short written conclusions based on the dataset.

## Important Functions

### In `data-engine.js`

* `fetchKaggleDataset()` – loads the CSV file
* `parseWorldBankCSV()` – converts CSV rows into structured objects
* `loadDataset()` – stores and renders the dataset
* `renderTable()` – displays the country table
* `renderSummaryCards()` – displays summary cards
* `applyFilterSort()` – filters and sorts country rows
* `resetTable()` – resets table filters

### In `viz-analysis.js`

* `initCharts()` – creates all charts
* `drawBarChart()` – GDP bar chart for countries
* `drawRegionChart()` – region pie chart
* `drawIncomeChart()` – income group bar chart
* `drawScatterPlot()` – rank vs GDP scatter plot
* `drawDoughnut()` – GDP concentration chart
* `renderAnalysis()` – statistical analysis section
* `renderInsights()` – key insights section
* `onDataReady()` – main entry point after data loads

## Controls and Interaction

### Table Controls

* Use the search box to filter by country name
* Use the sort dropdown to sort the table
* Click **Apply** to update the table
* Click **Reset** to restore the full list

### Chart Controls

* Bar chart: choose top or bottom economies and set how many rows to display
* Scatter plot: choose the number of points and sort order
* Scatter plot: use mouse wheel to zoom and drag to pan
* Doughnut chart: adjust tier boundaries to compare concentration groups

## Troubleshooting

### Data does not appear

Check that:

* `data.csv` is in the same folder as `index.html`
* You are running the project through a local server
* The browser console does not show fetch errors

### Charts do not load

Make sure the CDN scripts are loading:

* PapaParse
* Chart.js
* Hammer.js
* chartjs-plugin-zoom

### Table shows “No results found”

This may happen if:

* The search filter is too specific
* The CSV data format is different from what the parser expects
* The rank or GDP values are missing

### Scatter plot zoom does not work

Check whether `chartjs-plugin-zoom` loaded correctly. The code also checks plugin availability before enabling zoom features.

## Notes for Developers

* The project uses `window.DS` as the shared dataset between files.
* `data-engine.js` must load before `viz-analysis.js`.
* `onDataReady()` is called after parsing finishes, so visualization functions can safely use the data.
* The dataset parsing is tailored to a World Bank GDP export format.

## Possible Improvements

* Add export/download buttons for tables or charts
* Add more detailed tooltips or annotations
* Support year switching for other GDP datasets
* Add dark/light theme toggle
* Improve mobile layout for small screens

## License

Add your preferred license here if the project will be shared publicly.

## Credits

* World Bank GDP data
* PapaParse
* Chart.js
* Hammer.js
* chartjs-plugin-zoom
