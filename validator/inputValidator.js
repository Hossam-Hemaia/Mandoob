const { body } = require("express-validator");

module.exports = {
  validateName: body("clientName")
    .trim()
    .isString()
    .notEmpty()
    .withMessage("Name must be letters only!"),
  validatePhoneNumber: body("phoneNumber")
    .trim()
    .isString()
    .notEmpty()
    .isLength({ min: 8, max: 8 })
    .withMessage("Phone Number is required, and must be valid phone number!"),
  validateEmail: body("email")
    .trim()
    .isEmail()
    .withMessage("Please enter valid email!"),
  validatePassword: body("password"),
};
