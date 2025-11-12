// main.js
import { getCards, addCard, deleteCard, toggleLike, getProfile, updateProfile } from "./api.js";

// ===== ЭЛЕМЕНТЫ =====
const popupAdd = document.querySelector('.popup_type_add');
const openAddButton = document.querySelector('.profile__add-button') || document.querySelector('.profile__add');
const closeAddButton = popupAdd ? popupAdd.querySelector('.popup__close') : null;
const addForm = popupAdd ? popupAdd.querySelector('.popup__form') : null;
const nameInput1 = popupAdd ? popupAdd.querySelector('input[name="name"]') : null;
const linkInput = popupAdd ? popupAdd.querySelector('input[name="link"]') : null;
const gallery = document.querySelector('.gallery');

// ===== ФУНКЦИИ ОТКРЫТИЯ / ЗАКРЫТИЯ =====
function openPopup(popup) { if (popup) popup.classList.add('popup_opened'); }
function closePopup(popup) { if (popup) popup.classList.remove('popup_opened'); }

// ===== СОЗДАНИЕ КАРТОЧКИ =====
// ВАЖНО: тут НЕ привязываем обработчики кликов — делегирование ниже обрабатывает лайк/удаление
function createCard(name, link, id, liked = false) {
  const card = document.createElement('article');
  card.classList.add('card');

  // если id пустой — временный, но лучше использовать id от сервера
  const effectiveId = id || `temp-${Date.now()}-${Math.floor(Math.random()*1000)}`;
  card.dataset.id = String(effectiveId);

  // Добавляем type="button" чтобы кнопки не были submit внутри форм
  card.innerHTML = `
    <img src="${link}" alt="${name}" class="card__image">
    <button type="button" class="card__delete" aria-label="Удалить карточку"></button>
    <div class="card__content">
      <h2 class="card__title">${name}</h2>
      <button type="button" class="card__like ${liked ? "card__like_active" : ""}"></button>
    </div>
  `;

  return card;
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
// Открытие/закрытие попапа добавления
openAddButton && openAddButton.addEventListener('click', () => openPopup(popupAdd));
closeAddButton && closeAddButton.addEventListener('click', () => closePopup(popupAdd));

// обработка формы добавления — ждём ответа сервера и используем возвращённые поля (id/_id)
if (addForm) {
  addForm.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    const name = nameInput1.value.trim();
    const link = linkInput.value.trim();
    if (!name || !link) return;

    try {
      const newCardFromServer = await addCard(name, link);
      // поддержка разных структур id: id / _id
      const id = newCardFromServer.id ?? newCardFromServer._id ?? '';
      const newCard = createCard(newCardFromServer.name ?? name, newCardFromServer.link ?? link, id, !!newCardFromServer.liked);
      // Добавляем в начало галереи
      gallery.prepend(newCard);
      addForm.reset();
      closePopup(popupAdd);
    } catch (err) {
      console.error('Ошибка при добавлении карточки:', err);
      alert('Не удалось добавить карточку. Проверь соединение с сервером.');
    }
  });
}

// ===== ДЕЛЕГИРОВАНИЕ (лайк / удаление) =====
// Вся логика лайка/удаления централизована здесь — избегаем дублирования обработчиков
gallery.addEventListener('click', (event) => {
  // Удаление карточки
  const del = event.target.closest('.card__delete');
  if (del) {
    event.preventDefault();
    event.stopPropagation();

    const cardEl = del.closest('.card');
    if (!cardEl) return;
    const cardId = cardEl.dataset.id;

    // Если есть id — пробуем удалить на сервере, затем из DOM
    if (cardId && !cardId.startsWith('temp-')) {
      deleteCard(cardId)
        .then(() => cardEl.remove())
        .catch(err => {
          console.error('Ошибка удаления (делегирование):', err);
          alert('Не удалось удалить карточку на сервере.');
        });
    } else {
      // временная карточка (её нет на сервере) — просто удаляем локально
      cardEl.remove();
    }
    return;
  }

  // Лайк карточки
  const like = event.target.closest('.card__like');
  if (like) {
    event.preventDefault();
    event.stopPropagation();

    const cardEl = like.closest('.card');
    if (!cardEl) return;
    const cardId = cardEl.dataset.id;

    // Новый визуальный статус (после клика)
    const willBeLiked = !like.classList.contains('card__like_active');
    // Меняем визуально сразу
    like.classList.toggle('card__like_active', willBeLiked);

    // Если нет id (временная карточка) — не отправляем на сервер
    if (!cardId || cardId.startsWith('temp-')) {
      return;
    }

    // Вызов API: при ошибке откатываем визуальную смену
    // ВАЖНО: некоторые реализации toggleLike ожидают параметр isLiked как текущий/предыдущий — 
    // в нашем api.js toggleLike(id, isLiked) реализован как: method = isLiked ? "DELETE" : "PUT"
    // Поэтому здесь вызываем с противоположным флагом от willBeLiked:
    // - if willBeLiked === true  -> we want PUT  -> call toggleLike(cardId, false)
    // - if willBeLiked === false -> we want DELETE -> call toggleLike(cardId, true)
    toggleLike(cardId, !willBeLiked).catch(err => {
      console.error('Ошибка toggleLike (делегирование):', err);
      // Откат визуального состояния при ошибке
      like.classList.toggle('card__like_active', !willBeLiked);
      alert('Не удалось изменить лайк на сервере.');
    });

    return;
  }
});

// ===== ЗАГРУЗКА КАРТОЧЕК =====
async function displayCards() {
  try {
    const cards = await getCards();
    if (!Array.isArray(cards)) {
      console.error('Ожидался массив карточек от сервера, получили:', cards);
      return;
    }
    gallery.innerHTML = ''; // очищаем перед добавлением
    cards.forEach(card => {
      const id = card.id ?? card._id ?? '';
      const cardEl = createCard(card.name, card.link, id, !!card.liked);
      gallery.prepend(cardEl);
    });
  } catch (err) {
    console.error('Ошибка при загрузке карточек:', err);
  }
}

displayCards();

// ===== ЭЛЕМЕНТЫ ПРОФИЛЯ (редактирование) =====
const editButton = document.querySelector('.profile__edit');
const popupEdit = document.querySelector('.popup_type_edit');
const closeEditButton = popupEdit ? popupEdit.querySelector('.popup__close') : null;
const editForm = popupEdit ? popupEdit.querySelector('.popup__form') : null;
// Обрати внимание: имя поля в форме должно совпадать с селектором ниже
const nameInput = editForm ? editForm.querySelector('input[name="name__person"]') : null;
const professionInput = editForm ? editForm.querySelector('input[name="profession"]') : null;
const profileTitle = document.querySelector('.profile__title');
const profileSubtitle = document.querySelector('.profile__subtitle');

// Открыть попап с текущими данными
if (editButton && popupEdit) {
  editButton.addEventListener('click', () => {
    if (!nameInput || !professionInput) return;
    nameInput.value = profileTitle?.textContent || "";
    professionInput.value = profileSubtitle?.textContent || "";
    popupEdit.classList.add('popup_opened');
  });
}

// Закрыть попап
if (closeEditButton && popupEdit) {
  closeEditButton.addEventListener('click', () => {
    popupEdit.classList.remove('popup_opened');
  });
}

// Сохранить изменения профиля (отправляем на сервер)
if (editForm) {
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const profession = professionInput.value.trim();
    if (!name || !profession) return;

    try {
      const updatedProfile = await updateProfile(name, profession);
      profileTitle.textContent = updatedProfile.name;
      profileSubtitle.textContent = updatedProfile.profession;
      popupEdit.classList.remove('popup_opened');
    } catch (err) {
      console.error("Ошибка при обновлении профиля:", err);
      alert("Не удалось сохранить изменения на сервере");
    }
  });
}

// Загрузка профиля при старте
async function loadProfile() {
  try {
    const profile = await getProfile();
    profileTitle.textContent = profile.name;
    profileSubtitle.textContent = profile.profession;
  } catch (err) {
    console.error("Ошибка при загрузке профиля:", err);
  }
}

loadProfile();

