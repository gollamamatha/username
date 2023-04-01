const express = require("express");
const path = require("path");

const bcrypt = require("bcrypt");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initialization = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://loaclhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error :${e.message}`);
    process.exit(1);
  }
};
initialization();

//user

app.post("/register/", async (request, response) => {
  let { userName, name, password, gender, location } = request.body;

  let hashedPassword = await bcrypt.hash(password, 10);

  let checkTheUsername = `
            SELECT *
            FROM user
            WHERE username = '${userName}';`;
  let userData = await db.get(checkTheUsername);
  if (userData === undefined) {
    let postNewUserQuery = `
            INSERT INTO
            user (username,name,password,gender,location)
            VALUES (
                '${userName}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let newUserDetails = await db.run(postNewUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//login

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login Success!");
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});
//change-password

app.put("/change-password/", async (request, response) => {
  const { userName, oldPassword, newPassword } = request.body;
  const userDetails = `SELECT * FROM user WHERE username='${userName}'`;
  const dbUser = await db.get(userDetails);
  if (dbUser === undefined) {
    response.status(400);
    response.status("User not registered");
  } else {
    const inValid = await bcrypt.compare(oldPassword, dbUser.password);
    if (inValid === true) {
      const lengthPassword = newPassword.length;
      if (lengthPassword < 5) {
        response.status(400);
        response.status("Password is too short");
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10);
        const upDate = `UPDATE  user 
                set password ='${encryptedPassword}'
                WHERE username='${userName}'`;
        await db.run(upDate);
        response.status(400);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.status("Invalid current password");
    }
  }
});
module.exports = app;
