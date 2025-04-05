export const setCreateResponse = (data, response) => {
    response.status(201).json(data);
  };

export const setErrorResponse = (error, response) => {
    response.status(500).json({
      error: {
        code: error.code,
        message: "An error occurred while processing your request.",
      },
    });
  }