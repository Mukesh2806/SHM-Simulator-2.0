// --- Canvas and Contexts ---
const simCanvas = document.getElementById('shmSimulationCanvas');
const simCtx = simCanvas.getContext('2d');

const graphCanvas = document.getElementById('shmGraphCanvas');
const graphCtx = graphCanvas.getContext('2d');

// --- Control Elements ---
const massInput = document.getElementById('mass');
const massValueSpan = document.getElementById('massValue');
const springConstantInput = document.getElementById('springConstant');
const springConstantValueSpan = document.getElementById('springConstantValue');
const initialAmplitudeInput = document.getElementById('initialAmplitude');
const initialAmplitudeValueSpan = document.getElementById('initialAmplitudeValue');
const startButton = document.getElementById('startSimulation');
const resetButton = document.getElementById('resetSimulation');

// --- Simulation Parameters ---
let mass = parseFloat(massInput.value);
let springConstant = parseFloat(springConstantInput.value);
let initialAmplitude = parseFloat(initialAmplitudeInput.value);

let angularFrequency = Math.sqrt(springConstant / mass); // ω = sqrt(k/m)
let period = (2 * Math.PI) / angularFrequency; // T = 2π/ω

// --- Simulation State Variables ---
let time = 0;
let position = initialAmplitude; // x(t)
let velocity = 0; // v(t)
let animationFrameId;
let simulationActive = false;

// --- Drawing Properties ---
const simScale = 100; // Pixels per meter for simulation canvas
const blockWidth = 60; // Pixels
const blockHeight = 40; // Pixels
const wallX = 50; // X-coordinate of the fixed wall
const groundY = simCanvas.height - 50; // Y-coordinate of the ground/surface
const equilibriumX = wallX + 200; // Equilibrium position X-coordinate (arbitrary, adjust for visual)

// --- Graph Properties ---
const graphScaleY = 80; // Pixels per meter for graph (amplitude)
const graphScaleX = 50; // Pixels per second for graph (time)
const graphOriginX = 50; // X-coordinate of graph origin
const graphOriginY = graphCanvas.height / 2; // Y-coordinate of graph origin (center)
const maxGraphTime = 20; // Max time shown on graph in seconds
const graphHistory = []; // Stores {time, position} data for plotting

// --- Event Listeners ---
massInput.addEventListener('input', updateParameters);
springConstantInput.addEventListener('input', updateParameters);
initialAmplitudeInput.addEventListener('input', updateParameters);
startButton.addEventListener('click', startSimulation);
resetButton.addEventListener('click', resetSimulation);

// --- Simulation Logic ---

function updateParameters() {
    mass = parseFloat(massInput.value);
    massValueSpan.textContent = mass.toFixed(1);

    springConstant = parseFloat(springConstantInput.value);
    springConstantValueSpan.textContent = springConstant.toFixed(0);

    initialAmplitude = parseFloat(initialAmplitudeInput.value);
    initialAmplitudeValueSpan.textContent = initialAmplitude.toFixed(1);

    // Recalculate angular frequency and period
    angularFrequency = Math.sqrt(springConstant / mass);
    period = (2 * Math.PI) / angularFrequency;

    resetSimulation(); // Reset simulation with new parameters
}

function updatePhysics(deltaTime) {
    time += deltaTime;
    // SHM equation: x(t) = A * cos(ωt) assuming v(0) = 0
    position = initialAmplitude * Math.cos(angularFrequency * time);
    // Velocity: v(t) = -A * ω * sin(ωt)
    velocity = -initialAmplitude * angularFrequency * Math.sin(angularFrequency * time);

    // Store data for graph
    graphHistory.push({ time: time, position: position });
    // Keep graph history within visible range
    if (graphHistory.length * (graphScaleX * 0.03) > graphCanvas.width - graphOriginX) { // 0.03 is deltaTime
        graphHistory.shift(); // Remove oldest data point
    }
}

// --- Drawing Functions ---

function drawSimulation() {
    simCtx.clearRect(0, 0, simCanvas.width, simCanvas.height); // Clear simulation canvas

    // Draw ground
    simCtx.fillStyle = '#d3d3d3'; // Light grey
    simCtx.fillRect(0, groundY, simCanvas.width, simCanvas.height - groundY);
    simCtx.strokeStyle = '#888';
    simCtx.lineWidth = 2;
    simCtx.beginPath();
    simCtx.moveTo(0, groundY);
    simCtx.lineTo(simCanvas.width, groundY);
    simCtx.stroke();

    // Draw fixed wall
    simCtx.fillStyle = '#666'; // Dark grey
    simCtx.fillRect(wallX - 10, groundY - 100, 20, 100); // Wall base
    simCtx.fillRect(wallX - 10, groundY - 100, 20, 100);
    simCtx.strokeStyle = '#333';
    simCtx.lineWidth = 2;
    simCtx.strokeRect(wallX - 10, groundY - 100, 20, 100);

    // Draw spring
    const currentBlockX = equilibriumX + position * simScale;
    const springStartX = wallX;
    const springEndX = currentBlockX - blockWidth / 2; // Connect to center of block's left face

    simCtx.strokeStyle = '#3498db'; // Blue spring
    simCtx.lineWidth = 3;
    simCtx.beginPath();
    simCtx.moveTo(springStartX, groundY - blockHeight / 2);

    // Draw spring coils (simplified)
    const numCoils = 15;
    const coilLength = (springEndX - springStartX) / numCoils;
    const coilHeight = 15;

    for (let i = 0; i <= numCoils; i++) {
        const x = springStartX + i * coilLength;
        const yOffset = (i % 2 === 0) ? coilHeight : -coilHeight;
        simCtx.lineTo(x, groundY - blockHeight / 2 + yOffset);
    }
    simCtx.stroke();


    // Draw block (mass)
    simCtx.fillStyle = '#e74c3c'; // Red block
    simCtx.fillRect(currentBlockX - blockWidth / 2, groundY - blockHeight, blockWidth, blockHeight);
    simCtx.strokeStyle = '#c0392b';
    simCtx.lineWidth = 2;
    simCtx.strokeRect(currentBlockX - blockWidth / 2, groundY - blockHeight, blockWidth, blockHeight);

    // --- Markings on Simulation Canvas ---
    simCtx.font = '14px Arial';
    simCtx.fillStyle = 'black';
    simCtx.textAlign = 'center';

    // Equilibrium position
    simCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    simCtx.setLineDash([5, 5]); // Dashed line
    simCtx.beginPath();
    simCtx.moveTo(equilibriumX, groundY - blockHeight - 20);
    simCtx.lineTo(equilibriumX, groundY + 20);
    simCtx.stroke();
    simCtx.fillText('Equilibrium (x=0)', equilibriumX, groundY + 35);

    // Amplitude markings
    simCtx.strokeStyle = 'rgba(0, 128, 0, 0.7)'; // Green for amplitude
    simCtx.beginPath();
    simCtx.moveTo(equilibriumX + initialAmplitude * simScale, groundY - blockHeight - 20);
    simCtx.lineTo(equilibriumX + initialAmplitude * simScale, groundY + 20);
    simCtx.stroke();

    simCtx.beginPath();
    simCtx.moveTo(equilibriumX - initialAmplitude * simScale, groundY - blockHeight - 20);
    simCtx.lineTo(equilibriumX - initialAmplitude * simScale, groundY + 20);
    simCtx.stroke();
    
    simCtx.setLineDash([]); // Reset line dash
}

function drawGraph() {
    graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height); // Clear graph canvas

    // Draw axes
    graphCtx.strokeStyle = '#666';
    graphCtx.lineWidth = 1;
    graphCtx.beginPath();
    graphCtx.moveTo(graphOriginX, 0); // Y-axis
    graphCtx.lineTo(graphOriginX, graphCanvas.height);
    graphCtx.moveTo(0, graphOriginY); // X-axis (time)
    graphCtx.lineTo(graphCanvas.width, graphOriginY);
    graphCtx.stroke();

    // Axis labels
    graphCtx.font = '12px Arial';
    graphCtx.fillStyle = 'black';
    graphCtx.textAlign = 'center';
    graphCtx.fillText('Time (s)', graphCanvas.width / 2, graphCanvas.height - 10);
    graphCtx.textAlign = 'right';
    graphCtx.fillText('Displacement (m)', graphOriginX - 5, 10);

    // Draw amplitude lines on graph
    graphCtx.strokeStyle = 'rgba(0, 128, 0, 0.5)'; // Green dashed for amplitude
    graphCtx.setLineDash([3, 3]);
    graphCtx.beginPath();
    graphCtx.moveTo(graphOriginX, graphOriginY - initialAmplitude * graphScaleY);
    graphCtx.lineTo(graphCanvas.width, graphOriginY - initialAmplitude * graphScaleY);
    graphCtx.stroke();

    graphCtx.beginPath();
    graphCtx.moveTo(graphOriginX, graphOriginY + initialAmplitude * graphScaleY);
    graphCtx.lineTo(graphCanvas.width, graphOriginY + initialAmplitude * graphScaleY);
    graphCtx.stroke();
    graphCtx.setLineDash([]);

    // Draw the displacement-time graph
    graphCtx.strokeStyle = '#e74c3c'; // Red line for graph
    graphCtx.lineWidth = 2;
    graphCtx.beginPath();

    // Offset the graph drawing to keep the latest data visible
    const currentGraphXOffset = (graphHistory.length > 0) ? graphHistory[graphHistory.length - 1].time * graphScaleX - (graphCanvas.width - graphOriginX) : 0;

    graphHistory.forEach((point, index) => {
        const x = graphOriginX + point.time * graphScaleX - currentGraphXOffset;
        const y = graphOriginY - point.position * graphScaleY;

        if (index === 0) {
            graphCtx.moveTo(x, y);
        } else {
            graphCtx.lineTo(x, y);
        }
    });
    graphCtx.stroke();

    // Mark current time on graph
    graphCtx.fillStyle = 'blue';
    graphCtx.beginPath();
    const currentX = graphOriginX + time * graphScaleX - currentGraphXOffset;
    const currentY = graphOriginY - position * graphScaleY;
    graphCtx.arc(currentX, currentY, 4, 0, Math.PI * 2);
    graphCtx.fill();


    // Mark Period on graph (if enough time has passed for at least one period)
    if (time >= period) {
        graphCtx.strokeStyle = 'purple';
        graphCtx.setLineDash([2, 4]);
        graphCtx.beginPath();
        // Find the start of the current period cycle on the graph
        const periodStartX = graphOriginX + (time - (time % period)) * graphScaleX - currentGraphXOffset;
        graphCtx.moveTo(periodStartX, graphOriginY - initialAmplitude * graphScaleY - 10);
        graphCtx.lineTo(periodStartX + period * graphScaleX, graphOriginY - initialAmplitude * graphScaleY - 10);
        graphCtx.stroke();

        // Arrow heads for period
        graphCtx.beginPath();
        graphCtx.moveTo(periodStartX, graphOriginY - initialAmplitude * graphScaleY - 10);
        graphCtx.lineTo(periodStartX + 5, graphOriginY - initialAmplitude * graphScaleY - 15);
        graphCtx.moveTo(periodStartX, graphOriginY - initialAmplitude * graphScaleY - 10);
        graphCtx.lineTo(periodStartX + 5, graphOriginY - initialAmplitude * graphScaleY - 5);
        graphCtx.stroke();

        graphCtx.beginPath();
        graphCtx.moveTo(periodStartX + period * graphScaleX, graphOriginY - initialAmplitude * graphScaleY - 10);
        graphCtx.lineTo(periodStartX + period * graphScaleX - 5, graphOriginY - initialAmplitude * graphScaleY - 15);
        graphCtx.moveTo(periodStartX + period * graphScaleX, graphOriginY - initialAmplitude * graphScaleY - 10);
        graphCtx.lineTo(periodStartX + period * graphScaleX - 5, graphOriginY - initialAmplitude * graphScaleY - 5);
        graphCtx.stroke();

        graphCtx.textAlign = 'center';
        graphCtx.setLineDash([]);
    }
}

// --- Animation Loop ---

function animationLoop(currentTime) {
    const deltaTime = (currentTime - (animationLoop.lastTime || currentTime)) / 1000; // Convert ms to seconds
    animationLoop.lastTime = currentTime;

    if (simulationActive) {
        updatePhysics(deltaTime);
        drawSimulation();
        drawGraph();
        animationFrameId = requestAnimationFrame(animationLoop);
    }
}

// --- Control Functions ---

function startSimulation() {
    if (simulationActive) {
        return;
    }
    simulationActive = true;
    animationLoop.lastTime = performance.now(); // Initialize lastTime for deltaTime calculation
    animationFrameId = requestAnimationFrame(animationLoop);
}

function resetSimulation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    simulationActive = false;
    time = 0;
    position = initialAmplitude; // Reset position to initial amplitude
    velocity = 0;
    graphHistory.length = 0; // Clear graph history

    // Redraw initial state
    drawSimulation();
    drawGraph();
}

// --- Initial Setup ---
updateParameters(); // Set initial values and draw