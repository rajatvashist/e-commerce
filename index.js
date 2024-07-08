const express = require("express");
const cors = require("cors");
const session = require("express-session");
const app = express();
const PORT = 3000;
const bodyparser = require("body-parser");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const path = require("path");
const myModelUser = require("./models/users");
const admin = require("./models/admins");
const myproduct = require("./models/products");
const mycart = require("./models/carts");
const mongoose = require("mongoose");
const multer = require("multer");
const multerupload = require("./models/multers");

mongoose.connect(
  "mongodb+srv://root:root-root@admin.h2liac0.mongodb.net/ecommerce"
);
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function callback() {
  console.log("db connection successful");
});

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.static("public"));
app.use(express.static("uploads"));
app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
app.use(cors());

app.use(
  session({
    secret: "2C44-4D44-WppQ38S",
    resave: true,
    saveUninitialized: true,
  })
);

// Authentication and Authorization Middleware
var auth = function (req, res, next) {
  if (req.session && "user" in req.session) return next();
  else if (req.session && req.session.changepassword) return next();
  else res.redirect("/login");
};
var authn = function (req, res, next) {
  if (req.session && "users" in req.session) return next();
  else if (req.session && req.session.changepassword) return next();
  else res.redirect("/login_page");
};

app.use(function (req, res, next) {
  res.locals.idu = req.session.user;
  next();
});

app.use(function (req, res, next) {
  res.locals.ide = req.session.users;
  next();
});

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/product", (req, res) => {
  myproduct.find().then((d) => {
    res.render("product", { d });
  });
});

app.get("/product/:id", (req, res) => {
  const id = req.params.id;
  let totals = 0;
  let price = 0;
  myproduct
    .findById(id)

    .then((d) => {
      // price = d.productprice;
      mycart.findOne({ id: res.locals.ide }).then((dd) => {
        // let k = price;
        if (dd !== null) {
          // totals = dd.Total;
          mycart
            .findOneAndUpdate(
              { _id: dd._id },
              {
                $push: {
                  product: [
                    {
                      productname: d.productname,
                      productprice: d.productprice,
                      productimage: d.productimage,
                    },
                  ],
                },
              }
            )
            .then((g) => {
              // mycart
              //   .findOneAndUpdate(
              //     { _id: dd._id },
              //     {
              //       Total: totals + k,
              //     }
              //   )
              //   .then((da) => {
              //     // console.log(da);
              //   });
            });
        } else {
          const b = new mycart({
            id: res.locals.ide,

            product: [
              {
                productname: d.productname,
                productprice: d.productprice,
                productimage: d.productimage,
              },
            ],
            // Total: k,
          });
          b.save();
        }
        return res.redirect("/cart");
      });
    });
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/testimonial", (req, res) => {
  res.render("testimonial");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.get("/cart", authn, (req, res) => {
  mycart.findOne({ id: res.locals.ide }).then((d) => {
    res.render("cart", { d });
  });
});

app.get("/removeproduct/:uid", async (req, res) => {
  console.log(req.session.users);

  await mycart
    .findOneAndUpdate(
      { id: req.session.users },
      {
        $pull: {
          product: { _id: req.params.uid },
        },
      }
    )
    .then((d) => {
      console.log(d);
      res.redirect("/cart");
    });
});

app.get("/login_page", (req, res) => {
  res.render("login_page");
});

app.post("/login_page", function (req, res) {
  myModelUser
    .findOne({ username: req.body.username, password: req.body.password })
    .then((data) => {
      if (data !== null) {
        req.session.users = data._id;
        res.redirect("/");
      } else {
        res.redirect("/login_page?msg=0");
      }
    });
});

// User Apis

app.get("/admin/singleUser/:uid", (req, res) => {
  myModelUser.findOne({ _id: req.params.uid }).then((userdata) => {
    res.render("admin/singleUser", { userdata });
  });
});

app.get("/admin/edituser/:uid", (req, res) => {
  myModelUser.findOne({ _id: req.params.uid }).then((data) => {
    res.render("admin/editUser", { data });
  });
});

app.post("/admin/useredited/:uid", (req, res) => {
  myModelUser
    .findOneAndUpdate({ _id: req.params.uid }, req.body)
    .then((data) => {
      res.redirect("/admin/showusers");
    });
});

app.get("/admin/removeUser/:uid", (req, res) => {
  myModelUser.findOneAndDelete({ _id: req.params.uid }).then((data) => {
    res.redirect("/admin/showusers");
  });
});

app.get("/admin/adduser", (req, res) => {
  res.render("admin/addUser", { q: req.query.msg });
});

app.get("/admin/showuser", (req, res) => {
  myModelUser
    .findOne()
    .sort({ _id: -1 })({ _id: req.params.uid }, req.body)
    .then((data) => {
      res.render("admin/showusers", { userdata: data });
    });
});

app.get("/admin/showusers", (req, res) => {
  myModelUser.find().then((data) => {
    res.render("admin/showusers", { data });
  });
});

app.post("/admin/adduser", (req, res) => {
  let insertUser = new myModelUser(req.body);
  insertUser.save();
  res.redirect("/admin/adduser?msg=1");
});

// admin api

app.get("/login", function (req, res) {
  res.render("admin/login");
});

app.post("/login", function (req, res) {
  admin
    .findOne({ username: req.body.username, password: req.body.password })
    .then((data) => {
      if (data !== null) {
        req.session.user = data._id;
        res.redirect("/admin");
      } else {
        res.redirect("/login?msg=0");
      }
    });
});

// Logout endpoint
app.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/login");
});

app.get("/verify/:token", (req, res) => {
  const { token } = req.params;

  // Verifying the JWT token
  jwt.verify(token, "ourSecretKey", function (err, decoded) {
    if (err) {
      console.log(err);
      res.send(
        "Email verification failed, possibly the link is invalid or expired"
      );
    } else {
      res.send("Email verifified successfully");
    }
  });
});

app.listen(PORT, (error) => {
  if (!error)
    console.log(
      "Server is Successfully Running, and App is listening on port " + PORT
    );
  else console.log("Error occurred, server can't start", error);
});

app.post("/signup", (req, res) => {
  let as = new myModelUser(req.body);
  as.save();
  res.redirect("/signup");

  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "margaret24@ethereal.email",
      pass: "Mac3UnbVUdd8fsaVmv",
    },
  });

  const token = jwt.sign(
    {
      data: "Token Data",
    },
    "ourSecretKey",
    { expiresIn: "10m" }
  );

  const mailConfigurations = {
    // It should be a string of sender/server email
    from: "margaret24@ethereal.email",
    to: "vicami6391@sentrau.com",
    // Subject of Email
    subject: "Email Verification",

    // This would be the text of email body
    text: `Hi! There, You have recently visited  
           our website and entered your email. 
           Please follow the given link to verify your email 
           <a href="http://localhost:3000/verify/${token}">Click Here</a>  
           Thanks`,
  };

  transporter.sendMail(mailConfigurations, function (error, info) {
    if (error) throw Error(error);
    console.log("Email Sent Successfully");
    console.log(info);
  });
});

app.get("/signup", (req, res) => {
  res.render("signuppage");
});

app.post("/admin/adminuser", (req, res) => {
  let ab = new admin(req.body);
  ab.save();
  res.redirect("/admin/adminuser?msg=1");
});

app.get("/admin/adminuser", (req, res) => {
  res.render("admin/adminUser", { q: req.query.msg });
});

app.post(
  "/admin/addproduct",
  multerupload.single("productimage"),
  (req, res) => {
    let ab = new myproduct({
      productname: req.body.productname,
      productimage: req.file.filename,
      productprice: req.body.productprice,
    });
    ab.save();
    res.redirect("/admin/addproduct?msg=1");
  }
);

app.get("/admin/addproduct", (req, res) => {
  res.render("admin/addproduct", { q: req.query.msg });
});

app.get("/admin/editadmin/:uid", (req, res) => {
  admin.findOne({ _id: req.params.uid }).then((data) => {
    res.render("admin/editAdmin", { data });
  });
});

app.post("/admin/adminedited/:uid", (req, res) => {
  admin.findOneAndUpdate({ _id: req.params.uid }, req.body).then((data) => {
    res.redirect("/admin/showAdmin");
  });
});

app.get("/admin/showAdmins", (req, res) => {
  myModelUser
    .findOne()
    .sort({ _id: -1 })({ _id: req.params.uid }, req.body)
    .then((data) => {
      res.render("admin/showAdmin", { data });
    });
});

app.get("/admin/showAdmin", (req, res) => {
  admin.find().then((data) => {
    res.render("admin/showAdmin", { data });
  });
});

app.get("/admin/singleAdmin/:uid", (req, res) => {
  admin.findOne({ _id: req.params.uid }).then((data) => {
    res.render("admin/singleAdmin", { data });
  });
});

app.get("/admin/removeadmin/:uid", (req, res) => {
  admin.findOneAndDelete({ _id: req.params.uid }).then((data) => {
    res.redirect("/admin/showAdmin");
  });
});

app.get("/adminapi", (req, res) => {
  admin.find().then((data) => {
    res.json(data);
  });
});

app.post("/passwordchanged", auth, (req, res) => {
  admin.findOneAndUpdate({ _id: req.session.userid }, req.body).then((data) => {
    res.redirect("/admin");
  });
});

app.post("/forgetpassword", (req, res) => {
  res.render("admin/forgetPassword");
});

app.get("/enterotp", auth, (req, res) => {
  res.render("admin/addotp");
});

app.get("/resetpassword", auth, (req, res) => {
  res.render("admin/resetpassword");
});
app.post("/admin/resetpassword", (req, res) => {
  if (req.body.otp == req.session.otp) {
    req.session.changepassword = true;
    res.redirect("/resetpassword");
  } else {
    res.redirect("/enterotp");
  }
});

app.post("/sendotp", (req, res) => {
  admin.findOne({ email: req.body.email }).then((data) => {
    if (data !== null) {
      req.session.user = data.username;
      req.session.userid = data._id;
      req.session.login = true;
      res.redirect("/otppage");
    } else {
      res.redirect("/login");
    }
  });
});

app.get("/admin", auth, (req, res) => {
  res.render("admin/admin_home");
});

app.get("/otppage", auth, (req, res) => {
  // Generate SMTP service account from ethereal.email
  nodemailer.createTestAccount((err, account) => {
    if (err) {
      console.error("Failed to create a testing account. " + err.message);
      return process.exit(1);
    }

    console.log("Credentials obtained, sending message...");

    var otp = Math.random();
    otp = otp * 1000000;
    otp = parseInt(otp);
    req.session.otp = otp;

    // Create a SMTP transporter object
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: "margaret24@ethereal.email",
        pass: "Mac3UnbVUdd8fsaVmv",
      },
    });

    // Message object
    let message = {
      from: "margaret24@ethereal.email",
      to: "vicami6391@sentrau.com",
      subject: "Nodemailer is unicode friendly ✔",
      text: "Hello to myself!",
      html: "<p><b>Hello</b> to myself! " + otp + "</p>",
    };

    transporter.sendMail(message, (err, info) => {
      // if (err) {
      //   console.log("Error occurred. " + err.message);
      //   return process.exit(1);
      // }
      return res.redirect("/enterotp");
      console.log("Message sent: %s", info.messageId);
      // Preview only available when sending through an Ethereal account
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    });
  });
});

//End

app.listen(2004, console.log("server running..."));
