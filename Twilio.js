import * as dotenv from 'dotenv';
dotenv.config();

import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const workspace = client.taskrouter.v1.workspaces(process.env.TWILIO_WORKSPACE_SID);

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;
const SyncGrant = AccessToken.SyncGrant;
const TaskRouterGrant = AccessToken.TaskRouterGrant;
const taskrouter = twilio.jwt.taskrouter;
const util = taskrouter.util;

const TaskRouterCapability = taskrouter.TaskRouterCapability;
const Policy = TaskRouterCapability.Policy;

const taskRouterUrl = "https://taskrouter.twilio.com";
const taskRouterVersion = "v1";

function buildWorkspacePolicy(options) {
    options = options || {};
    var resources = options.resources || [];
    var urlComponents = [taskRouterUrl, taskRouterVersion, 'Workspaces', process.env.TWILIO_WORKSPACE_SID];

    return new Policy({
        url: urlComponents.concat(resources).join('/'),
        method: options.method || 'GET',
        allow: true
    });
}

const eventBridgePolicies = util.defaultEventBridgePolicies(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_WORKER_SID);

const workerPolicies = util.defaultWorkerPolicies(taskRouterVersion, process.env.TWILIO_WORKSPACE_SID, process.env.TWILIO_WORKER_SID);

const workspacePolicies = [
    buildWorkspacePolicy(),
    buildWorkspacePolicy({ resources: ['**']}),
    buildWorkspacePolicy({resources: ['Activities'], method: 'POST'}),
    buildWorkspacePolicy({resources: ['Workers', process.env.TWILIO_WORKER_SID, 'Reservations', '**'], method: 'POST'}),
];

const policies = [
    new Policy({url: util.workersUrl(process.env.TWILIO_WORKSPACE_SID, process.env.TWILIO_WORKER_SID), method: 'POST', allow: true, postFilter: 
        {"ActivitySid": {"required": true}}
    }),
    new Policy({url: util.tasksUrl(process.env.TWILIO_WORKSPACE_SID), method: 'POST', allow: true}),
    new Policy({url: util.tasksUrl(process.env.TWILIO_WORKSPACE_SID), method: 'GET', allow: true}),
    new Policy({url: util.reservationsUrl(process.env.TWILIO_WORKSPACE_SID, process.env.TWILIO_WORKER_SID) + "/**", method: 'POST', allow: true}),
    new Policy({url: util.activitiesUrl(process.env.TWILIO_WORKSPACE_SID), method: 'GET', allow: true}),
]

export const GetTaskRouterToken = (workerName) => {
    let workerSid = workerName === "worker_alice" ? process.env.TWILIO_WORKER_SID_ALICE : process.env.TWILIO_WORKER_SID_BOB;

    const capability = new TaskRouterCapability({
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        workspaceSid: process.env.TWILIO_WORKSPACE_SID,
        channelId: workerSid
    });

    const eventBridgePolicies = util.defaultEventBridgePolicies(process.env.TWILIO_ACCOUNT_SID, workerSid);

    const workerPolicies = util.defaultWorkerPolicies(taskRouterVersion, process.env.TWILIO_WORKSPACE_SID, workerSid);

    const policies = [
        new Policy({url: util.workersUrl(process.env.TWILIO_WORKSPACE_SID, workerSid), method: 'POST', allow: true, postFilter: 
            {"ActivitySid": {"required": true}}
        }),
        new Policy({url: util.tasksUrl(process.env.TWILIO_WORKSPACE_SID), method: 'POST', allow: true}),
        new Policy({url: util.tasksUrl(process.env.TWILIO_WORKSPACE_SID), method: 'GET', allow: true}),
        new Policy({url: util.reservationsUrl(process.env.TWILIO_WORKSPACE_SID, workerSid) + "/**", method: 'POST', allow: true}),
        new Policy({url: util.activitiesUrl(process.env.TWILIO_WORKSPACE_SID), method: 'GET', allow: true}),
    ]

    eventBridgePolicies.concat(workerPolicies).concat(policies).forEach(policy => {
        console.log(policy);
        capability.addPolicy(policy);
    });

    return capability.toJwt();
}

export const GetMediaToken = () => {
}



export const GetVoiceToken = (workerIdentity) => {
    const outgoingApplicationSid = "AP10ddfde60a65c8fbd94224157ca1c8f2";
    const identity = workerIdentity;

    const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: outgoingApplicationSid,
        incomingAllow: true
    });

    const syncGrant = new SyncGrant({
        serviceSid: process.env.TWILIO_SYNC_SERVICE_SID
    });

    const token = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY,
        process.env.TWILIO_API_SECRET,
        {identity: identity}
    );
    token.addGrant(voiceGrant);
    token.addGrant(syncGrant);

    return token.toJwt();
}

export const CompleteWrap = async (taskId) => {
    workspace
    .tasks(taskId).update({
        assignmentStatus: 'completed'
    }).then(task => {
        console.log(task);
    });
}

export const CreateCallTask = async (number) => {
    workspace.tasks.create({
        attributes: JSON.stringify({
           type: 'outbound-call',
           contact: number
        }),
        workflowSid: 'WW6d132bcef35221fe27538a2cf0dc8bb1',
        taskChannel: 'voice'
    });
}

export const ConferenceInstruction = async (taskId, reservationId) => {
    let data = await workspace.tasks(taskId).reservations(reservationId).update({
        instruction: 'conference',
        from: '+447952917039',
        statusCallback: "https://dan-twilio.eu.ngrok.io/conference_status_callback",
        conferenceStatusCallbackEvent: ['start', 'end', 'join', 'leave', 'mute', 'hold']
    });
    console.log(data);
    return data;
}

export const GetWorkerReservations = async (workerSid) => {
    let data = await workspace.workers(workerSid).reservations.list({limit: 20});
    return data;
}

