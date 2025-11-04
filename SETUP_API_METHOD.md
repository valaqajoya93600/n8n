# 🚀 Setup Guide: Import Credentials via n8n API (No File Writing)

## Проблема яку ми вирішили

**Стара версія workflow** використовувала:
- ❌ `n8n-nodes-base.writeReadFile` - запис файлів на диск (заблоковано в багатьох середовищах)
- ❌ `n8n-nodes-base.executeCommand` - виконання CLI команд
- ❌ Потребувала доступ до файлової системи

**Нова версія workflow** використовує:
- ✅ **n8n REST API** - створює credentials через HTTP запити
- ✅ **Працює в пам'яті** - не потребує запису файлів
- ✅ **Безпечніше** - працює з суворими security налаштуваннями
- ✅ **Краща діагностика** - деталі по кожному credential

---

## 🎯 Швидкий старт

### Крок 1: Отримати n8n API Key

```
1. Відкрийте ваш n8n instance
2. Натисніть на свій профіль (правий верхній кут)
3. Settings → API
4. Натисніть "Create API Key"
5. Скопіюйте ключ (він показується ОДИН раз!)
```

**Приклад API key:**
```
n8n_api_1234567890abcdefghijklmnopqrstuvwxyz1234567890
```

---

### Крок 2: Імпортувати оновлений workflow

Виберіть потрібний варіант:

**Для GitHub:**
```
Файл: n8n-import-credentials-from-github.json
```

**Для Google Drive:**
```
Файл: n8n-import-credentials-from-google-drive.json
```

Обидва тепер працюють через **n8n API**!

---

### Крок 3: Налаштувати Globals - Config node

Відкрийте node **"Globals - Config"** та змініть параметри:

#### Для GitHub варіанту:

```json
{
  "repo.owner": "your-github-username",
  "repo.name": "n8n-backups",
  "repo.path": "credentials/n8n_backup_credentials.json",
  "n8nApiKey": "n8n_api_YOUR_KEY_HERE",
  "n8nUrl": "https://your-n8n.yourdomain.com"
}
```

#### Для Google Drive варіанту:

```json
{
  "driveId": "My Drive",
  "folderId": "1p447S9MWYcRpA6dmfDe-Kdc3-d8L2Lzr",
  "fileName": "n8n_backup_credentials.json",
  "n8nApiKey": "n8n_api_YOUR_KEY_HERE",
  "n8nUrl": "https://your-n8n.yourdomain.com"
}
```

⚠️ **ВАЖЛИВО:**
- `n8nUrl` - БЕЗ слешу в кінці (правильно: `https://n8n.com`, неправильно: `https://n8n.com/`)
- `n8nApiKey` - повний ключ включно з префіксом `n8n_api_`

---

### Крок 4: Запустити workflow

1. **Натисніть "Execute Workflow"**
2. **Дочекайтесь завершення**
3. **Перевірте результат в node "Aggregate Results"**

Очікуваний output:

```json
{
  "status": "✅ Success",
  "message": "Imported 15 of 15 credentials from GitHub",
  "successful": 15,
  "failed": 0,
  "total": 15,
  "details": {
    "successful": [
      {"name": "GitHub API", "id": "abc123"},
      {"name": "Google Drive OAuth2", "id": "def456"},
      ...
    ],
    "failed": []
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "GitHub",
  "method": "n8n API"
}
```

---

## 🔧 Як це працює

### Новий Flow (API Method)

```
1️⃣ Trigger → Завантажує файл (GitHub/Drive)
    ↓
2️⃣ Parse JSON → Валідує структуру
    ↓
3️⃣ Split Credentials → Розбиває масив на окремі items
    ↓
4️⃣ Loop через кожен credential:
    → HTTP Request: POST /api/v1/credentials
    → Header: X-N8N-API-KEY: your_key
    → Body: { name, type, data }
    ↓
5️⃣ Aggregate Results → Збирає статистику
    ↓
6️⃣ ✅ Готово!
```

### Порівняння методів

| Аспект | CLI Method (стара) | API Method (нова) |
|--------|-------------------|-------------------|
| Запис файлів | ❌ Потрібен | ✅ Не потрібен |
| Безпека | ⚠️ Потребує file access | ✅ Тільки API |
| Діагностика | ⚠️ Загальна помилка | ✅ По кожному credential |
| Performance | ⚡ Швидше (bulk) | ⚡⚡ Трохи повільніше (loop) |
| Підтримка | ⚠️ CLI може змінитись | ✅ API стабільний |
| Сумісність | ❌ Не працює на Digital Ocean | ✅ Працює скрізь |

---

## 🐛 Troubleshooting

### Помилка: "Please set your n8n API Key"

**Причина:** Ви не змінили `YOUR_N8N_API_KEY_HERE` в Globals node

**Рішення:**
```
1. Відкрийте node "Globals - Config"
2. Знайдіть поле n8nApiKey
3. Замініть на ваш справжній API key
```

---

### Помилка: "401 Unauthorized"

**Причина:** Неправильний або прострочений API key

**Рішення:**
```
1. Settings → API
2. Створіть новий API key
3. Оновіть в Globals node
```

---

### Помилка: "404 Not Found"

**Причина:** Неправильний n8nUrl

**Рішення:**
```
Переконайтесь що URL правильний:
✅ https://n8n.yourdomain.com
✅ http://localhost:5678
❌ https://n8n.yourdomain.com/ (слеш в кінці)
❌ n8n.yourdomain.com (без https://)
```

---

### Помилка: "Credential already exists"

**Поведінка:** Це НЕ помилка! n8n API не може створити duplicate credentials

**Що відбувається:**
- Credentials з такою ж назвою вже існують
- Workflow помічає їх як "failed" але з поясненням
- Решта credentials імпортуються успішно

**Рішення якщо хочете оновити існуючі:**
```javascript
// В node "Create Credential via API" можна додати логіку:
// 1. Спочатку GET /api/v1/credentials (знайти існуючий)
// 2. Якщо знайдено - PATCH /api/v1/credentials/:id (оновити)
// 3. Якщо не знайдено - POST /api/v1/credentials (створити)
```

---

### Credentials імпортуються але не працюють

**Можливі причини:**

1. **Шифрування:** Credentials були експортовані з іншого n8n instance з іншим encryption key

**Рішення:**
```bash
# Переконайтесь що експортували з --decrypted flag:
npx n8n export:credentials --all --decrypted --output=credentials.json
```

2. **Формат data:** API очікує plaintext data (як при decrypted export)

**Перевірка:**
```json
// Правильний формат (decrypted):
{
  "name": "My API",
  "type": "httpBasicAuth",
  "data": {
    "user": "username",
    "password": "password123"
  }
}

// Неправильний формат (encrypted):
{
  "name": "My API",
  "type": "httpBasicAuth",
  "data": "encrypted_string_here"
}
```

---

## 📊 Моніторинг та статистика

### Додати Slack notifications

Після node "Aggregate Results" додайте Slack node:

```javascript
// Slack Message
📊 *n8n Credentials Import Report*

Status: {{ $json.status }}
Total: {{ $json.total }}
✅ Successful: {{ $json.successful }}
❌ Failed: {{ $json.failed }}

Source: {{ $json.source }}
Time: {{ $json.timestamp }}

{{#if $json.details.failed.length > 0}}
⚠️ Failed credentials:
{{#each $json.details.failed}}
  • {{ this.name }}: {{ this.error }}
{{/each}}
{{/if}}
```

---

### Зберегти logs в базу даних

Після node "Aggregate Results" додайте Postgres/MySQL node:

```sql
INSERT INTO credential_import_logs (
  status,
  successful_count,
  failed_count,
  total_count,
  source,
  details,
  timestamp
) VALUES (
  '{{ $json.status }}',
  {{ $json.successful }},
  {{ $json.failed }},
  {{ $json.total }},
  '{{ $json.source }}',
  '{{ JSON.stringify($json.details) }}',
  '{{ $json.timestamp }}'
);
```

---

## 🎨 Розширення workflow

### Додати retry для failed credentials

```javascript
// Новий node "Retry Failed" після "Aggregate Results"
const failedCreds = $json.details.failed;

if (failedCreds.length > 0) {
  // Зачекати 5 секунд
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Повторити спробу
  return failedCreds.map(item => ({
    json: {
      credential: item.credential,
      n8nApiKey: $('Globals - Config').first().json.n8nApiKey,
      n8nUrl: $('Globals - Config').first().json.n8nUrl,
      isRetry: true
    }
  }));
}

return [];
```

---

### Автоматичне оновлення існуючих credentials

Замініть node "Create Credential via API" на sequence:

```
1. Check if exists (GET /api/v1/credentials?filter=...)
2. If exists → Update (PATCH /api/v1/credentials/:id)
3. If not exists → Create (POST /api/v1/credentials)
```

**Code node example:**

```javascript
const { credential, n8nApiKey, n8nUrl } = $json;

// Search for existing
const existing = await this.helpers.httpRequest({
  method: 'GET',
  url: `${n8nUrl}/api/v1/credentials`,
  headers: { 'X-N8N-API-KEY': n8nApiKey },
  qs: { filter: JSON.stringify({ name: credential.name, type: credential.type }) }
});

let result;
if (existing.data && existing.data.length > 0) {
  // Update existing
  const credId = existing.data[0].id;
  result = await this.helpers.httpRequest({
    method: 'PATCH',
    url: `${n8nUrl}/api/v1/credentials/${credId}`,
    headers: { 'X-N8N-API-KEY': n8nApiKey },
    body: { name: credential.name, type: credential.type, data: credential.data },
    json: true
  });
  result.action = 'updated';
} else {
  // Create new
  result = await this.helpers.httpRequest({
    method: 'POST',
    url: `${n8nUrl}/api/v1/credentials`,
    headers: { 'X-N8N-API-KEY': n8nApiKey },
    body: { name: credential.name, type: credential.type, data: credential.data },
    json: true
  });
  result.action = 'created';
}

return { json: result };
```

---

## 🔐 Безпека

### Best Practices

✅ **Зберігайте API key в безпеці:**
```
- НЕ комітьте в git
- Використовуйте environment variables
- Ротація кожні 90 днів
```

✅ **Обмежте доступ до API:**
```
n8n → Settings → API
→ Перевірте які API keys активні
→ Видаліть старі/непотрібні
```

✅ **Моніторте використання API:**
```
- Логуйте кожен import
- Слідкуйте за незвичайною активністю
- Налаштуйте alerts
```

✅ **Використовуйте HTTPS:**
```
- Завжди https:// для n8nUrl
- Ніколи http:// для production
```

---

## 📚 Довідка n8n API

### Credentials Endpoints

| Method | Endpoint | Опис |
|--------|----------|------|
| GET | `/api/v1/credentials` | Список всіх credentials |
| GET | `/api/v1/credentials/:id` | Отримати один credential |
| POST | `/api/v1/credentials` | Створити новий credential |
| PATCH | `/api/v1/credentials/:id` | Оновити credential |
| DELETE | `/api/v1/credentials/:id` | Видалити credential |

### Приклад POST request:

```bash
curl -X POST https://your-n8n.com/api/v1/credentials \
  -H "X-N8N-API-KEY: n8n_api_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My GitHub Token",
    "type": "githubApi",
    "data": {
      "accessToken": "ghp_xxxxxxxxxxxxx"
    }
  }'
```

### Response:

```json
{
  "id": "abc123def456",
  "name": "My GitHub Token",
  "type": "githubApi",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

Повна документація: https://docs.n8n.io/api/

---

## 🎉 Готово!

Тепер ваш workflow:
- ✅ Працює БЕЗ запису файлів
- ✅ Сумісний з Digital Ocean та іншими обмеженими середовищами
- ✅ Використовує офіційний n8n API
- ✅ Дає детальну діагностику по кожному credential
- ✅ Легко розширюється і кастомізується

---

## 💡 Наступні кроки

1. ✅ Протестуйте workflow вручну
2. ✅ Перевірте що всі credentials імпортувались
3. ✅ Налаштуйте Schedule Trigger для автоматизації
4. ✅ Додайте notifications (Slack/Email)
5. ✅ Налаштуйте моніторинг та логування

---

**Є питання?** Дивіться повну документацію:
- `CREDENTIALS_IMPORT_README.md` - Загальний огляд
- `N8N_CREDENTIALS_IMPORT_GUIDE.md` - Детальний гайд
- `QUICKSTART_UA.md` - Швидкий старт

**Працює? Відмінно! 🚀**

---

_Version: 2.0 (API Method)_  
_Last Updated: 2024-01-15_  
_Author: Based on community feedback_
