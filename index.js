require("dotenv").config();
const express = require("express");
const app = express();
var async = require("async");
var fs = require("fs");
var pg = require("pg");
var jwt = require("jsonwebtoken");
const cors = require("cors");

// Connect to the "bank" database.
var config = {
  user: "dhwaj",
  host: "localhost",
  database: "bank",
  port: 26257,
};

//Middle wares
// http://localhost:19002
var allowedOrigins = ["*"];
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin
      // (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);

// Create a pool.
var pool = new pg.Pool(config);
pool.connect(function (err, client, done) {
  // Close communication with the database and exit.
  var finish = function () {
    done();
    process.exit();
  };

  if (err) {
    console.error("could not connect to cockroachdb", err);
    finish();
  }
});

app.get("/users", (req, res) => {
  pool.query("SELECT * FROM users3", (err, result) => {
    if (err) {
      res.send(err);
    } else {
      return res.json({
        data: result.rows,
      });
    }
  });
});

app.get("/register", (req, res) => {
  console.log(req.query);
  var data = require("./data.json");
  console.log(data);
  const { aadhar } = req.query;
  //   pool.query(
  //     "CREATE TABLE users3 (aadhar INT , name VARCHAR(255), phone VARCHAR(255), email VARCHAR(320), token VARCHAR(320), city VARCHAR(255), gender VARCHAR(255));",
  //     (err, result) => {
  //       if (err) {
  //         console.log(err);
  //       } else {
  //         console.log(result);
  //       }
  //     }
  //   );
  pool.query(`SELECT * FROM users3 WHERE aadhar = ${aadhar}`, (err, result) => {
    if (err) {
      console.log(err);
    } else if (result.rows.length > 0) {
      const token = jwt.sign({ aadhar: aadhar }, process.env.SECRET);
      pool.query(
        `UPDATE users3 SET token = '${token}' WHERE aadhar = ${aadhar} `,
        (err, result) => {
          if (err) {
            res.json({ error: "Error" });
          } else {
            return res.status(200).json({ success: true });
          }
        }
      );
    } else {
      var dd = data.find((item) => item.aadhar == aadhar);
      console.log(dd);
      if (dd) {
        const token = jwt.sign({ aadhar: dd.aadhar }, process.env.SECRET);
        var sql = `INSERT INTO users3 (aadhar, name, phone, email, token, city, gender) VALUES (${dd.aadhar}, '${dd.name}', '${dd.phone}', '${dd.email}', '${token}', '${dd.city}', '${dd.gender}')`;
        console.log(sql);
        pool.query(sql, (err, results) => {
          if (err) {
            console.log(err);
          } else {
            res.json(results);
          }
        });
      } else {
        res.json({ error: "User not Exist in DB" });
      }
    }
  });
});

app.get("/logout", (req, res) => {
  console.log(req.query.aadhar);
  pool.query(
    `UPDATE users3 SET token = '' WHERE aadhar = ${req.query.aadhar} `,
    (err, result) => {
      if (err) {
        res.json({ error: "Error" });
      } else {
        res.json({ status: result });
      }
    }
  );
});

app.get("/particluaruser", (req, res) => {
  console.log(req.query.aadhar);
  pool.query(
    `SELECT * FROM users3 WHERE aadhar = ${req.query.aadhar} `,
    (err, result) => {
      if (err) {
        res.json({ error: "Error" });
      } else {
        res.json({ result: result.rows[0] });
      }
    }
  );
});

app.get("/vacinated", (req, res) => {
  console.log(req.query);
  var data = require("./data.json");
  console.log(data);
  const { aadhar, vacine1, vacine2 } = req.query;
  //   pool.query(
  //     "CREATE TABLE vacinated (aadhar INT , vacine1 BOOLEAN, vacine2 BOOLEAN);",
  //     (err, result) => {
  //       if (err) {
  //         console.log(err);
  //       } else {
  //         console.log(result);
  //       }
  //     }
  //   );
  pool.query(
    `SELECT * FROM vacinated WHERE aadhar = ${aadhar}`,
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        if (result.rows.length > 0) {
          pool.query(
            `UPDATE vacinated SET vacine1 = ${vacine1}, vacine2 = ${vacine2} WHERE aadhar = ${aadhar}`,
            (error, results) => {
              if (error) {
                console.log(error);
              } else {
                return res.json({ success: "Done" });
              }
            }
          );
        } else {
          pool.query(
            `INSERT INTO vacinated (aadhar, vacine1, vacine2) VALUES (${aadhar}, ${vacine1}, ${vacine2})`,
            (error, results) => {
              if (error) {
                console.log(error);
              } else {
                return res.json({ success: "Done" });
              }
            }
          );
        }
      }
    }
  );
});

app.get("/allvacinated", (req, res) => {
  const { aadhar } = req.query;
  pool.query(
    `SELECT * FROM vacinated WHERE aadhar = ${aadhar}`,
    (err, result) => {
      if (err) {
        res.send(err);
      } else {
        return res.json({
          data: result.rows,
        });
      }
    }
  );
});

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Hackathon Backend",
  });
});

const port = process.env.PORT || 8000;

app.listen(port, () => console.log("Server is running"));
