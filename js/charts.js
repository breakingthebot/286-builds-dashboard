/**
 * Charts Module
 * 
 * Advanced visualizations using Plotly.js and D3.js
 * Creates interactive, beautiful charts for the dashboard
 * 
 * Functions:
 * - renderLanguageChart3D()
 * - renderCategoryChart()
 * - renderTimelineChart()
 * - renderVelocityChart()
 * - renderSkillsRadar()
 * - renderDepthChart()
 */

/**
 * Render 3D Language Distribution Pie Chart
 * Shows which languages are most used (Plotly 3D pie)
 * 
 * @param {Array<Object>} languages - Language aggregation data
 */
function renderLanguageChart3D(languages) {
    const trace = {
        labels: languages.map(l => l.name),
        values: languages.map(l => l.count),
        type: 'pie',
        marker: {
            colors: languages.map((_, i) => {
                const hue = (i * 360) / languages.length;
                return `hsl(${hue}, 70%, 60%)`;
            }),
            line: {
                color: '#1a1f2e',
                width: 2
            }
        },
        textinfo: 'label+percent',
        hovertemplate: '<b>%{label}</b><br>Builds: %{value}<br>Percentage: %{percent}<extra></extra>'
    };

    const layout = {
        title: '',
        showlegend: true,
        height: 400,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: {
            color: '#e6edf3',
            family: 'system-ui, -apple-system, sans-serif'
        },
        margin: { l: 0, r: 0, t: 0, b: 0 },
        legend: {
            x: 1.05,
            y: 1,
            bgcolor: 'rgba(0,0,0,0.3)',
            bordercolor: '#30363d',
            borderwidth: 1
        }
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['select2d', 'lasso2d']
    };

    Plotly.newPlot('language-chart', [trace], layout, config);
    console.log('✅ Language chart rendered');
}

/**
 * Render Category Sunburst Chart
 * Nested categories showing breakdown (D3 sunburst)
 * 
 * @param {Array<Object>} categories - Category aggregation data
 */
function renderCategoryChart(categories) {
    const rootId = 'all-categories';
    const totalBuilds = categories.reduce((sum, category) => sum + category.count, 0);
    const labels = ['All Categories', ...categories.map(c => c.name)];
    const values = [totalBuilds, ...categories.map(c => c.count)];
    const ids = [rootId, ...categories.map(c => `category-${c.name}`)];
    const parents = ['', ...categories.map(() => rootId)];

    const trace = {
        ids: ids,
        labels: labels,
        parents: parents,
        values: values,
        type: 'sunburst',
        branchvalues: 'total',
        marker: {
            colors: ['#58a6ff', ...categories.map((_, i) => {
                const hue = (i * 360) / categories.length;
                return `hsl(${hue}, 65%, 55%)`;
            })],
            line: {
                color: '#1a1f2e',
                width: 2
            }
        },
        hovertemplate: '<b>%{label}</b><br>Builds: %{value}<extra></extra>',
        textfont: { size: 12 }
    };

    const layout = {
        title: '',
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: {
            color: '#e6edf3',
            family: 'system-ui, -apple-system, sans-serif'
        },
        margin: { l: 0, r: 0, t: 0, b: 0 },
        height: 400
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['select2d', 'lasso2d']
    };

    Plotly.newPlot('category-chart', [trace], layout, config);
    console.log('✅ Category sunburst chart rendered');
}

/**
 * Render Build Timeline Heatmap
 * Calendar-style heatmap showing build intensity over time
 * 
 * @param {Array<Object>} velocity - Velocity data with weeks
 */
function renderTimelineChart(velocity) {
    // Angle labels to keep full week ranges readable without overlapping.
    const timelineTickAngle = -35;
    const weeks = velocity.map(v => v.week);
    const builds = velocity.map(v => v.builds);
    const weekRanges = velocity.map(v => `${v.weekStart} → ${v.weekEnd}`);

    const trace = {
        x: weeks,
        y: ['Build Intensity'],
        z: [builds],
        customdata: [weekRanges],
        type: 'heatmap',
        colorscale: [
            [0, '#0f1419'],
            [0.3, '#1f6feb'],
            [0.6, '#58a6ff'],
            [1, '#79c0ff']
        ],
        hovertemplate: 'Week %{x}<br>Range: %{customdata}<br>Builds: %{z}<extra></extra>',
        colorbar: {
            title: 'Builds',
            thickness: 20,
            len: 0.7,
            tickfont: { color: '#e6edf3' }
        }
    };

    const layout = {
        title: '',
        xaxis: {
            title: 'Week Range',
            titlefont: { color: '#e6edf3' },
            tickfont: { color: '#8b949e' },
            tickangle: timelineTickAngle,
            gridcolor: '#30363d'
        },
        yaxis: {
            tickfont: { color: '#e6edf3' }
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: {
            color: '#e6edf3',
            family: 'system-ui, -apple-system, sans-serif'
        },
        margin: { l: 100, r: 100, t: 20, b: 60 },
        height: 300
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false
    };

    Plotly.newPlot('timeline-chart', [trace], layout, config);
    console.log('✅ Timeline heatmap rendered');
}

/**
 * Render Build Velocity Area Chart
 * Shows builds per week over time with trend
 * 
 * @param {Array<Object>} velocity - Velocity data
 */
function renderVelocityChart(velocity) {
    const weeks = velocity.map(v => v.week);
    const builds = velocity.map(v => v.builds);
    const cumulative = velocity.map(v => v.cumulative);

    const traceBuilds = {
        x: weeks,
        y: builds,
        name: 'Weekly Builds',
        type: 'scatter',
        mode: 'lines',
        line: {
            color: '#58a6ff',
            width: 2
        },
        fill: 'tozeroy',
        fillcolor: 'rgba(88, 166, 255, 0.2)',
        hovertemplate: 'Week %{x}<br>Builds: %{y}<extra></extra>'
    };

    const traceCumulative = {
        x: weeks,
        y: cumulative,
        name: 'Cumulative Builds',
        type: 'scatter',
        mode: 'lines',
        line: {
            color: '#79c0ff',
            width: 2,
            dash: 'dash'
        },
        yaxis: 'y2',
        hovertemplate: 'Week %{x}<br>Total: %{y}<extra></extra>'
    };

    const layout = {
        title: '',
        xaxis: {
            title: 'Week',
            titlefont: { color: '#e6edf3' },
            tickfont: { color: '#8b949e' },
            gridcolor: '#30363d'
        },
        yaxis: {
            title: 'Weekly Builds',
            titlefont: { color: '#58a6ff' },
            tickfont: { color: '#8b949e' }
        },
        yaxis2: {
            title: 'Cumulative Builds',
            titlefont: { color: '#79c0ff' },
            tickfont: { color: '#8b949e' },
            overlaying: 'y',
            side: 'right'
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: {
            color: '#e6edf3',
            family: 'system-ui, -apple-system, sans-serif'
        },
        margin: { l: 80, r: 80, t: 20, b: 60 },
        height: 400,
        hovermode: 'x unified',
        legend: {
            x: 0.5,
            y: 1.1,
            bgcolor: 'rgba(0,0,0,0.3)',
            bordercolor: '#30363d',
            borderwidth: 1,
            orientation: 'h'
        }
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false
    };

    Plotly.newPlot('velocity-chart', [traceBuilds, traceCumulative], layout, config);
    console.log('✅ Velocity area chart rendered');
}

/**
 * Render Skills Progression Radar Chart
 * Multi-axis radar showing skill development
 * 
 * @param {Array<Object>} skills - Skills data with proficiency levels
 */
function renderSkillsRadar(skills) {
    const trace = {
        type: 'scatterpolar',
        r: skills.map(s => s.proficiency),
        theta: skills.map(s => s.skill),
        fill: 'toself',
        name: 'Skill Proficiency',
        line: {
            color: '#58a6ff'
        },
        fillcolor: 'rgba(88, 166, 255, 0.3)',
        hovertemplate: '<b>%{theta}</b><br>Proficiency: %{r:.1f}%<extra></extra>'
    };

    const layout = {
        title: '',
        polar: {
            radialaxis: {
                visible: true,
                range: [0, 100],
                tickfont: { color: '#8b949e' },
                gridcolor: '#30363d',
                linecolor: '#30363d'
            },
            angularaxis: {
                tickfont: { color: '#e6edf3' }
            },
            bgcolor: 'rgba(0,0,0,0.2)'
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        font: {
            color: '#e6edf3',
            family: 'system-ui, -apple-system, sans-serif'
        },
        margin: { l: 60, r: 60, t: 20, b: 60 },
        height: 400,
        showlegend: false
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false
    };

    Plotly.newPlot('skills-chart', [trace], layout, config);
    console.log('✅ Skills radar chart rendered');
}

/**
 * Render Build Depth Distribution
 * Bar chart showing Deep vs Expanded vs Basic builds
 * 
 * @param {Array<Object>} depth - Depth aggregation data
 */
function renderDepthChart(depth) {
    const trace = {
        x: depth.map(d => d.depth),
        y: depth.map(d => d.count),
        type: 'bar',
        marker: {
            color: ['#3fb950', '#79c0ff', '#58a6ff'],
            line: {
                color: '#30363d',
                width: 1
            }
        },
        hovertemplate: '<b>%{x}</b><br>Builds: %{y}<br>Percentage: ' +
            depth.map(d => d.percentage).join('% / ') + '%<extra></extra>'
    };

    const layout = {
        title: '',
        xaxis: {
            title: 'Build Depth',
            titlefont: { color: '#e6edf3' },
            tickfont: { color: '#e6edf3' }
        },
        yaxis: {
            title: 'Number of Builds',
            titlefont: { color: '#e6edf3' },
            tickfont: { color: '#8b949e' },
            gridcolor: '#30363d'
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: {
            color: '#e6edf3',
            family: 'system-ui, -apple-system, sans-serif'
        },
        margin: { l: 80, r: 40, t: 20, b: 60 },
        height: 400,
        showlegend: false
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false
    };

    Plotly.newPlot('depth-chart', [trace], layout, config);
    console.log('✅ Build depth chart rendered');
}

/**
 * Render Statistics Summary Table
 * Text-based statistics display
 * 
 * @param {Object} stats - Dashboard statistics
 */
function renderStatsChart(stats) {
    const statsHtml = `
        <div style="padding: 20px; color: #e6edf3;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                <div>
                    <h3 style="color: #58a6ff; margin-bottom: 10px;">📊 Build Distribution</h3>
                    <p><strong>Total Builds:</strong> ${formatNumber(stats.totalBuilds)}</p>
                    <p><strong>Deep Builds:</strong> ${stats.deepBuilds} (${((stats.deepBuilds/stats.totalBuilds)*100).toFixed(1)}%)</p>
                    <p><strong>Expanded Builds:</strong> ${stats.expandedBuilds} (${((stats.expandedBuilds/stats.totalBuilds)*100).toFixed(1)}%)</p>
                    <p><strong>Basic Builds:</strong> ${stats.basicBuilds} (${((stats.basicBuilds/stats.totalBuilds)*100).toFixed(1)}%)</p>
                </div>
                <div>
                    <h3 style="color: #79c0ff; margin-bottom: 10px;">🏗️ Project Scope</h3>
                    <p><strong>Total Projects:</strong> ${stats.totalProjects}</p>
                    <p><strong>Avg Builds/Project:</strong> ${stats.averageBuildsPerProject}</p>
                    <p><strong>Total Technologies:</strong> ${stats.totalLanguages}</p>
                    <p><strong>Total Categories:</strong> ${stats.totalCategories}</p>
                </div>
                <div>
                    <h3 style="color: #3fb950; margin-bottom: 10px;">🚀 Deployment</h3>
                    <p><strong>Builds with Live URLs:</strong> ${stats.buildsWithLiveUrl}</p>
                    <p><strong>Deployment Rate:</strong> ${((stats.buildsWithLiveUrl/stats.totalBuilds)*100).toFixed(1)}%</p>
                    <p><em style="color: #8b949e;">💡 Tracks how many builds are deployed to production</em></p>
                </div>
            </div>
        </div>
    `;

    const statsElement = document.getElementById('stats-chart');
    statsElement.innerHTML = statsHtml;
    console.log('✅ Stats summary rendered');
}

/**
 * Render all charts
 * Called after data processing
 * 
 * @param {Object} processedData - Processed dashboard data
 */
function renderAllCharts(processedData) {
    console.log('📊 Rendering all charts...');
    
    renderLanguageChart3D(processedData.languages);
    renderCategoryChart(processedData.categories);
    renderTimelineChart(processedData.velocity);
    renderVelocityChart(processedData.velocity);
    renderSkillsRadar(processedData.skills);
    renderDepthChart(processedData.depth);
    renderStatsChart(processedData.stats);
    
    console.log('✨ All charts rendered successfully');
}

// Export functions (globally accessible)
