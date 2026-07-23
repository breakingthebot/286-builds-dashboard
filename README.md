# 286 Builds Dashboard

An advanced interactive dashboard that visualizes the progression of 286 daily coding builds across 37 completed projects.

🌐 Live site: https://breakingthebot.github.io/286-builds-dashboard/

## 📊 Overview

This dashboard fetches build metadata from the [286-builds](https://github.com/breakingthebot/286-builds) repository and transforms it into beautiful, interactive visualizations showing:

- **Language Distribution** - Which programming languages are used most (3D pie chart)
- **Build Timeline** - When each build was completed (animated heatmap)
- **Category Breakdown** - How builds are distributed across categories (sunburst chart)
- **Build Velocity** - Builds completed per week/month over time (area chart)
- **Skills Progression** - Radar chart showing skill development across different areas
- **Build Depth Distribution** - How many Deep vs Expanded vs Basic builds

## 🏗️ Architecture

```
Data Flow:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

286-builds repo (builds.json)
    ↓
js/dataFetcher.js
    ├─ fetchBuildsData() - Fetch from GitHub
    ├─ enrichBuildWithMetadata() - Add GitHub stats
    └─ normalizeBuildData() - Standardize format
    ↓
js/dataProcessor.js
    ├─ aggregateByLanguage() - Count languages
    ├─ aggregateByCategory() - Group by category
    ├─ calculateBuildVelocity() - Timeline data
    ├─ calculateSkillsProgression() - Skill radar
    └─ processAllData() - Orchestrate all processing
    ↓
js/charts.js
    ├─ renderLanguageChart3D() - Plotly 3D pie
    ├─ renderCategoryChart() - Plotly sunburst
    ├─ renderTimelineChart() - Plotly heatmap
    ├─ renderVelocityChart() - Plotly area chart
    ├─ renderSkillsRadar() - Plotly radar
    └─ renderAllCharts() - Render everything
    ↓
index.html (display all visualizations)
    ↓
css/style.css (dark theme styling)
    ↓
User sees beautiful dashboard! ✨
```

### File Structure

```
286-builds-dashboard/
├── README.md                 # This file
├── index.html               # Main dashboard HTML
├── css/
│   └── style.css           # Dark theme styles
├── js/
│   ├── main.js             # Dashboard orchestration
│   ├── dataFetcher.js      # GitHub data fetching
│   ├── dataProcessor.js    # Data aggregation
│   └── charts.js           # Plotly visualizations
├── data/
│   └── sample-data.json    # Sample processed data
└── .gitignore              # Git ignore file
```

## 🎨 Design

- **Theme**: Dark mode with smooth, minimal aesthetic
- **Colors**: Dark grays (#0f1419), accent blues (#58a6ff, #79c0ff)
- **Responsive**: Fully responsive on desktop, tablet, and mobile
- **Performance**: Client-side rendering, no backend needed
- **Libraries**: 
  - Plotly.js for advanced interactive charts
  - D3.js for custom data visualizations
  - Vanilla JavaScript (no build tools needed)

## 🚀 Getting Started

### Quick Start

1. **Clone this repository**
   ```bash
   git clone https://github.com/breakingthebot/286-builds-dashboard.git
   cd 286-builds-dashboard
   ```

2. **Open in browser**
   ```bash
   # Option 1: Direct open
   open index.html
   
   # Option 2: Local server (recommended)
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

3. **Dashboard loads automatically** - Data is fetched from GitHub and visualized

### GitHub Pages Deployment

This project is configured for GitHub Pages project-site hosting:

- **Source**: Deploy from branch
- **Branch**: `main`
- **Folder**: `/` (root)
- **Live URL**: https://breakingthebot.github.io/286-builds-dashboard/

Because `index.html` is in the repository root and all CSS/JS links use relative paths (`css/...`, `js/...`), the site deploys automatically on every push to `main`.

### Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (to fetch from GitHub)
- No npm, no build tools, no installation needed!

## 📈 Visualizations

### 1. Language Distribution (real 3D scatter chart)
Shows the breakdown of programming languages used across all builds as a genuine Plotly `scatter3d` scene -- language on one axis, build count on another, share-of-total percentage on the third, marker size scaled to count.
- **Interactive**: Drag to rotate, scroll to zoom, right-click-drag to pan -- a real 3D scene, not a 2D chart labeled "3D"
- **Hover details**: Language, build count, and percentage share
- **Use Case**: Understand your tech stack diversity from any angle

### 2. Category Breakdown (Sunburst Chart)
Nested circular chart showing builds distributed by category.
- **Interactive**: Click segments to drill down
- **Color-coded**: Each category has unique color
- **Proportional**: Size represents number of builds
- **Use Case**: Identify which project types dominate

### 3. Build Timeline (Heatmap)
Calendar-style heatmap showing build intensity over time (52 weeks).
- **Color intensity**: Darker = more builds that week
- **Animated**: Smooth transitions
- **Hover details**: See exact build count per week
- **Use Case**: Find productivity patterns and trends

### 4. Build Velocity (Area Chart)
Dual-axis chart showing weekly builds and cumulative progress.
- **Weekly builds**: Blue solid line with fill
- **Cumulative total**: Cyan dashed line
- **Trend analysis**: See acceleration/deceleration of progress
- **Use Case**: Measure consistency and momentum

### 5. Skills Progression (Radar Chart + build scrubber)
Multi-axis radar showing skill *coverage* across areas -- the % of builds so far whose technology/category/description text matches each skill area's keywords (Frontend, Backend, DevOps, Database, Testing, Mobile, Data & ML, CLI Tools). A slider under the chart lets you scrub through the build series build-by-build, recomputing coverage as it stood at that point -- so "progression" is an actual build-by-build trend, not a single end-state snapshot labeled as one.
- **Axes**: Frontend, Backend, DevOps, Database, Testing, Mobile, Data & ML, CLI Tools
- **Scrubber**: Drag to replay coverage as of any build number
- **Interactive**: Hover for exact percentages at the selected point
- **Use Case**: See how skill coverage broadened over the series, not just where it ended up
- **Honest limitation**: this is keyword-match coverage, not a real measurement of proficiency -- a build whose description happens to mention "test" counts toward "Testing" whether or not it involved deep testing work

### 6. Build Depth Distribution (Bar Chart)
Shows breakdown of Deep, Expanded, and Basic builds.
- **Deep**: Complex, multi-tech projects
- **Expanded**: Medium complexity
- **Basic**: Simple, focused projects
- **Percentages**: Displayed on hover
- **Use Case**: Understand project complexity distribution

## 🔧 Development

### Adding New Charts

1. **Create a function in `js/charts.js`**
   ```javascript
   function renderMyNewChart(data) {
       const trace = { /* ... */ };
       const layout = { /* ... */ };
       Plotly.newPlot('my-chart-id', [trace], layout, config);
   }
   ```

2. **Add a container in `index.html`**
   ```html
   <div class="chart-container">
       <h2>My New Chart</h2>
       <div id="my-chart-id" class="chart"></div>
   </div>
   ```

3. **Call from `js/main.js`**
   ```javascript
   renderMyNewChart(processedData.myData);
   ```

### Modifying Data Processing

Edit `js/dataProcessor.js` to:
- Add new aggregation functions
- Calculate different statistics
- Transform data for new visualizations

Example:
```javascript
function aggregateByNewMetric(builds) {
    // Your aggregation logic
    return aggregatedData;
}

// Then call from processAllData()
```

### Styling

All styling in `css/style.css`:
- CSS variables at the top for easy dark theme customization
- Responsive breakpoints for mobile/tablet/desktop
- Smooth animations and transitions

## 💡 Learning Path

This project teaches:

1. **Fetching Data from GitHub APIs**
   - Using fetch() with raw GitHub URLs
   - Rate limiting and error handling
   - CORS-friendly approaches

2. **Data Transformation & Aggregation**
   - Grouping and counting
   - Calculating statistics
   - Normalizing data structures

3. **Advanced Visualizations**
   - Plotly.js charts (3D, interactive)
   - D3.js custom visualizations
   - Color scales and legends
   - Responsive chart sizing

4. **Modern Web Architecture**
   - Modular JavaScript organization
   - Separation of concerns (fetch, process, render)
   - State management
   - Error handling

5. **Responsive Web Design**
   - CSS Grid layouts
   - Mobile-first design
   - Dark theme implementation
   - Smooth animations

6. **Browser APIs**
   - DOM manipulation
   - Event listeners
   - Local storage (optional enhancement)
   - Page visibility API

## 🎮 Console Commands

Open browser DevTools (F12) and try:

```javascript
// View current dashboard state
dashboard.state()

// View all processed data
dashboard.data()

// Manually refresh dashboard
dashboard.refresh()

// Export data as JSON
dashboard.exportJSON()

// Export stats as CSV
dashboard.exportCSV()
```

## 🚀 Advanced Features

### Auto-Refresh
Dashboard auto-refreshes every 5 minutes via a real `setInterval` timer, started once from `initializeDashboard()` in `js/main.js` after the first successful load (guarded so a page refresh doesn't stack a second timer on top of it). Customize the interval:
```javascript
setupAutoRefresh(5); // minutes
```

### Data Export
Export visualized data for analysis:
- **JSON**: Full dataset with all calculations
- **CSV**: Statistics and aggregations

### Smart Refresh
When you return to the tab after 5+ minutes, data auto-refreshes.

### Error Handling
- Graceful error messages if GitHub API fails
- Loading states for user feedback
- Console logging for debugging

## 📊 Data Structure

Raw build from `builds.json` (actual shape, not aspirational):
```json
{
  "build_number": 1,
  "date": "2026-06-06",
  "project_name": "Expense Tracker",
  "description": "Standard-library-only expense tracker...",
  "repo_url": "https://github.com/breakingthebot/expense-tracker",
  "technology": "Python (Core)",
  "category": "CLI Tools",
  "stack": ["Python (Core)", "CLI Tools"],
  "depth": "Expanded",
  "notes": ""
}
```
`technology` is a single string per build, not an array -- `normalizeBuildData()` in `js/dataFetcher.js` maps `depth` to `build_depth` and prefers the explicit `technology` field, falling back to filtering the legacy `stack` array only if `technology` is missing.

Processed/aggregated data includes:
- Language counts and percentages
- Category breakdowns
- Weekly velocity
- Skill coverage over time (cumulative, per build)
- Build depth distribution

## 🤝 Contributing

This is a personal learning project. Feel free to:
- Fork and experiment
- Add new visualizations
- Improve styling
- Optimize performance
- Share improvements

## 🔗 Related

- **286 Builds Repository**: https://github.com/breakingthebot/286-builds
- **Plotly.js Docs**: https://plotly.com/javascript/
- **D3.js Docs**: https://d3js.org/

## 📝 License

MIT - Feel free to use this project for learning and personal use.

## 🐛 Troubleshooting

### Dashboard shows loading forever
- Check browser console (F12) for errors
- Ensure you have internet connection
- Try refreshing page
- 286-builds repo might be temporarily unavailable

### Charts don't render
- Check console for JavaScript errors
- Ensure Plotly.js CDN is accessible
- Try hard refresh (Ctrl+Shift+R)

### Data looks incomplete
- First load might take a few seconds
- Try manual refresh: `dashboard.refresh()` in console
- Data updates every 5 minutes automatically

### Mobile layout issues
- Mobile responsive design included
- Use landscape mode for better chart visibility
- Charts adapt to screen size automatically

## ✨ Future Enhancements

Potential improvements:
- [x] Real dates from `builds.json`'s own `date` field (already used by the velocity and skills-progression charts, not fabricated)
- [ ] Technology combinations analysis (removed a broken first attempt at this -- every build only has one `technology` value, so pairwise co-occurrence was always empty; would need a different data source, like the languages a repo actually uses, to be meaningful)
- [ ] Performance metrics
- [ ] Contributor statistics
- [ ] Deployment timeline
- [ ] Local caching
- [ ] Dark/Light theme toggle
- [ ] Chart customization controls
- [ ] Data filtering UI
- [ ] Share dashboard snapshots

---

**Happy exploring!** 🚀 Open the dashboard and watch your 286 builds come to life in beautiful visualizations.
