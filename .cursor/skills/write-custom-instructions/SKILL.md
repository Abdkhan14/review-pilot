---
name: write-custom-instructions
description: Generates customInstructions (shop notes) for a review-pilot business in the parser format. Use when the user asks to write, generate, or rewrite shop notes, custom instructions, or catalog items for a business. Produces a paste-ready string with optional prose, # Group headings, and - item lines that each include a short parenthetical description.
---

# Write Custom Instructions

Generates a paste-ready `customInstructions` string for a review-pilot business.

## Format rules

The server parser expects exactly this shape. The whole bullet is the item, so the description stays on that line in parentheses.

```
<optional prose lines — override guidance>

# Group Label
- Item Name (short description)
- Item Name (short description)

# Group Label
- Item Name (short description)
```

- **Prose:** any line that is not a heading or bullet. Carries override guidance ("Always mention the open kitchen", "Don't talk about wait times").
- **Group headings:** `# Label` — real categories (Mains / Sides / Drinks, Cut / Color / Add-ons). The sampler spreads picks across groups.
- **Items:** lines starting with `- `. Name first, then a short parenthetical description. Do **not** use `*`, `|`, or a full sentence for the line.
- **No item in prose:** do not repeat catalog items as prose sentences. A description in prose is sent with every draft and leaks the rest of the menu. On the bullet, it travels only with the item that gets picked.

## Descriptions

Add a small description for every item, from what that item actually is.

- A few words in parentheses. Enough that a review can name the dish or service without reading like a menu blurb.
- Use a real detail from the business when you have one. Otherwise infer a plain description from the item name. Do not invent staff names, prices, or claims you do not have.
- Keep the name itself a name. The description is the parenthetical, not a second sentence.

## How to produce output

1. Ask for (or infer from context): business name, type, offerings list, any hard constraints (never mention X, staff names, tone).
2. Group offerings into real categories. Aim for **9 or more items total** so random picks vary across refreshes.
3. Add a short parenthetical description on every item line.
4. Write prose only for genuine override guidance. Leave it out if there is none.
5. Emit a single fenced code block so the user can copy-paste directly into the admin textarea.

## Output template

```
<prose override guidance if any>

# <Category>
- <Item> (<short description>)
- <Item> (<short description>)

# <Category>
- <Item> (<short description>)
```

For examples of restaurant, salon, and generic outputs, see [examples.md](examples.md).
