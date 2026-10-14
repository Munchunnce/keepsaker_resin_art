class CustomErrorHandler extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
        this.message = message;
    }
    // register a static method to create a new instance of CustomErrorHandler with a specific status and message
    static alreadyExists(message) {
        return new CustomErrorHandler(409, message);
    }
    // login CustomErrorHandler
    static wrongCredentials(message = 'Username or password is wrong') {
        return new CustomErrorHandler(401, message);
    }

    // unauthorized CustomErrorHandler
    static unAuthorized(message = 'Unauthorized') {
        return new CustomErrorHandler(401, message);
    }

    // not found CustomErrorHandler
    static notFound(message = 'Not Found') {
        return new CustomErrorHandler(404, message);
    }

    // internal server error CustomErrorHandler
    static internal(message = 'Internal Server Error') {
        return new CustomErrorHandler(500, message);
    }
}

export default CustomErrorHandler;