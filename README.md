# Remindify Channel

A web application that displays weather, EDB alerts, and air quality information for Hong Kong.

## Features
- **Tabbed Navigation**: Switch between Weather, EDB, and Air Quality views.
- **Dynamic Data**: Simulates fetching data from backend APIs with loading states.
- **Responsive Design**: Mobile-friendly layout using Tailwind CSS.
- **Faithful Recreation**: Visuals based on the Remindify Channel design.

## Technologies Used
- HTML5
- CSS3 (Custom styles and Tailwind CSS)
- JavaScript (ES6+, Vanilla JS)
- Tailwind CSS (via CDN)

## How to Run

### Method 1: Direct Open
1. Download or clone this repository.
2. Locate the `index.html` file in the project root.
3. Double-click `index.html` or right-click and select **Open with** > **Your Browser (Chrome, Firefox, Safari, etc.)**.

### Method 2: Local Server (Recommended)
Using a local server ensures all features work as expected and mimics a production environment.

#### Using Python
If you have Python installed, run the following command in the project directory:
```bash
# Python 3
python -m http.server 8000
```
Then open your browser and navigate to `http://localhost:8000`.

#### Using VS Code Live Server
If you use Visual Studio Code, you can install the **Live Server** extension and click **"Go Live"** in the status bar while having `index.html` open.

#### Using Node.js (npx)
```bash
npx serve .
```
Then navigate to the URL provided in the terminal (usually `http://localhost:3000`).

## Testing

The project uses Jest for unit testing and Playwright for visual snapshot testing.

### Run all tests
```bash
npm test
```

### Run Jest tests only
```bash
npm run test:jest
```

### Run Playwright tests only
```bash
npm run test:pw
```

### Update Playwright Snapshots
If the UI changes are intentional, update the baseline snapshots:
```bash
npx playwright test --update-snapshots
```

## Project Structure
- `index.html`: Main HTML structure.
- `style.css`: Custom CSS for specific components.
- `app.js`: Application logic and mock API implementation.
- `sample/`: Contains original design references.
