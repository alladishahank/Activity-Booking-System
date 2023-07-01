function createAlert(msg) {
    return `<div class="alert alert-danger" role="alert">${msg}</div>`;
  }
  
  document.addEventListener('DOMContentLoaded', function() {
    const alertElement = document.getElementById('alert');
    if (alertElement) {
      const message = alertElement.getAttribute('data-message');
      const alertHTML = createAlert(message);
      alertElement.innerHTML = alertHTML;
    }
  });
  