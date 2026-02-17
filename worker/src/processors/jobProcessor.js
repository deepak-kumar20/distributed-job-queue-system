const processJob = async (job) => {
  try {
    const { type, ...data } = job.data;
    switch (type) {
      case "email":
        await processEmail(data);
        break;
      case "notification":
        await processNotification(data);
        break;
      default:
        await processDefault(data);
    }
    return { success: true, message: `Job processed successfully` };
  } catch (error) {
    throw error;
  }
};
const processEmail = async (data) => {
  await delay(2000);
};
const processNotification = async (data) => {
  await delay(2000);
};
const processDefault = async (data) => {
  await delay(1500);
};
const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
module.exports = processJob;
