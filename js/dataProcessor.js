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
    const dateFormatOptions = {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
    };
    const startLabel = startDate.toLocaleDateString(undefined, dateFormatOptions);
    const endLabel = endDate.toLocaleDateString(undefined, dateFormatOptions);

    return `${startLabel} - ${endLabel}`;
}

/**
 * Skill area keyword patterns, shared by every skills calculation below
 * so there's exactly one definition of what counts as "Frontend",
 * "Backend", etc.
 */
const SKILL_AREA_PATTERNS = {
    'Frontend': /react|vue|angular|html|css|javascript|typescript|es modules/i,
    'Backend': /node|python|java|go|rust|php|ruby|django|networking/i,
    'DevOps': /docker|kubernetes|ci\/cd|aws|gcp|azure|terraform|automation|bash|shell/i,
    'Database': /sql|mongodb|postgresql|redis|firebase|dynamodb|sqlite/i,
    'Testing': /test|jest|mocha|pytest|rspec|junit|xctest/i,
    'Mobile': /react native|flutter|swift|kotlin|mobile|android|ios|compose/i,
    'Data & ML': /data|analytics|streamlit|ml|machine learning|pandas|matplotlib/i,
    'CLI Tools': /cli|command|bash|shell|click/i
};

/**
 * Builds the searchable text used to match a build against skill areas.
 *
 * @param {Object} build - A single build object.
 * @returns {String} - Lowercased text combining technology, category, and description.
 */
function buildSkillSearchText(build) {
    return (
        (Array.isArray(build.technology) ? build.technology.join(' ') : build.technology || '') + ' ' +
        (build.category || '') + ' ' +
        (build.description || '')
    ).toLowerCase();
}

/**
 * Calculates skill coverage cumulatively, build by build in chronological
 * order, so the radar chart can show how coverage actually grew over the
 * series instead of only a single end-state snapshot.
 *
 * @param {Array<Object>} builds - Array of build objects.
 * @returns {Array<Object>} - One snapshot per build: {index, buildNumber, date, projectName, skills}.
 */
function calculateSkillsProgressionOverTime(builds) {
    const sortedBuilds = [...builds]
        .map(build => ({ ...build, parsedDate: parseBuildDate(build.date) }))
        .filter(build => !Number.isNaN(build.parsedDate.getTime()))
        .sort((a, b) => a.parsedDate - b.parsedDate);

    const runningCounts = {};
    Object.keys(SKILL_AREA_PATTERNS).forEach(skill => {
        runningCounts[skill] = 0;
    });

    const snapshots = sortedBuilds.map((build, position) => {
        const buildsSoFar = position + 1;
        const searchableText = buildSkillSearchText(build);

        Object.entries(SKILL_AREA_PATTERNS).forEach(([skill, regex]) => {
            if (regex.test(searchableText)) {
                runningCounts[skill]++;
            }
        });

        const skills = Object.entries(runningCounts)
            .map(([skill, count]) => ({
                skill,
                proficiency: Math.min(100, (count / buildsSoFar) * 100),
                count
            }))
            .filter(s => s.count > 0)
            .sort((a, b) => b.proficiency - a.proficiency);

        return {
            index: buildsSoFar,
            buildNumber: build.build_number,
            date: build.date,
            projectName: build.project_name,
            skills
        };
    });

    console.log(`🎯 Skills progression calculated: ${snapshots.length} snapshots`);
    return snapshots;
}

/**
 * Generate dashboard statistics
 * 
 * @param {Array<Object>} builds - Array of build objects
 * @returns {Object} - Dashboard stats
 */
function getDashboardStats(builds) {
    const deployedBuilds = builds.filter(b => b.is_deployed || (b.repo_url && b.notes && b.notes.toLowerCase().includes('vercel'))).length;
    
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
 * Process all data for dashboard display
 * Orchestrates all aggregation and processing functions
 *
 * @param {Array<Object>} builds - Raw build data
 * @returns {Object} - Complete processed dashboard data
 */
function processAllData(builds) {
    console.log('🔄 Processing all data...');

    const skillsProgression = calculateSkillsProgressionOverTime(builds);
    const latestSkillsSnapshot = skillsProgression[skillsProgression.length - 1];

    const processedData = {
        builds: builds,
        stats: getDashboardStats(builds),
        languages: aggregateByLanguage(builds),
        categories: aggregateByCategory(builds),
        depth: aggregateByDepth(builds),
        velocity: calculateBuildVelocity(builds),
        skills: latestSkillsSnapshot ? latestSkillsSnapshot.skills : [],
        skillsProgression: skillsProgression,
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
