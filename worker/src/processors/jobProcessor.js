const processJob = async (job) => { 
    try {
        const { type, ...data } = job.data;
        switch (type) {
            case 'email':
                await processEmail(data);
                break;
            case 'notification':
                await processNotification(data);
                break;
            default:
                await processDefault(data); 
        }
        console.log(`Job ${job.id} processed successfully`);
        return {success: true,message: `Job ${job.id} processed successfully`};
    } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        return {success: false, message: `Error processing job ${job.id}`};
    }
}
const processEmail = async (data) => {
    console.log('Sending email to:', data.to)
    console.log('subject', data.subject)
    await delay(2000);
    console.log('Email sent')
}
const processNotification = async (data) => {
    console.log('Seding notification:', data.title);
    await delay(2000);
    console.log('Notification sent');
    
    
}
const processDefault = async (data) => {
    console.log('Processing default job:', data);
    await delay(1500);
    console.log('Job done');
}
const delay = (ms) => {
    return new Promise(resolve=>setTimeout(resolve,ms))
}
module.exports = processJob;