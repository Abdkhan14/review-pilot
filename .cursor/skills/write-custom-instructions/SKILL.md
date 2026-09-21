---
name: write-custom-instructions
description: Generates customInstructions (shop notes) for a review-pilot business in the parser format. Use when the user asks to write, generate, or rewrite shop notes, custom instructions, or catalog items for a business. Produces a paste-ready string with optional prose, # Group headings, and - item lines.
---

# Write Custom Instructions

Generates a paste-ready `customInstructions` string for a review-pilot business.

## Format rules

The server parser expects exactly this shape:

```
<optional prose lines — override guidance>

# Group Label
- Item Name
- Item Name

# Group Label
- Item Name
```

- **Prose:** any line that is not a heading or bullet. Carries override guidance ("Always mention the open kitchen", "Don't talk about wait times").
- **Group headings:** `# Label` — real categories (Mains / Sides / Drinks, Cut / Color / Add-ons). The sampler spreads picks across groups.
- **Items:** lines starting with `- `. Do **not** use `*`, commas, `|`, or prose sentences for items.
- **No item in prose:** do not repeat catalog items as prose sentences.

## How to produce output

1. Ask for (or infer from context): business name, type, offerings list, any hard constraints (never mention X, staff names, tone).
2. Group offerings into real categories. Aim for **9 or more items total** so random picks vary across refreshes.
3. Write prose only for genuine override guidance. Leave it out if there is none.
4. Emit a single fenced code block so the user can copy-paste directly into the admin textarea.

## Output template

```
<prose override guidance if any>

# <Category>
- <Item>
- <Item>

# <Category>
- <Item>
```

For examples of restaurant, salon, and generic outputs, see [examples.md](examples.md).
