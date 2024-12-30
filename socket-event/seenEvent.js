import redisClient from "../redis-client/redisClient.js";
import messageSchema from '../models/message.js'

const seenEvent = ({ io, socket, ONLINE_USERS_KEY }) => {

    socket.on('seen', async (data) => {
        console.log(data, 'seen')

        async function isUserOnline(userId) {
            const _userId = await redisClient.hget(ONLINE_USERS_KEY, userId);
            return _userId;
        }

        const find_user_msg = await messageSchema.findOneAndUpdate(
            {
                $and: [
                    { Id: data.messageId },
                    { textFor: data.senderId }
                ]
            },
            { $set: { seen: true } },
            { new: true }
        )

        //  console.log(find_user_msg, 'findusermsg')


        const _userId = await isUserOnline(data.senderId)
        io.to(_userId).emit('seen', data)


        // console.log(data, 'seen data')
    })

}

export default seenEvent