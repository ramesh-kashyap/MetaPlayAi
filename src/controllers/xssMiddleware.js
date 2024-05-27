// Install the 'xss' library using npm install xss
const xss = require('xss');

// XSS middleware controller
const xssMiddleware = (req, res, next) => {
  // Iterate through request body
  sanitizeObject(req.body);

  // Iterate through request query parameters
  sanitizeObject(req.query);

  next();
};

// Recursive function to sanitize an object
function sanitizeObject(obj) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'string') {
        // Sanitize string values using the 'xss' library
        obj[key] = xss(obj[key]);
      } else if (typeof obj[key] === 'object') {
        // Recursively sanitize nested objects
        sanitizeObject(obj[key]);
      }
    }
  }
}

module.exports = xssMiddleware;
