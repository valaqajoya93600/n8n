# 🔧 Виправлення для ноди "Credentials to File"

## Проблема

Нода "Credentials to File" обробляє 5 credentials на вході, але на виході тільки 1.

### Причини:

1. **Синтаксична помилка**: `==N8N_ENCRYPTION_KEY=` (подвійний `==`)
2. **`alwaysOutputData: false`**: Credentials що падають з помилкою не передаються далі
3. **Шлях файлу**: `/tmp/` може бути недоступний або команда падає з іншої причини
4. **n8n export command** може падати для певних типів credentials

---

## ✅ Виправлення 1: Базове (виправити синтаксис)

Замініть параметри ноди "Credentials to File":

```json
{
  "parameters": {
    "executeOnce": false,
    "command": "N8N_ENCRYPTION_KEY=$N8N_ENCRYPTION_KEY npx n8n export:credentials --id={{ $json.credentialId }} --decrypted --output=/tmp/{{ $json.credentialId }}.json"
  },
  "type": "n8n-nodes-base.executeCommand",
  "alwaysOutputData": true,
  "onError": "continueRegularOutput"
}
```

**Зміни:**
- ❌ Прибрано подвійний `==`
- ✅ Встановлено `alwaysOutputData: true`

---

## ✅ Виправлення 2: Змінити шлях (якщо `/tmp/` недоступний)

Якщо `/tmp/` недоступний, використовуйте `/home/node/`:

```json
{
  "parameters": {
    "executeOnce": false,
    "command": "N8N_ENCRYPTION_KEY=$N8N_ENCRYPTION_KEY npx n8n export:credentials --id={{ $json.credentialId }} --decrypted --output=/home/node/{{ $json.credentialId }}.json"
  },
  "type": "n8n-nodes-base.executeCommand",
  "alwaysOutputData": true,
  "onError": "continueRegularOutput"
}
```

**І також змініть в ноді "Read Credentials Files":**
```json
{
  "parameters": {
    "fileSelector": "/home/node/*.json",
    "options": {}
  }
}
```

**І в ноді "Delete Credentials Files":**
```json
{
  "parameters": {
    "command": "rm -rf /home/node/*.json"
  }
}
```

---

## ✅ Виправлення 3: Діагностика помилок

Додайте діагностичну ноду після "Credentials to File":

### 3.1. Додайте Code node "Check Export Errors":

```javascript
// Check which credentials failed to export
const credentialId = $json.credentialId;
const credentialName = $json.credentialName;
const stdout = $json.stdout || '';
const stderr = $json.stderr || '';
const exitCode = $json.exitCode;

const hasError = exitCode !== 0 || stderr.includes('error') || stderr.includes('Error');

return {
  json: {
    credentialId,
    credentialName,
    status: hasError ? 'failed' : 'success',
    error: hasError ? stderr : null,
    stdout: stdout.substring(0, 200),
    stderr: stderr.substring(0, 200)
  }
};
```

Це покаже вам які саме credentials падають і чому.

---

## ✅ Виправлення 4: Альтернативний підхід - через n8n API

Замість Execute Command можна використати n8n API для отримання credentials:

### 4.1. Замініть "Credentials to File" на HTTP Request node:

```json
{
  "parameters": {
    "url": "http://localhost:5678/api/v1/credentials/{{ $json.credentialId }}",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "X-N8N-API-KEY",
          "value": "your_n8n_api_key_here"
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
  "type": "n8n-nodes-base.httpRequest",
  "continueOnFail": true
}
```

**Переваги:**
- Не потребує запису файлів
- Не потребує Execute Command
- Працює через API
- Стабільніше

---

## 🔍 Діагностика: Чому падають певні credentials?

### Можливі причини:

1. **Encrypted credentials**: Деякі credentials можуть бути зашифровані неправильно
2. **Missing fields**: n8n export може падати для credentials з відсутніми полями
3. **Permission issues**: Немає доступу до `/tmp/` або `/home/node/`
4. **n8n CLI issues**: Команда `npx n8n export:credentials` може мати баги для певних типів

### Як перевірити:

#### Спосіб 1: Запустіть команду вручну

```bash
# SSH в контейнер n8n
docker exec -it your_n8n_container bash

# Спробуйте експортувати кожен credential окремо
N8N_ENCRYPTION_KEY=$N8N_ENCRYPTION_KEY npx n8n export:credentials --id=GOms1QfbZPmnWIGY --decrypted --output=/tmp/test1.json
N8N_ENCRYPTION_KEY=$N8N_ENCRYPTION_KEY npx n8n export:credentials --id=JV9jLizQJV5eFRKf --decrypted --output=/tmp/test2.json
# і т.д.

# Подивіться які падають
cat /tmp/test1.json
cat /tmp/test2.json
```

#### Спосіб 2: Додайте логування в workflow

Після "Credentials to File" додайте Code node:

```javascript
// Log export results
console.log('Credential export attempt:');
console.log('ID:', $json.credentialId);
console.log('Name:', $json.credentialName);
console.log('Exit Code:', $json.exitCode);
console.log('STDOUT:', $json.stdout);
console.log('STDERR:', $json.stderr);

return $input.all();
```

---

## 📋 Покрокова інструкція виправлення

### Крок 1: Виправити синтаксис команди

В ноді "Credentials to File":
1. Відкрийте параметри
2. В полі "Command" змініть:
   - **Було**: `==N8N_ENCRYPTION_KEY=$N8N_ENCRYPTION_KEY npx...`
   - **Стало**: `N8N_ENCRYPTION_KEY=$N8N_ENCRYPTION_KEY npx...`

### Крок 2: Увімкнути alwaysOutputData

В параметрах ноди:
1. Натисніть на "Settings" (три крапки)
2. В розділі "Node" встановіть:
   - **Always Output Data**: ✅ `true`

### Крок 3: Перевірити шляхи файлів

Переконайтесь що всі шляхи однакові в нодах:
- "Credentials to File": `/home/node/{{ $json.credentialId }}.json`
- "Read Credentials Files": `/home/node/*.json`
- "Delete Credentials Files": `rm -rf /home/node/*.json`

### Крок 4: Запустити і перевірити

1. Запустіть workflow
2. Перевірте output ноди "Credentials to File"
3. Тепер ви побачите ВСІ 5 items (навіть ті що з помилками)
4. Подивіться `stderr` для credentials що падають

### Крок 5: Виправити проблемні credentials

Залежно від помилок в `stderr`, можливо доведеться:
- Виправити credentials в source system
- Використати API-підхід замість CLI
- Skip проблемних credentials

---

## 🎯 Швидке рішення (copy-paste ready)

### Для ноди "Credentials to File":

**Command:**
```bash
N8N_ENCRYPTION_KEY=$N8N_ENCRYPTION_KEY npx n8n export:credentials --id={{ $json.credentialId }} --decrypted --output=/home/node/{{ $json.credentialId }}.json
```

**Settings:**
- Always Output Data: `true`
- Continue On Fail: `true`

### Для ноди "Read Credentials Files":

**File Selector:**
```
/home/node/*.json
```

### Для ноди "Delete Credentials Files":

**Command:**
```bash
rm -rf /home/node/*.json
```

---

## ⚠️ Важливі примітки

### Про export:credentials command

n8n CLI команда `export:credentials` може мати проблеми з деякими типами credentials через:
1. Невідповідність схем
2. Missing required fields
3. Шифрування issues

Як зазначено в вашому Sticky Note "Credential Issues and Limitations":
> For some credentials, the fields obtained through c8n-cli are not consistent with the mandatory fields required by the n8n API when importing them into the target system.

### Альтернатива: Використовуйте мій API-based import workflow

Я раніше створював workflow для import credentials через API - він НЕ має цих проблем!

Файл: `n8n-import-credentials-from-github.json` або `n8n-import-credentials-from-google-drive.json`

Вони використовують n8n REST API замість CLI і працюють стабільніше.

---

## 🎁 Bonus: Improved workflow з кращим error handling

Якщо хочете, можу створити покращену версію всього workflow з:
- ✅ Proper error handling для кожного credential
- ✅ Детальним логуванням
- ✅ API-based approach замість CLI
- ✅ Retry mechanism для failed credentials
- ✅ Summary report в кінці

Дайте знати якщо потрібно!

---

## 📞 Підсумок

**Основна проблема:** Подвійний `==` в команді + `alwaysOutputData: false`

**Швидке виправлення:**
1. Прибрати `==`
2. Встановити `alwaysOutputData: true`
3. Перевірити шляхи файлів

**Після виправлення:** Ви побачите всі 5 credentials на виході (навіть якщо деякі з помилками)

**Далі:** Дивіться `stderr` для кожного credential і виправляйте проблеми індивідуально.

---

_Версія: 1.0_  
_Дата: 2024-01-15_
