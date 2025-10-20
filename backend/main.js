const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const CARDS_PATH = path.join(__dirname, "data", "cards.json");
const PROFILE_PATH = path.join(__dirname, "data", "profile.json");

// HTTP Basic Auth middleware
const basicAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Mesto API"');
    return res.status(401).json({ error: "Требуется авторизация" });
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString(
    "ascii"
  );
  const [username, password] = credentials.split(":");

  // Простая проверка (в реальном проекте используйте хеширование паролей)
  if (username === "admin" && password === "password") {
    next();
  } else {
    res.setHeader("WWW-Authenticate", 'Basic realm="Mesto API"');
    return res.status(401).json({ error: "Неверные учетные данные" });
  }
};

// Применяем авторизацию ко всем роутам
app.use(basicAuth);

// Функции для работы с файлами
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

// API для карточек
// GET /cards - получить все карточки
app.get("/cards", async (req, res) => {
  const cards = await readFile(CARDS_PATH);
  if (cards === null) {
    return res.status(500).json({ error: "Ошибка чтения данных карточек" });
  }
  res.json(cards);
});

// POST /cards - добавить новую карточку
app.post("/cards", async (req, res) => {
  const { name, link } = req.body;

  if (!name || !link) {
    return res.status(400).json({ error: "Необходимы поля name и link" });
  }

  const cards = await readFile(CARDS_PATH);
  if (cards === null) {
    return res.status(500).json({ error: "Ошибка чтения данных карточек" });
  }

  const newCard = {
    id: Date.now().toString(),
    name,
    link,
    liked: false,
  };

  cards.push(newCard);

  if (await writeFile(CARDS_PATH, cards)) {
    res.status(201).json(newCard);
  } else {
    res.status(500).json({ error: "Ошибка сохранения карточки" });
  }
});

// DELETE /cards/:id - удалить карточку
app.delete("/cards/:id", async (req, res) => {
  const { id } = req.params;

  const cards = await readFile(CARDS_PATH);
  if (cards === null) {
    return res.status(500).json({ error: "Ошибка чтения данных карточек" });
  }

  const cardIndex = cards.findIndex((card) => card.id === id);
  if (cardIndex === -1) {
    return res.status(404).json({ error: "Карточка не найдена" });
  }

  cards.splice(cardIndex, 1);

  if (await writeFile(CARDS_PATH, cards)) {
    res.json({ message: "Карточка удалена" });
  } else {
    res.status(500).json({ error: "Ошибка удаления карточки" });
  }
});

// PUT /cards/:id/like - поставить/убрать лайк
app.put("/cards/:id/like", async (req, res) => {
  const { id } = req.params;

  const cards = await readFile(CARDS_PATH);
  if (cards === null) {
    return res.status(500).json({ error: "Ошибка чтения данных карточек" });
  }

  const card = cards.find((card) => card.id === id);
  if (!card) {
    return res.status(404).json({ error: "Карточка не найдена" });
  }

  card.liked = !card.liked;

  if (await writeFile(CARDS_PATH, cards)) {
    res.json(card);
  } else {
    res.status(500).json({ error: "Ошибка обновления лайка" });
  }
});

// API для профиля
// GET /profile - получить профиль
app.get("/profile", async (req, res) => {
  const profile = await readFile(PROFILE_PATH);
  if (profile === null) {
    return res.status(500).json({ error: "Ошибка чтения данных профиля" });
  }
  res.json(profile);
});

// PUT /profile - обновить профиль
app.put("/profile", async (req, res) => {
  const { name, profession } = req.body;

  if (!name || !profession) {
    return res.status(400).json({ error: "Необходимы поля name и profession" });
  }

  const updatedProfile = { name, profession };

  if (await writeFile(PROFILE_PATH, updatedProfile)) {
    res.json(updatedProfile);
  } else {
    res.status(500).json({ error: "Ошибка обновления профиля" });
  }
});

// Обработка несуществующих роутов
app.use("*", (req, res) => {
  res.status(404).json({ error: "Маршрут не найден" });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log("Для авторизации используйте: login: admin, password: password");
});

module.exports = app;
