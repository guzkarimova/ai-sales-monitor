# n8n workflow exports

В этой папке находятся обезличенные экспорты девяти реальных workflow AI Sales Monitor. Они сохраняют узлы, связи, Code-ноды, AI prompts, расписания и бизнес-логику, но не содержат credentials, webhook ID, рабочих Telegram chat ID или инфраструктурных идентификаторов.

## Импорт

1. В n8n выберите `Import from File`.
2. Импортируйте нужный JSON.
3. Назначьте собственные credentials узлам Telegram, Google Sheets и RouterAI/OpenAI.
4. Замените плейсхолдеры:
   - `__CONFIGURE_TELEGRAM_CHAT_ID__`;
   - `__CONFIGURE_DATA_TABLE_ID__`;
   - `__CONFIGURE_GOOGLE_SHEET_ID__`;
   - `__CONFIGURE_WORKFLOW_ID__`.
5. Проверьте расписание и часовой пояс.
6. Выполните тестовый запуск на синтетических данных.
7. Включайте workflow только после проверки всех получателей и интеграций.

Все экспорты имеют `active: false`. Это преднамеренная защита от случайного запуска после импорта.

## Состав

| Файл | Назначение |
|---|---|
| `incoming-lead.json` | Telegram-сообщение → лид → CRM → уведомления |
| `crm-demo-api.json` | API для dashboard и CRM-событий |
| `manager-reply.json` | Ответ менеджера клиенту и фиксация коммуникации |
| `sla-monitor.json` | Контроль времени ответа и SLA-напоминания |
| `critical-alerts.json` | Эскалация критических сделок |
| `analyze-dialogues.json` | AI-анализ диалогов и расчёт риска |
| `daily-report.json` | Расширенная ежедневная аналитика с AI summary |
| `daily-director-report.json` | Краткая управленческая сводка директору |
| `mock-crm.json` | Синтетический CRM-контур и mapping-примеры |

Скрипт `scripts/sanitize-n8n-exports.mjs` используется для повторной очистки приватных экспортов. Исходные файлы из n8n не должны сохраняться в репозитории.

