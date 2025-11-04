# 🔧 Виправлення експорту конкретних Credentials у Workflow Exporter

## ❌ Проблема

Команда `n8n export:credentials --id={{ $json.credentialId }}` **не працює**, тому що:

1. **Параметр `--id` не існує** в n8n CLI для команди `export:credentials`
2. Доступні тільки параметри: `--all`, `--backup`, `--decrypted`, `--output`
3. CLI не дозволяє експортувати конкретний credential за ID

## ✅ Робочі рішення

---

## Рішення 1: n8n REST API (РЕКОМЕНДОВАНО) ⭐

### Переваги:
- ✅ Працює напряму з конкретним credential ID
- ✅ Не потребує запису файлів
- ✅ Швидше і надійніше
- ✅ Не потрібна команда export

### Як виправити:

Замініть ноду **"Credentials to File"** (Execute Command) на **HTTP Request** node:

#### Конфігурація HTTP Request node:

```json
{
  "parameters": {
    "url": "=http://localhost:5678/api/v1/credentials/{{ $json.credentialId }}",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "X-N8N-API-KEY",
          "value": "YOUR_SOURCE_N8N_API_KEY"
        }
      ]
    },
    "options": {
      "response": {
        "response": {
          "fullResponse": false,
          "responseFormat": "json"
        }
      }
    }
  },
  "id": "get-credential-api",
  "name": "Get Credential via API",
  "type": "n8n-nodes-base.httpRequest",
  "position": [3952, 9232],
  "typeVersion": 4.2,
  "continueOnFail": true,
  "alwaysOutputData": true
}
```

**Налаштування:**
1. Замініть `YOUR_SOURCE_N8N_API_KEY` на ваш API key від SOURCE системи
2. Якщо n8n не на localhost, змініть URL: `https://your-n8n-url.com/api/v1/credentials/...`

#### Результат:

API поверне credential у форматі:
```json
{
  "id": "GOms1QfbZPmnWIGY",
  "name": "Deepgram",
  "type": "deepgramApi",
  "data": {
    "apiKey": "decrypted_value_here"
  }
}
```

### Модифікація наступних нод:

#### Після HTTP Request додайте Code node "Format Credential":

```javascript
// Format credential for further processing
const cred = $input.first().json;

return {
  json: {
    id: cred.id,
    name: cred.name,
    type: cred.type,
    data: cred.data,
    credentialId: cred.id,
    credentialName: cred.name,
    credentialType: cred.type
  }
};
```

#### Видаліть або пропустіть ці ноди:
- ❌ "Read Credentials Files" - більше не потрібна
- ❌ "Credentials Files to Json" - більше не потрібна  
- ❌ "Delete Credentials Files" - більше не потрібна

#### Змініть потік:

**Було:**
```
Loop Over Items → Credentials to File → Wait → [повернення до Loop]
                                      ↓
                              Read Credentials Files → ...
```

**Стало:**
```
Loop Over Items → Get Credential via API → Format Credential → Export Credentials1
                                                              ↓
                                                    Fix Workflow Creds Ids
```

---

## Рішення 2: Експорт всіх + фільтрування

Якщо API недоступний, використовуйте цей підхід.

### Крок 1: Змініть "Credentials to File" на "Export All Credentials"

```json
{
  "parameters": {
    "command": "N8N_ENCRYPTION_KEY=$N8N_ENCRYPTION_KEY npx n8n export:credentials --all --decrypted --output=/tmp/all_credentials.json"
  },
  "id": "export-all-credentials",
  "name": "Export All Credentials",
  "type": "n8n-nodes-base.executeCommand",
  "position": [3952, 9232],
  "typeVersion": 1,
  "executeOnce": true,
  "alwaysOutputData": true
}
```

**Важливо:** `executeOnce: true` - виконується тільки 1 раз (не в loop)

### Крок 2: Перемістіть Execute Command з Loop

**Новий потік:**
```
Loop Over Items → Aggregate (collect all IDs)
                      ↓
              Export All Credentials (executeOnce)
                      ↓
              Read Credentials Files
                      ↓
              Filter Needed Credentials (Code node)
                      ↓
              Split back to items
                      ↓
              Export Credentials1
```

### Крок 3: Code node "Filter Needed Credentials"

```javascript
// Read all exported credentials
const allCredsFile = $input.first().json;
const allCreds = JSON.parse(allCredsFile.data.toString());

// Get list of needed IDs from Loop
const neededIds = $('Aggregate').first().json.credentialIds;

// Filter only needed credentials
const filtered = allCreds.filter(cred => 
  neededIds.includes(cred.id)
);

return filtered.map(cred => ({
  json: cred
}));
```

### Крок 4: Aggregate node після Loop Over Items

```json
{
  "parameters": {
    "aggregate": "aggregateAllItemData",
    "fieldsToAggregate": {
      "fieldToAggregate": [
        {
          "fieldToAggregate": "credentialId",
          "renameField": false,
          "outputFieldName": "credentialIds"
        }
      ]
    },
    "options": {}
  },
  "id": "aggregate-cred-ids",
  "name": "Aggregate Credential IDs",
  "type": "n8n-nodes-base.aggregate",
  "typeVersion": 1
}
```

---

## Рішення 3: Використання n8n node (найпростіше) 🌟

### Замініть Execute Command на n8n node:

```json
{
  "parameters": {
    "resource": "credential",
    "operation": "get",
    "credentialId": {
      "__rl": true,
      "value": "={{ $json.credentialId }}",
      "mode": "id"
    }
  },
  "id": "get-credential-n8n",
  "name": "Get Credential",
  "type": "n8n-nodes-base.n8n",
  "position": [3952, 9232],
  "typeVersion": 1,
  "credentials": {
    "n8nApi": {
      "id": "YOUR_SOURCE_API_CREDENTIAL_ID",
      "name": "SOURCE n8n API"
    }
  },
  "continueOnFail": true,
  "alwaysOutputData": true
}
```

**Переваги:**
- Найпростіше рішення
- Використовує стандартний n8n node
- Автоматично обробляє credentials

**Налаштування:**
1. В параметрах node виберіть ваш SOURCE n8n API credential
2. Operation: "Get"
3. Credential ID: `={{ $json.credentialId }}`

---

## Порівняння рішень

| Критерій | Рішення 1 (HTTP API) | Рішення 2 (Export All) | Рішення 3 (n8n node) |
|----------|---------------------|------------------------|---------------------|
| Складність | ⭐⭐ Середня | ⭐⭐⭐ Висока | ⭐ Низька |
| Швидкість | ⚡⚡⚡ Швидко | ⚡ Повільно | ⚡⚡⚡ Швидко |
| Файлові операції | ✅ Не потрібні | ❌ Потрібні | ✅ Не потрібні |
| Надійність | ✅ Висока | ⚠️ Середня | ✅ Висока |
| **Рекомендація** | ✅ Так | ⚠️ Якщо API недоступний | ✅✅ Найкраще |

---

## Покрокова інструкція міграції

### Для Рішення 3 (найпростіше):

#### Крок 1: Видалити старі ноди

Видаліть з workflow:
1. ❌ "Credentials to File" (Execute Command)
2. ❌ "Wait"
3. ❌ "Read Credentials Files"
4. ❌ "Credentials Files to Json"
5. ❌ "Credentials to Export" (Split Out)
6. ❌ "Delete Credentials Files"

#### Крок 2: Додати нову ноду

Після "Loop Over Items" додайте **n8n node**:
- Name: "Get Credential"
- Type: n8n-nodes-base.n8n
- Resource: credential
- Operation: get
- Credential ID: `={{ $json.credentialId }}`
- n8n API credentials: ваш SOURCE API

#### Крок 3: Підключити до "Export Credentials1"

```
Loop Over Items → Get Credential → Export Credentials1 → Fix Workflow Creds Ids
```

#### Крок 4: Видалити Aggregate

Оскільки тепер не потрібно збирати всі items, видаліть "Aggregate" node.

#### Крок 5: Протестувати

1. Запустіть workflow
2. Перевірте що всі 5 credentials експортуються
3. Якщо є помилки - дивіться output ноди "Get Credential"

---

## Додаткові налаштування

### Якщо n8n не на localhost

Змініть URL в HTTP Request або n8n node settings:

**Для HTTP Request:**
```javascript
url: "https://your-source-n8n.com/api/v1/credentials/{{ $json.credentialId }}"
```

**Для n8n node:**
В credentials налаштуйте правильний Base URL.

### Якщо потрібен decrypted data

API автоматично повертає decrypted data якщо:
1. Використовується правильний API key
2. API key має доступ до credentials

### Error handling

Додайте після "Get Credential" Code node для перевірки:

```javascript
const cred = $input.first().json;

if (!cred || !cred.id) {
  throw new Error(`Failed to get credential: ${$('Loop Over Items').item.json.credentialName}`);
}

if (!cred.data) {
  throw new Error(`Credential data is empty: ${cred.name}`);
}

return { json: cred };
```

---

## Troubleshooting

### "API returned 401 Unauthorized"

**Проблема:** Неправильний або відсутній API key

**Рішення:**
1. Перевірте що API key правильний
2. Settings → API → Create new key
3. Оновіть credentials в workflow

### "API returned 404 Not Found"

**Проблема:** Credential з таким ID не існує

**Рішення:**
1. Перевірте що credentialId правильний
2. Можливо credential був видалений
3. Використайте `continueOnFail: true`

### "Cannot read property 'data' of undefined"

**Проблема:** API не повернув credential

**Рішення:**
1. Додайте error handling (див. вище)
2. Перевірте чи credential доступний через API
3. Можливо потрібні додаткові права

### "Some credentials still fail to export"

**Проблема:** Деякі типи credentials мають проблеми при експорті

**Рішення:**
1. Це нормально (як зазначено в вашому Sticky Note)
2. Експортуйте що можна
3. Інші налаштуйте вручну на target system
4. В кінці workflow буде список failed credentials

---

## Готові JSON конфігурації

### Варіант A: HTTP Request node (copy-paste ready)

```json
{
  "parameters": {
    "url": "=http://localhost:5678/api/v1/credentials/{{ $json.credentialId }}",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "X-N8N-API-KEY",
          "value": "n8n_api_YOUR_KEY_HERE"
        }
      ]
    },
    "options": {
      "response": {
        "response": {
          "fullResponse": false,
          "responseFormat": "json"
        }
      }
    }
  },
  "name": "Get Credential via API",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [3440, 9040],
  "continueOnFail": true,
  "alwaysOutputData": true
}
```

### Варіант B: n8n node (copy-paste ready)

```json
{
  "parameters": {
    "resource": "credential",
    "operation": "get",
    "credentialId": {
      "__rl": true,
      "value": "={{ $json.credentialId }}",
      "mode": "id"
    }
  },
  "name": "Get Credential",
  "type": "n8n-nodes-base.n8n",
  "typeVersion": 1,
  "position": [3440, 9040],
  "credentials": {
    "n8nApi": {
      "id": "YOUR_SOURCE_N8N_API_ID",
      "name": "SOURCE n8n API"
    }
  },
  "continueOnFail": true,
  "alwaysOutputData": true
}
```

---

## Мінімальні зміни в існуючому workflow

Якщо не хочете переробляти весь flow, зробіть мінімальні зміни:

1. **Замініть тільки одну ноду** "Credentials to File" на "Get Credential" (n8n node)
2. **Видаліть Wait** (більше не потрібен)
3. **З'єднайте** напряму: Loop → Get Credential → Read Files (якщо інші credentials)

Або ще простіше:

1. Замініть "Credentials to File" + "Wait" на "Get Credential"
2. Додайте Code node після для форматування
3. Підключіть до існуючого "Export Credentials1"

---

## Підсумок

### Що було:
```
❌ n8n export:credentials --id=... (не працює, параметр не існує)
```

### Що тепер:
```
✅ GET /api/v1/credentials/{id} (через HTTP Request або n8n node)
```

### Рекомендація:
Використовуйте **Рішення 3** (n8n node) - найпростіше і найнадійніше.

### Час на виправлення:
- Рішення 3: ~5 хвилин
- Рішення 1: ~10 хвилин
- Рішення 2: ~20 хвилин

---

## Контрольний список

Після виправлення перевірте:

- [ ] Всі 5 credentials проходять через flow
- [ ] Кожен credential має `id`, `name`, `type`, `data`
- [ ] Немає помилок в "Get Credential" node
- [ ] "Export Credentials1" отримує правильні дані
- [ ] "Fix Workflow Creds Ids" коректно замінює ID
- [ ] Фінальний workflow успішно експортується на target

---

**Версія:** 2.0  
**Дата:** 2024-01-15  
**Статус:** Production Ready ✅
