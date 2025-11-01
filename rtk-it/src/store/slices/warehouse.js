import { createSlice } from '@reduxjs/toolkit';

// Генерация начальных данных для демонстрации
const generateInitialRobots = () => {
    const robots = {};
    for (let i = 1; i <= 15; i++) {
        const battery = Math.floor(Math.random() * 100);
        let status = 'active';
        if (battery < 20) status = 'low_battery';
        if (Math.random() < 0.1) status = 'offline';

        robots[`robot_${i}`] = {
            id: `robot_${i}`,
            battery,
            status,
            lastUpdate: new Date().toISOString(),
            position: {
                x: Math.floor(Math.random() * 26), // A-Z
                y: Math.floor(Math.random() * 50) + 1 // 1-50
            }
        };
    }
    return robots;
};

const generateInitialZones = () => {
    const zones = {};
    const statuses = ['checked', 'needs_check', 'critical'];

    for (let col = 'A'.charCodeAt(0); col <= 'Z'.charCodeAt(0); col++) {
        for (let row = 1; row <= 50; row++) {
            const zoneId = `${String.fromCharCode(col)}${row}`;
            zones[zoneId] = {
                id: zoneId,
                status: statuses[Math.floor(Math.random() * statuses.length)],
                lastChecked: new Date(Date.now() - Math.random() * 86400000).toISOString()
            };
        }
    }
    return zones;
};

const initialState = {
    robots: generateInitialRobots(),
    scans: [],
    stats: {
        activeRobots: 12,
        totalRobots: 15,
        scannedToday: 2456,
        criticalItems: 23,
        avgBattery: 76
    },
    predictions: [
        {
            id: 1,
            name: "Смартфон Galaxy X",
            currentStock: 45,
            predictedDate: "2024-12-15",
            recommendedOrder: 200,
            confidence: 87
        },
        {
            id: 2,
            name: "Ноутбук ProBook 15",
            currentStock: 32,
            predictedDate: "2024-12-18",
            recommendedOrder: 150,
            confidence: 92
        }
    ],
    predictionConfidence: 89,
    isScanPaused: false,
    websocketStatus: 'connected',
    warehouseMap: {
        zones: generateInitialZones(),
        scale: 1,
        center: { x: 12, y: 25 }
    },
    activityData: Array.from({ length: 60 }, (_, i) => ({
        time: i,
        active: Math.floor(Math.random() * 10) + 5
    }))
};

const warehouseSlice = createSlice({
    name: 'warehouse',
    initialState,
    reducers: {
        updateRobots: (state, action) => {
            state.robots = { ...state.robots, ...action.payload };
        },

        addScan: (state, action) => {
            if (!state.isScanPaused) {
                const newScan = {
                    id: Date.now(),
                    timestamp: new Date().toLocaleTimeString(),
                    robotId: action.payload.robotId || `robot_${Math.floor(Math.random() * 15) + 1}`,
                    zone: action.payload.zone || `A${Math.floor(Math.random() * 50) + 1}`,
                    product: action.payload.product || `Товар ${Math.floor(Math.random() * 1000)}`,
                    sku: action.payload.sku || `SKU-${Math.floor(Math.random() * 10000)}`,
                    quantity: action.payload.quantity || Math.floor(Math.random() * 100),
                    status: action.payload.status || ['OK', 'Низкий остаток', 'Критично'][Math.floor(Math.random() * 3)]
                };

                state.scans.unshift(newScan);
                if (state.scans.length > 20) {
                    state.scans = state.scans.slice(0, 20);
                }
            }
        },

        updateStats: (state, action) => {
            state.stats = { ...state.stats, ...action.payload };
        },

        updatePredictions: (state, action) => {
            state.predictions = action.payload.predictions || state.predictions;
            state.predictionConfidence = action.payload.confidence || state.predictionConfidence;
        },

        toggleScanPause: (state) => {
            state.isScanPaused = !state.isScanPaused;
        },

        updateWebsocketStatus: (state, action) => {
            state.websocketStatus = action.payload;
        },

        updateMapView: (state, action) => {
            if (action.payload.scale !== undefined) {
                state.warehouseMap.scale = Math.max(0.5, Math.min(3, action.payload.scale));
            }
            if (action.payload.center) {
                state.warehouseMap.center = action.payload.center;
            }
        },

        updateActivityData: (state, action) => {
            state.activityData = action.payload;
        },

        // Демо-действие для симуляции данных
        simulateData: (state) => {
            // Обновляем батареи роботов
            Object.values(state.robots).forEach(robot => {
                if (robot.status !== 'offline') {
                    const batteryChange = Math.floor(Math.random() * 6) - 2; // -2 to +3
                    robot.battery = Math.max(0, Math.min(100, robot.battery + batteryChange));

                    if (robot.battery < 10 && robot.status === 'active') {
                        robot.status = 'low_battery';
                    } else if (robot.battery >= 20 && robot.status === 'low_battery') {
                        robot.status = 'active';
                    }
                }
            });

            // Добавляем случайное сканирование
            const scanStatus = ['OK', 'Низкий остаток', 'Критично'][Math.floor(Math.random() * 3)];
            state.addScan({
                robotId: `robot_${Math.floor(Math.random() * 15) + 1}`,
                zone: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 50) + 1}`,
                product: `Товар ${Math.floor(Math.random() * 1000)}`,
                quantity: Math.floor(Math.random() * 100),
                status: scanStatus
            });

            // Обновляем статистику
            state.stats.scannedToday += 1;
            if (scanStatus === 'Критично') {
                state.stats.criticalItems = Math.max(0, state.stats.criticalItems + (Math.random() > 0.7 ? 1 : -1));
            }

            // Обновляем график активности
            state.activityData = state.activityData.map((point, index) => ({
                time: index,
                active: index === state.activityData.length - 1
                    ? Math.floor(Math.random() * 5) + 8
                    : point.active
            }));
        }
    }
});

export const {
    updateRobots,
    addScan,
    updateStats,
    updatePredictions,
    toggleScanPause,
    updateWebsocketStatus,
    updateMapView,
    updateActivityData,
    simulateData
} = warehouseSlice.actions;

export default warehouseSlice.reducer;