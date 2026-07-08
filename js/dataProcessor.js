/**
 * Data Processor Module
 * 
 * Transforms raw build data into aggregations and statistics
 * Prepares data for visualization
 * 
 * Key functions:
 * - aggregateByLanguage()
 * - aggregateByCategory()
 * - calculateBuildVelocity()
 * - calculateSkillsProgression()
 * - getDashboardStats()
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
 * @returns {Object} - Depth distribution
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
 * Calculate build velocity over time
 * Simulates timeline by assigning builds to weeks
 * (In real scenario, would use actual completion dates from metadata)
 * 
 * @param {Array<Object>} builds - Array of build objects
 * @returns {Array<Object>} - Weekly build counts
 */
function calculateBuildVelocity(builds) {
    // Group builds into weeks (roughly 286 builds / 52 weeks = ~5.5 per week)
    const weeksPerBuild = builds.length / 52;
    const velocity = [];
    
    for (let week = 0; week < 52; week++) {
        const weekStart = Math.floor(week * weeksPerBuild);
        const weekEnd = Math.floor((week + 1) * weeksPerBuild);
        const weekBuilds = builds.slice(weekStart, weekEnd);
        
        const weekDate = new Date(2024, 0, 1 + (week * 7)); // Approximate dates
        
        velocity.push({
            week: week + 1,
            date: weekDate.toISOString().split('T')[0],
            builds: weekBuilds.length,
            cumulative: weekStart + weekBuilds.length
        });
    }

    console.log('📅 Build velocity calculated:', velocity.length, 'weeks');
    return velocity;
}

/**
 * Estimate skills development based on categories and technologies
 * Creates a radar chart dataset
 * 
 * @param {Array<Object>} builds - Array of build objects
 * @returns {Object} - Skills progression data
 */
function calculateSkillsProgression(builds) {
    const skillAreas = {
        'Frontend': { regex: /react|vue|angular|html|css|javascript|typescript/i, count: 0 },
        'Backend': { regex: /node|python|java|go|rust|php|ruby|django/i, count: 0 },
        'DevOps': { regex: /docker|kubernetes|ci\/cd|aws|gcp|azure|terraform/i, count: 0 },
        'Database': { regex: /sql|mongodb|postgresql|redis|firebase|dynamodb/i, count: 0 },
        'Testing': { regex: /test|jest|mocha|pytest|rspec/i, count: 0 },
        'Mobile': { regex: /react native|flutter|swift|kotlin|mobile/i, count: 0 }
    };

    builds.forEach(build => {
        const allTechs = Array.isArray(build.technology) 
            ? build.technology.join(' ').toLowerCase()
            : (build.technology || '').toLowerCase();
        
        Object.keys(skillAreas).forEach(skill => {
            if (skillAreas[skill].regex.test(allTechs)) {
                skillAreas[skill].count++;
            }
        });
    });

    const skills = Object.entries(skillAreas)
        .map(([skill, data]) => ({
            skill,
            proficiency: Math.min(100, (data.count / builds.length) * 100),
            count: data.count
        }));

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
        buildsWithLiveUrl: builds.filter(b => b.live_url).length,
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
    console.log('Processed data structure:', processedData);
    
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
        'Git': '#F1502F'
    };

    return colors[tech] || '#58A6FF'; // Default to accent blue
}

// Export functions (globally accessible in browser)
