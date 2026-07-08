/**
 * Main Dashboard Orchestration
 * 
 * Controls the entire dashboard lifecycle:
 * 1. Fetch data from 286-builds repo
 * 2. Process and aggregate data
 * 3. Render visualizations
 * 4. Handle errors and loading states
 */

// ============================================
// State Management
// ============================================

let dashboardState = {
    isLoading: false,
    isError: false,
    errorMessage: '',
    data: null,
    timestamp: null,
    autoRefreshStarted: false
};

// ============================================
// DOM Elements
// ============================================

const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error');
const contentElement = document.getElementById('content');
const errorMessageElement = document.getElementById('error-message');
const lastUpdatedElement = document.getElementById('last-updated');

// ============================================
// Main Initialization
// ============================================

/**
 * Initialize dashboard on page load
 * Orchestrates entire data flow
 */
async function initializeDashboard() {
    console.log('🚀 Initializing dashboard...');
    
    try {
        // Show loading state
        setLoadingState(true);
        
        // Step 1: Fetch raw build data
        console.log('📡 Step 1: Fetching build data...');
        const builds = await getAllBuildsData(false); // false = don't enrich with GitHub metadata yet
        
        if (!builds || builds.length === 0) {
            throw new Error('No builds data received');
        }
        
        console.log(`✅ Fetched ${builds.length} builds`);
        
        // Step 2: Process data for visualizations
        console.log('🔄 Step 2: Processing data...');
        const processedData = processAllData(builds);
        
        // Step 3: Update dashboard statistics
        console.log('📊 Step 3: Updating statistics...');
        updateDashboardStats(processedData.stats);
        
        // Step 4: Render all visualizations
        console.log('🎨 Step 4: Rendering charts...');
        renderAllCharts(processedData);
        
        // Update state
        dashboardState.data = processedData;
        dashboardState.timestamp = new Date();
        
        // Show success
        setLoadingState(false);
        showContent();

        // Only start the auto-refresh timer once -- initializeDashboard
        // only runs on page load, but guard anyway since a second timer
        // would double up every refresh from then on.
        if (!dashboardState.autoRefreshStarted) {
            setupAutoRefresh(5);
            dashboardState.autoRefreshStarted = true;
        }

        console.log('✨ Dashboard initialized successfully!');

    } catch (error) {
        console.error('❌ Dashboard initialization failed:', error);
        showError(error.message || 'Failed to load dashboard data');
        setLoadingState(false);
    }
}

// ============================================
// UI State Management
// ============================================

/**
 * Set loading state
 * 
 * @param {Boolean} isLoading - Loading state
 */
function setLoadingState(isLoading) {
    dashboardState.isLoading = isLoading;
    
    if (isLoading) {
        loadingElement.classList.remove('hidden');
        contentElement.classList.add('hidden');
        errorElement.classList.add('hidden');
    }
}

/**
 * Show error message
 * 
 * @param {String} message - Error message to display
 */
function showError(message) {
    console.error('⚠️ Error:', message);
    dashboardState.isError = true;
    dashboardState.errorMessage = message;
    
    errorMessageElement.textContent = message;
    errorElement.classList.remove('hidden');
    contentElement.classList.add('hidden');
    loadingElement.classList.add('hidden');
}

/**
 * Show dashboard content
 */
function showContent() {
    contentElement.classList.remove('hidden');
    errorElement.classList.add('hidden');
    loadingElement.classList.add('hidden');
}

// ============================================
// Statistics Update
// ============================================

/**
 * Update header statistics cards
 * 
 * @param {Object} stats - Dashboard statistics
 */
function updateDashboardStats(stats) {
    console.log('📈 Updating dashboard stats...');
    
    // Update stat cards
    document.getElementById('total-builds').textContent = formatNumber(stats.totalBuilds);
    document.getElementById('total-languages').textContent = stats.totalLanguages;
    document.getElementById('total-categories').textContent = stats.totalCategories;
    document.getElementById('total-projects').textContent = stats.totalProjects;
    
    // Update last updated timestamp
    const now = new Date();
    const timeString = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
    });
    lastUpdatedElement.textContent = timeString;
    
    console.log('✅ Statistics updated');
}

// ============================================
// Data Refresh
// ============================================

/**
 * Refresh dashboard data
 * Can be called to update data without page reload
 */
async function refreshDashboard() {
    console.log('🔄 Refreshing dashboard...');
    
    try {
        setLoadingState(true);
        
        // Re-fetch and process
        const builds = await getAllBuildsData(false);
        const processedData = processAllData(builds);
        
        // Update everything
        updateDashboardStats(processedData.stats);
        renderAllCharts(processedData);
        
        dashboardState.data = processedData;
        dashboardState.timestamp = new Date();
        
        setLoadingState(false);
        showContent();
        
        console.log('✨ Dashboard refreshed!');
        
    } catch (error) {
        showError('Failed to refresh dashboard: ' + error.message);
        setLoadingState(false);
    }
}

// ============================================
// Event Listeners
// ============================================

/**
 * Add keyboard shortcuts
 */
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + R to refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshDashboard();
    }
});

// ============================================
// Auto-refresh Configuration
// ============================================

/**
 * Set up auto-refresh timer
 * Refreshes dashboard every 5 minutes
 */
function setupAutoRefresh(intervalMinutes = 5) {
    const intervalMs = intervalMinutes * 60 * 1000;
    
    console.log(`⏱️ Auto-refresh enabled: every ${intervalMinutes} minutes`);
    
    setInterval(() => {
        console.log('🔄 Auto-refreshing...');
        refreshDashboard();
    }, intervalMs);
}

// ============================================
// Export/Download Functions
// ============================================

/**
 * Export dashboard data as JSON
 */
function exportDataAsJSON() {
    if (!dashboardState.data) {
        console.warn('No data to export');
        return;
    }
    
    const dataStr = JSON.stringify(dashboardState.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `286-builds-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log('✅ Data exported as JSON');
}

/**
 * Export dashboard stats as CSV
 */
function exportStatsAsCSV() {
    if (!dashboardState.data) {
        console.warn('No data to export');
        return;
    }
    
    const stats = dashboardState.data.stats;
    const languages = dashboardState.data.languages;
    const categories = dashboardState.data.categories;
    
    let csv = 'Dashboard Export\n\n';
    
    // Overall stats
    csv += 'STATISTICS\n';
    csv += 'Metric,Value\n';
    Object.entries(stats).forEach(([key, value]) => {
        csv += `${key},${value}\n`;
    });
    
    csv += '\n\nLANGUAGES\n';
    csv += 'Language,Count,Percentage\n';
    languages.forEach(lang => {
        csv += `${lang.name},${lang.count},${lang.percentage}%\n`;
    });
    
    csv += '\n\nCATEGORIES\n';
    csv += 'Category,Count,Percentage\n';
    categories.forEach(cat => {
        csv += `${cat.name},${cat.count},${cat.percentage}%\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `286-builds-stats-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log('✅ Stats exported as CSV');
}

// ============================================
// Debugging & Logging
// ============================================

/**
 * Log dashboard state for debugging
 */
function logDashboardState() {
    console.log('📊 Dashboard State:', dashboardState);
}

/**
 * Make functions accessible in console for debugging
 */
window.dashboard = {
    refresh: refreshDashboard,
    exportJSON: exportDataAsJSON,
    exportCSV: exportStatsAsCSV,
    state: () => logDashboardState(),
    data: () => dashboardState.data
};

console.log('💡 Tip: Type dashboard.state() in console to see dashboard state');
console.log('💡 Tip: Type dashboard.data() in console to see all data');
console.log('💡 Tip: Type dashboard.refresh() in console to manually refresh');
console.log('💡 Tip: Type dashboard.exportJSON() in console to export data');
console.log('💡 Tip: Type dashboard.exportCSV() in console to export stats');

// ============================================
// Page Lifecycle
// ============================================

/**
 * Run when DOM is fully loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, initializing dashboard...');
    initializeDashboard();
});

/**
 * Handle page visibility changes
 * Refresh data when user returns to tab
 */
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        console.log('👁️ Page visible, checking if refresh needed...');
        
        // Refresh if data is older than 5 minutes
        if (dashboardState.timestamp) {
            const ageMs = Date.now() - dashboardState.timestamp.getTime();
            const ageMinutes = ageMs / (60 * 1000);
            
            if (ageMinutes > 5) {
                console.log(`⏱️ Data is ${ageMinutes.toFixed(1)} minutes old, refreshing...`);
                refreshDashboard();
            }
        }
    }
});

/**
 * Handle errors thrown globally
 */
window.addEventListener('error', (event) => {
    console.error('🔴 Global error:', event.error);
    showError(`An unexpected error occurred: ${event.message}`);
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('🔴 Unhandled promise rejection:', event.reason);
    showError(`An unexpected error occurred: ${event.reason}`);
});

console.log('✨ Main.js loaded successfully');
