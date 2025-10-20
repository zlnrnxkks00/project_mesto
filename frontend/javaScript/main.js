// ===== ЭЛЕМЕНТЫ =====
const popupAdd = document.querySelector('.popup_type_add'); // сам попап
const openAddButton = document.querySelector('.profile__add-button'); // кнопка "+"
const closeAddButton = popupAdd.querySelector('.popup__close'); // крестик
const addForm = popupAdd.querySelector('.popup__form'); // форма в попапе
const nameInput1 = popupAdd.querySelector('input[name="name"]'); // поле названия
const linkInput = popupAdd.querySelector('input[name="link"]'); // поле ссылки
const gallery = document.querySelector('.gallery'); // контейнер для карточек

// ===== ФУНКЦИИ ОТКРЫТИЯ / ЗАКРЫТИЯ =====
function openPopup(popup) {
  popup.classList.add('popup_opened');
}

function closePopup(popup) {
  popup.classList.remove('popup_opened');
}

// ===== СОЗДАНИЕ КАРТОЧКИ =====
function createCard(name, link) {
  const card = document.createElement('article');
  card.classList.add('card');

  card.innerHTML = `
    <img src="${link}" alt="${name}" class="card__image">
    <div class="card__content">
      <h2 class="card__title">${name}</h2>
      <button class="card__like"></button>
    </div>
  `;

  // логика лайка
  const likeButton = card.querySelector('.card__like');
  likeButton.addEventListener('click', () => {
    likeButton.classList.toggle('card__like_active');
  });

  return card;
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====

// открытие попапа при клике на "+"
openAddButton.addEventListener('click', () => openPopup(popupAdd));

// закрытие попапа при клике на крестик
closeAddButton.addEventListener('click', () => closePopup(popupAdd));

// обработка формы
addForm.addEventListener('submit', (evt) => {
  evt.preventDefault(); // отменяем перезагрузку страницы

  const name = nameInput1.value.trim();
  const link = linkInput.value.trim();

  if (!name || !link) return; // если поля пустые, ничего не делаем

  const newCard = createCard(name, link);

  // добавляем новую карточку в начало галереи
  gallery.prepend(newCard);

  // очищаем поля формы
  addForm.reset();

  // закрываем попап
  closePopup(popupAdd);
});





