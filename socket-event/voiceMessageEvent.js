import moment from "moment";
import redisClient from "../redis-client/redisClient.js";


const voiceMessageEvent = ({ io, socket, ONLINE_USERS_KEY }) => {

    try {
        
        async function isUserOnline(userId) {
            const _userId = await redisClient.hget(ONLINE_USERS_KEY, userId);
            return _userId;
          }


          socket.on('voiceMessage', async(data)=>{
            const { name, profile, senderId, receiverId, text, socketId, Dates, type, timeZoneOffset } = data;


               const FormateDate = (dates) => {
                          // Adjust the date to the user's time zone using the provided offset
                          const createdAt = moment(dates).utcOffset(timeZoneOffset); // Offset in minutes
                          const now = moment().utcOffset(timeZoneOffset); // Current time in the user's time zone
                        
                          const duration = moment.duration(now.diff(createdAt));
                        
                          const years = duration.years();
                          const months = duration.months();
                          const days = duration.days();
                        
                          const getFormattedDate = (date) => {
                            if (Math.abs(years)) {
                              return `${date.format('MMM DD YYYY')} AT ${date.format('hh:mm A')}`;
                            } else if (Math.abs(months)) {
                              return `${date.format('MMM DD')} AT ${date.format('hh:mm A')}`;
                            } else if (days) {
                              return `${date.format('ddd')} AT ${date.format('hh:mm A')}`;
                            } else {
                              return date.format('hh:mm A');
                            }
                          };
                        
                          return getFormattedDate(createdAt);
                        };
            



            console.log(data, 'data')
            const online_user = await isUserOnline(receiverId)
            const onlineUser_sender = await isUserOnline(senderId);

            data.text?.map((item)=>{
                io.to(online_user).emit('voiceMessage', {
                    messageId: data.messageId,
                    name: name,
                    profile: profile,
                    iSend: senderId,
                    // isMsgReqAccept:automatic_request_accept, 
                    whoSend: receiverId,
                    socketId: socketId,
                    text: item,
                    type: type,
                    date: FormateDate(Dates),
                    
                }) 


                io.to(onlineUser_sender).emit("voiceMessage_sender", {
                    messageId: data.messageId,
                    iSend: senderId,
                    text: item,
                    type:type,
                    date: FormateDate(Dates),
                    receiverId: receiverId,

                   
                  });
            })

            


        })



    } catch (error) {
        console.log(error)
    }

  




}

export default voiceMessageEvent