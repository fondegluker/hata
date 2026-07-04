# Hata - Недвижимость Беларуси

Web-приложение для парсинга и визуализации недвижимости с электронных торгов Беларуси (eri2.nca.by).

## Возможности

- 🗺️ **Интерактивная карта** с маркерами объектов недвижимости
- 🏠 **Парсинг данных** с eri2.nca.by с защитой от блокировок
- 📊 **Фильтрация** по типу, цене, площади, региону
- 📸 **Просмотр фотографий** в lightbox
- 📥 **Экспорт** в Excel и PDF
- 🌓 **Тёмная/светлая тема**
- 🔐 **Авторизация пользователей**

## Технологии

### Backend
- Python 3.11+
- FastAPI
- PostgreSQL + SQLAlchemy
- Playwright (парсинг)
- Alembic (миграции)

### Frontend
- React 18 + TypeScript
- Material UI
- Leaflet + OpenStreetMap
- React Query
- Zustand

## Установка

### Вариант 1: Локальная установка (WSL2/Ubuntu/Debian)

```bash
# Клонирование репозитория
git clone <repository-url>
cd hata

# Запуск скрипта установки
chmod +x install.sh
./install.sh
```

Скрипт автоматически:
1. Установит все системные зависимости
2. Настроит PostgreSQL
3. Создаст виртуальное окружение Python
4. Установит зависимости backend и frontend
5. Выполнит миграции базы данных

### Вариант 2: Docker

```bash
# Сборка и запуск
docker-compose up -d

# Просмотр логов
docker-compose logs -f
```

Приложение будет доступно по адресу http://localhost

## Разработка

### Backend

```bash
cd backend

# Создание виртуального окружения
python3 -m venv venv
source venv/bin/activate

# Установка зависимостей
pip install -e .

# Запуск в режиме разработки
uvicorn app.main:app --reload --port 8000
```

API документация: http://localhost:8000/api/docs

### Frontend

```bash
cd frontend

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev
```

Приложение: http://localhost:5173

### База данных

```bash
# Запуск PostgreSQL в Docker
docker-compose -f docker-compose.dev.yml up -d db

# Миграции
cd backend
source venv/bin/activate
alembic upgrade head       # Применить миграции
alembic revision --autogenerate -m "description"  # Создать миграцию
```

## Конфигурация

### Переменные окружения (backend/.env)

```env
# База данных
DATABASE_URL=postgresql+asyncpg://hata:hata@localhost:5432/hata

# Безопасность (ОБЯЗАТЕЛЬНО ИЗМЕНИТЬ В ПРОДАКШЕН!)
SECRET_KEY=change-me-in-production

# Парсер
PARSER_DELAY_MIN=1.0
PARSER_DELAY_MAX=3.0
PARSER_CONCURRENT_PAGES=2

# Прокси (опционально)
PARSER_PROXY_ENABLED=false
PARSER_PROXY_URL=
```

## Структура проекта

```
hata/
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Безопасность, зависимости
│   │   ├── models/       # SQLAlchemy модели
│   │   ├── schemas/      # Pydantic схемы
│   │   └── services/     # Бизнес-логика
│   ├── alembic/          # Миграции БД
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── api/          # API клиент
│   │   ├── components/   # React компоненты
│   │   ├── pages/        # Страницы
│   │   ├── store/        # Zustand stores
│   │   └── theme/        # MUI темы
│   └── package.json
├── docker/
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── Makefile
└── install.sh
```

## Использование парсера

1. Откройте страницу "Парсер" в приложении
2. Нажмите "Запустить парсер"
3. Наблюдайте за прогрессом и логами
4. Данные автоматически сохраняются в базу

### Рекомендации по безопасности парсинга

- Используйте задержки между запросами (по умолчанию 1-3 секунды)
- Не запускайте парсер слишком часто
- При больших объёмах данных используйте прокси

## API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход
- `POST /api/auth/register` - Регистрация
- `GET /api/auth/me` - Текущий пользователь

### Объекты
- `GET /api/properties/` - Список объектов с фильтрацией
- `GET /api/properties/{id}` - Детали объекта
- `GET /api/properties/regions` - Список регионов
- `GET /api/properties/property-types` - Типы недвижимости

### Карта
- `GET /api/map/markers` - Маркеры для карты
- `GET /api/map/bounds` - Границы карты

### Парсер
- `GET /api/parser/status` - Статус парсера
- `POST /api/parser/start` - Запуск парсинга
- `POST /api/parser/control` - Управление (pause/resume/stop)

### Экспорт
- `GET /api/export/excel` - Экспорт в Excel
- `GET /api/export/pdf/{id}` - PDF карточки объекта

## Лицензия

MIT License
