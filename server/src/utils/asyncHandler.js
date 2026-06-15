// Wraps async controller functions so errors auto-go to express error handler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
 
module.exports = asyncHandler;