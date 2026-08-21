const adminAccess = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized. Please login first."
            });
        }

        const role = req.user.role;

        if (
            role === "admin" ||
            role === "theaterOwner"
        ) {
            return next();
        }

        return res.status(403).json({
            message: "Admin or Theater Owner access only"
        });

    } catch (error) {
        console.error("Admin Middleware Error:", error);

        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
};

module.exports = {
    adminAccess
};