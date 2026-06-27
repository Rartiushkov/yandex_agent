# Yandex Marketing Agent

Фронтенд для входа через Яндекс и демо-интерфейса управления рекламой.

## Что настроить в Яндексе

1. Откройте `https://oauth.yandex.ru/client/new`.
2. Создайте приложение для веб-сервиса.
3. Укажите `Redirect URI`:
   `https://rartiushkov.github.io/yandex_agent/`
4. Для обычного входа на сайт достаточно прав:
   `login:info`, `login:email`
5. Для подключения собственного Яндекс.Директа каждому пользователю нужен отдельный Direct OAuth app c `direct:api`.
6. Каждый пользователь, который будет подключаться к сервису, должен:
   - иметь аккаунт в Яндексе;
   - иметь доступ к Яндекс.Директ;
   - при необходимости запросить доступ к `Direct API` в кабинете Яндекса.

## Локальный запуск

```bash
npm install
npm run dev
```

Отдельно для backend-коннектора:

```bash
npm run server
```

## Переменные окружения

Скопируйте `.env.example` в `.env` и при необходимости поменяйте значения:

- `VITE_YANDEX_CLIENT_ID` - Client ID приложения Яндекса
- `VITE_YANDEX_REDIRECT_URI` - точный адрес возврата после логина
- `VITE_DIRECT_API_BASE_URL` - URL backend-коннектора, который ходит в Yandex Direct API
- `VITE_DIRECT_CLIENT_LOGIN` - логин клиента, если вы работаете как агент
- `VITE_YANDEX_SCOPES` - набор прав OAuth

## Важное ограничение

GitHub Pages подходит только для фронтенда. Для реальных вызовов `Яндекс.Директ API`
из браузера нужен серверный прокси или backend-коннектор. В этом проекте фронтенд
умеет работать с таким коннектором через `VITE_DIRECT_API_BASE_URL`, но сам backend
нужно поднять отдельно.

## Backend-коннектор

В проект добавлен backend-коннектор на `Express`:

- `GET /health`
- `GET /campaigns`
- `POST /campaigns/sync`
- `POST /campaigns/:id/suspend`
- `POST /campaigns/:id/resume`

Коннектор:

- принимает OAuth-токен пользователя в `Authorization: Bearer <token>`
- опционально принимает `X-Direct-Client-Login` для агентских аккаунтов
- получает список кампаний через Direct API
- получает сводную статистику и историю через `Reports` service
- умеет реально приостанавливать и возобновлять кампании

Переменные окружения backend:

- `DIRECT_CONNECTOR_PORT` - порт сервера, по умолчанию `8787`
- `YANDEX_DIRECT_CLIENT_LOGIN` - логин клиента в агентском кабинете, если нужен
- `YANDEX_DIRECT_USE_SANDBOX` - `true`, если хотите ходить в sandbox
- `YANDEX_DIRECT_MASTER_TOKEN` - OAuth-токен для single-user режима, если хотите тестировать Direct без выдачи `direct:api` браузерному токену
- `YANDEX_DIRECT_OAUTH_CLIENT_ID` - Client ID отдельного Direct OAuth app для multi-user подключения
- `YANDEX_DIRECT_OAUTH_CLIENT_SECRET` - Client secret отдельного Direct OAuth app для multi-user подключения

## Контракт backend-коннектора

Если `VITE_DIRECT_API_BASE_URL` задан, фронтенд ожидает:

- `GET /auth/direct/url` - вернуть ссылку на получение verification code для Direct API
- `GET /auth/direct/status` - вернуть статус подключения Direct для текущей серверной сессии
- `POST /auth/direct/exchange` - обменять verification code на Direct API token
- `POST /auth/direct/logout` - сбросить Direct-сессию
- `GET /campaigns` - вернуть `{ "campaigns": [...] }`
- `POST /campaigns/sync` - обновить данные и вернуть `{ "campaigns": [...] }`
- `POST /campaigns/:id/suspend` - приостановить кампанию
- `POST /campaigns/:id/resume` - возобновить кампанию

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

Примечание:
`budget` в текущем коннекторе вычисляется эвристически от фактического расхода, потому что в этом UI ещё нет полноценной модели бюджетных стратегий Яндекс.Директа.

## Деплой backend

В репо добавлены:

- [render.yaml](/C:/Users/r.artyshkov/Desktop/testTask/yandex-marketing-agent/render.yaml:1) для Render
- [Dockerfile](/C:/Users/r.artyshkov/Desktop/testTask/yandex-marketing-agent/Dockerfile:1) для Docker/VPS
- [ci.yml](/C:/Users/r.artyshkov/Desktop/testTask/yandex-marketing-agent/.github/workflows/ci.yml:1) для автотестов в GitHub Actions

Я не могу сам создать внешний сервис в вашем аккаунте Render/Railway без доступа к нему, но проект к деплою уже подготовлен.

## Что уже боевое

- получение реальных кампаний и метрик из Яндекс.Директ
- refresh/sync через backend-коннектор
- реальные действия `pause` / `resume` из агента
- multi-user подключение Direct API через verification code и серверную cookie-сессию

## Multi-user режим

Из-за ограничений Яндекс OAuth поток для `direct:api` работает не так же, как обычный вход на сайт. Поэтому multi-user схема в проекте такая:

1. Пользователь входит на сайт через обычное Яндекс ID приложение.
2. Пользователь нажимает `Подключить Директ`.
3. Backend открывает ссылку второго Direct OAuth app.
4. Яндекс показывает `verification code`.
5. Пользователь вставляет этот код в приложение.
6. Backend меняет код на персональный Direct API token и хранит его в серверной сессии.

Это даёт каждому клиенту подключать именно свой Яндекс.Директ, а не общий мастер-токен.

## Single-user тестовый режим

Если у вас уже есть рабочий OAuth-токен или мастер-токен для Direct API, можно не мучить браузерный OAuth:

- положите токен в `YANDEX_DIRECT_MASTER_TOKEN`
- backend будет использовать его для всех запросов в Direct API
- вход через Яндекс на сайте останется только для UI-профиля пользователя

Это самый быстрый способ проверить интеграцию end-to-end на одном аккаунте.

## Что ещё не боевое до конца

- создание новых кампаний из UI
- изменение бюджетных стратегий для всех типов кампаний
- управление группами, фразами и объявлениями

## Как протестировать multi-user Direct

1. Запустите backend: `npm run server`
2. Запустите фронт: `npm run dev`
3. Убедитесь, что в `.env` задано:
   `VITE_DIRECT_API_BASE_URL=http://localhost:8787`
4. Добавьте на backend env:
   `YANDEX_DIRECT_OAUTH_CLIENT_ID`
   `YANDEX_DIRECT_OAUTH_CLIENT_SECRET`
5. Откройте приложение и войдите через Яндекс
6. Нажмите `Подключить Директ`
7. Разрешите доступ в открывшейся вкладке Яндекса
8. Скопируйте `verification code`
9. Вставьте его обратно в приложение
10. Проверьте `http://localhost:8787/health`
   Должен вернуться JSON с `"ok": true`
11. После подключения сверху должен появиться статус `Direct API подключён`
12. Откройте раздел кампаний и агент
13. Нажмите запуск агента
14. Для проверки боевого действия найдите рекомендацию с `pause` или `resume` и примените её

Если не работает:

- `Missing Direct API token`:
  пользователь ещё не подключил Direct через verification code
- ошибка Direct API:
  у аккаунта нет доступа к Direct API или нужен `VITE_DIRECT_CLIENT_LOGIN`
- остался `Demo mode`:
  не задан `VITE_DIRECT_API_BASE_URL` или backend недоступен
