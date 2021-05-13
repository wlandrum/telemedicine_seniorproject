// imports all values from the .env file
const { parsed: envs, error } = require("dotenv").config();

// if there is an error, it will exit the process since the server can't run without the variables
if (error) {
  console.error(error);
  process.exit(1);
}

const defaultValues = {
  PORT: 5000,
  DB_HOST: "localhost",
  DB_USER: "root",
  DB_PASSWORD: "",
  DB_PORT: 3306,
  DATABASE: "telemedicine",
  SESSION_SECRET: "telemedicine-portal",
  SESSION_NAME: "sid",
};

// assign values from the defaultValues defined above
Object.keys(defaultValues).forEach((key) => {
  if (typeof envs[key] === "undefined") envs[key] = defaultValues[key];
});

// export the values to be imported by other modules
module.exports = envs;
