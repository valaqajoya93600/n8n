# Competitor Price Monitoring Workflow - Implementation Guide

## Overview

This document describes the implementation of an n8n workflow for automatic competitor price monitoring with aggregated Slack reporting.

## Ticket Description

Створити n8n воркфлоу для автоматичного моніторингу цін конкурентів з агрегованим звітом у Slack.

**Бізнес-мета:**
Відстежувати ціни на 3-4 ключових товари у конкурентів. Воркфлоу запускається щогодини, перевіряє ціни і надсилає ОДИН зведений звіт у Slack, тільки якщо хтось із конкурентів має ціну нижчу за нашу.

## Files Created

### 1. Main Workflow
**Location**: `packages/frontend/editor-ui/src/features/workflows/templates/utils/samples/competitor_price_monitoring.json`

This is the complete, production-ready workflow that includes:
- Schedule Trigger (hourly execution)
- Set Node with reference prices
- HTTP Request to fetch competitors
- Code Node with Cheerio-based HTML parsing and price comparison
- IF Node for conditional logic
- ItemLists Aggregation
- Slack integration

### 2. Test Workflow
**Location**: `packages/testing/playwright/workflows/competitor_price_monitoring_test.json`

A simplified version for testing with mock data that doesn't require:
- External API calls
- Cheerio HTML parsing
- Slack credentials

Perfect for unit testing and demonstrating the workflow logic.

### 3. Documentation
**Location**: `packages/frontend/editor-ui/src/features/workflows/templates/utils/samples/COMPETITOR_PRICE_MONITORING.md`

Comprehensive documentation including:
- Architecture overview
- Node-by-node explanation
- Configuration instructions
- Technical challenges and solutions

## Workflow Architecture

```
Schedule Trigger (Hourly)
    ↓
Our Prices (Set Node)
    ↓
Get Competitors (HTTP Request)
    ↓
Loop and Compare Prices (Code Node)
    ├─ Fetch each competitor URL
    ├─ Parse HTML with Cheerio
    ├─ Extract price
    ├─ Compare with our price
    └─ Return only lower prices
    ↓
Check If Any Lower Prices (IF Node)
    ├─ Yes → Continue
    └─ No → End (no Slack message)
    ↓
Aggregate Lower Prices (ItemLists Node)
    ↓
Format Slack Message (Code Node)
    ↓
Send Report to Slack (Slack Node)
```

## Key Technical Solutions

### 1. Aggregation Challenge ✅

**Problem**: Need to send ONE Slack message, not multiple

**Solution**: 
- Code node processes ALL competitors in one execution
- Returns array of items (only lower prices)
- ItemLists aggregation collects all into single object
- Slack node sends one message at the end

### 2. Data Context Between Nodes ✅

**Problem**: Access reference prices from previous node inside loop

**Solution**: Used n8n expression `$item(0).$node["Our Prices"].json.my_prices`

### 3. HTML Parsing ✅

**Problem**: Extract price from competitor HTML

**Solution**:
```javascript
const cheerio = require('cheerio');
const $ = cheerio.load(response);
const priceText = $('span.price').first().text().trim();
const priceMatch = priceText.match(/[\d,]+\.?\d*/);
const theirPrice = parseFloat(priceMatch[0].replace(',', ''));
```

### 4. Error Handling ✅

**Problem**: One failing competitor shouldn't break the workflow

**Solution**: Try-catch with continue logic:
```javascript
try {
  // Process competitor
} catch (error) {
  console.error(`Error processing competitor: ${error.message}`);
  continue; // Continue with next competitor
}
```

## How to Use

### Import the Workflow

1. Open n8n instance
2. Go to Workflows
3. Click "Import from File"
4. Select: `packages/frontend/editor-ui/src/features/workflows/templates/utils/samples/competitor_price_monitoring.json`

### Configure the Workflow

#### Step 1: Update Our Prices
Open "Our Prices" node and modify:
```json
{
  "product_A": 100,
  "product_B": 250,
  "product_C": 999
}
```

#### Step 2: Configure Competitors API
Open "Get Competitors" node and set URL to your API endpoint that returns:
```json
[
  {
    "name": "Competitor 1",
    "url": "https://competitor1.com/product_A",
    "product_id": "product_A"
  }
]
```

#### Step 3: Adjust HTML Parsing (if needed)
Open "Loop and Compare Prices" node and modify:
- Cheerio selector: `$('span.price')` - change to match competitor HTML
- Regex pattern: `/[\d,]+\.?\d*/` - adjust for price format

#### Step 4: Setup Slack
Open "Send Report to Slack" node:
- Add Slack credentials
- Select channel from dropdown
- Test connection

### Testing

For quick testing without external dependencies:
1. Import the test workflow: `packages/testing/playwright/workflows/competitor_price_monitoring_test.json`
2. Click "Execute Workflow"
3. Review the output at "Format Message" node
4. Verify aggregation works correctly

## Acceptance Criteria Status

| Criterion | Status | Notes |
|-----------|--------|-------|
| Workflow created as .json file | ✅ | In proper n8n repo location |
| Schedule Trigger configured hourly | ✅ | `hoursInterval: 1` |
| Aggregation works correctly | ✅ | ItemLists node collects all results |
| Code Node with HTML parsing | ✅ | Uses Cheerio library |
| Data context properly passed | ✅ | Uses `$item(0).$node["Our Prices"]` |
| IF checks for lower prices | ✅ | Conditional logic before Slack |
| Slack message readable format | ✅ | Ukrainian text with formatting |
| Workflow can be imported | ✅ | Valid n8n JSON structure |

## Advanced Customization

### Changing Schedule Frequency

In "Schedule Trigger" node, modify:
```json
{
  "field": "hours",
  "hoursInterval": 1  // Change to 2, 3, 4, etc.
}
```

Or switch to minutes:
```json
{
  "field": "minutes",
  "minutesInterval": 30
}
```

### Adding More Products

In "Our Prices" node:
```json
{
  "product_A": 100,
  "product_B": 250,
  "product_C": 999,
  "product_D": 499,  // Add new products
  "product_E": 150
}
```

### Custom Slack Message Format

In "Format Slack Message" node, modify the message template:
```javascript
let message = '🔔 *Price Alert*\n\n';
// Customize as needed
```

### Parsing Different HTML Structures

Common patterns:
```javascript
// Option 1: Class selector
const priceText = $('.product-price').text();

// Option 2: Data attribute
const priceText = $('[data-price]').attr('data-price');

// Option 3: Multiple selectors
const priceText = $('.price, .product-price, [data-price]').first().text();

// Option 4: Regex in HTML
const priceMatch = response.match(/"price":\s*(\d+\.?\d*)/);
```

## Troubleshooting

### Issue: No Slack messages received

**Check**:
1. Are there actually lower prices? Check "Compare Prices" node output
2. Is IF node condition met? Review IF node logic
3. Slack credentials configured? Test Slack connection
4. Channel ID correct? Verify in Slack node

### Issue: HTML parsing fails

**Check**:
1. Is the selector correct? Inspect competitor website HTML
2. Try different selectors: `.price`, `#price`, `[data-price]`
3. Add logging: `console.log('HTML:', response.substring(0, 500))`
4. Test regex pattern separately

### Issue: "Cannot read property 'json' of undefined"

**Fix**: Ensure "Our Prices" node is connected and executes before "Compare Prices"

## Performance Considerations

- **Concurrent Requests**: Code node processes competitors sequentially. For many competitors, consider batching.
- **Timeout**: Default HTTP timeout is 60s. Adjust if needed.
- **Rate Limiting**: Add delays between requests if competitor sites rate-limit.

## Security Notes

- Store sensitive data (API keys, tokens) in n8n credentials, not in workflow
- Use environment variables for URLs via `$env.COMPETITOR_API_URL`
- Consider IP rotation if scraping many sites

## Future Enhancements

Potential improvements:
1. **Email fallback** if Slack fails
2. **Historical tracking** - store prices in database
3. **Price trend analysis** - ML predictions
4. **Multi-region support** - different prices per region
5. **Automated price adjustments** - trigger pricing API

## Support

For issues or questions about this workflow:
1. Check workflow documentation in `COMPETITOR_PRICE_MONITORING.md`
2. Review n8n Code node documentation
3. Test with simplified mock workflow first
4. Enable debug mode in n8n for detailed logs

## License

This workflow is part of the n8n project and follows the same license.
