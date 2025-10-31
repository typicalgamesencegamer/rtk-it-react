import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  IconButton
} from '@mui/material';
import {
  CloudUpload,
  Close,
  CheckCircle,
  Error
} from '@mui/icons-material';

const CSVUploadModal = ({ open, onClose }) => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const requiredColumns = ['product_id', 'product_name', 'quantity', 'zone', 'date'];

  const validateCSV = (data) => {
    if (!data || data.length === 0) {
      throw new Error('Файл пустой');
    }

    const headers = Object.keys(data[0]);
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(`Отсутствуют обязательные колонки: ${missingColumns.join(', ')}`);
    }

    // Проверка типов данных
    data.forEach((row, index) => {
      if (!row.product_id || !row.product_name) {
        throw new Error(`Строка ${index + 1}: Обязательные поля product_id и product_name не могут быть пустыми`);
      }
      if (isNaN(parseInt(row.quantity))) {
        throw new Error(`Строка ${index + 1}: quantity должно быть числом`);
      }
    });
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(';').map(header => header.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(';').map(value => value.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
  };

  const handleFileSelect = useCallback((selectedFile) => {
    setError('');
    setUploadProgress(0);

    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvData = parseCSV(e.target.result);
          validateCSV(csvData);
          setPreviewData(csvData.slice(0, 5));
          setUploadProgress(100);
        } catch (err) {
          setError(err.message);
          setFile(null);
          setPreviewData([]);
        }
      };
      reader.readAsText(selectedFile, 'UTF-8');
    } else {
      setError('Пожалуйста, выберите CSV файл');
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      // Имитация загрузки
      for (let progress = 0; progress <= 100; progress += 10) {
        setUploadProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Здесь будет реальная загрузка на сервер
      console.log('Загружаемые данные:', previewData);
      alert('Файл успешно загружен!');
      handleClose();
    } catch (err) {
      setError('Ошибка при загрузке файла');
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setUploadProgress(0);
    setError('');
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" component="div">
            Загрузка данных инвентаризации
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Drag & Drop область */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: isDragging ? 'primary.main' : 'grey.300',
            backgroundColor: isDragging ? 'action.hover' : 'background.paper',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            mb: 3
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".csv"
            style={{ display: 'none' }}
          />
          
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Перетащите CSV файл сюда или нажмите для выбора
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Поддерживается только формат CSV
          </Typography>
        </Paper>

        {/* Информация о выбранном файле */}
        {file && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <CheckCircle color="success" />
              <Typography variant="body1">
                Выбран файл: <strong>{file.name}</strong> ({formatFileSize(file.size)})
              </Typography>
            </Box>
          </Box>
        )}

        {/* Прогресс-бар */}
        {file && uploadProgress > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              Проверка файла: {uploadProgress}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress}
              color={uploadProgress === 100 ? 'success' : 'primary'}
            />
          </Box>
        )}

        {/* Сообщения об ошибках */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Требования к файлу */}
        <Box sx={{ mb: 3}}>
          <Typography variant="subtitle1" gutterBottom>
            Требования к файлу:
          </Typography>
          <Box display="flex" flexWrap="wrap" flexDirection='column' gap={1} width='250px'>
            <Chip label="Формат: CSV с разделителем ';'" size="small" />
            <Chip label="Кодировка: UTF-8" size="small" />
            <Chip label="Обязательные колонки" size="small"/>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Обязательные колонки: {requiredColumns.join(', ')}
          </Typography>
        </Box>

        {/* Предпросмотр данных */}
        {previewData.length > 0 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Предпросмотр данных (первые {previewData.length} строк):
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {Object.keys(previewData[0]).map(header => (
                      <TableCell key={header} sx={{ fontWeight: 'bold' }}>
                        {requiredColumns.includes(header) ? (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            {header}
                            <Chip label="Обязательно" size="small" color="primary" />
                          </Box>
                        ) : (
                          header
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value, cellIndex) => (
                        <TableCell key={cellIndex}>
                          {value}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Отмена
        </Button>
        <Button   
          onClick={handleUpload}
          variant="contained"
          disabled={!file || uploadProgress !== 100 || error}
          startIcon={<CloudUpload />}
        >
          Загрузить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CSVUploadModal;