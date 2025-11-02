import { instance } from "../axios/axios";
import React, { useEffect, useState } from "react";
import { Button } from "@mui/material";
import {
    TrendingUp,
    Warning,
    Inventory,
    CalendarToday,
    ShoppingCart
} from '@mui/icons-material';
import {
    Alert,
    CircularProgress
} from '@mui/material';


const BodyAIPredict = () => {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Моковые данные для демонстрации
    const mockPredictions = [
        {
            id: 1,
            name: "Смартфон Samsung Galaxy S23",
            currentStock: 12,
            depletionDate: "2024-01-15",
            recommendedOrder: 50,
            confidence: 87
        },
        {
            id: 2,
            name: "Ноутбук Lenovo ThinkPad X1",
            currentStock: 8,
            depletionDate: "2024-01-12",
            recommendedOrder: 25,
            confidence: 92
        },
        {
            id: 3,
            name: "Наушники Sony WH-1000XM5",
            currentStock: 5,
            depletionDate: "2024-01-10",
            recommendedOrder: 30,
            confidence: 78
        },
        {
            id: 4,
            name: "Планшет iPad Air 5",
            currentStock: 3,
            depletionDate: "2024-01-08",
            recommendedOrder: 20,
            confidence: 85
        },
        {
            id: 5,
            name: "Умные часы Apple Watch Series 9",
            currentStock: 7,
            depletionDate: "2024-01-14",
            recommendedOrder: 35,
            confidence: 81
        }
    ];

    // Функция для получения прогнозов от API
    const fetchPredictions = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await instance.get('/api/ai-predictions', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            setPredictions(response.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Ошибка при получении прогнозов:', err);
            setError('Не удалось загрузить прогнозы. Используются демо-данные.');
            // Используем моковые данные в случае ошибки
            setPredictions(mockPredictions);
            setLastUpdated(new Date());
        } finally {
            setLoading(false);
        }
    };

    // Функция для обновления конкретного прогноза
    const updateSinglePrediction = async (productId) => {
        try {
            const response = await instance.post(
                `/ai/update-prediction/${productId}`
            );

            // Обновляем конкретный прогноз в списке
            setPredictions(prev =>
                prev.map(pred =>
                    pred.id === productId ? response.data.prediction : pred
                )
            );
        } catch (err) {
            console.error('Ошибка при обновлении прогноза:', err);
            setError('Ошибка при обновлении прогноза');
        }
    };

    // Загружаем прогнозы при монтировании компонента
    useEffect(() => {
        fetchPredictions();
    }, []);

    

    // Функция для форматирования даты
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="ai-container body_info">
            <div className="ai-header">
                <div className="ai-title-section">
                    <TrendingUp className="ai-icon" />
                    <h3>Прогноз ИИ на следующие 7 дней</h3>
                </div>
                <div className="ai-controls">
                    {lastUpdated && (
                        <div className="last-updated">
                            Обновлено: {lastUpdated.toLocaleTimeString('ru-RU')}
                        </div>
                    )}
                    <Button
                        variant="outlined"
                        onClick={fetchPredictions}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} /> : <TrendingUp />}
                        sx={{
                            px: 3, // Фиксированные отступы по горизонтали
                            width: 'fit-content', // Ширина по содержимому
                            minWidth: 'max-content', // Минимальная ширина чтобы вместить текст
                        }}
                    >
                        {loading ? 'Обновление...' : 'Обновить прогноз'}
                    </Button>
                </div>
            </div>

            {error && (
                <Alert severity="warning" className="ai-alert">
                    {error}
                </Alert>
            )}

            <div className="predictions-list">
                {predictions.map((prediction) => (
                    <div key={prediction.id} className="prediction-item">
                        <div className="prediction-main">
                            <div className="product-info">
                                <Warning className="warning-icon" />
                                <div className="product-name">{prediction.product_id}</div>
                            </div>

                        </div>

                        <div className="prediction-details">
                            <div className="detail-item">
                                <Inventory className="detail-icon" />
                                <span>Дней до исчерпания остатка: </span>
                                <strong>{prediction.days_until_stockout}</strong>
                            </div>
                            <div className="detail-item">
                                <CalendarToday className="detail-icon" />
                                <span>Дата прогноза: </span>
                                <strong>{formatDate(prediction.prediction_date)}</strong>
                            </div>
                            <div className="detail-item">
                                <ShoppingCart className="detail-icon" />
                                <span>Рекомендуемый заказ: </span>
                                <strong className="recommended-order">
                                    {prediction.recommended_order} шт.
                                </strong>
                            </div>
                        </div>

                        <div className="prediction-actions">

                        </div>
                    </div>
                ))}
            </div>

            {predictions.length === 0 && !loading && (
                <div className="no-predictions">
                    Нет данных для прогноза
                </div>
            )}
        </div>
    );
};

export default BodyAIPredict