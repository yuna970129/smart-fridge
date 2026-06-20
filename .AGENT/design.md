## Build a React frontend for "Fridge AI" app with the following design specifications:

### COLOR PALETTE

Use these calming, warm colors:

- Primary Accent: #E8C47E (warm beige/gold)
- Secondary: #B6C3A2 (soft sage green)
- Light Mint: #C5E1DE (cool mint)
- Very Light Teal: #D8EDE7 (subtle teal)
- Background: #E6F4F1 (very pale mint - almost white)

Feel free to adjust slight variations if needed, but maintain this warm + cool + natural aesthetic.

### DESIGN STYLE

- **Overall Tone**: Calm, minimalist, welcoming
- **Aesthetic**: Clean, intuitive, premium feel (like iPhone glass morphism)
- **Vibe**: Soothing + Easy to use
- **Material**: Frosted glass effect with soft shadows

### KEY DESIGN ELEMENTS

**1. Home Screen**

- Large, readable buttons
- Soft rounded corners (border-radius: 20px+)
- Subtle shadow under buttons
- Plenty of white space

**2. List Items (Especially Fridge Inventory)**

- Use glassmorphism: semi-transparent backgrounds with slight blur
- Each ingredient card should have:
    - Emoji clearly visible
    - Item name in readable font
    - Delete button (trash icon) with subtle hover effect
    - Soft background color (#D8EDE7 or #C5E1DE)
    - Gentle shadow for depth

**3. Input/Upload Areas**

- "Choose File" button: Use #E8C47E for focus/hover states
- File upload zone: Light background with dashed border
- Loading states: Smooth animations with muted colors

**4. Confirmation Screens**

- Checklist items with radio buttons or toggle switches
- Clear visual distinction between "Still have" and "Used all" states
- Soft color transitions

**5. General Rules**

- No harsh blacks - use dark grays (#333 or similar)
- Buttons: Rounded, with color from palette
- Spacing: Generous padding (16px+)
- Typography: Clean, readable (16px minimum for body text)
- Transitions: Smooth, 300ms ease
- Shadows: Soft and subtle, not harsh

### FUNCTIONAL REQUIREMENTS

- File upload for receipt & dish photos
- Button states: Default, Hover, Active, Disabled
- Responsive design (works on mobile & desktop)
- Simple loading spinners
- Error messages in non-alarming colors

### SCREENS TO BUILD

1. Home Screen (3 buttons)
2. Scan Receipt: Upload → Loading → Results (list of ingredients)
3. Check Dish: Upload → Loading → Checklist
4. My Fridge: Ingredient list with delete buttons

### CODE FRAMEWORK

- React with Tailwind CSS (or styled-components)
- Glassmorphism using CSS:
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(10px);
- Mobile-first responsive design

### TONE SUMMARY

Think of it like opening a calm, luxurious app on an iPhone. Not loud, not harsh. Warm, inviting, smart.