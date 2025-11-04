// api.js
const BACKEND_URL = "http://localhost:5000";
const AUTH_HEADER = {
  "Authorization": "Basic " + btoa("admin:password"),
  "Content-Type": "application/json"
};

// Получить карточки
export async function getCards() {
  const response = await fetch(`${BACKEND_URL}/cards`, {
    headers: AUTH_HEADER
  });

  if (!response.ok) throw new Error("Ошибка загрузки карточек");
  return response.json();
}

// Создать карточку
export async function addCard(name, link) {
  const response = await fetch(`${BACKEND_URL}/cards`, {
    method: "POST",
    headers: AUTH_HEADER,
    body: JSON.stringify({ name, link })
  });

  if (!response.ok) throw new Error("Ошибка добавления карточки");
  return response.json();
}

// Удалить карточку
export async function deleteCard(id) {
  const response = await fetch(`${BACKEND_URL}/cards/${id}`, {
    method: "DELETE",
    headers: AUTH_HEADER
  });

  if (!response.ok) throw new Error("Ошибка удаления карточки");
  return response.json();
}

// Лайк / дизлайк
// === ЛАЙК КАРТОЧКИ ===

export async function toggleLike(id, isLiked) {
  const response = await fetch(`${BACKEND_URL}/cards/${id}/likes`, {
    method: isLiked ? "PUT" : "DELETE",
    headers: AUTH_HEADER
  });

  if (!response.ok) throw new Error("Ошибка лайка");
  return response.json();
}

// === Получить профиль ===
export async function getProfile() {
  const response = await fetch(`${BACKEND_URL}/profile`, {
    headers: AUTH_HEADER
  });
  if (!response.ok) throw new Error("Ошибка при получении профиля");
  return response.json();
}

// === Обновить профиль ===
export async function updateProfile(name, profession) {
  const response = await fetch(`${BACKEND_URL}/profile`, {
    method: "PUT",
    headers: AUTH_HEADER,
    body: JSON.stringify({ name, profession })
  });
  if (!response.ok) throw new Error("Ошибка при обновлении профиля");
  return response.json();
}



