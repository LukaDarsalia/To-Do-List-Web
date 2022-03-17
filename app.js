require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const findOrCreate = require("mongoose-findorcreate");
const FacebookStrategy = require("passport-facebook").Strategy;
const htmlEntities = require("html-entities");
const _ = require("lodash");
const app = express();
const flash = require("connect-flash");
const port = process.env.PORT;
var jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = new JSDOM("").window;
global.document = document;
var $ = (jQuery = require("jquery")(window));
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const passportLocalMongoose = require("passport-local-mongoose");
let toDoItems = [];
let workItems = [];
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(
	session({
		secret: process.env.SECRET,
		resave: false,
		saveUninitialized: false,
		cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 },
	})
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
mongoose.connect(
	"mongodb+srv://admin-darsala:tavgasa2003@cluster0.md00x.mongodb.net/todolistDB",
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: false,
	}
);
mongoose.set("useCreateIndex", true);

// Datebase
const itemsSchema = new mongoose.Schema({
	name: String,
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const listSchema = new mongoose.Schema({
	name: String,
	items: [itemsSchema],
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const userSchema = new mongoose.Schema({
	username: { type: String, unique: true },
	password: String,
	darkMode: Boolean,
	provider: String,
	list: [listSchema],
	item: [itemsSchema],
});

userSchema.plugin(passportLocalMongoose, { usernameField: "username" });
userSchema.plugin(findOrCreate);
itemsSchema.plugin(encrypt, {
	secret: process.env.SECRET,
	encryptedFields: ["name"],
	requireAuthenticationCode: false,
});
listSchema.plugin(encrypt, {
	secret: process.env.SECRET,
	encryptedFields: ["name"],
	requireAuthenticationCode: false,
});

const User = new mongoose.model("User", userSchema);
const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

const item1 = new Item({
	name: "Welcome to you're to-do-list!",
});

const item2 = new Item({
	name: "Hit the + button to add a new item.",
});

const item3 = new Item({
	name: "<--- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.CLIENT_ID,
			clientSecret: process.env.CLIENT_SECRET,
			callbackURL:
				"https://infinite-taiga-13320.herokuapp.com/auth/google/todolist",
		},
		function (accessToken, refreshToken, profile, cb) {
			List.find({}, function (err, foundLists) {
				if (err) {
					console.log(err);
				} else {
					Item.find({}, function (e, foundItems) {
						if (e) {
							console.log(e);
						} else {
							User.findOrCreate(
								{ username: profile.id },
								{
									provider: "google",
									list: foundLists,
									item: foundItems,
									darkMode: false,
								},
								function (err, user) {
									return cb(err, user);
								}
							);
						}
					});
				}
			});
		}
	)
);

passport.use(
	new FacebookStrategy(
		{
			clientID: process.env.APP_ID,
			clientSecret: process.env.APP_SECRET,
			callbackURL:
				"https://infinite-taiga-13320.herokuapp.com/auth/facebook/todolist",
		},
		function (accessToken, refreshToken, profile, cb) {
			List.find({}, function (err, foundLists) {
				if (err) {
					console.log(err);
				} else {
					Item.find({}, function (e, foundItems) {
						if (e) {
							console.log(e);
						} else {
							User.findOrCreate(
								{ username: profile.id },
								{
									provider: "facebook",
									list: foundLists,
									item: foundItems,
									darkMode: false,
								},
								function (err, user) {
									return cb(err, user);
								}
							);
						}
					});
				}
			});
		}
	)
);

app
	.route("/auth/google")

	.get(
		passport.authenticate("google", {
			scope: ["profile"],
		})
	);

app.get("/auth/facebook", passport.authenticate("facebook"));

app.get(
	"/auth/facebook/todolist",
	passport.authenticate("facebook", { failureRedirect: "/login" }),
	function (req, res) {
		// Successful authentication, redirect home.
		res.redirect("/");
	}
);

app.get(
	"/auth/google/todolist",
	passport.authenticate("google", { failureRedirect: "/login" }),
	function (req, res) {
		// Successful authentication, redirect home.
		res.redirect("/");
	}
);

app.get("/Settings", function (req, res) {
	if (req.isAuthenticated()) {
		User.findOne({ _id: req.session.passport.user }, function (err, foundUser) {
			var darkMode = foundUser.darkMode;
			res.render("settings", { darkMode: darkMode });
		});
	} else {
		res.redirect("/login");
	}
});

app.get("/", function (req, res) {
	if (req.isAuthenticated()) {
		// console.log(req.session.passport.user);
		User.findOne({ _id: req.session.passport.user }, function (err, foundUser) {
			var userItem = foundUser.item;
			var darkMode = foundUser.darkMode;
			var userList = foundUser.list;
			// foundUser.item.forEach(function(single) {})
			toDoItems.push(userItem);
			if (userList.length === 0) {
				res.render("list", {
					listTitle: "Today",
					newItem: userItem,
					toDoList: "Today",
					darkMode: darkMode,
				});
			} else {
				res.render("list", {
					listTitle: "Today",
					newItem: userItem,
					toDoList: userList,
					darkMode: darkMode,
				});
			}
		});
	} else {
		res.redirect("/login");
	}
});

app.get("/register", function (req, res) {
	if (req.isAuthenticated()) {
		res.redirect("/");
	} else {
		if (_.isEmpty(req.flash())) {
			res.render("register");
		} else {
			res.render("register", { e: req.flash() });
		}
	}
});

app.post("/register", function (req, res) {
	List.find({}, function (err, foundLists) {
		if (err) {
			console.log(err);
			res.redirect("/register");
		} else {
			Item.find({}, function (err, foundItems) {
				if (err) {
					console.log(err);
					res.redirect("/register");
				} else {
					User.register(
						{
							username: req.body.username,
							list: foundLists,
							item: foundItems,
							darkMode: false,
							provider: "local",
						},
						req.body.password,
						function (err, user) {
							if (err) {
								console.log(err);
								req.flash("message", "Account already exist.");
								res.redirect("/register");
							} else {
								passport.authenticate("local")(req, res, function () {
									res.redirect("/");
								});
							}
						}
					);
				}
			});
		}
	});
});

app.get("/login", function (req, res) {
	if (req.isAuthenticated()) {
		res.redirect("/");
	} else {
		if (_.isEmpty(req.flash())) {
			res.render("login");
		} else {
			res.render("login", { e: req.flash() });
		}
	}
});

app.post(
	"/login",
	passport.authenticate("local", {
		successRedirect: "/",
		failureRedirect: "/login",
		failureFlash: "Invalid username or password.",
	}),
	function (req, res) {
		const user = new User({
			username: req.body.username,
			password: req.body.password,
		});
		req.login(user, function (err) {
			if (err) {
				console.log(err);
			} else {
				passport.authenticate("local")(req, res, function () {
					res.redirect("/");
				});
			}
		});
	}
);

app.get("/:customListName", function (req, res) {
	if (req.isAuthenticated()) {
		const customListName = _.capitalize(req.params.customListName);
		if (
			customListName !== "Settings" &&
			customListName !== "Redirect" &&
			customListName !== "Favicon.ico" &&
			customListName !== "login" &&
			customListName !== "register" &&
			customListName !== "deleteList"
		) {
			User.findOne(
				{ _id: req.session.passport.user },
				function (err, foundUser) {
					var userItem = foundUser.item;
					var userList = foundUser.list;
					var darkMode = foundUser.darkMode;
					if (!err) {
						var a = false;
						userList.forEach(function (singleList) {
							if (singleList.name === customListName) {
								a = true;
								res.render("list", {
									listTitle: singleList.name,
									newItem: singleList.items,
									toDoList: userList,
									darkMode: darkMode,
								});
							}
						});
						if (a === false) {
							const list = {
								name: customListName,
								items: defaultItems,
							};
							userList.push(list);
							foundUser.save();
							res.redirect("/" + customListName);
						}
					}
				}
			);
		}
	} else {
		res.redirect("/login");
	}
});

app.post("/", function (req, res) {
	const title = req.body.title;
	const itemName = req.body.toDoItem;
	if (
		itemName !== "" &&
		itemName !== defaultItems &&
		!toDoItems.includes(itemName)
	) {
		User.findOne({ _id: req.session.passport.user }, function (err, foundUser) {
			var userItem = foundUser.item;
			var userList = foundUser.list;
			const item = {
				name: itemName,
			};
			if (title === "Today") {
				userItem.push(item);
				foundUser.save();
				res.redirect("/");
			} else {
				userList.forEach(function (singleList) {
					if (singleList.name === title) {
						singleList.items.push(item);
						foundUser.save();
						res.redirect("/" + title);
					}
				});
			}
		});
	} else {
		res.redirect("/");
	}
});

app.post("/delete", function (req, res) {
	// let checkedItems = req.body.submitDeletion.split(',');
	const listName = req.body.listName;
	const checkedItems = req.body.checkbox;
	if (listName === "Today") {
		// checkedItems.forEach(function(item){
		// 	item = htmlEntities.decode(item);
		// 	Item.deleteOne({name: item}, function(err){
		// 		if(err){
		// 			console.log("Somethings wrong, I can feel it!");
		// 			console.log(err);
		// 		} else{
		// 			console.log("Items have successfully removed!");
		// 		}
		// 	});
		// });
		if (Array.isArray(checkedItems)) {
			User.findOne(
				{ _id: req.session.passport.user },
				function (err, foundUser) {
					checkedItems.forEach(function (item) {
						var userItem = foundUser.item;
						var userList = foundUser.list;
						userItem.forEach(function (singleItem) {
							if (singleItem._id == item) {
								const index = userItem.indexOf(singleItem);
								if (index > -1) {
									userItem.splice(index, 1);
								}
							}
						});
					});
					foundUser.save();
				}
			);
		} else {
			User.findOne(
				{ _id: req.session.passport.user },
				function (err, foundUser) {
					var userItem = foundUser.item;
					var userList = foundUser.list;
					userItem.forEach(function (singleItem) {
						if (singleItem._id == checkedItems) {
							const index = userItem.indexOf(singleItem);
							if (index > -1) {
								userItem.splice(index, 1);
							}
						}
					});
					foundUser.save();
				}
			);
		}
		res.redirect("/");
	} else {
		if (Array.isArray(checkedItems)) {
			User.findOne(
				{ _id: req.session.passport.user },
				function (err, foundUser) {
					checkedItems.forEach(function (item) {
						var userItem = foundUser.item;
						var userList = foundUser.list;
						userList.forEach(function (singleList) {
							if (singleList.name == listName) {
								singleList.items.forEach(function (singleItem) {
									if (singleItem._id == item) {
										const index = singleList.items.indexOf(singleItem);
										if (index > -1) {
											singleList.items.splice(index, 1);
										}
									}
								});
							}
						});
					});
					foundUser.save();
				}
			);
		} else {
			User.findOne(
				{ _id: req.session.passport.user },
				function (err, foundUser) {
					var userItem = foundUser.item;
					var userList = foundUser.list;
					userList.forEach(function (singleList) {
						if (singleList.name === listName) {
							singleList.items.forEach(function (singleItem) {
								if (singleItem._id == checkedItems) {
									const index = singleList.items.indexOf(singleItem);
									if (index > -1) {
										singleList.items.splice(index, 1);
									}
								}
							});
						}
					});
					foundUser.save();
				}
			);
		}
		res.redirect("/" + listName);
	}
});

app.post("/Redirect", function (req, res) {
	if (req.body.checkedCondition === "true") {
		User.findOneAndUpdate(
			{ _id: req.session.passport.user },
			{ darkMode: true },
			function (err, obj) {
				if (err) {
					console.log(err);
				}
			}
		);
		res.redirect("/");
	} else {
		User.findOneAndUpdate(
			{ _id: req.session.passport.user },
			{ darkMode: false },
			function (err, obj) {
				if (err) {
					console.log(err);
				}
			}
		);
		res.redirect("/");
	}
});

app.post("/deleteList", function (req, res) {
	const name = req.body.currentList;
	var nameDirect = req.body.listName;

	User.findOne({ _id: req.session.passport.user }, function (err, foundUser) {
		var userItem = foundUser.item;
		var userList = foundUser.list;
		userList.forEach(function (singleList) {
			if (singleList._id == name) {
				const index = userList.indexOf(singleList);
				if (index > -1) {
					userList.splice(index, 1);
				}
			}
		});
		foundUser.save();
	});

	res.redirect("/");
});

app.post("/logout", function (req, res) {
	req.logout();
	req.session.destroy();
	res.redirect("/login");
});

app.listen(port, function () {
	console.log("Server has started successfully.");
});
