const jwt = require('jsonwebtoken');

const authRequired = (req, res, next) => {
    const header = req.headers.authorization || '';
    let token = header.startsWith('Bearer ') ? header.slice(7) : null;
    // Support token via query string (e.g., for EventSource which cannot send headers)
    if (!token && req.query && req.query.token) {
        token = req.query.token;
    }
	if (!token) {
		console.log('Auth failed: Missing token for', req.path);
		return res.status(401).json({ message: 'Missing token' });
	}
	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
		req.user = payload; // { id, role, name }
		console.log('Auth success:', { userId: payload.id, role: payload.role, path: req.path });
		next();
	} catch (e) {
		console.log('Auth failed: Invalid token for', req.path, e.message);
		return res.status(401).json({ message: 'Invalid token' });
	}
};

const requireRole = (...roles) => (req, res, next) => {
	if (!req.user || !roles.includes(req.user.role)) {
		return res.status(403).json({ message: 'Forbidden' });
	}
	next();
};

module.exports = { authRequired, requireRole };
