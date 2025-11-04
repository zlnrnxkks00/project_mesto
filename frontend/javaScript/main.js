// main.js
import { getCards, addCard, deleteCard, toggleLike, getProfile, updateProfile } from "./api.js";

// ===== ЭЛЕМЕНТЫ =====
const popupAdd = document.querySelector('.popup_type_add');
const openAddButton = document.querySelector('.profile__add-button') || document.querySelector('.profile__add');
const closeAddButton = popupAdd.querySelector('.popup__close');
const addForm = popupAdd.querySelector('.popup__form');
const nameInput1 = popupAdd.querySelector('input[name="name"]');
const linkInput = popupAdd.querySelector('input[name="link"]');
const gallery = document.querySelector('.gallery');

// ===== ФУНКЦИИ ОТКРЫТИЯ / ЗАКРЫТИЯ =====
function openPopup(popup) { popup.classList.add('popup_opened'); }
function closePopup(popup) { popup.classList.remove('popup_opened'); }

// ===== СОЗДАНИЕ КАРТОЧКИ (заменить существующую) =====
function createCard(name, link, id, liked = false) {
  const card = document.createElement('article');
  card.classList.add('card');

  // если id пустой, создаём временный (чтобы localStorage работал)
  const effectiveId = id || `temp-${Date.now()}-${Math.floor(Math.random()*1000)}`;
  card.dataset.id = String(effectiveId);

  card.innerHTML = `
    <img src="${link}" alt="${name}" class="card__image">
    <button class="card__delete" aria-label="Удалить карточку"></button>
    <div class="card__content">
      <h2 class="card__title">${name}</h2>
      <button class="card__like ${liked ? "card__like_active" : ""}"></button>
    </div>
  `;

  // ЛАЙК — переключаем визуал + сохраняем в localStorage
  const likeBtn = card.querySelector('.card__like');
  likeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    likeBtn.classList.toggle('card__like_active');
    saveLikes(); // сохраняем актуальные лайки
  });

  // УДАЛЕНИЕ — сначала пытаемся сервер (если есть), иначе просто удаляем DOM и localStorage обновляем
  const deleteBtn = card.querySelector('.card__delete');
  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const cardId = card.dataset.id;
    // если у тебя есть deleteCard (server), попытаемся вызвать; если нет — просто удалим
    try {
      if (typeof deleteCard === 'function') {
        await deleteCard(cardId).catch(() => {}); // игнорим ошибку сервера
      }
    } catch (err) {
      // игнор
    }
    card.remove();
    saveLikes(); // обновляем localStorage (удалили карточку)
  });

  return card;
}


// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
openAddButton && openAddButton.addEventListener('click', () => openPopup(popupAdd));
closeAddButton && closeAddButton.addEventListener('click', () => closePopup(popupAdd));

// обработка формы добавления — ждём ответа сервера и используем возвращённые поля (id/_id)
addForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  const name = nameInput1.value.trim();
  const link = linkInput.value.trim();
  if (!name || !link) return;

  try {
    const newCardFromServer = await addCard(name, link);
    // поддержка разных структур id: newCardFromServer.id или newCardFromServer._id
    const id = newCardFromServer.id ?? newCardFromServer._id ?? newCardFromServer._idString ?? '';
    const newCard = createCard(newCardFromServer.name ?? name, newCardFromServer.link ?? link, id, newCardFromServer.liked);
    gallery.prepend(newCard);
    addForm.reset();
    closePopup(popupAdd);
  } catch (err) {
    console.error('Ошибка при добавлении карточки:', err);
    alert('Не удалось добавить карточку. Проверь соединение с сервером.');
  }
});

// делегирование на случай, если на странице уже есть карточки без слушателей
// (удаление/лайк через делегирование — fallback, основная логика уже привязана при создании)
gallery.addEventListener('click', (event) => {
  // если клик на делегируемой кнопке удаления
  const del = event.target.closest('.card__delete');
  if (del) {
    const cardEl = del.closest('.card');
    if (!cardEl) return;
    const cardId = cardEl.dataset.id;
    if (!cardId) { cardEl.remove(); return; }
    // вызываем deleteCard и удаляем DOM только после успешного ответа
    deleteCard(cardId)
      .then(() => cardEl.remove())
      .catch(err => {
        console.error('Ошибка удаления (делегирование):', err);
        alert('Не удалось удалить карточку на сервере.');
      });
    return;
  }

  // клик на лайк (делегирование) — синхронизируем визуал и сервер
  const like = event.target.closest('.card__like');
  if (like) {
    const cardEl = like.closest('.card');
    if (!cardEl) return;
    const cardId = cardEl.dataset.id;
    const willBeLiked = !like.classList.contains('card__like_active');
    like.classList.toggle('card__like_active', willBeLiked);
    if (!cardId) return;
    toggleLike(cardId, !willBeLiked).catch(err => { // попытка синхронно откатить в случае ошибки
      console.error('Ошибка toggleLike (делегирование):', err);
      like.classList.toggle('card__like_active', !willBeLiked);
    });
    
    saveLikes();

  }
});

// ===== ЗАГРУЗКА КАРТОЧЕК (заменить существующую функцию) =====
async function displayCards() {
  try {
    const cards = await getCards();
    if (!Array.isArray(cards)) {
      console.error('Ожидался массив карточек от сервера, получили:', cards);
      return;
    }
    gallery.innerHTML = ''; // очищаем перед добавлением
    cards.forEach(card => {
      const id = card.id ?? card._id ?? card._idString ?? '';
      const cardEl = createCard(card.name, card.link, id, !!card.liked);
      gallery.prepend(cardEl);
    });
    // Восстанавливаем лайки из localStorage (после того как все карточки вставлены)
    restoreLikes();
  } catch (err) {
    console.error('Ошибка при загрузке карточек:', err);
  }
}


// ===== localStorage: сохранить и восстановить лайки =====
function saveLikes() {
  try {
    const likedIds = Array.from(document.querySelectorAll('.card__like.card__like_active'))
      .map(btn => btn.closest('.card')?.dataset.id)
      .filter(Boolean);
    localStorage.setItem('likedCards', JSON.stringify(likedIds));
  } catch (err) {
    console.error('saveLikes error', err);
  }
}

function restoreLikes() {
  try {
    const likedIds = JSON.parse(localStorage.getItem('likedCards') || "[]");
    if (!Array.isArray(likedIds)) return;
    likedIds.forEach(id => {
      const card = document.querySelector(`.card[data-id="${id}"]`);
      if (card) {
        const likeBtn = card.querySelector('.card__like');
        if (likeBtn) likeBtn.classList.add('card__like_active');
      }
    });
  } catch (err) {
    console.error('restoreLikes error', err);
  }
}


displayCards();

// === ЭЛЕМЕНТЫ ПРОФИЛЯ ===
const editButton = document.querySelector('.profile__edit');
const popupEdit = document.querySelector('.popup_type_edit');
const closeEditButton = popupEdit?.querySelector('.popup__close');
const editForm = popupEdit?.querySelector('.popup__form');
const nameInput = editForm?.querySelector('input[name="name__person"]');
const professionInput = editForm?.querySelector('input[name="profession"]');
const profileTitle = document.querySelector('.profile__title');
const profileSubtitle = document.querySelector('.profile__subtitle');

// === Открыть попап с текущими данными ===
if (editButton && popupEdit) {
  editButton.addEventListener('click', () => {
    if (!nameInput || !professionInput) return;
    nameInput.value = profileTitle?.textContent || "";
    professionInput.value = profileSubtitle?.textContent || "";
    popupEdit.classList.add('popup_opened');
  });
}

// === Закрыть попап ===
if (closeEditButton && popupEdit) {
  closeEditButton.addEventListener('click', () => {
    popupEdit.classList.remove('popup_opened');
  });
}

// === Сохранить изменения профиля ===
if (editForm) {
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const profession = professionInput.value.trim();
    if (!name || !profession) return;

    try {
      // обновляем профиль на сервере
      const updatedProfile = await updateProfile(name, profession);

      // обновляем DOM
      profileTitle.textContent = updatedProfile.name;
      profileSubtitle.textContent = updatedProfile.profession;

      popupEdit.classList.remove('popup_opened');
    } catch (err) {
      console.error("Ошибка при обновлении профиля:", err);
      alert("Не удалось сохранить изменения на сервере");
    }
  });
}

// === Загрузка профиля при старте ===
async function loadProfile() {
  try {
    const profile = await getProfile();
    profileTitle.textContent = profile.name;
    profileSubtitle.textContent = profile.profession;
  } catch (err) {
    console.error("Ошибка при загрузке профиля:", err);
  }
}

// Загружаем профиль при открытии страницы
loadProfile();


