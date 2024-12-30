import userschema from '../models/user.js'
import messageSchema from '../models/message.js'
import profileSchema from '../models/profile.js'
import requestSchema from '../models/request.js'
import moment from 'moment'

const getMessagesById = async (req, res) => {

    const senderId = req.params.userId
    const receiverId = req.params.receiverId

    const { limit, offset } = req.query;
    const  { usertimezoneoffset} = req.headers
   


    const FormateDate = (dates) => {
        // Adjust the date to the user's time zone using the provided offset
        const createdAt = moment(dates).utcOffset(usertimezoneoffset); // Offset in minutes
        const now = moment().utcOffset(usertimezoneoffset); // Current time in the user's time zone
      
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



    try {

        const checkIsRequest = await requestSchema.findOne({ For: receiverId })
        console.log(checkIsRequest, 'check is request') 
        const messages = await messageSchema.find({

            $or: [
                { senderId: senderId, receiverId: receiverId },
                { senderId: receiverId, receiverId: senderId },
            ],

        })
            .sort({ date: -1 }).skip(parseInt(offset)).limit(limit)





        


            




        let array = []



        for (const item of messages) {

            if (item.senderId.toString() === senderId) {

                if (item.textFor.toString() === senderId) {


                    const user = await userschema.findById(item.senderId)

                    const profPic = await profileSchema.findOne({
                        $or: [
                            { Id: senderId },

                        ]
                    })

                 


                    array.push({ messageId: item.Id, replyMessageId:item.replyMessageId, profile: profPic.profilePic, iSend: item.senderId, name: user.name, text: item.text, type: item.type, unsent: item.unsent, seen: item.seen, date: FormateDate(item.date, -360)})


                }
  

            } else if (item.senderId.toString() === receiverId) {
            
                if (item.textFor.toString() === senderId) {

                    const user = await userschema.findById(item.senderId)
                    const profPic = await profileSchema.findOne({
                         $or: [
                            { Id: receiverId },

                        ]
                    })

                    array.push({ messageId: item.Id, replyMessageId:item.replyMessageId, profile: profPic.profilePic, whoSend: item.senderId, name: user.name, text: item.text, type: item.type, unsent: item.unsent, seen: item.seen, date: FormateDate(item.date, -360)})
                 


                }

            }
 



        }


        // const FormateDate = (dates) => {

        //     const createdAt = moment(dates);
        //     const now = moment()
        //     const duration = moment.duration(now.diff(createdAt));

        //     const years = duration.years();
        //     const months = duration.months();
        //     const days = duration.days();

        //     const date = moment(dates);




        //     const getFormattedDate = (date) => { 
        //         if (Math.abs(years)) {
        //             return `${date.format('MMM DD YYYY')} AT ${date.format('hh:mm A')} `
        //         }
        //         else if (Math.abs(months)) {
        //             return `${date.format('MMM DD')} AT ${date.format('hh:mm A')} `
        //         }
        //         else if (days) {
        //             return `${date.format('ddd')} AT ${date.format('hh:mm A')} `
        //         } else {
        //             return date.format('hh:mm A')
        //         }
        //     }



        //     return getFormattedDate(date)

        // }

      




        const receiverDetails = await profileSchema.findOne({ Id: receiverId })

        res.status(200).send({ request: checkIsRequest !== null ? true : false, receiverPic: receiverDetails.profilePic, receiverName: receiverDetails.name, receiverUsername: `@${receiverDetails.username}`, receiverAbout: receiverDetails.about, data: array.reverse() });



    } catch (err) {
        res.status(500).json(err);
    }
}


export default getMessagesById