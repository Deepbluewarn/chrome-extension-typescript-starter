import { ReplayPageType } from "./contentScript/utils";
import MessageInterface from "./interfaces/message";

const { fetch: origFetch } = window;
const base_url = process.env.BASE_URL || "";
let bodyBuffer: any[] = [];
let currentChannel = { channel: '', sent: false };

const replayFrameState = {
  loaded: false,
  url: "",
};
const liveFrameState = {
  loaded: false,
  url: '',
}
const setReplayFrameState = (loaded: boolean) => {
  replayFrameState.loaded = loaded;
  replayFrameState.url = location.href;
};
const setLiveFrameState = (loaded: boolean) => {
  liveFrameState.loaded = loaded;
  liveFrameState.url = location.href;
};

const postBodyMessage = () => {
  const replayType = ReplayPageType();

  if(!replayType) return;

  for (let b of bodyBuffer) {
    if (location.href === b.url && !b.sent) {
      const frame = <HTMLIFrameElement>document.getElementById("wtbc-replay");

      frame.contentWindow?.postMessage(
        {
          sender: "extension",
          type: "CHAT_LIST",
          value: b,
        } as MessageInterface,
        base_url
      );

      b.sent = true;
    }
  }
};

const postChannelData = () => {
  const replayType = ReplayPageType();

  if(replayType) return;

  if (!currentChannel.sent) {
    const frame = <HTMLIFrameElement>document.getElementById("wtbc-mini");

    frame.contentWindow?.postMessage(
      {
        sender: "extension",
        type: "CHANNEL_DATA",
        value: currentChannel,
      } as MessageInterface,
      base_url
    );

    currentChannel.sent = true;
  }
}

const updateChannelData = (channel: string) => {
  const oldChannel = currentChannel.channel;

  currentChannel.channel = channel;

  if(oldChannel !== channel) {
    setLiveFrameState(false);
    currentChannel.sent = false;
  }
}

window.fetch = async (...args) => {
  const response = await origFetch(...args);

  if (response.url === "https://gql.twitch.tv/gql") {
    response
      .clone()
      .json()
      .then((body) => {
        let isComment = false;

        if (Array.isArray(body)) {
          for (let b of body) {
            if (
              b.extensions.operationName === "VideoCommentsByOffsetOrCursor"
            ) {
              bodyBuffer.push({
                url: location.href,
                body: b,
              });

              isComment = true;
            }
            if (b.extensions.operationName === 'Chat_ChannelData') {
              updateChannelData(b.data.channel.login);
            }
          }
        } else {
          if (
            body.extensions.operationName === "VideoCommentsByOffsetOrCursor"
          ) {
            bodyBuffer.push({
              url: location.href,
              body: body,
            });

            isComment = true;
          }
          if (body.extensions.operationName === 'Chat_ChannelData') {
            updateChannelData(body.data.channel.login);
          }
        }

        if (
          replayFrameState.url === location.href &&
          replayFrameState.loaded &&
          isComment
        ) {
          postBodyMessage();
        }

        if (liveFrameState.loaded && currentChannel.channel !== '') {
          postChannelData();
        }

        bodyBuffer = bodyBuffer.filter((e) => !e.sent);

        console.debug('TBC - [extension] overrideFetch bodyBuffer: ', bodyBuffer);

        isComment = false;
      });
  }

  return response;
};
window.onmessage = (e) => {
  if (e.data.sender === "wtbc" && e.data.type === "REQUEST_CHAT_LIST") {
    setReplayFrameState(true);
    postBodyMessage();
  }
  if (e.data.sender === 'wtbc' && e.data.type === 'REQUEST_CHANNEL_ID') {
    setLiveFrameState(true);
    postChannelData();
  }
};
