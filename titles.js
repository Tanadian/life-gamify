// Title System for Life Gamify App
class TitleSystem {
    constructor() {
        this.titleData = {
            physical: {
                name: 'Physical',
                titles: [
                    { min: 0, max: 9, title: 'Couch Potato', tier: 0 },
                    { min: 10, max: 24, title: 'Getting Started', tier: 1 },
                    { min: 25, max: 49, title: 'Active', tier: 2 },
                    { min: 50, max: 74, title: 'Athlete', tier: 3 },
                    { min: 75, max: 99, title: 'Warrior', tier: 4 },
                    { min: 100, max: Infinity, title: 'Goliath', tier: 5 }
                ]
            },
            mental: {
                name: 'Mental',
                titles: [
                    { min: 0, max: 9, title: 'Scatterbrained', tier: 0 },
                    { min: 10, max: 24, title: 'Curious', tier: 1 },
                    { min: 25, max: 49, title: 'Focused', tier: 2 },
                    { min: 50, max: 74, title: 'Scholar', tier: 3 },
                    { min: 75, max: 99, title: 'Genius', tier: 4 },
                    { min: 100, max: Infinity, title: 'Mastermind', tier: 5 }
                ]
            },
            social: {
                name: 'Social',
                titles: [
                    { min: 0, max: 9, title: 'Hermit', tier: 0 },
                    { min: 10, max: 24, title: 'Shy', tier: 1 },
                    { min: 25, max: 49, title: 'Friendly', tier: 2 },
                    { min: 50, max: 74, title: 'Popular', tier: 3 },
                    { min: 75, max: 99, title: 'Charismatic', tier: 4 },
                    { min: 100, max: Infinity, title: 'Influencer', tier: 5 }
                ]
            },
            creative: {
                name: 'Creative',
                titles: [
                    { min: 0, max: 9, title: 'Uninspired', tier: 0 },
                    { min: 10, max: 24, title: 'Dabbler', tier: 1 },
                    { min: 25, max: 49, title: 'Creative', tier: 2 },
                    { min: 50, max: 74, title: 'Artist', tier: 3 },
                    { min: 75, max: 99, title: 'Visionary', tier: 4 },
                    { min: 100, max: Infinity, title: 'Renaissance', tier: 5 }
                ]
            },
            productive: {
                name: 'Productive',
                titles: [
                    { min: 0, max: 9, title: 'Procrastinator', tier: 0 },
                    { min: 10, max: 24, title: 'Starter', tier: 1 },
                    { min: 25, max: 49, title: 'Organized', tier: 2 },
                    { min: 50, max: 74, title: 'Efficient', tier: 3 },
                    { min: 75, max: 99, title: 'Powerhouse', tier: 4 },
                    { min: 100, max: Infinity, title: 'Unstoppable', tier: 5 }
                ]
            }
        };

        this.tierColors = {
            0: '#666666', // Gray - Starting
            1: '#8B4513', // Brown - Beginner
            2: '#4169E1', // Blue - Developing
            3: '#32CD32', // Green - Competent
            4: '#FFD700', // Gold - Advanced
            5: '#FF1493'  // Pink/Magenta - Master
        };
    }

    // Get title information for a specific stat and point value
    getTitleInfo(statName, points) {
        const stat = this.titleData[statName];
        if (!stat) {
            return {
                title: 'Unknown',
                tier: 0,
                color: this.tierColors[0],
                statName: statName,
                points: points
            };
        }

        const titleInfo = stat.titles.find(t => points >= t.min && points <= t.max);
        if (!titleInfo) {
            // Fallback to highest tier if points exceed max
            const highestTier = stat.titles[stat.titles.length - 1];
            return {
                title: highestTier.title,
                tier: highestTier.tier,
                color: this.tierColors[highestTier.tier],
                statName: stat.name,
                points: points
            };
        }

        return {
            title: titleInfo.title,
            tier: titleInfo.tier,
            color: this.tierColors[titleInfo.tier],
            statName: stat.name,
            points: points
        };
    }

    // Get all title information for current stats
    getAllTitles(stats) {
        const titles = {};
        Object.keys(this.titleData).forEach(statName => {
            const points = stats[statName] || 0;
            titles[statName] = this.getTitleInfo(statName, points);
        });
        return titles;
    }

    // Get progress to next tier
    getProgressToNextTier(statName, points) {
        const stat = this.titleData[statName];
        if (!stat) return null;

        const currentTitleInfo = stat.titles.find(t => points >= t.min && points <= t.max);
        if (!currentTitleInfo) return null;

        // If at max tier, return completion info
        if (currentTitleInfo.tier === 5) {
            return {
                isMaxTier: true,
                currentTier: currentTitleInfo.tier,
                currentTitle: currentTitleInfo.title,
                progress: 100
            };
        }

        // Find next tier
        const nextTierInfo = stat.titles.find(t => t.tier === currentTitleInfo.tier + 1);
        if (!nextTierInfo) return null;

        const pointsInCurrentTier = points - currentTitleInfo.min;
        const pointsNeededForTier = currentTitleInfo.max - currentTitleInfo.min + 1;
        const progress = Math.min((pointsInCurrentTier / pointsNeededForTier) * 100, 100);

        return {
            isMaxTier: false,
            currentTier: currentTitleInfo.tier,
            currentTitle: currentTitleInfo.title,
            nextTier: nextTierInfo.tier,
            nextTitle: nextTierInfo.title,
            pointsToNext: nextTierInfo.min - points,
            progress: progress,
            currentMin: currentTitleInfo.min,
            currentMax: currentTitleInfo.max,
            nextMin: nextTierInfo.min
        };
    }

    // Get tier color
    getTierColor(tier) {
        return this.tierColors[tier] || this.tierColors[0];
    }

    // Get all available tiers for a stat (for debugging/display)
    getStatTiers(statName) {
        return this.titleData[statName]?.titles || [];
    }

    // Check if a title was just unlocked (useful for notifications)
    checkTitleUnlock(statName, oldPoints, newPoints) {
        const oldTitle = this.getTitleInfo(statName, oldPoints);
        const newTitle = this.getTitleInfo(statName, newPoints);
        
        if (oldTitle.tier < newTitle.tier) {
            return {
                unlocked: true,
                oldTitle: oldTitle.title,
                newTitle: newTitle.title,
                tier: newTitle.tier,
                statName: statName
            };
        }
        
        return { unlocked: false };
    }

    // Get a summary of all current titles
    getTitlesSummary(stats) {
        const summary = {
            titles: this.getAllTitles(stats),
            totalTiers: 0,
            maxPossibleTiers: Object.keys(this.titleData).length * 5, // 5 stats × 5 max tier
            averageTier: 0
        };

        const tierValues = Object.values(summary.titles).map(t => t.tier);
        summary.totalTiers = tierValues.reduce((sum, tier) => sum + tier, 0);
        summary.averageTier = summary.totalTiers / tierValues.length;

        return summary;
    }
}

// Create global instance
window.titleSystem = new TitleSystem();
