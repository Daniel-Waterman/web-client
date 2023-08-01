import * as dotenv from 'dotenv';
dotenv.config();

import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const workspace = client.taskrouter.v1.workspaces(process.env.TWILIO_WORKSPACE_SID);
const conversations = client.conversations.v1.conversations;

export const CreateConversation = async () => {
    let conv = await conversations.create({friendlyName: "My First Conversation"});

    return conv.sid;
}

export const FetchConversation = async (sid) => {
    let conv = await conversations(sid).fetch();
    return conv;
}

export const DeleteConversation = async (sid) => {
    await conversations(sid).remove();
}

export const EndConversation = async (sid) => {
    await conversations(sid).remove();
}

export const AddParticipants = async (conversationSid) => {
    let data = await conversations(conversationSid).participants.create({
        'messagingBinding.address': '+447952917039',
        'messagingBinding.proxyAddress' : '+447883320538'
    });

    return data;
}

export const AddUser = async (conversationSid) => {
    let data = await conversations(conversationSid).participants.create({
        identity: "worker_alice"
    });

    return data;
}