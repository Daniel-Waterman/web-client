import * as dotenv from 'dotenv';
dotenv.config();

import twilio from 'twilio';
import { PlaceOnHold } from './Conference.js';
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const workspace = client.taskrouter.v1.workspaces(process.env.TWILIO_WORKSPACE_SID);

export const GetAllTasks = async () => {
    let tasks = await workspace.tasks.list({limit: 1, taskQueueSid: 'WQf77f6120db9fa43dfe025ece77f271f9'});
    return tasks;
}

export const FetchTask = async (taskId) => {
    console.log(taskId);
    let data = await workspace.tasks(taskId).fetch();
    console.log(data);
    return data;
}

export const AcceptTask = async (reservationId, taskId) => {
    await workspace.tasks(taskId).reservations(reservationId).update({
        reservationStatus: "accepted"
    }).then(reservation => console.log(reservation));
}

export const CompleteTask = async (reservationId, taskId) => {
    await workspace.tasks(taskId).update({
        assignmentStatus: "wrapping"
    }).then(reservation => console.log(reservation));
}

export const DeleteTask = async (taskId) => {
    console.log(taskId);
    await workspace.tasks(taskId).remove();
}

export const ParkTask = async (taskId) => {
    let task = await FetchTask(taskId);

    const { conference, ...theRest } = JSON.parse(task.attributes);

    let newAttr = {
        ...theRest,
        park_note: "parked",
        conference_sid: conference.sid,
        initital_task_sid: taskId
    }

    //await PlaceOnHold(conference.sid, conference.participants.customer, false);

    console.log(conference.participants.customer);

    console.log(newAttr);
    console.log(JSON.stringify(newAttr));

    let taskString = JSON.stringify(newAttr);

    await DeleteTask(taskId);

    const twiml = new twilio.twiml.VoiceResponse();

    twiml.enqueue({
        workflowSid: 'WW5bfa8788a6b272ed027bbae6e0c6ac71',
    }).task(taskString);

    console.log(twiml.toString());

    console.log(conference.participants.customer);

    await client.calls(conference.participants.worker).update({
        status: 'completed'
    });

    await client.calls(conference.participants.customer).update({
        twiml: twiml.toString()
    });

    
}

export const UnParkTask = async (workerName) => {
    let tasks = await GetAllTasks();
    if (tasks.length == 0) {
        throw new Error("No parked tasks");
    }

    console.log(tasks);

    let task = tasks[0];
    console.log(task);
    let workerSid = workerName === "worker_alice" ? process.env.TWILIO_WORKER_SID_ALICE : process.env.TWILIO_WORKER_SID_BOB;

    let attr = JSON.parse(task.attributes);
    attr = {
        ...attr,
        contact_sid: workerSid,
        contact_uri: workerName
    };

    await DeleteTask(task.sid);

    const twiml = new twilio.twiml.VoiceResponse();

    twiml.enqueue({
        workflowSid: 'WWe5bd2157dc31384990bda05755ee67c2',
    }).task(JSON.stringify(attr));

    console.log(twiml.toString());

    await client.calls(attr.call_sid).update({
        twiml: twiml.toString()
    });
}

export const TransferFromUnPark = async () => {

}