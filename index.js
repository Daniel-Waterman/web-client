import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import * as path from "path";
import { GetTaskRouterToken, GetVoiceToken, CompleteWrap, CreateCallTask, ConferenceInstruction } from "./Twilio.js";
import { FetchConference, PlaceOnHold } from "./Conference.js";
import { FetchTask, GetAllTasks, ParkTask, UnParkTask } from "./Task.js";

dotenv.config();
const PORT = process.env.PORT || 5003;

const app = express();

app.use(
    cors({
        origin: "http://localhost:5003"
    })
);

app.use(express.json());

app.post("/api/token/taskrouter/:workerName", async (req, res) => {
    let token = GetTaskRouterToken(req.params.workerName);
    res.status(200).json({token: token});
})

app.post("/api/token/voice/:workerName", async (req, res) => {
    let token = GetVoiceToken(req.params.workerName);
    res.status(200).json({token: token});
})

app.post("/api/wrap/complete/:taskId", async (req, res) => {
    let taskId = req.params.taskId;
    console.log("Attempting to wrap task: " + taskId);
    if (taskId) {
        await CompleteWrap(taskId);
        res.status(200).send();
    }
    else {
        res.status(400).send();
    }
})

app.post("/api/task/create/:number", async (req, res) => {
    let number = req.params.number;
    if (number) {
        await CreateCallTask(number);
        res.status(200).send();
    } else {
        res.status(400).send();
    }
})

app.post("/api/task/all", async (req, res) => {
    await GetAllTasks();
})

app.post("/api/task/fetch/:taskId", async (req, res) => {
    let task = await FetchTask(req.params.taskId);
    res.status(200).json(task);
})

app.post("/api/task/park/:taskId",  async (req, res) => {
    await ParkTask(req.params.taskId);
    res.status(200).send();
})

app.post("/api/task/unpark/:workerName", async (req, res) => {
    await UnParkTask(req.params.workerName);
    res.status(200).send();
})

app.post("/api/task/:taskId/reservation/:reservationId/conference", async (req, res) => {
    let conf = await ConferenceInstruction(req.params.taskId, req.params.reservationId);
    res.status(200).json(conf);
})

app.post("/api/conference/fetch/:key", async (req, res) => {
    let conf = await FetchConference(req.params.key);
    res.status(200).json(conf);
})

app.post("/api/conference/:conferenceId/hold/:participantId/:isOnHold", async (req, res) => {
    console.log(req.params.isOnHold);
    await PlaceOnHold(req.params.conferenceId, req.params.participantId, req.params.isOnHold === 'false' ? false : true);
    res.status(200).send();
})

app.listen(PORT, () => {
    console.log("Server listening on " + PORT);
})