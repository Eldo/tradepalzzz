import axios from 'axios';

const baseUrl = 'https://gate.whapi.cloud/messages';

const headers = {
  Authorization: `Bearer ${process.env.WHAPI_TOKEN}`,
  'Content-Type': 'application/json',
  Accept: 'application/json'
};

const sendText = async (to, body) => {
  await axios.post(`${baseUrl}/text`, { to, body }, { headers });
};

const sendImage = async (to, media) => {
  await axios.post(`${baseUrl}/image`, { to, media }, { headers });
};

const sendAudio = async (to, media) => {
  await axios.post(`${baseUrl}/audio`, { to, media }, { headers });
};

const sendVideo = async (to, media) => {
  await axios.post(`${baseUrl}/video`, { to, media }, { headers });
};

export { sendText, sendImage, sendAudio, sendVideo };