import { Client, Conversation, Message } from "@twilio/conversations";
import { useEffect, useState, useRef } from "react";

export const ChatWidget = (props: {token: string, reservationId: string | null, taskId: string | null, conversationSid: string | null}) => {
    const client = useRef<Client>();
    const [message, setMessage] = useState<string>("");
    const [isReady, setIsReady] = useState<boolean>(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversationId, setConversationId] = useState<string>("");
    const [convo, setConvo] = useState<Conversation>();
    const [chatAvailable, setChatAvailable] = useState<boolean>(false);

    useEffect(() => {
        if (props.token) {
            let cc = new Client(props.token)
            cc.on("stateChanged", (state) => {
                console.log(state);
            });

            cc.on("connectionStateChanged", (state) => {
                console.log("Connection state: " + state);
            })

            cc.on("conversationJoined", (conversation: Conversation) => {
                console.log("Convseration Joined");

                

                conversation.getMessages().then(paginator => {
                    setMessages(paginator.items)
                })

                conversation.on("messageAdded", (m: Message) => {
                    console.log("Message added: " + m.body);
                    setMessages((msgs) => [...msgs, m]);
                });

                

                setConvo(conversation);
            })

            cc.on("initialized", () => {
                setIsReady(true);
            })

            client.current = cc;
        }
    }, [props.token]);

    const Accept = () => {
        if (props.conversationSid) {
            setConversationId(props.conversationSid);
            AcceptTask();
        }
    }

    const AcceptTask = () => {
        if (props.taskId) {
            fetch(`/api/reservation/${props.reservationId}/task/${props.taskId}/accept`, {method: 'POST', headers: {'Content-Type': 'application/json'}}).then(async res => {
                if (res.status === 200) {
                    console.log("Task accepted successfully");
                }
            })
        }
    }

    const sendMessage = () => {
        convo?.sendMessage(message);
        setMessage("");
    }

    const createConvo = () => {
        fetch(`/api/conversations/create`, {method: 'POST', headers: {'Content-Type': 'application/json'}}).then(async res => {
            if (res.status === 200) {
                let data: any = await res.json();
                setConversationId(data.sid);
            }
        });
    }

    const deleteConvo = () => {
        fetch (`/api/conversations/${convo?.sid}/delete`, {method: 'POST', headers: {'Content-Type': 'application/json'}}).then(async res => {
            if (res.status === 200) {
                console.log("Conversation ended");
            }
        });

        fetch (`/api/reservation/${props.reservationId}/task/${props.taskId}/delete`, {method: 'POST', headers: {'Content-Type': 'application/json'}}).then(async res => {
            if (res.status === 200) {
                console.log("Task ended");
                setConversationId("");
                setConvo(undefined);
                setMessages([]);
                setMessage("");
            }
        });
    }

    useEffect(() => {
        if (conversationId !== "") {
            fetch(`/api/conversations/${conversationId}/add/participants`, {method: 'POST', headers: {'Content-Type': 'application/json'}}).then(async res => {
                if (res.status === 200) {
                    console.log(await res.json());
                }
            });
        }
    }, [conversationId]);

    return (
        <>
        <h1>Chat Component</h1>
        <button onClick={createConvo}>Create</button>
        <button onClick={deleteConvo}>Delete</button>

        {props.conversationSid &&
            <div>
                <p>You have a new chat! </p>
                <p>Reservation Id: {props.conversationSid}</p>
                <button onClick={Accept}>Start Chat</button>
            </div>
        }

        {isReady && convo &&
        <>
            <p>Conversation Id: {convo.sid}  Friendly Name: {convo.friendlyName}</p>
            {messages.map((m: Message, idx: number) => 
                <div key={"message" + idx}>
                    {m.body} ({m.author})
                </div>
            )}
            <div>
                Write message
                <input value={message} onChange={e => setMessage(e.target.value)}/>
                <button onClick={sendMessage}>Send</button>
            </div>
        </>
        }
        </>
    )
}