// Data Storage Management
class DataStorage {
    constructor() {
        this.storageKey = 'lifeGamifyData';
        this.defaultData = {
            stats: {
                physical: 0,
                mental: 0,
                social: 0,
                creative: 0,
                productive: 0
            },
            activities: [],
            lastActivity: {
                physical: null,
                mental: null,
                social: null,
                creative: null,
                productive: null
            },
            settings: {
                maxStatValue: 100, // For scaling the star visualization
                createdDate: new Date().toISOString(),
                declineSettings: {
                    enabled: true,
                    inactivityDays: 4, // Days before decline starts
                    declineRate: 1 // Points lost per day after inactivity
                }
            }
        };
    }

    // Load data from localStorage
    loadData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                // Merge with default data to ensure all properties exist
                return {
                    ...this.defaultData,
                    ...parsedData,
                    stats: { ...this.defaultData.stats, ...parsedData.stats },
                    settings: { ...this.defaultData.settings, ...parsedData.settings }
                };
            }
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
        }
        return this.defaultData;
    }

    // Save data to localStorage
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
            return false;
        }
    }

    // Add a new activity and update stats
    addActivity(activityData) {
        const data = this.loadData();
        
        // Apply decline before adding new activity
        this.applyDecline(data);
        
        // Create activity object
        const activity = {
            id: Date.now(), // Simple ID using timestamp
            name: activityData.name,
            stats: { ...activityData.stats },
            notes: activityData.notes || '',
            date: new Date().toISOString(),
            dateString: new Date().toLocaleDateString()
        };

        // Add to activities array (newest first)
        data.activities.unshift(activity);

        // Update total stats
        Object.keys(activity.stats).forEach(stat => {
            if (activity.stats[stat] > 0) {
                data.stats[stat] += activity.stats[stat];
                // Update last activity timestamp for this stat
                data.lastActivity[stat] = new Date().toISOString();
            }
        });

        // Keep only last 50 activities to prevent storage bloat
        if (data.activities.length > 50) {
            data.activities = data.activities.slice(0, 50);
        }

        // Save updated data
        this.saveData(data);
        return activity;
    }

    // Get current stats
    getStats() {
        const data = this.loadData();
        return data.stats;
    }

    // Get recent activities
    getActivities(limit = 10) {
        const data = this.loadData();
        return data.activities.slice(0, limit);
    }

    // Get all activities
    getAllActivities() {
        const data = this.loadData();
        return data.activities;
    }

    // Delete an activity and recalculate stats
    deleteActivity(activityId) {
        const data = this.loadData();
        const activityIndex = data.activities.findIndex(activity => activity.id === activityId);
        
        if (activityIndex === -1) {
            return false;
        }

        const activity = data.activities[activityIndex];
        
        // Remove activity from array
        data.activities.splice(activityIndex, 1);

        // Recalculate stats from scratch
        data.stats = { ...this.defaultData.stats };
        data.activities.forEach(act => {
            Object.keys(act.stats).forEach(stat => {
                if (act.stats[stat] > 0) {
                    data.stats[stat] += act.stats[stat];
                }
            });
        });

        this.saveData(data);
        return true;
    }

    // Export data as JSON
    exportData() {
        const data = this.loadData();
        const exportData = {
            ...data,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        return JSON.stringify(exportData, null, 2);
    }

    // Import data from JSON
    importData(jsonString) {
        try {
            const importedData = JSON.parse(jsonString);
            
            // Validate imported data structure
            if (!importedData.stats || !importedData.activities) {
                throw new Error('Invalid data format');
            }

            // Merge with default data to ensure all properties exist
            const validatedData = {
                ...this.defaultData,
                ...importedData,
                stats: { ...this.defaultData.stats, ...importedData.stats },
                settings: { ...this.defaultData.settings, ...importedData.settings }
            };

            this.saveData(validatedData);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Clear all data (reset)
    clearAllData() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    // Get data summary for display
    getDataSummary() {
        const data = this.loadData();
        const totalPoints = Object.values(data.stats).reduce((sum, value) => sum + value, 0);
        
        return {
            totalActivities: data.activities.length,
            totalPoints: totalPoints,
            createdDate: data.settings.createdDate,
            lastActivity: data.activities.length > 0 ? data.activities[0].date : null,
            highestStat: this.getHighestStat(data.stats)
        };
    }

    // Helper method to find highest stat
    getHighestStat(stats) {
        let highest = { name: '', value: 0 };
        Object.entries(stats).forEach(([name, value]) => {
            if (value > highest.value) {
                highest = { name, value };
            }
        });
        return highest;
    }

    // Get stats for a specific date range
    getStatsForDateRange(startDate, endDate) {
        const data = this.loadData();
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const filteredActivities = data.activities.filter(activity => {
            const activityDate = new Date(activity.date);
            return activityDate >= start && activityDate <= end;
        });

        const rangeStats = { ...this.defaultData.stats };
        filteredActivities.forEach(activity => {
            Object.keys(activity.stats).forEach(stat => {
                if (activity.stats[stat] > 0) {
                    rangeStats[stat] += activity.stats[stat];
                }
            });
        });

        return {
            stats: rangeStats,
            activities: filteredActivities,
            totalPoints: Object.values(rangeStats).reduce((sum, value) => sum + value, 0)
        };
    }

    // Apply decline to stats based on inactivity
    applyDecline(data) {
        if (!data.settings.declineSettings.enabled) {
            return { declined: false };
        }

        const now = new Date();
        const inactivityThreshold = data.settings.declineSettings.inactivityDays;
        const declineRate = data.settings.declineSettings.declineRate;
        const declineResults = {};
        let totalDeclined = 0;

        Object.keys(data.stats).forEach(stat => {
            const lastActivityDate = data.lastActivity[stat];
            
            if (!lastActivityDate || data.stats[stat] <= 0) {
                declineResults[stat] = { declined: 0, daysSinceActivity: 0 };
                return;
            }

            const lastActivity = new Date(lastActivityDate);
            const daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
            
            if (daysSinceActivity > inactivityThreshold) {
                const daysOfDecline = daysSinceActivity - inactivityThreshold;
                const pointsToDecline = Math.min(daysOfDecline * declineRate, data.stats[stat]);
                
                data.stats[stat] = Math.max(0, data.stats[stat] - pointsToDecline);
                declineResults[stat] = { 
                    declined: pointsToDecline, 
                    daysSinceActivity: daysSinceActivity 
                };
                totalDeclined += pointsToDecline;
            } else {
                declineResults[stat] = { declined: 0, daysSinceActivity: daysSinceActivity };
            }
        });

        return {
            declined: totalDeclined > 0,
            totalPointsDeclined: totalDeclined,
            statDeclines: declineResults
        };
    }

    // Get decline status for UI display
    getDeclineStatus() {
        const data = this.loadData();
        const now = new Date();
        const inactivityThreshold = data.settings.declineSettings.inactivityDays;
        const status = {};

        Object.keys(data.stats).forEach(stat => {
            const lastActivityDate = data.lastActivity[stat];
            
            if (!lastActivityDate) {
                status[stat] = {
                    status: 'never_active',
                    daysSinceActivity: 0,
                    daysUntilDecline: 0,
                    isAtRisk: false,
                    isDeclining: false
                };
                return;
            }

            const lastActivity = new Date(lastActivityDate);
            const daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
            const daysUntilDecline = Math.max(0, inactivityThreshold - daysSinceActivity);
            
            status[stat] = {
                status: daysSinceActivity > inactivityThreshold ? 'declining' : 
                        daysSinceActivity >= inactivityThreshold - 1 ? 'at_risk' : 'safe',
                daysSinceActivity: daysSinceActivity,
                daysUntilDecline: daysUntilDecline,
                isAtRisk: daysSinceActivity >= inactivityThreshold - 1,
                isDeclining: daysSinceActivity > inactivityThreshold,
                lastActivityDate: lastActivityDate
            };
        });

        return status;
    }

    // Get current stats with decline applied (for display)
    getStatsWithDecline() {
        const data = this.loadData();
        this.applyDecline(data);
        return data.stats;
    }

    // Manual decline check (can be called from UI)
    checkAndApplyDecline() {
        const data = this.loadData();
        const declineResult = this.applyDecline(data);
        
        if (declineResult.declined) {
            this.saveData(data);
        }
        
        return declineResult;
    }
}

// Create global instance
window.dataStorage = new DataStorage();
