// Requiring path
const path = require('path')

// Express, for hosting the website
const express = require("express");
const session = require("express-session");

// Requiring chatroom as we've configured it
const passport = require("./config/passport");
const app = express();

const formatMessage = require('./utils/messages');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');

// HTTP for hosting the socket.io connections
const server = require("http").createServer(app);
const io = require("socket.io")(server);

const PORT = process.env.PORT || 7070;


// Setting up port and requiring models for syncing
const db = require("./models");

let numUsers = 0;

const botName = "Babble Chat";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// We need to use sessions to keep track of our user's login status
app.use(
	session({
		secret: "keyboard cat",
		resave: true,
		saveUninitialized: true
	})
);
app.use(passport.initialize());
app.use(passport.session());

// Requiring our routes
require("./routes/html-routes.js")(app);
require("./routes/api-routes.js")(app);

app.get("/", ((req, res) => {
  res.sendFile(path.join(__dirname, "public/members.html"))
}));

// Creating express app and configuring middleware needed for authentication

// socket io hooks
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to BabbleChat!'));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

server.listen(PORT, () => {
	console.log(
		"==> 🌎  Listening on port %s. Visit http://localhost:%s/ in your browser.",
		PORT,
		PORT
	);
});

// Syncing our database and logging a message to the user upon success
