$(document).ready(() => {
    // This file just does a GET request to figure out which user is logged in
    // and updates the HTML on the page
    const socket = io.connect();
    let userData = null;
    let firstName = null;
    $.get("/api/user_data").then(data => {
        userData = data;
        firstName = data?.firstName;
        if (firstName.length > 0) {
          firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
        }
      $(".member-greeting").text(`Welcome, ${firstName}!`);
  
      socket.emit("test msg", `${firstName} has logged in.`);
    });
  });
  
  
  