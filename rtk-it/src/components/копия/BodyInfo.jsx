import React, { useEffect, useState } from "react";
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

  const [localMetrics, setLocalMetrics] = useState(metrics);
  const [activityData, setActivityData] = useState([]);
  const [error, setError] = useState(null);

  // Подписываемся на обновления метрик
  useEffect(() => {
    const unsubscribe = subscribeToMetrics((newMetrics) => {
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
          scans: newMetrics.scannedToday,
          activeRobots: newMetrics.activeRobots
        });
        return newData;
      });
    });

    return unsubscribe;
  }, [subscribeToMetrics]);

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

        {progress && (
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
  const ActivityChart = () => (
    <Card
      sx={{
        mt: 2,
        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUp sx={{ mr: 1, color: 'primary.main', fontSize: 22 }} />
            <Box>
              <Typography variant="h6" component="h3" fontWeight="bold" sx={{ fontSize: '1rem' }}>
                Активность роботов
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                Данные в реальном времени • Обновление каждые 5 сек
              </Typography>
            </Box>
          </Box>
          <Chip
            icon={<Refresh sx={{ fontSize: '0.9rem' }} />}
            label="Real-time"
            size="small"
            color={connectionState === 'connected' ? 'success' : 'error'}
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 24 }}
          />
        </Box>

        {activityData.length > 0 ? (
          <Box sx={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="2 2" stroke={theme.palette.divider} />
                <XAxis
                  dataKey="time"
                  stroke={theme.palette.text.secondary}
                  fontSize={10}
                  tickMargin={6}
                />
                <YAxis
                  stroke={theme.palette.text.secondary}
                  fontSize={10}
                  tickMargin={6}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: theme.shape.borderRadius,
                    boxShadow: theme.shadows[2],
                    fontSize: '0.8rem'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="scans"
                  stroke={theme.palette.secondary.main}
                  fill={theme.palette.secondary.main + '20'}
                  strokeWidth={1.5}
                  name="Сканирования"
                />
                <Line
                  type="monotone"
                  dataKey="activeRobots"
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  dot={{ fill: theme.palette.primary.main, strokeWidth: 1.5, r: 3 }}
                  activeDot={{ r: 4, strokeWidth: 1.5 }}
                  name="Активных роботов"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box sx={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              {connectionState === 'connected' ? 'Ожидание данных...' : 'Нет подключения'}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
          <Typography variant="caption" color="primary.main" sx={{ fontSize: '0.65rem' }}>
            ● Активные роботы
          </Typography>
          <Typography variant="caption" color="secondary.main" sx={{ fontSize: '0.65rem' }}>
            ● Сканирования (область)
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  const handleReconnect = () => {
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
        maxWidth: '100%'
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
      <Grid container spacing={0}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<RobotIcon sx={{ fontSize: '1.2rem' }} />}
            value={`${localMetrics.activeRobots}/${localMetrics.totalRobots}`}
            label="Активных роботов"
            subtitle="в работе"
            color="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<Inventory sx={{ fontSize: '1.2rem' }} />}
            value={localMetrics.scannedToday.toLocaleString()}
            label="Проверено сегодня"
            subtitle="позиций"
            color="success"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<Warning sx={{ fontSize: '1.2rem' }} />}
            value={localMetrics.criticalStock}
            label="Критических остатков"
            subtitle="SKU"
            color="error"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            icon={<BatteryChargingFull sx={{ fontSize: '1.2rem' }} />}
            value={`${localMetrics.averageBattery}%`}
            label="Средний заряд"
            subtitle="батарей"
            color="warning"
            progress={localMetrics.averageBattery}
          />
        </Grid>
      </Grid>

      {/* График активности */}
      <ActivityChart />

      {/* Информация о подключении */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pt: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          {connectionState === 'connected'
            ? 'Данные обновляются в реальном времени через WebSocket'
            : 'Отсутствует подключение к серверу'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          {connectionState === 'connected' ? '🟢' : '🔴'}
        </Typography>
      </Box>
    </Box>
  );
};

export default BodyInfo;