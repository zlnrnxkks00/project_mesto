document.addEventListener('click', (event) => {
  if (event.target.classList.contains('card__delete')) {
    const card = event.target.closest('.card');
    card.remove();
  }
});
