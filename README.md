# 🖥️ Kiosek

Kiosek project using Node.js, TypeScript and Next.js.

---

## 🛠️ Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14 or later recommended)
- npm (comes bundled with Node.js)
- Setut uped [backend service](https://github.com/JackReaperCZ/kiosek-backend)


## 📦 Setup Instructions

Follow these steps to set up and run the project locally.

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/JackReaperCZ/kiosek.git
cd kiosek
```

### 2️⃣ Install Dependencies

```bash
npm install
```

## ⚙️ Configuration
4️⃣ Edit config.ts
Update `app/utils/config.ts` with your backend service address:

```javascript
export const config = {
    apiUrl: "http://ĺocalhost:5148",
}
```

### 🏗️ Build Project
Builds the project to the `./dist` folder:

```bash
npm run build
```

### 🚀 Start Project
Run the backend server:

```bash
npm start
```
