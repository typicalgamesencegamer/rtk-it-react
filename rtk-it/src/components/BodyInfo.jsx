import React, { useEffect, useState, useRef } from "react";
import { Box, Button, Typography } from "@mui/material";
import { TrendingUp, Warning, Inventory } from '@mui/icons-material';
import { Alert, Card, CardContent, Grid, LinearProgress, useTheme, Chip } from '@mui/material';
import { BatteryChargingFull, Refresh, Wifi, WifiOff } from '@mui/icons-material';
import { SmartToy as RobotIcon } from "@mui/icons-material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import { useWebSocket } from '../contexts/WebSocketContext';

const BodyInfo = () => {
    const theme = useTheme();
    const {
        connectionState,
        metrics,
        subscribeToMetrics,
        reconnect
    } = useWebSocket();

    const [localMetrics, setLocalMetrics] = useState({
        activeRobots: 8,
        totalRobots: 12,
        scannedToday: 245,
        criticalStock: 15,
        averageBattery: 78,
        lastUpdate: new Date().toISOString()
    });
    const [activityData, setActivityData] = useState([]);
    const [error, setError] = useState(null);

    console.log('🔔 BodyInfo rendered, connectionState:', connectionState);
    console.log('📊 Context metrics:', metrics);
    console.log('📊 Local metrics:', localMetrics);

    // Подписываемся на обновления метрик
    useEffect(() => {
        console.log('🔔 BodyInfo subscribing to metrics...');

        // Сразу установим начальные данные
        if (metrics.activeRobots > 0 || metrics.scannedToday > 0) {
            console.log('📊 Setting initial metrics from context:', metrics);
            setLocalMetrics(metrics);
        }

        const unsubscribe = subscribeToMetrics((newMetrics) => {
            console.log('📊 BodyInfo received new metrics via subscription:', newMetrics);
            setLocalMetrics(newMetrics);
            setError(null);

            // Обновляем данные для графика
            setActivityData(prev => {
                const newData = [...prev];
                if (newData.length >= 10) {
                    newData.shift();
                }
                newData.push({
                    time: new Date().toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    scans: newMetrics.scannedToday || 0,
                    activeRobots: newMetrics.activeRobots || 0
                });
                return newData;
            });
        });

        return unsubscribe;
    }, [subscribeToMetrics, metrics]);

    // Добавим тестовые данные если нет реальных
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localMetrics.activeRobots === 0 && localMetrics.scannedToday === 0) {
                console.log('🔄 Setting test data due to no real data');
                setLocalMetrics({
                    activeRobots: 8,
                    totalRobots: 12,
                    scannedToday: 245,
                    criticalStock: 15,
                    averageBattery: 78,
                    lastUpdate: new Date().toISOString()
                });
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [localMetrics]);

    // Компонент карточки метрики
    const MetricCard = ({
        icon,
        value,
        label,
        subtitle,
        color = 'primary',
        progress
    }) => (
        <Card
            sx={{
                height: '100%',
                background: `linear-gradient(135deg, ${theme.palette[color].light}15, ${theme.palette[color].main}08)`,
                border: `1px solid ${theme.palette[color].light}30`,
                position: 'relative',
                overflow: 'visible',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[2]
                }
            }}
        >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: progress ? 0.5 : 0 }}>
                    <Box
                        sx={{
                            p: 1,
                            borderRadius: 1.5,
                            backgroundColor: `${theme.palette[color].main}15`,
                            color: theme.palette[color].main,
                            mr: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography
                            variant="h6"
                            component="div"
                            fontWeight="bold"
                            color={theme.palette[color].main}
                            sx={{ fontSize: '1.25rem' }}
                        >
                            {value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
                            {label}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, fontSize: '0.7rem' }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {progress !== undefined && (
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            mt: 0.5,
                            height: 3,
                            borderRadius: 1.5,
                            backgroundColor: `${theme.palette[color].main}20`,
                            '& .MuiLinearProgress-bar': {
                                backgroundColor: theme.palette[color].main
                            }
                        }}
                    />
                )}

                {/* Индикатор реального времени */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                    <Chip
                        icon={connectionState === 'connected' ? <Wifi /> : <WifiOff />}
                        label={connectionState === 'connected' ? 'Live' : 'Offline'}
                        size="small"
                        color={connectionState === 'connected' ? 'success' : 'error'}
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.6rem', '& .MuiChip-icon': { fontSize: '0.8rem' } }}
                    />
                </Box>
            </CardContent>
        </Card>
    );

    // Компонент графика активности
    // const ActivityChart = () => {
    //     const chartData = activityData.length > 0 ? activityData : [
    //         { time: '10:00', scans: 120, activeRobots: 6 },
    //         { time: '10:05', scans: 180, activeRobots: 7 },
    //         { time: '10:10', scans: 220, activeRobots: 8 },
    //         { time: '10:15', scans: 245, activeRobots: 8 },
    //     ];

    //     return (
    //         <Card
    //             sx={{
    //                 mt: 2,
    //                 background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
    //                 border: `1px solid ${theme.palette.divider}`,
    //             }}
    //         >
    //             <CardContent sx={{ p: 2 }}>
    //                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
    //                     <Box sx={{ display: 'flex', alignItems: 'center' }}>
    //                         <TrendingUp sx={{ mr: 1, color: 'primary.main', fontSize: 22 }} />
    //                         <Box>
    //                             <Typography variant="h6" component="h3" fontWeight="bold" sx={{ fontSize: '1rem' }}>
    //                                 Активность роботов
    //                             </Typography>
    //                             <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
    //                                 Данные в реальном времени • Обновление каждые 5 сек
    //                             </Typography>
    //                         </Box>
    //                     </Box>
    //                     <Chip
    //                         icon={<Refresh sx={{ fontSize: '0.9rem' }} />}
    //                         label="Real-time"
    //                         size="small"
    //                         color={connectionState === 'connected' ? 'success' : 'error'}
    //                         variant="outlined"
    //                         sx={{ fontSize: '0.7rem', height: 24 }}
    //                     />
    //                 </Box>

    //                 {/* Контейнер для графика с абсолютными размерами */}
    //                 <Box
    //                     sx={{
    //                         height: 180,
    //                         width: '100%',
    //                         minHeight: 150,
    //                         minWidth: 300
    //                     }}
    //                 >
    //                     <ResponsiveContainer
    //                         width="100%"
    //                         height="100%"
    //                         minWidth={300}
    //                         minHeight={150}
    //                     >
    //                         <LineChart
    //                             data={chartData}
    //                             margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
    //                         >
    //                             <CartesianGrid
    //                                 strokeDasharray="2 2"
    //                                 stroke={theme.palette.divider}
    //                             />
    //                             <XAxis
    //                                 dataKey="time"
    //                                 stroke={theme.palette.text.secondary}
    //                                 fontSize={10}
    //                                 tickMargin={6}
    //                             />
    //                             <YAxis
    //                                 stroke={theme.palette.text.secondary}
    //                                 fontSize={10}
    //                                 tickMargin={6}
    //                             />
    //                             <Tooltip
    //                                 contentStyle={{
    //                                     backgroundColor: theme.palette.background.paper,
    //                                     border: `1px solid ${theme.palette.divider}`,
    //                                     borderRadius: theme.shape.borderRadius,
    //                                     boxShadow: theme.shadows[2],
    //                                     fontSize: '0.8rem'
    //                                 }}
    //                             />
    //                             <Area
    //                                 type="monotone"
    //                                 dataKey="scans"
    //                                 stroke={theme.palette.secondary.main}
    //                                 fill={theme.palette.secondary.main + '20'}
    //                                 strokeWidth={1.5}
    //                                 name="Сканирования"
    //                             />
    //                             <Line
    //                                 type="monotone"
    //                                 dataKey="activeRobots"
    //                                 stroke={theme.palette.primary.main}
    //                                 strokeWidth={2}
    //                                 dot={{ fill: theme.palette.primary.main, strokeWidth: 1.5, r: 3 }}
    //                                 activeDot={{ r: 4, strokeWidth: 1.5 }}
    //                                 name="Активных роботов"
    //                             />
    //                         </LineChart>
    //                     </ResponsiveContainer>
    //                 </Box>

    //                 <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
    //                     <Typography variant="caption" color="primary.main" sx={{ fontSize: '0.65rem' }}>
    //                         ● Активные роботы
    //                     </Typography>
    //                     <Typography variant="caption" color="secondary.main" sx={{ fontSize: '0.65rem' }}>
    //                         ● Сканирования (область)
    //                     </Typography>
    //                 </Box>
    //             </CardContent>
    //         </Card>
    //     );
    // };


    const handleReconnect = () => {
        console.log('🔄 Manual reconnect from BodyInfo');
        reconnect();
    };

    if (connectionState === 'connecting') {
        return (
            <Box
                className="real-time-stats"
                sx={{
                    width: '745px',
                    maxWidth: '100%'
                }}
            >
                <Card>
                    <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                            <Box sx={{ textAlign: 'center' }}>
                                <LinearProgress sx={{ width: 150, mb: 1.5, height: 4 }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                    Подключение к серверу...
                                </Typography>
                                <Chip
                                    icon={<WifiOff sx={{ fontSize: '0.8rem' }} />}
                                    label={connectionState}
                                    size="small"
                                    color="warning"
                                    sx={{ mt: 0.5, fontSize: '0.7rem', height: 22 }}
                                />
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <Box
            className="real-time-stats"
            sx={{
                width: '745px',
                maxWidth: '100%',
                minWidth: 300,
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Заголовок и статус */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" component="h2" fontWeight="bold" sx={{ fontSize: '1.25rem' }}>
                    📊 Статистика в реальном времени
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        icon={connectionState === 'connected' ? <Wifi sx={{ fontSize: '0.8rem' }} /> : <WifiOff sx={{ fontSize: '0.8rem' }} />}
                        label={`WS: ${connectionState}`}
                        color={connectionState === 'connected' ? 'success' : 'error'}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 24 }}
                    />
                    {localMetrics.lastUpdate && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {new Date(localMetrics.lastUpdate).toLocaleTimeString('ru-RU')}
                        </Typography>
                    )}
                </Box>
            </Box>

            {error && (
                <Alert
                    severity="warning"
                    sx={{ mb: 2, fontSize: '0.8rem', py: 0.5 }}
                    action={
                        <Button color="inherit" size="small" onClick={handleReconnect} sx={{ fontSize: '0.7rem', minWidth: 'auto' }}>
                            Переподключить
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {/* Карточки с метриками */}
            <Grid container spacing={0.75} sx={{ width: '100%' }}>
                <Grid item xs={3}>
                    <MetricCard
                        icon={<RobotIcon sx={{ fontSize: '0.9rem' }} />}
                        value={`${localMetrics.activeRobots || 0}/${localMetrics.totalRobots || 0}`}
                        label="Активных роботов"
                        subtitle="в работе"
                        color="primary"
                        sx={{
                            minWidth: '120px',
                            width: '100%',
                            height: '100px',
                            '& .MuiCardContent-root': {
                                p: 0.75,
                                '&:last-child': { pb: 0.75 },
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                height: '100%'
                            },
                            '& .MuiTypography-h4': {
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                lineHeight: 1.1
                            },
                            '& .MuiTypography-body1': {
                                fontSize: '0.7rem',
                                lineHeight: 1.1,
                                mb: 0.25
                            },
                            '& .MuiTypography-body2': {
                                fontSize: '0.6rem',
                                lineHeight: 1.1,
                                color: 'text.secondary'
                            },
                            '& .MuiBox-root': {
                                minHeight: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                mb: 0.25
                            }
                        }}
                    />
                </Grid>

                <Grid item xs={3}>
                    <MetricCard
                        icon={<Inventory sx={{ fontSize: '0.9rem' }} />}
                        value={(localMetrics.scannedToday || 0).toLocaleString()}
                        label="Проверено сегодня"
                        subtitle="позиций"
                        color="success"
                        sx={{
                            minWidth: '120px',
                            width: '100%',
                            height: '100px',
                            '& .MuiCardContent-root': {
                                p: 0.75,
                                '&:last-child': { pb: 0.75 },
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                height: '100%'
                            },
                            '& .MuiTypography-h4': {
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                lineHeight: 1.1
                            },
                            '& .MuiTypography-body1': {
                                fontSize: '0.7rem',
                                lineHeight: 1.1,
                                mb: 0.25
                            },
                            '& .MuiTypography-body2': {
                                fontSize: '0.6rem',
                                lineHeight: 1.1,
                                color: 'text.secondary'
                            },
                            '& .MuiBox-root': {
                                minHeight: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                mb: 0.25
                            }
                        }}
                    />
                </Grid>

                <Grid item xs={3}>
                    <MetricCard
                        icon={<Warning sx={{ fontSize: '0.9rem' }} />}
                        value={localMetrics.criticalStock || 0}
                        label="Критических остатков"
                        subtitle="SKU"
                        color="error"
                        sx={{
                            minWidth: '120px',
                            width: '100%',
                            height: '100px',
                            '& .MuiCardContent-root': {
                                p: 0.75,
                                '&:last-child': { pb: 0.75 },
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                height: '100%'
                            },
                            '& .MuiTypography-h4': {
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                lineHeight: 1.1
                            },
                            '& .MuiTypography-body1': {
                                fontSize: '0.7rem',
                                lineHeight: 1.1,
                                mb: 0.25
                            },
                            '& .MuiTypography-body2': {
                                fontSize: '0.6rem',
                                lineHeight: 1.1,
                                color: 'text.secondary'
                            },
                            '& .MuiBox-root': {
                                minHeight: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                mb: 0.25
                            }
                        }}
                    />
                </Grid>

                <Grid item xs={3}>
                    <MetricCard
                        icon={<BatteryChargingFull sx={{ fontSize: '0.9rem' }} />}
                        value={`${localMetrics.averageBattery || 0}%`}
                        label="Средний заряд"
                        subtitle="батарей"
                        color="warning"
                        progress={localMetrics.averageBattery || 0}
                        sx={{
                            minWidth: '120px',
                            width: '100%',
                            height: '100px',
                            '& .MuiCardContent-root': {
                                p: 0.75,
                                '&:last-child': { pb: 0.75 },
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                height: '100%'
                            },
                            '& .MuiTypography-h4': {
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                lineHeight: 1.1
                            },
                            '& .MuiTypography-body1': {
                                fontSize: '0.7rem',
                                lineHeight: 1.1,
                                mb: 0.25
                            },
                            '& .MuiTypography-body2': {
                                fontSize: '0.6rem',
                                lineHeight: 1.1,
                                color: 'text.secondary'
                            },
                            '& .MuiBox-root': {
                                minHeight: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                mb: 0.25
                            },
                            '& .MuiLinearProgress-root': {
                                height: 2,
                                mt: 0.25,
                                borderRadius: 1
                            }
                        }}
                    />
                </Grid>
            </Grid>
            {/* График активности */}
            {/* <ActivityChart /> */}

            {/* Информация о подключении */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pt: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    {connectionState === 'connected'
                        ? 'Данные обновляются в реальном времени через WebSocket'
                        : 'Отсутствует подключение к серверу'}
                </Typography>
                <Button
                    size="small"
                    onClick={handleReconnect}
                    sx={{ fontSize: '0.6rem', minWidth: 'auto' }}
                >
                    Обновить
                </Button>
            </Box>

            {/* Отладочная информация */}
            <Box sx={{ mt: 1, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    Отладка: activeRobots={localMetrics.activeRobots}, scannedToday={localMetrics.scannedToday}, connectionState={connectionState}
                </Typography>
            </Box>
        </Box>
    );
};

export default BodyInfo;