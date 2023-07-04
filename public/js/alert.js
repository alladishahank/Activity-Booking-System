document.addEventListener('DOMContentLoaded', () => {
    const alert = document.querySelector('.alert');
    if (alert) {
      alert.addEventListener('click', () => {
        alert.style.display = 'none';
      });
    }
  });
  