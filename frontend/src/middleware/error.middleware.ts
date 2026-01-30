export const handleError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return "Something went wrong";
};
