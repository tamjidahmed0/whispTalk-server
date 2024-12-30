import messageSchema from "../models/message.js";
import userschema from "../models/user.js";
import onlineSchema from "../models/online.js";
import conversationSchema from "../models/conversation.js";
import profileSchema from "../models/profile.js";
import requestSchema from "../models/request.js";
import unReadMessageSchema from "../models/unReadMsg.js";
import MessageRequestAccept from '../models/messageReqAccepted.js'
import moment from "moment";

import redisClient from "../redis-client/redisClient.js";
import { Types } from "mongoose";

// import { produceMessage } from "../kafka/kafka.js";
// import { startMessageConsumer } from "../kafka/message-consumer.js";

const sendMessageEvent = async ({ io, socket, ONLINE_USERS_KEY }) => {
  // startMessageConsumer()

  socket.on("sendMessage", async (body) => {
    const { name, profile, senderId, receiverId, text, socketId, Dates, types, replyMessageId, timeZoneOffset, repliedUserId } = body;
    const messageId = new Types.ObjectId();

    // await produceMessage(body)

    console.log(body)


    try {

      async function isUserOnline(userId) {
        const _userId = await redisClient.hget(ONLINE_USERS_KEY, userId);
        return _userId;
      }

      const onlineUser = await isUserOnline(receiverId);
      const onlineUser_sender = await isUserOnline(senderId);
      console.log(onlineUser, "onlui be");


      const is_message_req_accepted = await MessageRequestAccept.findOne({
        $or: [
          { RequestSenderId: senderId, RequestReceiverId: receiverId },
          { RequestSenderId: receiverId, RequestReceiverId: senderId }
        ]
      })



      const automatic_message_request_accept = async () => {


        try {
          const find_user_Request = await requestSchema.findOne({
            $or: [
              { conversationFor: senderId, For: receiverId },
              { conversationFor:receiverId , For: senderId }
            ]
          })

          console.log(find_user_Request, 'find user request')


          if (find_user_Request !== null) {

            const verified = await profileSchema.findOne({ Id: receiverId });

            const transferToConversation = await new conversationSchema({
              senderName: find_user_Request.senderName,
              receiverName: find_user_Request.receiverName,
              text: find_user_Request.text,
              conversationFor: find_user_Request.conversationFor,
              For: find_user_Request.For,
              isVerified: verified.isVerified,
              members: [find_user_Request.members[0], find_user_Request.members[1]],
            }).save();

            if (transferToConversation) {

              requestSchema.findOneAndDelete({
                $or: [
                  { conversationFor: senderId , For : receiverId},
                  { conversationFor: receiverId , For: senderId }
                ]
              } ,async function (err, docs) {
                if (err){
                    console.log(err)
                }
                else{
                  if (docs) {

                    await new MessageRequestAccept({
                      RequestSenderId: receiverId,
                      RequestReceiverId: senderId
                    }).save()
    
    
    
                    io.to(onlineUser_sender).emit("messageAccept", {
    
                      isMsgReqAccept: false,
    
                    });
    
    
                  }
                    // console.log("Deleted User : ", docs);
                }
            }); 
 

              // const deletedDoc = await requestSchema.findOneAndDelete({
              //   $or: [
              //     { conversationFor: senderId , For : receiverId},
              //     { conversationFor: receiverId , For: senderId }
              //   ]
              // });


              // console.log(deletedDoc, 'delete docs')


    

            }

          } else {

            // const is_message_req_accepted = await MessageRequestAccept.findOne({
            //  $or :[
            //   {RequestSenderId:senderId , RequestReceiverId:receiverId},
            //   {RequestSenderId:receiverId, RequestReceiverId:senderId} 
            //  ]
            // })



            if (is_message_req_accepted !== null) {




              return false
            } else {
              return true
            }


            // return true

          }
        } catch (error) {
          console.log(error)
        }




      }



      const is_both_conversation_available = await conversationSchema.find({
        $or: [
          { conversationFor: senderId, For: receiverId },
          { conversationFor: receiverId, For: senderId }
        ]
      })

      console.log(is_both_conversation_available.length, 'is_both_conversation_available')





      const automatic_request_accept = await automatic_message_request_accept()


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



      io.to(onlineUser).emit("receivermessage", {
        // messageId: success._id,
        messageId,
        name: name,
        profile: profile,
        iSend: senderId,
        isMsgReqAccept: automatic_request_accept,
        whoSend: receiverId,
        socketId: socketId,
        text: text,
        type: types,
        replyMessageId: replyMessageId,
        date: FormateDate(Dates),
      });



      io.to(onlineUser_sender).emit("sendermsg", {
        messageId,
        iSend: senderId,
        text: text,
        type: types,
        date: FormateDate(Dates),
        receiverId: receiverId,
        messageStatus: "sent",
        replyMessageId: replyMessageId
      });





      io.to(onlineUser).emit("chat_list:receivermessage", {
        // messageId: success._id,
        name: name,
        profile: profile,
        iSend: senderId,
        whoSend: receiverId,
        socketId: socketId,
        text: text,
        types: types,
        Date: Dates,
      });



      socket.emit("chat_list:sendermsg", {
        iSend: senderId,
        name: name,
        profile: profile,
        text: text,
        Date: Dates,
        receiverId: receiverId,
        messageStatus: "sent",
      });




      const Message = new messageSchema({
        Id: messageId,
        receiverId,
        senderId,
        textFor: receiverId,
        text,
        type: types,
        replyMessageId: replyMessageId || null,
        repliedUserId: repliedUserId
      });
      const newMessage = new messageSchema({
        Id: messageId,
        senderId,
        receiverId,
        textFor: senderId,
        text,
        type: types,
        replyMessageId:replyMessageId || null,
        repliedUserId: receiverId
      });
      const success = await newMessage.save();
      const senderMessage = await Message.save();




      //  await redisClient.publish('messages' , JSON.stringify({
      //   receiverId,
      //   senderId,
      //   textFor: receiverId,
      //   // receiverText: text,
      //   text,
      //   type: types,
      //  }))

      // console.log(senderMessage, 'successs')

      if (success) {
        const unreadmsgfind = await unReadMessageSchema.find({
          $and: [{ senderId: senderId }, { receiverId: receiverId }],
        });

        if (unreadmsgfind.length === 0) {
          const unread = await new unReadMessageSchema({
            senderId: senderId,
            receiverId: receiverId,
          }).save();

          // console.log(unread)
        } else {
          const updateUnread = await unReadMessageSchema.findOneAndUpdate(
            {
              $and: [{ senderId: senderId }, { receiverId: receiverId }],
            },
            {
              $inc: { count: 1 },
            },
            {
              new: true,
            }
          );
        }

        const findUser = await userschema.find({
          $or: [{ _id: senderMessage.senderId }, { _id: success.receiverId }],
        });

        if (findUser) {
          const find = await conversationSchema.find({
            $and: [{ members: { $in: [senderMessage.senderId] } }, { members: { $in: [success.receiverId] } }],
          });




/**
* Handle message creation and conversation management.
* 
* - Checks if a conversation already exists between the sender and receiver.
* - If it exists, adds the new message to the conversation.
* - If not, creates a new conversation with the sender and receiver as participants.
* - Each conversation is shared between two users, not stored separately for each.
* - In below if conversation less then 2 then it execute 
*/

          //Object.keys(find).length !== 0
          if (!(is_both_conversation_available.length < 2)) {
            const originalText = success.text;
            const trimText = originalText.substring(0, 23);

            const filter = {
              $and: [{ conversationFor: senderMessage.senderId }, { For: success.receiverId }],
            };
            const filter2 = {
              $and: [{ conversationFor: success.receiverId }, { For: senderMessage.senderId }],
            };







            if (findUser[0]._id.toString() === senderId) {
              console.log("line 320");
              await conversationSchema.findOneAndUpdate(filter, {
                $set: {
                  text: trimText.length < 23 ? `You: ${trimText}.` : `You: ${trimText}...`,
                  date: new Date(),
                },
              });

              await conversationSchema.findOneAndUpdate(filter2, {
                $set: {
                  text: `${trimText}`,
                  date: new Date(),
                },
              });

              await requestSchema.findOneAndUpdate(filter2, {
                $set: {
                  text: `${trimText}`,
                  date: new Date(),
                },
              });
            } else {
              console.log('line 342')
              await conversationSchema.findOneAndUpdate(filter2, {
                $set: {
                  text: `${trimText}.`,
                  date: new Date(),
                },
              });

              await requestSchema.findOneAndUpdate(filter2, {
                $set: {
                  text: `${trimText}.`,
                  date: new Date(),
                },
              });

              await conversationSchema.findOneAndUpdate(filter, {
                $set: {
                  text: trimText.length < 23 ? `You: ${trimText}.` : `You: ${trimText}...`,
                  date: new Date(),
                },
              });
            }
          } else {
            console.log('one of them or two not avalable')

            const conversationExistingSender = await conversationSchema.findOne({ conversationFor: senderId });
            const conversationExistingReceiver = await conversationSchema.findOne({ conversationFor: receiverId });

            const verified = await profileSchema.findOne({ Id: success.receiverId });
            const verified2 = await profileSchema.findOne({ Id: senderMessage.senderId });

            const originalText = success.text;
            const trimText = originalText.slice(0, 10);

            const conversation = new conversationSchema({
              senderName: "",
              receiverName: "",
              text: "",
              conversationFor: "",
              isVerified: verified.isVerified,
              For: "",
              members: [senderMessage.senderId, success.receiverId],
            });


            const conversation_receiver = new conversationSchema({
              senderName: "",
              receiverName: "",
              text: "",
              conversationFor: "",
              isVerified: verified2.isVerified,
              For: "",
              members: [success.receiverId, senderMessage.senderId],
            });

            const newconversation = new requestSchema({
              senderName: "",
              receiverName: "",
              text: "",
              conversationFor: "",
              isVerified: verified2.isVerified,
              For: "",
              members: [success.receiverId, senderMessage.senderId],
            });

            if (findUser[0]._id.toString() === senderId) {
              console.log('tamjid ahmed for receiver')


              ///if both conversation not available

              if (is_both_conversation_available.length === 0) {
                //sender
                conversation.senderName = findUser[0].name;
                conversation.receiverName = findUser[1].name;
                conversation.text = trimText.length < 23 ? `You: ${trimText}.` : `You: ${trimText}...`;
                conversation.conversationFor = findUser[0]._id;
                conversation.For = findUser[1]._id;

                //receiver
                conversation_receiver.senderName = findUser[1].name;
                conversation_receiver.receiverName = findUser[0].name;
                conversation_receiver.text = success.text;
                conversation_receiver.conversationFor = findUser[1]._id;
                conversation_receiver.For = findUser[0]._id;

                //request box
                newconversation.senderName = findUser[1].name;
                newconversation.receiverName = findUser[0].name;
                newconversation.text = success.text;
                newconversation.conversationFor = findUser[1]._id;
                newconversation.For = findUser[0]._id;


              } else {


                if (conversationExistingReceiver === null) {
                  //sender
                  conversation.senderName = findUser[0].name;
                  conversation.receiverName = findUser[1].name;
                  conversation.text = trimText.length < 23 ? `You: ${trimText}.` : `You: ${trimText}...`;
                  conversation.conversationFor = findUser[0]._id;
                  conversation.For = findUser[1]._id;
                } else if (conversationExistingSender === null) {
                  //receiver
                  conversation_receiver.senderName = findUser[1].name;
                  conversation_receiver.receiverName = findUser[0].name;
                  conversation_receiver.text = success.text;
                  conversation_receiver.conversationFor = findUser[1]._id;
                  conversation_receiver.For = findUser[0]._id;
                } else {
                  //request box
                  newconversation.senderName = findUser[1].name;
                  newconversation.receiverName = findUser[0].name;
                  newconversation.text = success.text;
                  newconversation.conversationFor = findUser[1]._id;
                  newconversation.For = findUser[0]._id;
                }

              }





            } else {

              console.log('tamjid ahmed for sender')


              //if no conversation available
              if (is_both_conversation_available.length === 0) {

                //sender
                conversation.senderName = findUser[1].name;
                conversation.receiverName = findUser[0].name;
                conversation.text = trimText.length < 23 ? `You: ${trimText}.` : `You: ${trimText}...`;
                conversation.conversationFor = findUser[1]._id;
                conversation.For = findUser[0]._id;

                //receiver
                conversation_receiver.senderName = findUser[0].name;
                conversation_receiver.receiverName = findUser[1].name;
                conversation_receiver.text = success.text;
                conversation_receiver.conversationFor = findUser[0]._id;
                conversation_receiver.For = findUser[1]._id;

                //message request
                newconversation.senderName = findUser[0].name;
                newconversation.receiverName = findUser[1].name;
                newconversation.text = success.text;
                newconversation.conversationFor = findUser[0]._id;
                newconversation.For = findUser[1]._id;



              } else {
                console.log(conversationExistingSender, 'conversation receiver')
                if (conversationExistingSender === null) {

                  console.log('test tamjid')
                  
                  conversation.senderName = findUser[1].name;
                  conversation.receiverName = findUser[0].name;
                  conversation.text = trimText.length < 23 ? `You: ${trimText}.` : `You: ${trimText}...`;
                  conversation.conversationFor = findUser[1]._id;
                  conversation.For = findUser[0]._id;
                } else if(conversationExistingReceiver === null) {

                  // console.log(conversation_receiver, 'findUser[0]._id')

            

                  console.log(findUser[0]._id, 'findUser[0]._id')
                  

                  conversation_receiver.senderName = findUser[0].name;
                  conversation_receiver.receiverName = findUser[1].name;
                  conversation_receiver.text = success.text;
                  conversation_receiver.conversationFor = findUser[0]._id;
                  conversation_receiver.For = findUser[1]._id;

                  // console.log(conversation_receiver, 'findUser[0]._id')

 
                  // await conversation_receiver.save()

                  
                }
              }








              // conversation.senderName = findUser[1].name;
              // conversation.receiverName = findUser[0].name;
              // conversation.text = trimText.length < 23 ? `You: ${trimText}.` : `You: ${trimText}...`;
              // conversation.conversationFor = findUser[1]._id;
              // conversation.For = findUser[0]._id;




              // conversation_receiver.senderName = findUser[0].name;
              // conversation_receiver.receiverName = findUser[1].name;
              // conversation_receiver.text = success.text;
              // conversation_receiver.conversationFor = findUser[0]._id;
              // conversation_receiver.For = findUser[1]._id;





            }

            if(conversationExistingSender === null){
              await conversation.save(); //msg that i send
            }

            // await conversation.save(); //msg that i send
            // await conversation_receiver.save()
            // await conversation_receiver.save()
            // const requestmsg = await newconversation.save(); // request box msg
            if (is_message_req_accepted !== null) {
              if(conversationExistingReceiver === null){
                const afterAdd =  await conversation_receiver.save()
              }
           
            // console.log(afterAdd, 'afteradd')
            } else {
              await newconversation.save() 
            }

            // const userfindonline = await onlineSchema.find({ id: receiverId });
            const countrequest = await requestSchema.countDocuments({
              conversationFor: receiverId,
            });

          }


        }



      }




    } catch (error) {
      // Handle error
      console.log(error);
    }
  });
};

export default sendMessageEvent;
