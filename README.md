# Ro Create Discord Bot

Бот для RU-сервера по Roblox Studio / Ro Create. Он один раз настраивает структуру сервера, создаёт приватные каналы, роли, панели верификации и роли специализаций, а ещё добавляет монеты и платные публикации в `developer-search` и `resumes`.

## Что умеет

- Один раз создаёт структуру сервера через `/setup_server`
- Сразу делает созданные каналы приватными, чтобы ты спокойно всё проверил вручную
- Создаёт роли: `Founder`, `Core Team`, `Verified`, `Recruiter`, `Scripter`, `Builder`, `UI/UX`, `Modeler`, `Animator`, `Composer`
- Публикует панель верификации и выбор ролей
- Даёт монеты через `/daily`
- Показывает баланс через `/balance`
- Позволяет админу выдать монеты через `/grant_coins`
- Публикует объявления через `/post_listing`

## Какие каналы создаются

- `START HERE`
- `owner-control`
- `setup-checklist`
- `welcome-info`
- `COMMUNITY`
- `verification`
- `choose-roles`
- `announcements`
- `RO CREATE HUB`
- `portfolio-showcase`
- `developer-search`
- `resumes`
- `coins-and-commands`
- `VOICE`
- `dev-lobby`
- `project-room`
- `interview-room`

## Как это работает

1. Приглашаешь бота на сервер с правами `Administrator`
2. Запускаешь `/setup_server`
3. Бот создаёт всё один раз и запоминает, что настройка уже выполнена
4. Все созданные каналы остаются приватными
5. Ты заходишь, проверяешь оформление, тексты, роли и порядок
6. Когда готов, вручную открываешь нужные каналы для `@everyone`

Это сделано специально под твой запрос: бот не должен потом сам перестраивать сервер снова и снова.

## Команды

### `/setup_server`

Создаёт роли, категории, каналы, панели и стартовые сообщения.

### `/daily`

Даёт 30 монет раз в 24 часа.

### `/balance [user]`

Показывает баланс монет.

### `/grant_coins user amount`

Админская команда для выдачи монет.

### `/post_listing`

Публикует объявление в:

- `developer-search`
- `resumes`

Параметры:

- `type` - куда отправить пост
- `title` - заголовок
- `description` - описание
- `budget` - бюджет/стоимость в монетах
- `payment` - как платишь
- `image` - картинка
- `contact` - контакт

За публикацию списывается комиссия, по умолчанию `25` монет.

## Установка локально

### 1. Установи Node.js

Нужен Node.js `20+`.

### 2. Установи зависимости

```bash
npm install
```

### 3. Создай `.env`

Скопируй `.env.example` в `.env` и вставь значения:

```env
DISCORD_TOKEN=токен_бота
CLIENT_ID=application_id
GUILD_ID=id_твоего_сервера
POST_LISTING_FEE=25
```

### 4. Запусти бота

```bash
npm start
```

## Как создать Discord-бота

### 1. Discord Developer Portal

Открой [Discord Developer Portal](https://discord.com/developers/applications)

### 2. Создай приложение

- `New Application`
- придумай имя, например `Ro Create Bot`

### 3. Создай бота

- вкладка `Bot`
- `Reset Token` или `Copy Token`
- включи `SERVER MEMBERS INTENT`

### 4. Пригласи бота на сервер

Во вкладке `OAuth2 > URL Generator`:

- `Scopes`: `bot`, `applications.commands`
- `Bot Permissions`: `Administrator`

Открой сгенерированную ссылку и добавь бота на свой сервер.

## Как залить в GitHub

### 1. Создай новый репозиторий на GitHub

Например: `ro-create-discord-bot`

### 2. В этой папке выполни команды

```bash
git init
git add .
git commit -m "Initial Discord bot"
git branch -M main
git remote add origin https://github.com/USERNAME/ro-create-discord-bot.git
git push -u origin main
```

Не заливай `.env` в GitHub. Он уже добавлен в `.gitignore`.

## Как загрузить на Wispbyte

Точный интерфейс у хостинга может меняться, но общий принцип такой:

1. Создай новый Node.js service / bot hosting service
2. Подключи GitHub-репозиторий
3. Укажи ветку `main`
4. Build/install command: `npm install`
5. Start command: `npm start`
6. В переменные окружения добавь:
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - `GUILD_ID`
   - `POST_LISTING_FEE`
7. Запусти сервис

Если Wispbyte просит именно ссылку на GitHub, вставляешь ссылку на свой репозиторий, например:

`https://github.com/USERNAME/ro-create-discord-bot`

## Что тебе важно проверить после первого запуска

- Роль бота должна быть выше ролей, которые он выдаёт
- Каналы после `/setup_server` будут закрыты для всех, кроме основателя и команды
- Чтобы верификация работала для участников, потом вручную открой `verification`
- Чтобы выбор ролей работал для участников, потом вручную открой `choose-roles`
- Чтобы объявления были видны, открой `developer-search` и `resumes`

## Что можно улучшить потом

- Добавить красивый embed-дизайн под твой бренд
- Сделать модерацию объявлений через одобрение
- Добавить магазин за монеты
- Сделать отдельные команды для портфолио
- Подключить базу данных вместо JSON-файла
