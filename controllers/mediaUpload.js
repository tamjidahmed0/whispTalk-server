import messageSchema from "../models/message.js";
import userschema from "../models/user.js";
import onlineSchema from "../models/online.js";
import conversationSchema from "../models/conversation.js";
import profileSchema from "../models/profile.js";
import requestSchema from "../models/request.js";
import unReadMessageSchema from "../models/unReadMsg.js";
import redisClient from "../redis-client/redisClient.js";
import { Types } from "mongoose";



const mediaUpload = async (req, res) => {

    const {receiverId, senderId, text, types} = JSON.parse(req.body.jsonData)

    console.log(JSON.parse(req.body.jsonData), 'req.body.jsonData')
    const messageId = new Types.ObjectId();

    // console.log(req.fileUrls, 'req.fileUrls')

    try {

        

  for(const item of req.fileUrls){
    const Message = new messageSchema({
        Id:messageId,
        receiverId,
        senderId,
        textFor: receiverId,
        // receiverText: text,
        text: item,
        type: types,
      });
      const newMessage = new messageSchema({
        Id:messageId,
        senderId,
        receiverId,
        // senderText: text,
        textFor: senderId,
        text: item,
        type: types,
      });
      const success = await newMessage.save();
      const senderMessage = await Message.save();


      if (success) { 
     
        const findUser = await userschema.find({
          $or: [{ _id: senderMessage.senderId }, { _id: success.receiverId }],
        });

        if (findUser) {
          const find = await conversationSchema.find({
            $and: [{ members: { $in: [senderMessage.senderId] } }, { members: { $in: [success.receiverId] } }],
          });
 
          if (Object.keys(find).length !== 0) {
            const originalText = success.text;
            const trimText = originalText.substring(0, 23);

            const filter = {
              $and: [{ conversationFor: senderMessage.senderId }, { For: success.receiverId }],
            };
            const filter2 = {
              $and: [{ conversationFor: success.receiverId }, { For: senderMessage.senderId }],
            };

            // const conversationExistingSender = await conversationSchema.findOne({ For: senderId });
            // const conversationExistingReceiver = await conversationSchema.findOne({ For: receiverId });

            if (findUser[0]._id.toString() === senderId) {
              console.log("line 271");
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
              console.log(success.text);
              conversation.senderName = findUser[0].name;
              conversation.receiverName = findUser[1].name;
              conversation.text = success.text;

              conversation.conversationFor = findUser[0]._id;
              conversation.For = findUser[1]._id;

              newconversation.senderName = findUser[1].name;
              newconversation.receiverName = findUser[0].name;
              newconversation.text = success.text;

              newconversation.conversationFor = findUser[1]._id;
              newconversation.For = findUser[0]._id;
            } else {
              console.log(success.text);
              conversation.senderName = findUser[1].name;
              conversation.receiverName = findUser[0].name;
              // conversation.text = success.text;
              conversation.text = trimText.length < 23 ? `You: ${trimText}.` : `You: ${trimText}...`;
              conversation.conversationFor = findUser[1]._id;
              conversation.For = findUser[0]._id;

              newconversation.senderName = findUser[0].name;
              newconversation.receiverName = findUser[1].name;
              newconversation.text = success.text;

              newconversation.conversationFor = findUser[0]._id;
              newconversation.For = findUser[1]._id;
            }

          const msg_send =  await conversation.save(); //msg that i send
            const requestmsg = await newconversation.save(); // request box msg
           




          }
        }
      }

      // if(item){

      // }

     
  }


 

                       
      if(req.fileUrls){
        res.status(201).send({messageId, msg:'image uploaded',url: req.fileUrls, status:201})
      }
     
      
        
     








    } catch (error) {
        console.log(error)
    }
}

export default mediaUpload