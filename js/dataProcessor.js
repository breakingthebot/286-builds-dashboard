/**
 * Data Processor Module
 * 
 * Transforms raw build data into aggregations and statistics
 * Prepares data for visualization
 * 
 * Now uses REAL dates from your builds data!
 */

/**
 * Count and aggregate builds by programming language
 * 
 * @param {Array<Object>} builds - Array of build objects
 * @returns {Array<Object>} - Array of {language, count, percentage}
 */
function aggregateByLanguage(builds) {
    const languageMap = {};
    
    builds.forEach(build => {
        const techs = Array.isArray(build.technology) ? build.technology : [build.technology];
        
        techs.forEach(tech => {
            if (tech) {
                languageMap[tech] = (languageMap[tech] || 0) + 1;
            }
        });
    });

    // Convert to array and sort by count
    const languages = Object.entries(languageMap)
        .map(([name, count]) => ({
            name,
            count,
            percentage: ((count / builds.length) * 100).toFixed(2)
        }))
        .sort((a, b) => b.count - a.count);

    console.log('📊 Languages aggregated:', languages);
    return languages;
}

/**
 * Count and aggregate builds by category
 * Uses YOUR real category data!
 * 
 * @param {Array<Object>} builds - Array of build objects
 * @returns {Array<Object>} - Array of {category, count, percentage}
 */
function aggregateByCategory(builds) {
    const categoryMap = {};
    
    builds.forEach(build => {
        const cat = build.category || 'Uncategorized';
        categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const categories = Object.entries(categoryMap)
        .map(([name, count]) => ({
            name,
            count,
            percentage: ((count / builds.length) * 100).toFixed(2)
        }))
        .sort((a, b) => b.count - a.count);

    console.log('📁 Categories aggregated:', categories);
    return categories;
}

/**
 * Aggregate builds by depth level (Deep, Expanded, Basic)
 * 
 * @param {Array<Object>} builds - Array of build objects
 * @returns {Array<Object>} - Depth distribution
 */
function aggregateByDepth(builds) {
    const depthMap = {
        'Deep': 0,
        'Expanded': 0,
        'Basic': 0
    };
    
    builds.forEach(build => {
        const depth = build.build_depth || 'Basic';
        if (depthMap.hasOwnProperty(depth)) {
            depthMap[depth]++;
        }
    });

    const result = Object.entries(depthMap)
        .map(([depth, count]) => ({
            depth,
            count,
            percentage: ((count / builds.length) * 100).toFixed(2)
        }));

    console.log('📈 Build depth aggregated:', result);
    return result;
}

/**
 * Calculate build velocity using REAL DATES from your builds
 * Groups by week based on actual dates
 * 
 * @param {Array<Object>} builds - Array of build objects sorted by date
 * @returns {Array<Object>} - Weekly build counts
 */
function calculateBuildVelocity(builds) {
    // Sort by date
    const sortedBuilds = [...builds]
        .map(build => ({
            ...build,
            parsedDate: parseBuildDate(build.date)
        }))
        .filter(build => !Number.isNaN(build.parsedDate.getTime()))
        .sort((a, b) => a.parsedDate - b.parsedDate);
    
    // Group by week
    const weekMap = {};
    let cumulative = 0;
    
    sortedBuilds.forEach(build => {
        const weekStart = getWeekStart(build.parsedDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weekMap[weekKey]) {
            weekMap[weekKey] = {
                week: formatWeekLabel(weekStart, weekEnd),
                weekKey: weekKey,
                date: weekKey,
                weekStart: weekKey,
                weekEnd: weekEnd.toISOString().split('T')[0],
                builds: 0,
                cumulative: 0,
                projects: new Set()
            };
        }
        
        cumulative++;
        weekMap[weekKey].builds++;
        weekMap[weekKey].cumulative = cumulative;
        weekMap[weekKey].projects.add(build.project_name);
    });
    
    // Convert to array and calculate cumulative
    const velocity = Object.values(weekMap)
        .sort((a, b) => {
            const aDate = new Date(a.weekStart);
            const bDate = new Date(b.weekStart);
            return aDate - bDate;
        })
        .map(week => ({
            week: week.week,
            weekKey: week.weekKey,
            date: week.date,
            weekStart: week.weekStart,
            weekEnd: week.weekEnd,
            builds: week.builds,
            cumulative: week.cumulative
        }));

    console.log('📅 Build velocity calculated from real dates:', velocity.length, 'weeks');
    return velocity;
}

function parseBuildDate(dateValue) {
    if (!dateValue) {
        return new Date(NaN);
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return new Date(`${dateValue}T00:00:00Z`);
    }

    return new Date(dateValue);
}

function getWeekStart(date) {
    const weekStart = new Date(date);
    const day = weekStart.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    weekStart.setUTCDate(weekStart.getUTCDate() + diffToMonday);
    weekStart.setUTCHours(0, 0, 0, 0);
    return weekStart;
}

function formatWeekLabel(startDate, endDate) {
    const startLabel = startDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
    });
    const endLabel = endDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
    });

    return `${startLabel} - ${endLabel}`;
}

/**
 * Estimate skills development based on categories and technologies
 * Creates a radar chart dataset
 * 
 * @param {Array<Object>} builds - Array of build objects
 * @returns {Array<Object>} - Skills progression data
 */
function calculateSkillsProgression(builds) {
    const skillAreas = {
        'Frontend': { regex: /react|vue|angular|html|css|javascript|typescript|es modules/i, count: 0 },
        'Backend': { regex: /node|python|java|go|rust|php|ruby|django|networking/i, count: 0 },
        'DevOps': { regex: /docker|kubernetes|ci\/cd|aws|gcp|azure|terraform|automation|bash|shell/i, count: 0 },
        'Database': { regex: /sql|mongodb|postgresql|redis|firebase|dynamodb|sqlite/i, count: 0 },
        'Testing': { regex: /test|jest|mocha|pytest|rspec|junit|xctest/i, count: 0 },
        'Mobile': { regex: /react native|flutter|swift|kotlin|mobile|android|ios|compose/i, count: 0 },
        'Data & ML': { regex: /data|analytics|streamlit|ml|machine learning|pandas|matplotlib/i, count: 0 },
        'CLI Tools': { regex: /cli|command|bash|shell|click/i, count: 0 }
    };

    builds.forEach(build => {
        const allText = (
            (Array.isArray(build.technology) ? build.technology.join(' ') : build.technology || '') + ' ' +
            (build.category || '') + ' ' +
            (build.description || '')
        ).toLowerCase();
        
        Object.keys(skillAreas).forEach(skill => {
            if (skillAreas[skill].regex.test(allText)) {
                skillAreas[skill].count++;
            }
        });
    });

    const skills = Object.entries(skillAreas)
        .map(([skill, data]) => ({
            skill,
            proficiency: Math.min(100, (data.count / builds.length) * 100),
            count: data.count
        }))
        .filter(s => s.count > 0) // Only show skills with at least 1 build
        .sort((a, b) => b.proficiency - a.proficiency);

    console.log('🎯 Skills progression calculated:', skills);
    return skills;
}

/**
 * Generate dashboard statistics
 * 
 * @param {Array<Object>} builds - Array of build objects
 * @returns {Object} - Dashboard stats
 */
function getDashboardStats(builds) {
    const deployedBuilds = builds.filter(b => b.is_deployed).length;
    
    const stats = {
        totalBuilds: builds.length,
        totalProjects: new Set(builds.map(b => b.project_name)).size,
        totalLanguages: new Set(
            builds.flatMap(b => Array.isArray(b.technology) ? b.technology : [b.technology])
        ).size,
        totalCategories: new Set(builds.map(b => b.category)).size,
        averageBuildsPerProject: (builds.length / new Set(builds.map(b => b.project_name)).size).toFixed(1),
        deepBuilds: builds.filter(b => b.build_depth === 'Deep').length,
        expandedBuilds: builds.filter(b => b.build_depth === 'Expanded').length,
        basicBuilds: builds.filter(b => b.build_depth === 'Basic').length,
        buildsWithLiveUrl: deployedBuilds,
        deploymentRate: ((deployedBuilds / builds.length) * 100).toFixed(1)
    };

    console.log('📊 Dashboard stats calculated:', stats);
    return stats;
}

/**
 * Calculate technology co-occurrence
 * Which technologies are most frequently used together
 * 
 * @param {Array<Object>} builds - Array of build objects
 * @returns {Array<Object>} - Tech pairs with frequency
 */
function calculateTechCooccurrence(builds) {
    const pairs = {};
    
    builds.forEach(build => {
        const techs = Array.isArray(build.technology) 
            ? build.technology 
            : [build.technology];
        
        // Create pairs of technologies
        for (let i = 0; i < techs.length; i++) {
            for (let j = i + 1; j < techs.length; j++) {
                const pair = [techs[i], techs[j]].sort().join(' + ');
                pairs[pair] = (pairs[pair] || 0) + 1;
            }
        }
    });

    const result = Object.entries(pairs)
        .map(([pair, count]) => ({ pair, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 pairs

    console.log('🔗 Technology co-occurrence calculated:', result);
    return result;
}

/**
 * Process all data for dashboard display
 * Orchestrates all aggregation and processing functions
 * 
 * @param {Array<Object>} builds - Raw build data
 * @returns {Object} - Complete processed dashboard data
 */
function processAllData(builds) {
    console.log('🔄 Processing all data...');
    
    const processedData = {
        builds: builds,
        stats: getDashboardStats(builds),
        languages: aggregateByLanguage(builds),
        categories: aggregateByCategory(builds),
        depth: aggregateByDepth(builds),
        velocity: calculateBuildVelocity(builds),
        skills: calculateSkillsProgression(builds),
        techPairs: calculateTechCooccurrence(builds),
        timestamp: new Date().toISOString()
    };

    console.log('✅ Data processing complete');
    
    return processedData;
}

/**
 * Helper: Format number with thousand separators
 * 
 * @param {Number} num - Number to format
 * @returns {String} - Formatted number
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Helper: Get color for technology category
 * Used for consistent coloring across charts
 * 
 * @param {String} tech - Technology name
 * @returns {String} - Hex color
 */
function getTechColor(tech) {
    const colors = {
        'JavaScript': '#F7DF1E',
        'TypeScript': '#3178C6',
        'React': '#61DAFB',
        'Python': '#3776AB',
        'Node.js': '#339933',
        'HTML': '#E34C26',
        'CSS': '#563D7C',
        'Vue': '#4FC08D',
        'Angular': '#DD0031',
        'Java': '#007396',
        'Go': '#00ADD8',
        'Rust': '#CE422B',
        'Docker': '#2496ED',
        'SQL': '#CC2927',
        'MongoDB': '#13AA52',
        'PostgreSQL': '#336791',
        'AWS': '#FF9900',
        'Git': '#F1502F',
        'Kotlin': '#7F52FF',
        'Swift': '#FA7343',
        'Lua': '#000080',
        'Shell': '#4EAA25',
        'Streamlit': '#FF2B2B'
    };

    return colors[tech] || '#58A6FF'; // Default to accent blue
}

console.log('✨ DataProcessor.js loaded');
