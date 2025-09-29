const editButton = document.querySelector('.profile__edit');
const popup = document.querySelector('.popup_type_edit');
const closeButton = document.querySelector('.popup__close');
const form = document.querySelector('.popup__form');
const nameInput = form.querySelector('input[name="name"]');
const jobInput = form.querySelector('input[name="job"]');
const profileTitle = document.querySelector('.profile__title');
const profileSubtitle = document.querySelector('.profile__subtitle');

// открытие попапа
editButton.addEventListener('click', () => {
  nameInput.value = profileTitle.textContent;
  jobInput.value = profileSubtitle.textContent;
  popup.classList.add('popup_opened');
});

// закрытие попапа
closeButton.addEventListener('click', () => {
  popup.classList.remove('popup_opened');
});

// сохранение данных профиля
form.addEventListener('submit', (e) => {
  e.preventDefault();

  profileTitle.textContent = nameInput.value;
  profileSubtitle.textContent = jobInput.value;

  popup.classList.remove('popup_opened');
});

