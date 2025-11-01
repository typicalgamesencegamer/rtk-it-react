import { Button, IconButton } from '@mui/material';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import React from 'react'
import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';

const Svg = () => {      
  const [robots, setRobots] = useState([
    { id: 'R001', x: 15 + 1 * 30, y: 15 + 22 * 30, battery: 85, status: 'active', lastUpdate: '2024-01-15 14:30:25' },
    { id: 'R002', x: 15 + 1 * 30, y: 15 + 23 * 30, battery: 25, status: 'low_battery', lastUpdate: '2024-01-15 14:28:10' },
    { id: 'R003', x: 15 + 1 * 30, y: 15 + 24 * 30, battery: 0, status: 'offline', lastUpdate: '2024-01-15 13:45:00' },
    { id: 'R004', x: 15 + 1 * 30, y: 15 + 25 * 30, battery: 92, status: 'active', lastUpdate: '2024-01-15 14:31:45' },
    { id: 'R005', x: 15 + 1 * 30, y: 15 + 26 * 30, battery: 45, status: 'active', lastUpdate: '2024-01-15 14:31:45' },
  ]);

  const allRobots = useSelector(state => state.allRobots);

  const [zones, setZones] = useState({});
  const [scale, setScale] = useState(1.9);
  const [isPaused, setIsPaused] = useState(false);
  const [scans, setScans] = useState([
    { time: '14:30:25', robotId: 'R001', zone: 'A5', product: 'Товар 123 (ART001)', quantity: 45, status: 'OK' },
    { time: '14:28:10', robotId: 'R002', zone: 'C12', product: 'Товар 456 (ART002)', quantity: 8, status: 'Низкий остаток' },
    { time: '14:25:33', robotId: 'R004', zone: 'G7', product: 'Товар 789 (ART003)', quantity: 3, status: 'Критично' },
  ]);

  const [aiPredictions, setAiPredictions] = useState([
    { name: 'Товар 123 (ART001)', currentStock: 45, predictedDate: '2024-01-18', recommendedOrder: 100, confidence: 87 },
    { name: 'Товар 456 (ART002)', currentStock: 8, predictedDate: '2024-01-16', recommendedOrder: 150, confidence: 92 },
    { name: 'Товар 789 (ART003)', currentStock: 3, predictedDate: '2024-01-15', recommendedOrder: 200, confidence: 95 },
  ]);

  const [metrics, setMetrics] = useState({
    activeRobots: '3/4',
    scannedToday: '1,247',
    criticalStock: '12',
    avgBattery: '76%'
  });

  const [wsStatus, setWsStatus] = useState('connected');
  const scansEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [scans]);

  const scrollToBottom = () => {
    scansEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 1.9));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.5));
  const handleCenter = () => setScale(2.6);

  const getRobotColor = (status) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'low_battery': return '#F59E0B';
      case 'offline': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'OK': 'bg-green-100 text-green-800',
      'Низкий остаток': 'bg-yellow-100 text-yellow-800',
      'Критично': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getZoneColor = (zone) => {
    // Simplified zone status logic
    const status = Math.random() > 0.7 ? 'critical' : Math.random() > 0.5 ? 'needs_check' : 'recent';
    switch (status) {
      case 'recent': return '#DCFCE7';
      case 'needs_check': return '#FEF9C3';
      case 'critical': return '#FEE2E2';
      default: return '#F3F4F6';
    }
  };

  return (
    <>
      <div className="dashboard-map">
        <div className="map-container">
          <div className="map-controls">
            <IconButton onClick={handleZoomIn}>
              <ZoomInIcon>

              </ZoomInIcon>
            </IconButton>
            <IconButton onClick={handleZoomOut}>
              <ZoomOutIcon>

              </ZoomOutIcon>
            </IconButton>
            <IconButton onClick={handleCenter}>
              <ZoomOutMapIcon>

              </ZoomOutMapIcon>
            </IconButton>
          </div>
          <div className="map-wrapper">
            <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 810 1600"
            style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }}>

            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E5E7EB" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="1531" fill="url(#grid)"/>
            
            {/* Нумерация строк */}
            {Array.from({ length: 50 }, (_, i) => (
              <text key={i} x="5" y={45 + i * 30} className="grid-label">{i + 1}</text>
            ))}
            
            {/* Буквы столбцов */}
            {Array.from({ length: 26 }, (_, i) => (
              <text key={i} x={35 + i * 30} y="15" className="grid-label">
                {String.fromCharCode(65 + i)}
              </text>
            ))}
            {Array.from({ length: 24 }, (_, col) => 
              Array.from({ length: 50 }, (_, row) => (
                <rect
                  key={`${col}-${row}`}
                  x={90 + col * 30}
                  y={30 + row * 30}
                  width="30"
                  height="30"
                  fill={getZoneColor(`${String.fromCharCode(65 + col)}${row + 1}`)}
                  stroke="#D1D5DB"
                  strokeWidth="1"
                />
              ))
            )}
            {allRobots.map(robot => (
              <g key={robot.id} className="robot-group">
                <circle
                  cx={robot.x}
                  cy={robot.y}
                  r="14"
                  fill={getRobotColor(robot.status)}
                  stroke="#FFFFFF"
                  strokeWidth="0"
                />
                <text 
                  x={robot.x} 
                  y={robot.y + 4} 
                  textAnchor="middle" 
                  fill="white" 
                  fontSize="8" 
                  fontWeight="bold"
                >
                  {robot.id.slice(-2)}
                </text>
                <title>
                  ID: {robot.id} | Батарея: {robot.battery}% | Обновление: {robot.lastUpdate}
                </title>
              </g>
            ))}
            </svg>
          </div>
        </div>
      </div>
    </>
  )
}



export default Svg;

