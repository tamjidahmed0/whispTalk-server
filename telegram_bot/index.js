import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv'
dotenv.config()
import userSchema from '../models/user.js'



const Telegram_bot = async () => {

    const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });




    // Helper function to send a message and wait for a response
    async function askQuestion(chatId, question) {
        await bot.sendMessage(chatId, question);

        // Wait for the user's response with the same chatId
        const response = await new Promise((resolve) => {
            bot.once('message', async (responseMsg) => {
                if (responseMsg.chat.id === chatId) {
                    resolve(responseMsg.text);
                }
            });
        });

        return response;
    }



    bot.on("polling_error", (msg) => console.log(msg, 'poling error'));




    let data = {
        name: '',
        username: '',
        email: '',
        password: ''
    }



    // Main conversation flow
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;

        try {
            // Step 1: Ask for the account name
            const accountName = await askQuestion(chatId, 'Enter your account name');
            // await bot.sendMessage(chatId, `Account name saved as: ${accountName}`);
            data.name = accountName

            // Loop until a unique username is provided
            let username;
            while (true) {

                username = await askQuestion(chatId, 'Choose a username');
                const checkUsername = await userSchema.findOne({ username: username });

                if (checkUsername === null) {
                    // Username is unique, break the loop
                    break;
                } else {
                    // Username exists, notify the user and ask again
                    await bot.sendMessage(chatId, `${username} already exists, try another one`);
                }
            }

            // Continue with the rest of the flow
            data.username = username;



            // Loop until a unique email is provided
            let email;
            while (true) {

                email = await askQuestion(chatId, 'Enter your email address');
                const checkEmail = await userSchema.findOne({ email: email });

                if (checkEmail === null) {
                    // Email is unique, break the loop
                    break;
                } else {
                    // Email exists, notify the user and ask again
                    await bot.sendMessage(chatId, `Email ${email} is already registered, try another one`);
                }
            }
            data.email = email;


            let password;
            while (true) {

                password = await askQuestion(chatId, 'Create password 6 character long.');

                if (password.length > 6) {
                    // Email is unique, break the loop
                    break;
                } else {
                    // Email exists, notify the user and ask again
                    await bot.sendMessage(chatId, `Password should be 6 character long.`);
                }
            }
            data.password = password;


            const final_check = await askQuestion(chatId,
                `Please check your information below:\n\n` +
                `Name: ${data.name}\n` +
                `Username: ${data.username}\n` +
                `Email: ${data.email}\n\n` +
                `If everything is correct, type 'yes'. Otherwise, type 'no'.`
            );


            if (final_check.toLowerCase() === 'yes') {
                console.log(data, 'data')


                let otp;
                while (true) {

                    otp = await askQuestion(chatId, 'We have sent OTP to your email');

                    if (password.length > 6) {
                        // Email is unique, break the loop
                        break;
                    } else {
                        // Email exists, notify the user and ask again
                        await bot.sendMessage(chatId, `Password should be 6 character long.`);
                    }
                }




            }




        } catch (error) {
            console.error(error);
            bot.sendMessage(chatId, 'Something went wrong, please try again.');
        }
    });




}

export default Telegram_bot








