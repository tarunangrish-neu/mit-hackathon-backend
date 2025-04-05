export const setCreateResponse = (data, response) => {
  response.status(201).json(data);
};

export const setSuccessResponse = (data, response) => {
  response.status(200).json(data);
};

export const setNotFoundResponse = (message, response) => {
  response.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: message || "Resource not found"
    }
  });
};

export const setErrorResponse = (error, response) => {
  response.status(500).json({
    error: {
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "An error occurred while processing your request."
    }
  });
};