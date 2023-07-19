function changeTimings() {
    const startTimeDropdown = document.getElementById('startTime');
    const endTimeDropdown = document.getElementById('endTime');
    const startTime = startTimeDropdown.value;
    const startHour = parseInt(startTime.split(':')[0]);
  
    endTimeDropdown.innerHTML = '';
  
    for (let i = startHour + 1; i <= 20; i++) {
      const option = document.createElement('option');
      const endTime = i.toString().concat(':30');
      option.value = endTime;
      option.textContent = endTime;
      endTimeDropdown.appendChild(option);
    }
  }
  
  const startTimeDropdown = document.getElementById('startTime');
  startTimeDropdown.addEventListener('change', changeTimings);
  