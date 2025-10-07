// Логика для лайков
const likeButtons = document.querySelectorAll('.card__like');

likeButtons.forEach(button => {
  button.addEventListener('click', () => {
    button.classList.toggle('card__like_active');
  });
});

