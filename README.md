# Yandex Marketing Agent

Фронтенд для входа через Яндекс и демо-интерфейса управления рекламой.

## Что настроить в Яндексе

1. Откройте `https://oauth.yandex.ru/client/new`.
2. Создайте приложение для веб-сервиса.
3. Укажите `Redirect URI`:
   `https://rartiushkov.github.io/yandex_agent/`
4. Проверьте, что у приложения есть права:
   `login:info`, `login:email`, `direct:api`
5. Каждый пользователь, который будет подключаться к сервису, должен:
   - иметь аккаунт в Яндексе;
   - иметь доступ к Яндекс.Директ;
   - при необходимости запросить доступ к `Direct API` в кабинете Яндекса.

## Локальный запуск

```bash
npm install
npm run dev
```

## Переменные окружения

Скопируйте `.env.example` в `.env` и при необходимости поменяйте значения:

- `VITE_YANDEX_CLIENT_ID` - Client ID приложения Яндекса
- `VITE_YANDEX_REDIRECT_URI` - точный адрес возврата после логина
- `VITE_DIRECT_API_BASE_URL` - URL backend-коннектора, который ходит в Yandex Direct API
- `VITE_YANDEX_SCOPES` - набор прав OAuth

## Важное ограничение

GitHub Pages подходит только для фронтенда. Для реальных вызовов `Яндекс.Директ API`
из браузера нужен серверный прокси или backend-коннектор. В этом проекте фронтенд
умеет работать с таким коннектором через `VITE_DIRECT_API_BASE_URL`, но сам backend
нужно поднять отдельно.

## Контракт backend-коннектора

Если `VITE_DIRECT_API_BASE_URL` задан, фронтенд ожидает:

- `GET /campaigns` - вернуть `{ "campaigns": [...] }`
- `POST /campaigns/sync` - обновить данные и вернуть `{ "campaigns": [...] }`

Каждая кампания в ответе:

```json
{
  "id": 123,
  "name": "Search campaign",
  "type": "search",
  "status": "active",
  "budget": 15000,
  "stats": {
    "spent": 3000,
    "impressions": 10000,
    "clicks": 200,
    "conversions": 10,
    "revenue": 24000
  },
  "history": [
    { "date": "01.01", "spend": 500, "clicks": 25, "conversions": 2, "cpc": 20 }
  ]
}
```
