import React from 'react'
import { Header } from '../components/Components'
import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Card,
  CardContent,
  IconButton,
  InputAdornment,
  FormGroup,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import {
  Search,
  FilterList,
  RestartAlt,
  Download,
  PictureAsPdf,
  BarChart,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';




const mockHistoryData = [
  {
    id: 1,
    date: '2024-03-15 10:30:00',
    robotId: 'ROBOT-001',
    zone: 'A',
    productId: 'TEL-4567',
    productName: 'Роутер RT-AC68U',
    expectedQuantity: 50,
    actualQuantity: 45,
    discrepancy: -5,
    status: 'low_stock',
    category: 'Сетевое оборудование'
  },
  {
    id: 2,
    date: '2024-03-15 11:15:00',
    robotId: 'ROBOT-002',
    zone: 'B',
    productId: 'TEL-8901',
    productName: 'Модем DSL-2640U',
    expectedQuantity: 15,
    actualQuantity: 12,
    discrepancy: -3,
    status: 'ok',
    category: 'Сетевое оборудование'
  },
  {
    id: 3,
    date: '2024-03-14 09:45:00',
    robotId: 'ROBOT-001',
    zone: 'C',
    productId: 'PHONE-1234',
    productName: 'Смартфон Galaxy S23',
    expectedQuantity: 100,
    actualQuantity: 78,
    discrepancy: -22,
    status: 'critical',
    category: 'Смартфоны'
  },
  {
    id: 4,
    date: '2024-03-14 14:20:00',
    robotId: 'ROBOT-003',
    zone: 'A',
    productId: 'TAB-5678',
    productName: 'Планшет iPad Air',
    expectedQuantity: 30,
    actualQuantity: 30,
    discrepancy: 0,
    status: 'ok',
    category: 'Планшеты'
  },
  {
    id: 5,
    date: '2024-03-13 16:10:00',
    robotId: 'ROBOT-002',
    zone: 'D',
    productId: 'ACC-9012',
    productName: 'Чехол для смартфона',
    expectedQuantity: 200,
    actualQuantity: 210,
    discrepancy: 10,
    status: 'ok',
    category: 'Аксессуары'
  }
];

const mockTrendData = [
  { date: '2024-03-10', 'Роутер RT-AC68U': 48, 'Модем DSL-2640U': 14, 'Смартфон Galaxy S23': 95 },
  { date: '2024-03-11', 'Роутер RT-AC68U': 47, 'Модем DSL-2640U': 13, 'Смартфон Galaxy S23': 92 },
  { date: '2024-03-12', 'Роутер RT-AC68U': 46, 'Модем DSL-2640U': 13, 'Смартфон Galaxy S23': 85 },
  { date: '2024-03-13', 'Роутер RT-AC68U': 45, 'Модем DSL-2640U': 12, 'Смартфон Galaxy S23': 78 },
  { date: '2024-03-14', 'Роутер RT-AC68U': 45, 'Модем DSL-2640U': 12, 'Смартфон Galaxy S23': 78 },
  { date: '2024-03-15', 'Роутер RT-AC68U': 45, 'Модем DSL-2640U': 12, 'Смартфон Galaxy S23': 78 },
];

const zones = ['A', 'B', 'C', 'D', 'E'];
const categories = ['Сетевое оборудование', 'Смартфоны', 'Планшеты', 'Аксессуары', 'Компьютеры'];
const statusOptions = [
  { value: 'all', label: 'Все' },
  { value: 'ok', label: 'ОК' },
  { value: 'low_stock', label: 'Низкий остаток' },
  { value: 'critical', label: 'Критично' }
];


const HystoryPage = () => {

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedZones, setSelectedZones] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState(['all']);
  const [searchQuery, setSearchQuery] = useState('');

  // Состояния таблицы
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('date');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Состояния графика
  const [chartDialogOpen, setChartDialogOpen] = useState(false);
  const [visibleLines, setVisibleLines] = useState({
    'Роутер RT-AC68U': true,
    'Модем DSL-2640U': true,
    'Смартфон Galaxy S23': true
  });

  // Быстрые фильтры по дате
  const handleQuickFilter = (period) => {
    const now = new Date();
    switch (period) {
      case 'today':
        setStartDate(now);
        setEndDate(now);
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        setStartDate(yesterday);
        setEndDate(yesterday);
        break;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        setStartDate(weekAgo);
        setEndDate(now);
        break;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        setStartDate(monthAgo);
        setEndDate(now);
        break;
      default:
        break;
    }
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedZones([]);
    setSelectedCategories([]);
    setSelectedStatus(['all']);
    setSearchQuery('');
  };

  // Сортировка
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Выбор строк
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredData.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }

    setSelected(newSelected);
  };

  // Пагинация
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Фильтрация данных
  const filteredData = useMemo(() => {
    return mockHistoryData.filter((item) => {
      // Фильтр по дате
      if (startDate && endDate) {
        const itemDate = new Date(item.date.split(' ')[0]);
        if (itemDate < startDate || itemDate > endDate) return false;
      }

      // Фильтр по зонам
      if (selectedZones.length > 0 && !selectedZones.includes(item.zone)) return false;

      // Фильтр по категориям
      if (selectedCategories.length > 0 && !selectedCategories.includes(item.category)) return false;

      // Фильтр по статусу
      if (!selectedStatus.includes('all') && !selectedStatus.includes(item.status)) return false;

      // Поиск
      if (searchQuery && 
          !item.productId.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !item.productName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [startDate, endDate, selectedZones, selectedCategories, selectedStatus, searchQuery]);

  // Сортировка данных
  const sortedData = useMemo(() => {
    return filteredData.sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      if (orderBy === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (bValue < aValue) {
        return order === 'desc' ? -1 : 1;
      }
      if (bValue > aValue) {
        return order === 'desc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, order, orderBy]);

  // Пагинированные данные
  const paginatedData = useMemo(() => {
    return sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedData, page, rowsPerPage]);

  // Статистика
  const statistics = useMemo(() => {
    const totalChecks = filteredData.length;
    const uniqueProducts = new Set(filteredData.map(item => item.productId)).size;
    const discrepancies = filteredData.filter(item => item.discrepancy !== 0).length;
    const avgTime = totalChecks > 0 ? Math.round(filteredData.reduce((acc, item) => acc + 15, 0) / totalChecks) : 0;

    return { totalChecks, uniqueProducts, discrepancies, avgTime };
  }, [filteredData]);

  // Получение цвета статуса
  const getStatusColor = (status) => {
    switch (status) {
      case 'ok': return 'success';
      case 'low_stock': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  // Получение текста статуса
  const getStatusText = (status) => {
    switch (status) {
      case 'ok': return 'ОК';
      case 'low_stock': return 'Низкий остаток';
      case 'critical': return 'Критично';
      default: return status;
    }
  };

  return (
    <>
    <Header></Header>
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Заголовок */}
        <Typography variant="h4" component="h1" gutterBottom>
          Исторические данные
        </Typography>

        {/* Панель фильтров */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            <FilterList sx={{ verticalAlign: 'middle', mr: 1 }} />
            Фильтры
          </Typography>

          <Grid container spacing={3}>
            {/* Период */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <DatePicker
                  label="От"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
                <DatePicker
                  label="До"
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                {['Сегодня', 'Вчера', 'Неделя', 'Месяц'].map((period) => (
                  <Chip
                    key={period}
                    label={period}
                    variant="outlined"
                    onClick={() => handleQuickFilter(period.toLowerCase())}
                  />
                ))}
              </Box>
            </Grid>

            {/* Зоны и категории */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Зоны склада</InputLabel>
                <Select
                  multiple
                  value={selectedZones}
                  onChange={(e) => setSelectedZones(e.target.value)}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {zones.map((zone) => (
                    <MenuItem key={zone} value={zone}>
                      <Checkbox checked={selectedZones.indexOf(zone) > -1} />
                      <ListItemText primary={zone} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Категории товаров</InputLabel>
                <Select
                  multiple
                  value={selectedCategories}
                  onChange={(e) => setSelectedCategories(e.target.value)}
                  renderValue={(selected) => selected.join(', ')}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      <Checkbox checked={selectedCategories.indexOf(category) > -1} />
                      <ListItemText primary={category} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Статус и поиск */}
            <Grid item xs={12} md={6}>
              <FormGroup row>
                {statusOptions.map((status) => (
                  <FormControlLabel
                    key={status.value}
                    control={
                      <Checkbox
                        checked={selectedStatus.includes(status.value)}
                        onChange={(e) => {
                          if (status.value === 'all') {
                            setSelectedStatus(e.target.checked ? ['all'] : []);
                          } else {
                            setSelectedStatus(prev => 
                              e.target.checked 
                                ? [...prev.filter(s => s !== 'all'), status.value]
                                : prev.filter(s => s !== status.value)
                            );
                          }
                        }}
                      />
                    }
                    label={status.label}
                  />
                ))}
              </FormGroup>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Поиск по артикулу или названию"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Кнопки действий */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" onClick={() => {}}>
                  Применить фильтры
                </Button>
                <Button variant="outlined" onClick={handleResetFilters} startIcon={<RestartAlt />}>
                  Сбросить
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Сводная статистика */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {[
            { label: 'Всего проверок за период', value: statistics.totalChecks },
            { label: 'Уникальных товаров', value: statistics.uniqueProducts },
            { label: 'Выявлено расхождений', value: statistics.discrepancies },
            { label: 'Среднее время инвентаризации зоны (мин)', value: statistics.avgTime }
          ].map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" component="div">
                    {stat.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Таблица данных */}
        <Paper sx={{ width: '100%', mb: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < filteredData.length}
                      checked={filteredData.length > 0 && selected.length === filteredData.length}
                      onChange={handleSelectAllClick}
                    />
                  </TableCell>
                  {[
                    { id: 'date', label: 'Дата и время проверки' },
                    { id: 'robotId', label: 'ID робота' },
                    { id: 'zone', label: 'Зона склада' },
                    { id: 'productId', label: 'Артикул товара' },
                    { id: 'productName', label: 'Название товара' },
                    { id: 'expectedQuantity', label: 'Ожидаемое количество' },
                    { id: 'actualQuantity', label: 'Фактическое количество' },
                    { id: 'discrepancy', label: 'Расхождение (+/-)' },
                    { id: 'status', label: 'Статус' }
                  ].map((headCell) => (
                    <TableCell key={headCell.id}>
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={() => handleRequestSort(headCell.id)}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={() => handleClick(row.id)}
                    selected={selected.indexOf(row.id) !== -1}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox checked={selected.indexOf(row.id) !== -1} />
                    </TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.robotId}</TableCell>
                    <TableCell>{row.zone}</TableCell>
                    <TableCell>{row.productId}</TableCell>
                    <TableCell>{row.productName}</TableCell>
                    <TableCell>{row.expectedQuantity}</TableCell>
                    <TableCell>{row.actualQuantity}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.discrepancy > 0 ? `+${row.discrepancy}` : row.discrepancy}
                        color={row.discrepancy === 0 ? 'default' : row.discrepancy > 0 ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(row.status)}
                        color={getStatusColor(row.status)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[20, 50, 100]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Записей на странице:"
          />
        </Paper>

        {/* Панель действий */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            disabled={selected.length === 0}
          >
            Экспорт в Excel ({selected.length})
          </Button>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdf />}
            disabled={selected.length === 0}
          >
            Экспорт в PDF ({selected.length})
          </Button>
          <Button
            variant="contained"
            startIcon={<BarChart />}
            onClick={() => setChartDialogOpen(true)}
          >
            Построить график
          </Button>
        </Box>

        {/* График тренда остатков */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            График тренда остатков
          </Typography>
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {Object.keys(visibleLines).map((key) => (
                  visibleLines[key] && (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={key === 'Роутер RT-AC68U' ? '#8884d8' : key === 'Модем DSL-2640U' ? '#82ca9d' : '#ffc658'}
                      activeDot={{ r: 8 }}
                    />
                  )
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
            {Object.keys(visibleLines).map((key) => (
              <Chip
                key={key}
                label={key}
                variant={visibleLines[key] ? 'filled' : 'outlined'}
                onClick={() => setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }))}
                icon={visibleLines[key] ? <Visibility /> : <VisibilityOff />}
              />
            ))}
          </Box>
        </Paper>

        {/* Диалог построения графика */}
        <Dialog
          open={chartDialogOpen}
          onClose={() => setChartDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Построение графика</DialogTitle>
          <DialogContent>
            <Typography>
              Здесь можно настроить параметры графика и выбрать товары для анализа...
            </Typography>
            {/* Дополнительные настройки графика */}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setChartDialogOpen(false)}>Отмена</Button>
            <Button variant="contained" onClick={() => setChartDialogOpen(false)}>
              Построить
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  </>
  );
};
  

export default HystoryPage