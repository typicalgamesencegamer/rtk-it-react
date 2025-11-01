import React from 'react'
import { useSelector, useDispatch } from 'react-redux';
import {
    Paper,
    Typography,
    IconButton,
    Tooltip,
    Box,
    Zoom
} from '@mui/material';
import {
    ZoomIn,
    ZoomOut,
    CenterFocusStrong
} from '@mui/icons-material';

import { updateMapView } from '../store/slices/warehouse';

const WarehouseMap = () => {
    const dispatch = useDispatch();
    const { robots, warehouseMap } = useSelector(state => state.warehouse);

    const handleZoomIn = () => {
        dispatch(updateMapView({ scale: warehouseMap.scale + 0.1 }));
    };

    const handleZoomOut = () => {
        dispatch(updateMapView({ scale: warehouseMap.scale - 0.1 }));
    };

    const handleCenter = () => {
        dispatch(updateMapView({ center: { x: 12, y: 25 } }));
    };

    const getRobotColor = (robot) => {
        switch (robot.status) {
            case 'active': return '#4caf50';
            case 'low_battery': return '#ff9800';
            case 'offline': return '#f44336';
            default: return '#757575';
        }
    };

    const getZoneColor = (zone) => {
        switch (zone.status) {
            case 'checked': return '#4caf50';
            case 'needs_check': return '#ff9800';
            case 'critical': return '#f44336';
            default: return '#757575';
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h2">
                    Карта склада
                </Typography>
                <Box>
                    <IconButton onClick={handleZoomOut} size="small">
                        <ZoomOut />
                    </IconButton>
                    <IconButton onClick={handleCenter} size="small">
                        <CenterFocusStrong />
                    </IconButton>
                    <IconButton onClick={handleZoomIn} size="small">
                        <ZoomIn />
                    </IconButton>
                </Box>
            </Box>

            <Box sx={{ flex: 1, position: 'relative', overflow: 'auto', bgcolor: 'background.default' }}>
                {/* Сетка склада */}
                <Box
                    sx={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        transform: `scale(${warehouseMap.scale})`,
                        transformOrigin: 'top left'
                    }}
                >
                    {/* Зоны склада */}
                    {Object.entries(warehouseMap.zones).slice(0, 100).map(([zoneId, zone]) => (
                        <Box
                            key={zoneId}
                            sx={{
                                position: 'absolute',
                                left: `${(zoneId.charCodeAt(0) - 65) * 20}px`,
                                top: `${(parseInt(zoneId.slice(1)) - 1) * 10}px`,
                                width: '18px',
                                height: '8px',
                                bgcolor: getZoneColor(zone),
                                border: '1px solid #333',
                                fontSize: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                '&:hover': {
                                    bgcolor: '#fff',
                                    color: '#000'
                                }
                            }}
                        >
                            {zoneId}
                        </Box>
                    ))}

                    {/* Роботы */}
                    {Object.values(robots).map(robot => (
                        <Tooltip
                            key={robot.id}
                            title={
                                <Box>
                                    <div>ID: {robot.id}</div>
                                    <div>Батарея: {robot.battery}%</div>
                                    <div>Статус: {
                                        robot.status === 'active' ? 'Активен' :
                                            robot.status === 'low_battery' ? 'Низкий заряд' : 'Оффлайн'
                                    }</div>
                                    <div>Позиция: {String.fromCharCode(65 + robot.position.x)}{robot.position.y}</div>
                                </Box>
                            }
                            arrow
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    left: `${robot.position.x * 20 + 5}px`,
                                    top: `${robot.position.y * 10 + 1}px`,
                                    width: '8px',
                                    height: '8px',
                                    bgcolor: getRobotColor(robot),
                                    borderRadius: '50%',
                                    border: '2px solid white',
                                    cursor: 'pointer',
                                    animation: robot.status === 'active' ? 'pulse 2s infinite' : 'none',
                                    '@keyframes pulse': {
                                        '0%': { transform: 'scale(1)' },
                                        '50%': { transform: 'scale(1.2)' },
                                        '100%': { transform: 'scale(1)' }
                                    }
                                }}
                            />
                        </Tooltip>
                    ))}
                </Box>
            </Box>

            {/* Легенда */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: '#4caf50', borderRadius: '50%' }} />
                    <Typography variant="body2">Активные роботы</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: '#ff9800', borderRadius: '50%' }} />
                    <Typography variant="body2">Низкий заряд</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, bgcolor: '#f44336', borderRadius: '50%' }} />
                    <Typography variant="body2">Оффлайн</Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default WarehouseMap;
