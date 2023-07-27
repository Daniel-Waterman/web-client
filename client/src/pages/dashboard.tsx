import { Call, Device } from "@twilio/voice-sdk";
import { useEffect, useState } from "react";

interface IConference {
    sid: string,
    workerSid: string,
    customerSid: string
}

export const Dashboard = () => {
    //@ts-ignore
    const Twilio = window.Twilio;

    const [errorMsg, setErrorMsg] = useState<string>("");
    const [isReady, setIsReady] = useState<boolean>(false);
    const [reservationId, setReservationId] = useState<string>("");
    const [taskId, setTaskId] = useState<string>("");
    const [canAccept, setCanAccept] = useState<boolean>(false);
    const [canRing, setCanRing] = useState<boolean>(false);
    const [currentCall, setCurrentCall] = useState<Call | null>(null);
    const [device, setDevice] = useState<Device | null>(null);
    const [taskAttributes, setTaskAttributes] = useState<IConference>();
    const [isOnHold, setIsOnHold] = useState<boolean>(false);
    const [currentWorker, setCurrentWorker] = useState<string>("worker_alice");

    let task;

    let worker;

    let currentReservation: any;

    let deviceToken = "";

    useEffect(() => {
        fetch(`/api/token/voice/${currentWorker}`, {method: 'POST', headers: {'Content-Type': 'application/json'}}).then(async res => {
            if (res.status === 200) {
                let data: any = await res.json();
                deviceToken = data.token;
            }
        });
    }, []);

    const onReady = () => {
        fetch(`/api/token/taskrouter/${currentWorker}`, { method: 'POST', headers: {'Content-Type': 'application/json'}}).then(async res => {
            if (res.status === 200) {
                let data: any = await res.json();
                let token = data.token;

                worker = new Twilio.TaskRouter.Worker(token, false, "", "", true);

                worker.on("ready", function(worker: any) {
                    console.log(worker.sid);
                    console.log(worker.friendlyName);
                    console.log(worker.activityName);
                    console.log(worker.available);
                });

                worker.on("reservation.created", function(reservation: any) {
                    console.log("-----");
                    console.log("You have been reserved to handle a call!");
                    console.log("Call from: " + reservation.task.attributes.from);
                    console.log("Selected language: " + reservation.task.attributes.selected_language);
                    console.log("-----");

                    console.log(reservation);

                    setReservationId(reservation.sid);
                    currentReservation = reservation;

                    setTaskId(reservation.task.sid);

                    console.log("Task Id:" + reservation.task.sid);

                    // fetch("/api/conference/fetch/" + reservation.task.sid, {method: 'POST', headers: {'Content-Type': 'application/json'}}).then(async res => {
                    //     if (res.status === 200) {
                    //         let data: any = await res.json();
                    //         task = data;
                    //         console.log(task);
                    //     }
                    // });

                    if (reservation.task.attributes.type == "outbound-call"){
                        setCanRing(true);
                    }
                });

                let device = new Device(deviceToken);

                device.on("registered", () => {
                    console.log("Device registered");
                });

                device.on("error", (error: any) => {
                    console.log("Device error: " + error.message);
                });

                device.on("incoming", handleIncomingCall);

                device.audio?.on("deviceChange", updateAllAudioDevices.bind(device));

                device.register();

                setDevice(device);

                // worker.on("reservation.created", function(reservation: any) {
                //     console.log(reservation);
                //     console.log(reservation.sid);
                //     setReservationId(reservation.sid);
                //     currentReservation = reservation;
                //     // reservation.accept();
                // })
                
                setIsReady(true);
            } else {
                setErrorMsg("Unable to get access token");
            }
        });
    }

    const currentTaskSid = (): string => {
        return currentReservation.taskSid;
    }

    const handleOutgoingCall = async () => {
        console.log("Outgoing call");

        console.log(device);
        if (device) {
            let call: Call = await device.connect({
                params: {
                    To: '+447952917039',
                    From: 'client:worker_alice'
                }
            });
            setCurrentCall(call);
            console.log(call);
        } else {
            setErrorMsg("Device is null");
        }
    }

    const handleIncomingCall = (call: Call) => {
        console.log("Incoming call from " + call.parameters.from);

        call.on("accepted", () => {
            console.log("Call accepted");
        })

        call.on("disconnect", () => {
            console.log("Call disconnected");

            // fetch("/api/wrap/complete/" + currentTaskSid(), {method: 'POST', headers: {'Content-Type': 'application/json'}}).then(async res => {
            //     if (res.status === 200) {
            //         console.log(`Call ${currentCall?.parameters.sid} successfully wrapped`);
            //     }
            //     setCurrentCall(null);
            // });
        });

        setCurrentCall(call);

        setCanAccept(true);
    }

    const placeOnHold = () => {
        if (taskAttributes) {
            console.log(taskAttributes);
            fetch(`/api/conference/${taskAttributes.sid}/hold/${taskAttributes.customerSid}/${isOnHold}`,
            {method: 'POST', headers: {'Content-Type': 'application/json'}}).then(async res => {
                if (res.status === 200) {
                    console.log("Placed on hold successfully");
                    setIsOnHold(!isOnHold);
                }
            });
        }
    }

    const handleTransfer = () => {

    }

    const ParkCall = () => {
        fetch(`/api/task/park/${taskId}`,
            {method: 'POST', headers: {'Content-Type': 'application/json'}}).then(async res => {
                if (res.status === 200) {
                    console.log("Placed on park successfully");
                }
            });
    }

    const UnParkCall = () => {
        fetch(`/api/task/unpark/${currentWorker === "worker_alice" ? "worker_bob" : "worker_alice"}`,
            {method: 'POST', headers: {'Content-Type': 'application/json'}}).then(async res => {
                if (res.status === 200) {
                    console.log("Unpark successful");
                }
            });
    }

    async function AcceptIncoming() {
        console.log(currentCall);
        if (currentCall) {
            currentCall.accept();
            console.log("Accepted incoming call.");
        } else {
            console.log("Current Call Missing");
        }

        setTimeout(() => {
            fetch("/api/task/fetch/" + taskId, {method: 'POST', headers: {'Content-Type': 'application/json'}}).then(async res => {
                if (res.status === 200) {
                    let data: any = await res.json();
                    task = data;
                    console.log(task);
                    let attr = JSON.parse(data.attributes);
                    setTaskAttributes({
                        sid: attr.conference.sid,
                        workerSid: attr.conference.participants.worker,
                        customerSid: attr.conference.participants.customer
                    });
                }
            });
        }, 2000);        
    }

    async function getAudioDevices() {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        updateAllAudioDevices.bind(device);
    }

    function updateAllAudioDevices() {
        if (device && device.audio) {
          updateDevices(device.audio.speakerDevices.get());
          updateDevices(device.audio.ringtoneDevices.get());
        }
    }

    function updateDevices(selectedDevices: any) {    
        device?.audio?.availableOutputDevices.forEach(function (device: any, id: any) {
          var isActive = selectedDevices.size === 0 && id === "default";
          selectedDevices.forEach(function (device: any) {
            if (device.deviceId === id) {
              isActive = true;
            }
          });
    
          var option = document.createElement("option");
          option.label = device.label;
          option.setAttribute("data-id", id);
          if (isActive) {
            option.setAttribute("selected", "selected");
          }
        });
    }

    const makeOutgoingCall = async () => {
        fetch("/api/task/create/+447952917039", {method: 'POST', headers: {'Content-Type': 'application/json'}}).then(async res => {
            if (res.status === 200) {
                console.log("Task created successfully")
            } else {
                console.log("Task created error");
            }
        });

        
    }

    const switchWorker = () => {
        if (currentWorker === "worker_alice") {
            setCurrentWorker("worker_bob");
        } else {
            setCurrentWorker("worker_alice");
        }
    }


    return (
        <div>
            <h1>Dashboard</h1>
            <p>Errors: {errorMsg == "" ? "No Errors" : errorMsg}</p>
            <div>
                <p>Current Worker: {currentWorker}</p>
                <button onClick={switchWorker}>Switch Worker</button>
                <button onClick={onReady}>Ready</button>
            </div>

            {isReady && 
            <>
                <div>
                    <p>Reservation: {reservationId}</p>
                    <p>Call in progress: {currentCall?.parameters.sid}</p>
                    {canAccept &&
                        <button onClick={AcceptIncoming}>Accept</button>
                    }

                    <button onClick={makeOutgoingCall}>Create Task</button>
                    {canRing &&
                        <button onClick={handleOutgoingCall}>Dial Out</button>
                    }
                    <button onClick={placeOnHold}>Place on Hold</button>
                    <button onClick={ParkCall}>Park Call</button>
                    <button onClick={UnParkCall}>Un-Park Call</button>
                </div>

                <div>
                    {isOnHold &&
                        <h2 color="red">Call currently on hold</h2>
                    }
                </div>
            </>
            }
        </div>
    )
}