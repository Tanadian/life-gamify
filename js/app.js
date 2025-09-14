// Main Application Logic
class LifeGamifyApp {
    constructor() {
        this.currentStats = {};
        this.currentActivities = [];
        
        this.initializeApp();
        this.bindEvents();
        this.loadInitialData();
    }

    // Initialize the application
    initializeApp() {
        console.log('Life Gamify App initialized');
        
        // Initialize slider value displays
        this.updateSliderValues();
        
        // Set up form validation
        this.setupFormValidation();
    }

    // Bind event listeners
    bindEvents() {
        // Activity form submission
        const activityForm = document.getElementById('activityForm');
        activityForm.addEventListener('submit', (e) => this.handleActivitySubmit(e));

        // Slider value updates
        const sliders = document.querySelectorAll('input[type="range"]');
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => this.updateSliderValue(e.target));
        });

        // Form reset on successful submission
        activityForm.addEventListener('reset', () => {
            setTimeout(() => this.updateSliderValues(), 10);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

        // Intensity guide modal
        const intensityGuideBtn = document.getElementById('intensityGuideBtn');
        const intensityGuideModal = document.getElementById('intensityGuideModal');
        const closeIntensityGuide = document.getElementById('closeIntensityGuide');

        intensityGuideBtn.addEventListener('click', () => {
            intensityGuideModal.style.display = 'block';
        });

        closeIntensityGuide.addEventListener('click', () => {
            intensityGuideModal.style.display = 'none';
        });

        // Close modal when clicking outside
        intensityGuideModal.addEventListener('click', (e) => {
            if (e.target === intensityGuideModal) {
                intensityGuideModal.style.display = 'none';
            }
        });
    }

    // Load initial data and update UI
    loadInitialData() {
        // Check for decline first
        const declineResult = window.dataStorage.checkAndApplyDecline();
        
        this.currentStats = window.dataStorage.getStats();
        this.currentActivities = window.dataStorage.getActivities(10);
        
        this.updateStatsDisplay();
        this.updateStarVisualization();
        this.updateActivitiesList();
        
        // Show decline notification if points were lost
        if (declineResult.declined) {
            this.showDeclineNotification(declineResult);
        }
        
        console.log('Initial data loaded:', {
            stats: this.currentStats,
            activities: this.currentActivities.length,
            decline: declineResult
        });
    }

    // Handle activity form submission
    handleActivitySubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const activityData = this.extractActivityData(formData);
        
        // Validate activity data
        if (!this.validateActivityData(activityData)) {
            return;
        }

        // Add activity to storage
        const newActivity = window.dataStorage.addActivity(activityData);
        
        if (newActivity) {
            // Update current data
            this.currentStats = window.dataStorage.getStats();
            this.currentActivities = window.dataStorage.getActivities(10);
            
            // Update UI
            this.updateStatsDisplay();
            this.updateStarVisualization();
            this.updateActivitiesList();
            
            // Reset form
            e.target.reset();
            this.updateSliderValues();
            
            // Show success feedback
            this.showSuccessMessage(`Added "${activityData.name}" successfully!`);
            
            // Focus back to activity name input
            document.getElementById('activityName').focus();
            
            console.log('Activity added:', newActivity);
        } else {
            this.showErrorMessage('Failed to add activity. Please try again.');
        }
    }

    // Extract activity data from form
    extractActivityData(formData) {
        const stats = {};
        const statTypes = ['physical', 'mental', 'social', 'creative', 'productive'];
        
        statTypes.forEach(stat => {
            const value = parseInt(formData.get(`${stat}Points`)) || 0;
            if (value > 0) {
                stats[stat] = value;
            }
        });

        return {
            name: formData.get('activityName').trim(),
            stats: stats,
            notes: formData.get('activityNotes').trim()
        };
    }

    // Validate activity data
    validateActivityData(activityData) {
        if (!activityData.name) {
            this.showErrorMessage('Please enter an activity name.');
            document.getElementById('activityName').focus();
            return false;
        }

        const totalPoints = Object.values(activityData.stats).reduce((sum, val) => sum + val, 0);
        if (totalPoints === 0) {
            this.showErrorMessage('Please assign at least 1 point to any stat.');
            return false;
        }

        return true;
    }

    // Update slider value displays
    updateSliderValues() {
        const sliders = document.querySelectorAll('input[type="range"]');
        sliders.forEach(slider => {
            this.updateSliderValue(slider);
        });
    }

    // Update individual slider value display
    updateSliderValue(slider) {
        const valueSpan = slider.parentElement.querySelector('.slider-value');
        if (valueSpan) {
            valueSpan.textContent = slider.value;
            
            // Add visual feedback for non-zero values
            if (parseInt(slider.value) > 0) {
                valueSpan.style.color = '#ffcc00';
                valueSpan.style.fontWeight = 'bold';
            } else {
                valueSpan.style.color = '#ffcc00';
                valueSpan.style.fontWeight = 'normal';
            }
        }
    }

    // Update stats display in the summary section
    updateStatsDisplay() {
        const statTypes = ['physical', 'mental', 'social', 'creative', 'productive'];
        
        statTypes.forEach(stat => {
            const element = document.getElementById(`${stat}Total`);
            const nameElement = element?.parentElement.querySelector('.stat-name');
            
            if (element && nameElement) {
                const value = this.currentStats[stat] || 0;
                const titleInfo = window.titleSystem.getTitleInfo(stat, value);
                
                // Update the stat name to show title
                nameElement.textContent = titleInfo.title;
                nameElement.style.color = titleInfo.color;
                nameElement.style.fontWeight = 'bold';
                
                // Update the value display
                element.textContent = value;
                
                // Add tier indicator
                element.setAttribute('data-tier', titleInfo.tier);
                
                // Add animation for value changes
                element.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                }, 200);
            }
        });
        
        // Update star visualization labels
        this.updateStarLabels();
    }

    // Update star visualization labels with titles
    updateStarLabels() {
        const statTypes = ['physical', 'mental', 'social', 'creative', 'productive'];
        
        statTypes.forEach(stat => {
            const labelElement = document.querySelector(`.stat-label[data-stat="${stat}"]`);
            if (labelElement) {
                const value = this.currentStats[stat] || 0;
                const titleInfo = window.titleSystem.getTitleInfo(stat, value);
                
                // Update label text to show title
                labelElement.textContent = titleInfo.title;
                labelElement.style.color = titleInfo.color;
                labelElement.style.fontWeight = 'bold';
                labelElement.setAttribute('data-tier', titleInfo.tier);
            }
        });
    }

    // Update star visualization
    updateStarVisualization() {
        console.log('Updating star visualization with stats:', this.currentStats);
        window.starVisualization.updateStar(this.currentStats);
    }

    // Update activities list
    updateActivitiesList() {
        const activitiesList = document.getElementById('activitiesList');
        
        if (this.currentActivities.length === 0) {
            activitiesList.innerHTML = '<p class="no-activities">No activities yet. Add your first activity above!</p>';
            return;
        }

        activitiesList.innerHTML = '';
        
        this.currentActivities.forEach(activity => {
            const activityElement = this.createActivityElement(activity);
            activitiesList.appendChild(activityElement);
        });
    }

    // Create activity element for the list
    createActivityElement(activity) {
        // Main container with swipe functionality
        const activityContainer = document.createElement('div');
        activityContainer.className = 'activity-container';
        activityContainer.setAttribute('data-activity-id', activity.id);

        // Activity content (swipeable part)
        const activityDiv = document.createElement('div');
        activityDiv.className = 'activity-item';

        // Activity header
        const header = document.createElement('div');
        header.className = 'activity-header';

        const name = document.createElement('div');
        name.className = 'activity-name';
        name.textContent = activity.name;

        const date = document.createElement('div');
        date.className = 'activity-date';
        date.textContent = activity.dateString;

        header.appendChild(name);
        header.appendChild(date);

        // Activity stats
        const statsDiv = document.createElement('div');
        statsDiv.className = 'activity-stats';

        Object.entries(activity.stats).forEach(([stat, value]) => {
            if (value > 0) {
                const badge = document.createElement('span');
                badge.className = `stat-badge ${stat}`;
                badge.textContent = `${stat.charAt(0).toUpperCase() + stat.slice(1)}: +${value}`;
                statsDiv.appendChild(badge);
            }
        });

        // Activity notes
        let notesDiv = null;
        if (activity.notes) {
            notesDiv = document.createElement('div');
            notesDiv.className = 'activity-notes';
            notesDiv.textContent = activity.notes;
        }

        // Assemble activity content
        activityDiv.appendChild(header);
        activityDiv.appendChild(statsDiv);
        if (notesDiv) {
            activityDiv.appendChild(notesDiv);
        }

        // Assemble container
        activityContainer.appendChild(activityDiv);

        // Add swipe functionality
        this.addSwipeGestures(activityContainer, activityDiv);

        return activityContainer;
    }

    // Show success message
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    // Show error message
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    // Show message with type
    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.app-message');
        existingMessages.forEach(msg => msg.remove());

        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `app-message ${type}`;
        messageDiv.textContent = message;

        // Style the message
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;

        // Set background color based on type
        switch (type) {
            case 'success':
                messageDiv.style.background = 'linear-gradient(45deg, #44ff44, #33cc33)';
                break;
            case 'error':
                messageDiv.style.background = 'linear-gradient(45deg, #ff4444, #cc3333)';
                break;
            case 'warning':
                messageDiv.style.background = 'linear-gradient(45deg, #ff8800, #cc6600)';
                break;
            default:
                messageDiv.style.background = 'linear-gradient(45deg, #4488ff, #3366cc)';
        }

        document.body.appendChild(messageDiv);

        // Animate in
        setTimeout(() => {
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateX(0)';
        }, 10);

        // Auto remove after 3 seconds
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
    }

    // Setup form validation
    setupFormValidation() {
        const activityNameInput = document.getElementById('activityName');
        
        activityNameInput.addEventListener('blur', () => {
            if (activityNameInput.value.trim().length === 0) {
                activityNameInput.style.borderColor = '#ff4444';
            } else {
                activityNameInput.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }
        });

        activityNameInput.addEventListener('input', () => {
            activityNameInput.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        });
    }

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + Enter to submit form
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const form = document.getElementById('activityForm');
            if (document.activeElement && form.contains(document.activeElement)) {
                form.dispatchEvent(new Event('submit'));
            }
        }

        // Escape to clear form
        if (e.key === 'Escape') {
            const form = document.getElementById('activityForm');
            if (document.activeElement && form.contains(document.activeElement)) {
                form.reset();
                this.updateSliderValues();
                document.getElementById('activityName').focus();
            }
        }
    }

    // Get app statistics for debugging
    getAppStats() {
        const summary = window.dataStorage.getDataSummary();
        return {
            ...summary,
            currentStats: this.currentStats,
            recentActivities: this.currentActivities.length
        };
    }

    // Refresh all data and UI
    refreshApp() {
        this.loadInitialData();
        this.showSuccessMessage('App refreshed successfully!');
    }

    // Add swipe gesture functionality
    addSwipeGestures(container, swipeableElement) {
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let isDragging = false;
        let startTime = 0;

        const threshold = 80; // Minimum swipe distance to trigger action
        const velocityThreshold = 0.3; // Minimum velocity for quick swipes

        const handleStart = (e) => {
            e.preventDefault();
            const point = e.touches ? e.touches[0] : e;
            startX = point.clientX;
            startY = point.clientY;
            currentX = 0;
            isDragging = true;
            startTime = Date.now();
            
            swipeableElement.style.transition = 'none';
            container.classList.add('swiping');
        };

        const handleMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const point = e.touches ? e.touches[0] : e;
            const deltaX = point.clientX - startX;
            const deltaY = point.clientY - startY;
            
            // Prevent vertical scrolling during horizontal swipe
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                currentX = deltaX;
                
                // Limit swipe distance
                const maxSwipe = 150;
                const limitedX = Math.max(-maxSwipe, Math.min(maxSwipe, currentX));
                
                swipeableElement.style.transform = `translateX(${limitedX}px)`;
                
                // Visual feedback based on swipe direction
                if (limitedX > threshold) {
                    container.classList.add('swipe-edit');
                    container.classList.remove('swipe-delete');
                } else if (limitedX < -threshold) {
                    container.classList.add('swipe-delete');
                    container.classList.remove('swipe-edit');
                } else {
                    container.classList.remove('swipe-edit', 'swipe-delete');
                }
            }
        };

        const handleEnd = (e) => {
            if (!isDragging) return;
            isDragging = false;
            
            const endTime = Date.now();
            const timeDiff = endTime - startTime;
            const velocity = Math.abs(currentX) / timeDiff;
            
            swipeableElement.style.transition = 'transform 0.3s ease';
            container.classList.remove('swiping', 'swipe-edit', 'swipe-delete');
            
            // Determine action based on distance and velocity
            const shouldTrigger = Math.abs(currentX) > threshold || velocity > velocityThreshold;
            
            if (shouldTrigger) {
                const activityId = parseInt(container.getAttribute('data-activity-id'));
                
                if (currentX > 0) {
                    // Right swipe - Edit
                    setTimeout(() => {
                        swipeableElement.style.transform = 'translateX(0)';
                        this.editActivity(activityId);
                    }, 100);
                } else {
                    // Left swipe - Delete
                    setTimeout(() => {
                        swipeableElement.style.transform = 'translateX(0)';
                        this.deleteActivityWithUndo(activityId);
                    }, 100);
                }
            } else {
                // Snap back to original position
                swipeableElement.style.transform = 'translateX(0)';
            }
        };

        // Touch events for mobile
        swipeableElement.addEventListener('touchstart', handleStart, { passive: false });
        swipeableElement.addEventListener('touchmove', handleMove, { passive: false });
        swipeableElement.addEventListener('touchend', handleEnd, { passive: false });

        // Mouse events for desktop
        swipeableElement.addEventListener('mousedown', handleStart);
        swipeableElement.addEventListener('mousemove', handleMove);
        swipeableElement.addEventListener('mouseup', handleEnd);
        swipeableElement.addEventListener('mouseleave', handleEnd);
    }

    // Edit activity functionality
    editActivity(activityId) {
        const activity = this.currentActivities.find(a => a.id === activityId);
        if (!activity) return;

        // Find the activity container
        const container = document.querySelector(`[data-activity-id="${activityId}"]`);
        if (!container) return;

        const activityItem = container.querySelector('.activity-item');
        
        // Create edit form
        const editForm = document.createElement('div');
        editForm.className = 'activity-edit-form';
        editForm.innerHTML = `
            <div class="edit-form-content">
                <div class="form-group">
                    <label>Activity Name:</label>
                    <input type="text" class="edit-name" value="${activity.name}" required>
                </div>
                <div class="form-group">
                    <label>Notes:</label>
                    <textarea class="edit-notes" placeholder="Optional notes...">${activity.notes || ''}</textarea>
                </div>
                <div class="edit-stats">
                    <label>Stats:</label>
                    <div class="edit-stat-sliders">
                        ${['physical', 'mental', 'social', 'creative', 'productive'].map(stat => `
                            <div class="edit-slider-group">
                                <span class="stat-label">${stat.charAt(0).toUpperCase() + stat.slice(1)}:</span>
                                <input type="range" class="edit-stat-slider" data-stat="${stat}" 
                                       min="0" max="5" value="${activity.stats[stat] || 0}">
                                <span class="edit-stat-value">${activity.stats[stat] || 0}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="edit-actions">
                    <button class="edit-save-btn">Save</button>
                    <button class="edit-cancel-btn">Cancel</button>
                </div>
            </div>
        `;

        // Replace activity content with edit form
        activityItem.style.display = 'none';
        container.appendChild(editForm);

        // Bind slider events
        const sliders = editForm.querySelectorAll('.edit-stat-slider');
        sliders.forEach(slider => {
            const updateValue = () => {
                const valueSpan = slider.parentElement.querySelector('.edit-stat-value');
                valueSpan.textContent = slider.value;
            };
            slider.addEventListener('input', updateValue);
        });

        // Save button
        editForm.querySelector('.edit-save-btn').addEventListener('click', () => {
            const newName = editForm.querySelector('.edit-name').value.trim();
            const newNotes = editForm.querySelector('.edit-notes').value.trim();
            
            if (!newName) {
                this.showErrorMessage('Activity name is required.');
                return;
            }

            const newStats = {};
            sliders.forEach(slider => {
                const stat = slider.getAttribute('data-stat');
                const value = parseInt(slider.value);
                if (value > 0) {
                    newStats[stat] = value;
                }
            });

            if (Object.keys(newStats).length === 0) {
                this.showErrorMessage('Please assign at least 1 point to any stat.');
                return;
            }

            // Update activity in storage
            if (this.updateActivity(activityId, { name: newName, notes: newNotes, stats: newStats })) {
                this.showSuccessMessage('Activity updated successfully!');
                this.loadInitialData(); // Refresh data and UI
            } else {
                this.showErrorMessage('Failed to update activity.');
            }
        });

        // Cancel button
        editForm.querySelector('.edit-cancel-btn').addEventListener('click', () => {
            editForm.remove();
            activityItem.style.display = 'block';
        });

        // Focus on name input
        editForm.querySelector('.edit-name').focus();
    }

    // Update activity in storage
    updateActivity(activityId, newData) {
        const data = window.dataStorage.loadData();
        const activityIndex = data.activities.findIndex(a => a.id === activityId);
        
        if (activityIndex === -1) return false;

        const oldActivity = data.activities[activityIndex];
        
        // Update activity
        data.activities[activityIndex] = {
            ...oldActivity,
            name: newData.name,
            notes: newData.notes,
            stats: newData.stats
        };

        // Recalculate stats from scratch
        data.stats = { physical: 0, mental: 0, social: 0, creative: 0, productive: 0 };
        data.activities.forEach(activity => {
            Object.keys(activity.stats).forEach(stat => {
                if (activity.stats[stat] > 0) {
                    data.stats[stat] += activity.stats[stat];
                }
            });
        });

        return window.dataStorage.saveData(data);
    }

    // Delete activity with undo functionality
    deleteActivityWithUndo(activityId) {
        const activity = this.currentActivities.find(a => a.id === activityId);
        if (!activity) return;

        const container = document.querySelector(`[data-activity-id="${activityId}"]`);
        if (!container) return;

        // Add deletion animation
        container.style.transition = 'all 0.3s ease';
        container.style.transform = 'translateX(-100%)';
        container.style.opacity = '0.5';
        container.classList.add('deleting');

        // Show undo notification
        this.showUndoNotification(activityId, activity.name, () => {
            // Undo callback - restore the activity
            container.style.transform = 'translateX(0)';
            container.style.opacity = '1';
            container.classList.remove('deleting');
        }, () => {
            // Permanent delete callback
            if (window.dataStorage.deleteActivity(activityId)) {
                this.loadInitialData(); // Refresh data and UI
                this.showSuccessMessage(`"${activity.name}" deleted successfully.`);
            } else {
                this.showErrorMessage('Failed to delete activity.');
                // Restore on error
                container.style.transform = 'translateX(0)';
                container.style.opacity = '1';
                container.classList.remove('deleting');
            }
        });
    }

    // Show decline notification
    showDeclineNotification(declineResult) {
        const declinedStats = Object.entries(declineResult.statDeclines)
            .filter(([stat, data]) => data.declined > 0)
            .map(([stat, data]) => `${stat.charAt(0).toUpperCase() + stat.slice(1)}: -${data.declined}`)
            .join(', ');

        if (declinedStats) {
            this.showMessage(`Points declined due to inactivity: ${declinedStats}`, 'warning');
        }
    }

    // Show undo notification
    showUndoNotification(activityId, activityName, undoCallback, deleteCallback) {
        // Remove any existing undo notifications
        const existingUndo = document.querySelectorAll('.undo-notification');
        existingUndo.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = 'undo-notification';
        notification.innerHTML = `
            <div class="undo-content">
                <span class="undo-text">"${activityName}" will be deleted</span>
                <button class="undo-btn">UNDO</button>
                <div class="undo-timer">
                    <div class="undo-progress"></div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Position and animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        let timeLeft = 5000; // 5 seconds
        const interval = 50;
        const progressBar = notification.querySelector('.undo-progress');
        
        const timer = setInterval(() => {
            timeLeft -= interval;
            const progress = (5000 - timeLeft) / 5000 * 100;
            progressBar.style.width = `${progress}%`;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                notification.classList.remove('show');
                setTimeout(() => {
                    notification.remove();
                    deleteCallback();
                }, 300);
            }
        }, interval);

        // Undo button click
        notification.querySelector('.undo-btn').addEventListener('click', () => {
            clearInterval(timer);
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
            undoCallback();
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.lifeGamifyApp = new LifeGamifyApp();
    console.log('Life Gamify App ready!');
});
