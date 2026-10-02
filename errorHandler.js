// Central error middleware keeps unexpected server failures consistent and safe for users.
export function notFound(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.path} was not found.` });
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  res.status(500).json({ message: 'Something went wrong on the server. Please try again.' });
}
