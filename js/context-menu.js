const dotsIcons = document.querySelectorAll(".dots-svg");

dotsIcons.forEach((dotsIcon) => {
    dotsIcon.addEventListener("click", (event) => {
        const row = event.target.closest("tr");
        const contextMenu = document.querySelector("#context-menu");
        const rect = row.getBoundingClientRect();
        contextMenu.style.position = "absolute";
        contextMenu.style.top = rect.top + "px";
        contextMenu.style.left = rect.right + "px";
        contextMenu.style.display = "block";
        event.stopPropagation(); 
    });
});

window.addEventListener("click", (event) => {
    const contextMenu = document.querySelector("#context-menu");
    if (!event.target.closest("#context-menu")) {
        contextMenu.style.display = "none";
    }
});

const profileIcon = document.querySelectorAll(".profile-button");

profileIcon.forEach((profileIcon) => {
    profileIcon.addEventListener("click", (event) => {
        const row = event.target.closest("tr");
        const contextMenu = document.querySelector("#context-menu");
        const rect = row.getBoundingClientRect();
        contextMenu.style.position = "absolute";
        contextMenu.style.top = rect.top + "px";
        contextMenu.style.left = rect.right + "px";
        contextMenu.style.display = "block";
        event.stopPropagation(); 
    });
});