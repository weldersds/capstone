import React, { useState, useEffect, useRef } from "react";
import _ from "lodash";
import { animateScroll } from "react-scroll";

export default function Chat(props) {
	const [first, setFirst] = useState(true); //used for more efficent database conection. checks if first render or not

	const [msgValue, setMsgValue, msgRef] = useStateRef([]);
	const [messageToSend, setMessageToSend] = useState("");
	const messagesEndRef = useRef(null);

	useEffect(() => {
		const deleteMsg = event => {
			props.fireChat.child(event.target.id).remove();
		};
		const scrollToBottom = () => {
			animateScroll.scrollToBottom({
				containerId: "chats"
			  });
		  };
		if (first) {
			//get init data here
			props.fireChat.once("value").then(function(snapshot) {
				let data = snapshot.val();
				let messageList = [];

				let keys = Object.keys(data || {});
				let lastIdInSnapshot =
					keys[keys.length - 1] || props.fireChat.push().key;

				props.fireChat
					.orderByKey()
					.startAt(lastIdInSnapshot)
					.limitToLast(1)
					.on("child_added", function(newMessSnapShot) {
						if (newMessSnapShot.key === lastIdInSnapshot) {
							return;
						}
						let newData = newMessSnapShot.val();
						let toUpdatemessages = _.clone(msgRef.current);
						toUpdatemessages.push(
							<div key={newMessSnapShot.key}>
								<p id={newMessSnapShot.key}>
									{" "}
									{newData.Name} : {newData.Message}{" "}
								</p>{" "}
								{/* <button id={newMessSnapShot.key} onClick={deleteMsg}>
									DELETE
								</button> */}
							</div>
						); //key is for react, id will be for if we want to remove it from the database or update it
						setMsgValue(toUpdatemessages);
					});
				//Need Child remove and child updated
				props.fireChat.on("child_removed", function(newMessSnapShot) {
					let toUpdatemessages = _.cloneDeep(msgRef.current);
					let indexToPop = _.findIndex(toUpdatemessages, function(o) {
						return o.key === newMessSnapShot.key;
					});
					toUpdatemessages.splice(indexToPop, 1);
					setMsgValue(toUpdatemessages);
				});

				keys.forEach(key => {
					messageList.push(
						<div key={key}>
							<p key={key}>
								{" "}
								{data[key].Name} : {data[key].Message}{" "}
							</p>
							 {/* <button id={key} onClick={deleteMsg}>
								DELETE
							</button>  */}
						</div>
					);
				});
				setMsgValue(messageList);
			});
			setFirst(false);
		}
		scrollToBottom()
	}, [first, msgRef, props.fireChat, setMsgValue, msgValue]);

	const updateMessageToSend = event => {
		setMessageToSend(event.target.value);
	};

	const sendMessage = event => {
		setMessageToSend("");
		let jsonMsg = { Name: props.username ?? "noName", Message: messageToSend }; //This add a message based on timestamp
		props.fireChat.push().set(jsonMsg); //add completion callback to ensure message sent to clear or not clear the messageToSend
	};


	return (
		<div>
		<div id="chats" style={{overflow: 'auto', height: '250px', overflowAnchor:'auto'}}>
			{msgValue}
		</div>
		<input
		placeholder="send Message"
		type="text"
		onChange={updateMessageToSend}
		value={messageToSend}
	></input>

	<button onClick={sendMessage}>SEND</button>
	</div>
	);
}

function useStateRef(initialValue) {
	const [value, setValue] = useState(initialValue);

	const ref = useRef(value);

	useEffect(() => {
		ref.current = value;
	}, [value]);

	return [value, setValue, ref];
}
