// Star Visualization System
class StarVisualization {
    constructor(svgId) {
        this.svg = document.getElementById(svgId);
        this.centerX = 200;
        this.centerY = 200;
        this.minRadius = 30; // Minimum star point length
        this.maxRadius = 150; // Maximum star point length
        this.innerRadius = 60; // Inner star radius (between points)
        
        // Stat colors matching CSS variables
        this.statColors = {
            physical: '#ff4444',
            mental: '#4488ff',
            social: '#44ff44',
            creative: '#ff44ff',
            productive: '#ffaa44'
        };

        // Stat order (clockwise from top)
        this.statOrder = ['physical', 'mental', 'social', 'creative', 'productive'];
        
        this.initializeSVG();
    }

    // Initialize SVG with base elements
    initializeSVG() {
        // Clear existing content
        this.svg.innerHTML = '';

        // Create gradient definitions
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        // Create gradients for each stat
        Object.entries(this.statColors).forEach(([stat, color]) => {
            const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
            gradient.setAttribute('id', `gradient-${stat}`);
            gradient.setAttribute('cx', '50%');
            gradient.setAttribute('cy', '50%');
            gradient.setAttribute('r', '50%');

            const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop1.setAttribute('offset', '0%');
            stop1.setAttribute('stop-color', color);
            stop1.setAttribute('stop-opacity', '0.8');

            const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop2.setAttribute('offset', '100%');
            stop2.setAttribute('stop-color', color);
            stop2.setAttribute('stop-opacity', '0.3');

            gradient.appendChild(stop1);
            gradient.appendChild(stop2);
            defs.appendChild(gradient);
        });

        this.svg.appendChild(defs);

        // Create background circle
        const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bgCircle.setAttribute('cx', this.centerX);
        bgCircle.setAttribute('cy', this.centerY);
        bgCircle.setAttribute('r', this.maxRadius);
        bgCircle.setAttribute('fill', 'none');
        bgCircle.setAttribute('stroke', 'rgba(255, 255, 255, 0.1)');
        bgCircle.setAttribute('stroke-width', '2');
        bgCircle.setAttribute('stroke-dasharray', '5,5');
        this.svg.appendChild(bgCircle);

        // Create grid lines for reference
        this.createGridLines();
    }

    // Create reference grid lines
    createGridLines() {
        const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gridGroup.setAttribute('class', 'grid-lines');
        gridGroup.setAttribute('opacity', '0.1');

        // Create concentric circles for reference
        for (let i = 1; i <= 3; i++) {
            const radius = this.minRadius + (this.maxRadius - this.minRadius) * (i / 3);
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', this.centerX);
            circle.setAttribute('cy', this.centerY);
            circle.setAttribute('r', radius);
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke', 'rgba(255, 255, 255, 0.3)');
            circle.setAttribute('stroke-width', '1');
            gridGroup.appendChild(circle);
        }

        // Create lines to each star point
        for (let i = 0; i < 5; i++) {
            const angle = (i * 72 - 90) * Math.PI / 180; // Start from top, go clockwise
            const x = this.centerX + Math.cos(angle) * this.maxRadius;
            const y = this.centerY + Math.sin(angle) * this.maxRadius;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', this.centerX);
            line.setAttribute('y1', this.centerY);
            line.setAttribute('x2', x);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', 'rgba(255, 255, 255, 0.2)');
            line.setAttribute('stroke-width', '1');
            gridGroup.appendChild(line);
        }

        this.svg.appendChild(gridGroup);
    }

    // Calculate star points based on stats
    calculateStarPoints(stats) {
        const points = [];
        
        // Find the maximum stat value for better scaling
        const maxStatValue = Math.max(...Object.values(stats), 1);
        const scalingFactor = Math.min(maxStatValue / 50, 1); // Dynamic scaling based on actual data
        
        console.log('Star calculation - Stats:', stats, 'Max value:', maxStatValue, 'Scaling factor:', scalingFactor);
        
        for (let i = 0; i < 5; i++) {
            const stat = this.statOrder[i];
            const statValue = stats[stat] || 0;
            
            // Calculate radius based on stat value with improved scaling
            // Use a combination of absolute and relative scaling
            let normalizedValue;
            if (maxStatValue <= 20) {
                // For small values, use absolute scaling
                normalizedValue = Math.min(statValue / 20, 1);
            } else {
                // For larger values, use relative scaling with a minimum threshold
                normalizedValue = Math.min(statValue / Math.max(maxStatValue, 20), 1);
                // Ensure minimum visibility for non-zero values
                if (statValue > 0 && normalizedValue < 0.1) {
                    normalizedValue = 0.1;
                }
            }
            
            const radius = this.minRadius + (this.maxRadius - this.minRadius) * normalizedValue;
            
            // Calculate angle for star tip (start from top, go clockwise)
            const angle = (i * 72 - 90) * Math.PI / 180;
            
            // Calculate star tip position (this should extend based on stat value)
            const tipX = this.centerX + Math.cos(angle) * radius;
            const tipY = this.centerY + Math.sin(angle) * radius;
            
            points.push({
                tip: { x: tipX, y: tipY },
                stat: stat,
                value: statValue,
                radius: radius,
                angle: angle,
                normalizedValue: normalizedValue
            });
        }
        
        console.log('Star points calculated:', points.map(p => ({ stat: p.stat, value: p.value, radius: p.radius })));
        return points;
    }

    // Create SVG path string for the star
    createStarPath(points) {
        if (points.length === 0) return '';
        
        // Create a proper 5-pointed star by alternating between tips and inner points
        let path = '';
        
        for (let i = 0; i < points.length; i++) {
            const currentTip = points[i];
            const nextTip = points[(i + 1) % points.length];
            
            // Calculate inner point between current and next tip
            // Make inner radius proportional to adjacent tip values for better star shape
            const avgRadius = (currentTip.radius + nextTip.radius) / 2;
            const dynamicInnerRadius = Math.max(this.minRadius * 0.4, avgRadius * 0.4);
            
            const innerAngle = (currentTip.angle + nextTip.angle) / 2;
            // If we cross the 0-degree boundary, adjust the angle
            if (Math.abs(nextTip.angle - currentTip.angle) > Math.PI) {
                const adjustedInnerAngle = innerAngle + (innerAngle < 0 ? Math.PI : -Math.PI);
                var innerX = this.centerX + Math.cos(adjustedInnerAngle) * dynamicInnerRadius;
                var innerY = this.centerY + Math.sin(adjustedInnerAngle) * dynamicInnerRadius;
            } else {
                var innerX = this.centerX + Math.cos(innerAngle) * dynamicInnerRadius;
                var innerY = this.centerY + Math.sin(innerAngle) * dynamicInnerRadius;
            }
            
            if (i === 0) {
                path = `M ${currentTip.tip.x} ${currentTip.tip.y}`;
            }
            
            // Line to inner point, then to next tip
            path += ` L ${innerX} ${innerY} L ${nextTip.tip.x} ${nextTip.tip.y}`;
        }
        
        path += ' Z'; // Close the path
        return path;
    }

    // Create layered bevel star effect (Option 3: Subtle Gradient-like Bevel)
    createBevelStarLayers(points) {
        const layers = [];
        
        // Define the 3 layers with their colors and scale factors
        const layerConfig = [
            { color: '#FFA500', stroke: '#FF8C00', scale: 1.0, opacity: 1 },      // Outer: Warm Gold
            { color: '#FFD700', stroke: '#FFA500', scale: 0.9, opacity: 1 },     // Middle: Bright Gold  
            { color: '#FFFFE0', stroke: '#FFD700', scale: 0.8, opacity: 1 }      // Inner: Light Yellow
        ];
        
        // Create each layer
        layerConfig.forEach((config, index) => {
            // Scale the points for this layer
            const scaledPoints = points.map(point => ({
                ...point,
                radius: point.radius * config.scale,
                tip: {
                    x: this.centerX + (point.tip.x - this.centerX) * config.scale,
                    y: this.centerY + (point.tip.y - this.centerY) * config.scale
                }
            }));
            
            // Create the star path element
            const starPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            starPath.setAttribute('class', `star-path star-layer-${index}`);
            starPath.setAttribute('d', this.createStarPath(scaledPoints));
            starPath.setAttribute('fill', config.color);
            starPath.setAttribute('stroke', config.stroke);
            starPath.setAttribute('stroke-width', '1');
            starPath.setAttribute('opacity', config.opacity);
            
            // Add glow effect to the innermost layer
            if (index === layerConfig.length - 1) {
                starPath.setAttribute('filter', 'url(#starGlow)');
                
                // Create glow filter if it doesn't exist
                if (!this.svg.querySelector('#starGlow')) {
                    const defs = this.svg.querySelector('defs');
                    const glowFilter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
                    glowFilter.setAttribute('id', 'starGlow');
                    
                    const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
                    blur.setAttribute('stdDeviation', '2.5');
                    blur.setAttribute('result', 'coloredBlur');
                    
                    const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
                    const mergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
                    mergeNode1.setAttribute('in', 'coloredBlur');
                    const mergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
                    mergeNode2.setAttribute('in', 'SourceGraphic');
                    
                    merge.appendChild(mergeNode1);
                    merge.appendChild(mergeNode2);
                    glowFilter.appendChild(blur);
                    glowFilter.appendChild(merge);
                    defs.appendChild(glowFilter);
                }
            }
            
            layers.push(starPath);
        });
        
        return layers;
    }

    // Update the star visualization
    updateStar(stats) {
        // Remove existing star elements
        const existingStars = this.svg.querySelectorAll('.star-path, .stat-point');
        existingStars.forEach(el => el.remove());

        const points = this.calculateStarPoints(stats);
        
        if (points.length === 0) return;

        // Create layered bevel star effect (Option 3: Subtle Gradient-like Bevel)
        const starLayers = this.createBevelStarLayers(points);
        
        // Add each layer to the SVG (from largest to smallest for proper layering)
        starLayers.forEach(layer => {
            this.svg.appendChild(layer);
        });


        // Add animation to all star layers
        starLayers.forEach(layer => {
            this.animateStar(layer);
        });
    }

    // Show tooltip for stat point
    showStatTooltip(point, element) {
        // Remove existing tooltip
        this.hideStatTooltip();

        const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        tooltip.setAttribute('class', 'stat-tooltip');

        // Tooltip background
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('x', point.tip.x - 40);
        bg.setAttribute('y', point.tip.y - 35);
        bg.setAttribute('width', '80');
        bg.setAttribute('height', '25');
        bg.setAttribute('fill', 'rgba(0, 0, 0, 0.8)');
        bg.setAttribute('stroke', this.statColors[point.stat]);
        bg.setAttribute('stroke-width', '1');
        bg.setAttribute('rx', '5');

        // Tooltip text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', point.tip.x);
        text.setAttribute('y', point.tip.y - 18);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-weight', 'bold');
        text.textContent = `${point.stat}: ${point.value}`;

        tooltip.appendChild(bg);
        tooltip.appendChild(text);
        this.svg.appendChild(tooltip);
    }

    // Hide tooltip
    hideStatTooltip() {
        const tooltip = this.svg.querySelector('.stat-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    // Animate star appearance
    animateStar(starElement) {
        // Start with scale 0 and fade in
        starElement.style.transformOrigin = `${this.centerX}px ${this.centerY}px`;
        starElement.style.transform = 'scale(0)';
        starElement.style.opacity = '0';

        // Animate to full size with full opacity for bevel effect
        setTimeout(() => {
            starElement.style.transition = 'all 0.5s ease-out';
            starElement.style.transform = 'scale(1)';
            starElement.style.opacity = '1';
        }, 50);
    }

    // Get current max stat value for scaling
    getMaxStatValue(stats) {
        return Math.max(...Object.values(stats), 1);
    }

    // Reset star to empty state
    resetStar() {
        const emptyStats = {
            physical: 0,
            mental: 0,
            social: 0,
            creative: 0,
            productive: 0
        };
        this.updateStar(emptyStats);
    }
}

// Create global instance
window.starVisualization = new StarVisualization('statsStar');
