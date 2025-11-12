const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// === Настройка CORS ===
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Обработка preflight (OPTIONS)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// === Пути к данным ===
const CARDS_PATH = path.join(__dirname, "data", "cards.json");
const PROFILE_PATH = path.join(__dirname, "data", "profile.json");

// === Простая авторизация ===
const basicAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Mesto API"');
    return res.status(401).json({ error: "Требуется авторизация" });
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
  const [username, password] = credentials.split(":");

  if (username === "admin" && password === "password") {
    next();
  } else {
    res.setHeader("WWW-Authenticate", 'Basic realm="Mesto API"');
    return res.status(401).json({ error: "Неверные учетные данные" });
  }
};

// === Применяем авторизацию ===
app.use(basicAuth);

// === Утилиты чтения/записи ===
const readFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Ошибка чтения файла ${filePath}:`, error);
    return null;
  }
};

const writeFile = async (filePath, data) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Ошибка записи в файл ${filePath}:`, error);
    return false;
  }
};

// === API карточек ===

// GET /cards
app.get("/cards", async (req, res) => {
  const cards = await readFile(CARDS_PATH);
  if (!cards) return res.status(500).json({ error: "Ошибка чтения карточек" });
  res.json(cards);
});

// POST /cards
app.post("/cards", async (req, res) => {
  const { name, link } = req.body;
  if (!name || !link)
    return res.status(400).json({ error: "Необходимы поля name и link" });

  const cards = await readFile(CARDS_PATH) || [];
  const newCard = { id: Date.now().toString(), name, link, liked: false };
  cards.push(newCard);

  if (await writeFile(CARDS_PATH, cards)) {
    res.status(201).json(newCard);
  } else {
    res.status(500).json({ error: "Ошибка сохранения карточки" });
  }
});

// DELETE /cards/:id
app.delete("/cards/:id", async (req, res) => {
  const { id } = req.params;
  const cards = await readFile(CARDS_PATH);
  if (!cards) return res.status(500).json({ error: "Ошибка чтения карточек" });

  const newCards = cards.filter((c) => c.id !== id);
  if (newCards.length === cards.length)
    return res.status(404).json({ error: "Карточка не найдена" });

  if (await writeFile(CARDS_PATH, newCards)) {
    res.json({ message: "Карточка удалена" });
  } else {
    res.status(500).json({ error: "Ошибка удаления карточки" });
  }
});

// PUT /cards/:id/likes (лайк)
app.put("/cards/:id/likes", async (req, res) => {
  const { id } = req.params;
  const cards = await readFile(CARDS_PATH);
  if (!cards) return res.status(500).json({ error: "Ошибка чтения карточек" });

  const card = cards.find((c) => c.id === id);
  if (!card) return res.status(404).json({ error: "Карточка не найдена" });

  card.liked = true;
  await writeFile(CARDS_PATH, cards);
  res.json(card);
});

// DELETE /cards/:id/likes (дизлайк)
app.delete("/cards/:id/likes", async (req, res) => {
  const { id } = req.params;
  const cards = await readFile(CARDS_PATH);
  if (!cards) return res.status(500).json({ error: "Ошибка чтения карточек" });

  const card = cards.find((c) => c.id === id);
  if (!card) return res.status(404).json({ error: "Карточка не найдена" });

  card.liked = false;
  await writeFile(CARDS_PATH, cards);
  res.json(card);
});


// GET /profile
app.get("/profile", async (req, res) => {
  const profile = await readFile(PROFILE_PATH);
  if (!profile) return res.status(500).json({ error: "Ошибка чтения профиля" });
  res.json(profile);
});

// PUT /profile
app.put("/profile", async (req, res) => {
  const { name, profession } = req.body;
  if (!name || !profession)
    return res.status(400).json({ error: "Необходимы поля name и profession" });

  const updatedProfile = { name, profession };
  if (await writeFile(PROFILE_PATH, updatedProfile)) {
    res.json(updatedProfile);
  } else {
    res.status(500).json({ error: "Ошибка обновления профиля" });
  }
});

// === Ошибки ===
app.use("*", (req, res) => {
  res.status(404).json({ error: "Маршрут не найден" });
});

// === Запуск ===
app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
  console.log(" Логин: admin  Пароль: password");
});

module.exports = app;
