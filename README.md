# OF Landing

Адаптивный лендинг (RU) для найма OnlyFans чаттеров с фокусом на мобильный Instagram-трафик.

## Запуск

1. Установи Node.js 18+.
2. (Опционально) создай `.env` на основе `.env.example`.
3. Запусти:

```bash
npm start
```

Сайт будет доступен на `http://localhost:3000`.

## Telegram уведомления

Для включения уведомлений добавь в `.env`:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Если переменные не заданы, форма всё равно сохраняет заявки локально в `data/applications.json`.
