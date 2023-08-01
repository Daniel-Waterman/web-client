import * as dotenv from 'dotenv';
dotenv.config();

import twilio from 'twilio';
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const workspace = client.taskrouter.v1.workspaces(process.env.TWILIO_WORKSPACE_SID);

export const PlaceOnHold = async (conferenceId, participantId, isOnHold) => {
    let options = {};
    if (!isOnHold) {
        options = {
            hold: true,
            holdUrl: 'http://demo.twilio.com/docs/classic.mp3'
        }
    } else {
        options = {
            hold: false,
            endConferenceOnExit: true,
            beepOnExit: true
        }
    }

    console.log(options);

    await client.conferences(conferenceId)
    .participants(participantId)
    .update(options)
    .then(participant => console.log(participant.callSid));
}

export const FetchConference = async (friendlyKey) => {
    console.log(friendlyKey);
    let data = await client.conferences.list({friendlyName: friendlyKey, limit: 1});
    console.log(data);

    if (data.length > 0) {
        return data[0];
    } else {
        return undefined;
    }
}

export const GetParticipants = async (conferenceSid) => {
    console.log(conferenceSid);
    let data = await client.conferences(conferenceSid).participants();
}

export const EndConference = async (taskId) => {
    let conv = await FetchConference(taskId);
    await client.conferences(conv.sid).update({
        status: 'completed'
    });
}


export const ColdTransfer = async (conferenceId, customerId) => {
    await PlaceOnHold(conferenceId, customerId, false);

    workspace.tasks.create({
        attributes: JSON.stringify({
            type: 'transfer-call',

        })
    })
}
